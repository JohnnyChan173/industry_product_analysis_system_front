<template>
  <Spin :spinning="loading">
    <div class="re-register">
      <Alert type="info" show-icon class="re-register__tip" message="根据历史登记重新创建" />

      <div v-if="sourceInfo" class="re-register__content">
        <div class="form-row required">
          <div class="form-label">登记产线：</div>
          <div class="form-value readonly-box">
            {{ sourceInfo.lineInfo?.lineName || sourceInfo.lineName || "/" }}
          </div>
        </div>

        <div class="form-row">
          <div class="form-label">关联任务单：</div>
          <div class="form-value">
            <div class="readonly-box">
              {{ sourceInfo.taskInfo?.taskNo || sourceInfo.taskNo || "未关联任务单" }}
            </div>
            <div v-if="sourceInfo.taskInfo" class="task-summary">
              <div>
                <span class="summary-label">生产数量：</span>
                <span>{{ sourceInfo.taskInfo.productNumber ?? "/" }}</span>
              </div>
              <div>
                <span class="summary-label">计划完成：</span>
                <span>{{ formatDate(sourceInfo.taskInfo.planCompleteDate) }}</span>
              </div>
              <div>
                <span class="summary-label">任务备注：</span>
                <span>{{ sourceInfo.taskInfo.memo || "/" }}</span>
              </div>
              <!-- <div class="task-summary__memo">
                <span class="summary-label">任务备注：</span>
                <span>{{ sourceInfo.taskInfo.memo || "/" }}</span>
              </div> -->
            </div>
          </div>
        </div>

        <div class="form-row required">
          <div class="form-label">产品&工艺：</div>
          <div class="form-value product-craft">
            <Select disabled
              v-model:value="selectedProductCraftKey"
              :options="productCraftOptions"
              :loading="productCraftLoading"
              placeholder="请选择产品&工艺"
              show-search
              optionFilterProp="label"
              style="width: 100%"
              @change="handleProductCraftChange"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-label">计划生产：</div>
          <div class="form-value inline-control">
            <InputNumber v-model:value="formState.planProductNumber" :min="0" :precision="0" style="width: 180px" />
            <span class="control-tip">选填，0 即不限</span>
          </div>
        </div>

        <div class="form-row form-row--top">
          <div class="form-label">工位登记：</div>
          <div class="form-value">
            <div class="station-summary">
              <div class="station-summary__info">
                <span :class="isAllStationSelected ? 'text-primary' : 'text-warning'">
                  {{ selectedStationCount }} / {{ staffSignList.length }}
                </span>
                <span class="station-summary__tip"> 复选框仅选择批量操作项，未勾选工位不受影响 </span>
              </div>
              <div class="station-summary__actions">
                <Button
                  size="small"
                  type="primary"
                  :disabled="!selectedRowKeys.length"
                  @click="setSelectedRegistration(true)"
                >
                  选中项登记
                </Button>
                <Button size="small" :disabled="!selectedRowKeys.length" @click="setSelectedRegistration(false)">
                  选中项不登记
                </Button>
              </div>
            </div>

            <Table
              size="small"
              row-key="rowKey"
              :columns="stationColumns"
              :data-source="staffSignList"
              :pagination="false"
              :scroll="{ y: 240 }"
              :row-selection="rowSelectionConfig"
              bordered
            >
              <template #bodyCell="{ record, index, column }">
                <template v-if="column.key === 'order'">{{ index + 1 }}</template>
                <template v-else-if="column.dataIndex === 'virtualStationName'">
                  {{ record.virtualStationName || "/" }}
                </template>
                <template v-else-if="column.dataIndex === 'staffName'">
                  <Select
                    v-model:value="record.selectedStaffIds"
                    mode="multiple"
                    allow-clear
                    placeholder="请选择本次登记员工（可为空）"
                    style="width: 100%"
                  >
                    <Select.Option
                      v-for="staffInfo in getStaffOptions(record.staffList)"
                      :key="staffInfo.id"
                      :value="staffInfo.id"
                    >
                      {{ staffInfo.staffName || `员工${staffInfo.id}` }}
                    </Select.Option>
                  </Select>
                </template>
                <template v-else-if="column.dataIndex === 'checked'">
                  <Switch v-model:checked="record.checked" checked-children="登记" un-checked-children="不登记" />
                </template>
              </template>
            </Table>
          </div>
        </div>

        <div class="form-row">
          <div class="form-label">拍照存证：</div>
          <div class="form-value evidence-tip">新登记不继承历史照片，可在新登记中重新上传。</div>
        </div>

        <div class="form-row form-row--top">
          <div class="form-label">备注：</div>
          <div class="form-value">
            <Input.TextArea v-model:value="formState.memo" :rows="3" :maxlength="500" show-count placeholder="选填" />
          </div>
        </div>

        <div class="footer-actions">
          <Button @click="emit('cancel')">取消</Button>
          <Button type="primary" :loading="submitting" @click="handleSubmit">开始生产</Button>
        </div>
      </div>

      <div v-else-if="!loading" class="empty-state">未获取到原登记数据</div>
    </div>
  </Spin>
</template>

<script setup lang="ts">
  import { computed, h, onMounted, reactive, ref, watch } from "vue";
  import { Alert, Button, Checkbox, Input, InputNumber, message, Modal, Select, Spin, Switch, Table } from "ant-design-vue";
  import {
    registrationAdd,
    registrationDetail,
    registrationDetailGetByLatest,
    registrationStaffSign,
    registrationStart,
  } from "/@/api/registration";
  import { RegistrationStatus, StaffSignStatus, StaffType } from "/@/enums/model";
  import { formatDateByDayjs } from "/@/utils/util";
  import { productTaskDetail } from "/@/api/productTask";
  import { craftList } from "/@/api/craft";
  import { stationListAll } from "/@/api/station";
  import { staffListAll } from "/@/api/staff";
  import { virtualLineListByLineId } from "/@/api/virtualLine";
  import { maxPageSize } from "/@/config";

  interface Props {
    sourceId: number;
  }

  interface StaffSignFormItem {
    rowKey: string;
    stationName: string;
    virtualStationName: string;
    stationNo: string;
    physicalStationName: string;
    physicalStationNo: string;
    stationId?: number;
    virtualStationId?: number;
    staffList: Array<{
      id: number | string;
      staffName: string;
    }>;
    selectedStaffIds: Array<number | string>;
    checked: boolean;
  }

  interface ProductCraftOption {
    label: string;
    value: string;
    craftId: number;
    productId: number;
    productAttrValueIdsList: number[];
  }

  const props = defineProps<Props>();
  const emit = defineEmits<{
    (event: "success", id: number): void;
    (event: "cancel"): void;
  }>();

  const loading = ref(false);
  const submitting = ref(false);
  const sourceInfo = ref<any>();
  const staffSignList = ref<StaffSignFormItem[]>([]);
  const normalStaffList = ref<Array<{ id: number | string; staffName: string }>>([]);
  const craftData = ref<any[]>([]);
  const selectedProductCraftKey = ref<string>();
  const productCraftLoading = ref(false);
  const selectedRowKeys = ref<Array<string | number>>([]);

  const formState = reactive({
    planProductNumber: 0,
    memo: "",
    virtualLineId: undefined as number | undefined,
    productId: undefined as number | undefined,
    productAttrValueIdsList: [] as number[],
    craftId: undefined as number | undefined,
  });

  const stationColumns: any[] = [
    { title: "序号", key: "order", width: 120, align: "center" },
    { title: "虚拟工位", dataIndex: "virtualStationName" },
    { title: "本次登记员工", dataIndex: "staffName", width: 300 },
    { title: "本次登记", dataIndex: "checked", width: 110, align: "center" },
  ];

  const selectedStationCount = computed(() => staffSignList.value.filter((item) => item.checked).length);
  const isAllStationSelected = computed(
    () => !!staffSignList.value.length && selectedStationCount.value === staffSignList.value.length
  );

  const rowSelectionConfig = computed(() => ({
    selectedRowKeys: selectedRowKeys.value,
    onChange: onSelectChange,
    columnWidth: 76,
    columnTitle: h("div", { class: "selection-column-title" }, [
      h(Checkbox, {
        checked: !!staffSignList.value.length && selectedRowKeys.value.length === staffSignList.value.length,
        indeterminate:
          selectedRowKeys.value.length > 0 && selectedRowKeys.value.length < staffSignList.value.length,
        disabled: !staffSignList.value.length,
        onChange: (event: any) => {
          selectedRowKeys.value = event?.target?.checked
            ? staffSignList.value.map((item) => item.rowKey)
            : [];
        },
      }),
      h(
        "span",
        {
          class: "invert-select-link",
          title: "反选当前列表",
          onClick: (event: MouseEvent) => {
            event.stopPropagation();
            handleInvertSelect();
          },
        },
        "反选"
      ),
    ]),
  }));

  const productCraftOptions = computed<ProductCraftOption[]>(() => {
    const options: ProductCraftOption[] = [];

    craftData.value.forEach((craftInfo: any) => {
      const craftProductList = craftInfo?.craftProductList || [];

      craftProductList.forEach((productInfo: any) => {
        const productAttrValueIdsList =
          productInfo.productAttrValueIdsList || (productInfo.productAttrValueList || []).map((item: any) => item.id);

        options.push({
          label: `${productInfo.productName || "未命名产品"}【${craftInfo?.craftName || "未命名工艺"}】`,
          value: `${craftInfo?.id}-${productInfo.id}`,
          craftId: Number(craftInfo?.id),
          productId: Number(productInfo.id),
          productAttrValueIdsList,
        });
      });
    });

    // 工艺接口中不存在历史项时，仍使用原登记数据兜底回显。
    const info = sourceInfo.value;
    const originalCraftId = Number(info?.craftId ?? info?.craftInfo?.id ?? info?.virtualLineInfo?.craftInfo?.id);
    const originalProductId = Number(info?.productId ?? info?.productInfo?.id);
    const hasOriginalOption = options.some(
      (item) => item.craftId === originalCraftId && item.productId === originalProductId
    );

    if (originalCraftId && originalProductId && !hasOriginalOption) {
      const productName =
        info?.productInfo?.productName || info?.taskInfo?.productInfo?.productName || info?.productName || "原登记产品";
      const craftName = info?.craftInfo?.craftName || info?.virtualLineInfo?.craftInfo?.craftName || "原登记工艺";

      options.unshift({
        label: `${productName}【${craftName}】`,
        value: `${originalCraftId}-${originalProductId}`,
        craftId: originalCraftId,
        productId: originalProductId,
        productAttrValueIdsList: [...(info?.productAttrValueIdsList || info?.taskInfo?.productAttrValueIdsList || [])],
      });
    }

    return options;
  });

  function formatDate(value?: string) {
    return value ? String(value).split(" ")[0] : "/";
  }

  /** 获取当前虚拟产线的虚拟工位；历史签到仅作为详情接口失败时的兜底。 */
  function getVirtualStationList(info: any): any[] {
    const detailVirtualStationList = info?.virtualLineInfo?.virtualStationList || [];
    const configuredList = detailVirtualStationList.length
      ? detailVirtualStationList
      : info?.virtualStationList || [];
    const sourceList = configuredList.length
      ? configuredList
      : (info?.staffSignList || []).map((item: any) => item?.virtualStationInfo || item);
    const virtualStationMap = new Map<number, any>();

    sourceList.forEach((item: any) => {
      const virtualStationId = Number(item?.id ?? item?.virtualStationId);
      if (!virtualStationId || virtualStationMap.has(virtualStationId)) return;
      virtualStationMap.set(virtualStationId, item);
    });

    return Array.from(virtualStationMap.values()).sort(
      (a: any, b: any) => Number(a?.virtualStationSort || 0) - Number(b?.virtualStationSort || 0)
    );
  }

  /**
   * 员工候选以全部普工为主，并合并物理工位原绑定员工。
   * 这样员工临时缺勤时，可以为本次登记改选其他员工或直接清空。
   */
  function getStaffOptions(stationStaffList: StaffSignFormItem["staffList"] = []) {
    const staffMap = new Map<string, { id: number | string; staffName: string }>();

    [...normalStaffList.value, ...stationStaffList].forEach((staffInfo) => {
      if (staffInfo?.id == null) return;
      staffMap.set(String(staffInfo.id), staffInfo);
    });

    return Array.from(staffMap.values());
  }

  /** 读取物理工位绑定员工，兼容 staffList、staffIdList 及旧版 staffId。 */
  function getPhysicalStationStaffList(stationInfo: any): StaffSignFormItem["staffList"] {
    const detailMap = new Map<string, any>();
    const sourceStaffList = Array.isArray(stationInfo?.staffList) ? stationInfo.staffList : [];

    sourceStaffList.forEach((staffInfo: any) => {
      const staffId = staffInfo?.id ?? staffInfo?.staffId;
      if (staffId == null) return;
      detailMap.set(String(staffId), staffInfo);
    });

    const staffIdList = Array.isArray(stationInfo?.staffIdList) ? stationInfo.staffIdList : [];
    const stationStaffIds = staffIdList.length
      ? staffIdList
      : sourceStaffList.length
      ? sourceStaffList.map((staffInfo: any) => staffInfo?.id ?? staffInfo?.staffId)
      : stationInfo?.staffId != null
      ? [stationInfo.staffId]
      : [];

    return Array.from(new Set(stationStaffIds.filter((staffId: any) => staffId != null).map(String))).map(
      (staffId) => {
        const detail = detailMap.get(staffId);
        const staffInfo = normalStaffList.value.find((item) => String(item.id) === staffId);
        return {
          id: detail?.id ?? detail?.staffId ?? staffInfo?.id ?? staffId,
          staffName:
            detail?.staffName ||
            detail?.name ||
            detail?.staffInfo?.staffName ||
            staffInfo?.staffName ||
            (String(stationInfo?.staffId) === staffId ? stationInfo?.staffName || stationInfo?.staffInfo?.staffName : "") ||
            `员工${staffId}`,
        };
      }
    );
  }

  /**
   * 工位登记以虚拟工位为展示主体，通过 virtualStation.stationId 匹配 station/list 的物理工位，
   * 并默认选中该物理工位当前绑定的员工。
   */
  function buildStaffSignList(info: any, physicalStationList: any[]): StaffSignFormItem[] {
    const virtualStationList = getVirtualStationList(info);
    const physicalStationMap = new Map<number, any>();

    physicalStationList.forEach((stationInfo: any) => {
      const stationId = Number(stationInfo?.id ?? stationInfo?.stationId);
      if (stationId) physicalStationMap.set(stationId, stationInfo);
    });

    const originalVirtualStationIds = new Set<number>();
    const originalStationIds = new Set<number>();

    (info?.staffSignList || []).forEach((signInfo: any) => {
      const virtualStationId = Number(signInfo?.virtualStationId ?? signInfo?.virtualStationInfo?.id);
      const stationId = Number(
        signInfo?.stationId ?? signInfo?.stationInfo?.id ?? signInfo?.virtualStationInfo?.stationId
      );
      if (virtualStationId) originalVirtualStationIds.add(virtualStationId);
      if (stationId) originalStationIds.add(stationId);
    });

    return virtualStationList
      .map((virtualStationInfo: any, index: number) => {
        const virtualStationId = Number(virtualStationInfo?.id ?? virtualStationInfo?.virtualStationId) || undefined;
        const stationId =
          Number(virtualStationInfo?.stationId ?? virtualStationInfo?.stationInfo?.id) || undefined;
        const stationInfo = stationId ? physicalStationMap.get(stationId) : undefined;

        // station/list 中未匹配到物理工位的虚拟工位不展示。
        if (!virtualStationId || !stationId || !stationInfo) return undefined;

        const staffList = getPhysicalStationStaffList(stationInfo);
        const virtualStationName =
          virtualStationInfo?.virtualStationName || virtualStationInfo?.stationName || stationInfo?.stationName || "";

        return {
          rowKey: `${virtualStationId}-${stationId}-${index}`,
          stationName: stationInfo?.stationName || "",
          stationNo: stationInfo?.stationNo || "",
          physicalStationName: stationInfo?.stationName || "",
          physicalStationNo: stationInfo?.stationNo || "",
          stationId,
          virtualStationId,
          virtualStationName,
          staffList,
          selectedStaffIds: staffList.map((item) => item.id),
          checked: originalVirtualStationIds.size
            ? originalVirtualStationIds.has(virtualStationId)
            : originalStationIds.has(stationId),
        } as StaffSignFormItem;
      })
      .filter((item): item is StaffSignFormItem => !!item);
  }

  function unwrapRecords(result: any): any[] {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.records)) return result.records;
    if (Array.isArray(result?.data?.records)) return result.data.records;
    if (Array.isArray(result?.data)) return result.data;
    return [];
  }

  function syncProductCraftSelection(info: any) {
    const originalCraftId = info?.craftId ?? info?.craftInfo?.id ?? info?.virtualLineInfo?.craftInfo?.id;
    const originalProductId = info?.productId ?? info?.productInfo?.id;
    const originalCraftName = info?.craftInfo?.craftName ?? info?.virtualLineInfo?.craftInfo?.craftName;
    const productOptions = productCraftOptions.value.filter(
      (item) => String(item.productId) === String(originalProductId)
    );
    const selectedOption =
      productOptions.find((item) => {
        return String(item.productId) === String(originalProductId) && String(item.craftId) === String(originalCraftId);
      }) ||
      productOptions.find((item) => originalCraftName && item.label.includes(`【${originalCraftName}】`)) ||
      (productOptions.length === 1 ? productOptions[0] : undefined);

    selectedProductCraftKey.value = selectedOption?.value;
    if (selectedOption) {
      formState.productId = selectedOption.productId;
      formState.craftId = selectedOption.craftId;
      if (selectedOption.productAttrValueIdsList.length) {
        formState.productAttrValueIdsList = [...selectedOption.productAttrValueIdsList];
      }
    }
  }

  function handleProductCraftChange(value: string) {
    const selectedOption = productCraftOptions.value.find((item) => item.value === value);
    if (!selectedOption) return;

    formState.productId = selectedOption.productId;
    formState.craftId = selectedOption.craftId;
    formState.productAttrValueIdsList = [...selectedOption.productAttrValueIdsList];
  }

  async function loadProductCraftList() {
    productCraftLoading.value = true;
    try {
      const result = await craftList({
        pageNum: 1,
        pageSize: maxPageSize,
        sort: "id asc",
      });
      craftData.value = unwrapRecords(result);
    } catch (error) {
      craftData.value = [];
      console.error("工艺列表加载失败", error);
      message.error("工艺列表加载失败");
    } finally {
      productCraftLoading.value = false;
    }
  }

  async function loadSourceInfo() {
    if (!props.sourceId) return;

    loading.value = true;
    try {
      const info = await registrationDetail(props.sourceId);
      const lineId = Number(info?.lineId ?? info?.lineInfo?.id) || undefined;
      const taskId = Number(info?.taskId ?? info?.taskInfo?.id) || undefined;
      const virtualLineId = Number(info?.virtualLineId ?? info?.virtualLineInfo?.id) || undefined;

      formState.virtualLineId = virtualLineId;
      formState.productId = Number(info?.productId ?? info?.productInfo?.id) || undefined;
      formState.productAttrValueIdsList = [
        ...(info?.productAttrValueIdsList || info?.taskInfo?.productAttrValueIdsList || []),
      ];
      formState.craftId =
        Number(info?.craftId ?? info?.craftInfo?.id ?? info?.virtualLineInfo?.craftInfo?.id) || undefined;
      formState.planProductNumber = Number(info?.planProductNumber || 0);
      formState.memo = info?.memo || "";
      const [taskResult, virtualLineResult, stationResult, staffResult] = await Promise.allSettled([
        taskId ? productTaskDetail(taskId) : Promise.resolve(undefined),
        lineId ? virtualLineListByLineId(lineId) : Promise.resolve([]),
        lineId ? stationListAll(lineId) : Promise.resolve([]),
        staffListAll(StaffType.PUGONG),
        loadProductCraftList(),
      ]);
      const taskInfo = taskResult.status === "fulfilled" ? taskResult.value : undefined;
      const virtualLineList =
        virtualLineResult.status === "fulfilled" ? unwrapRecords(virtualLineResult.value) : [];
      const virtualLineInfo =
        virtualLineList.find((item: any) => String(item?.id) === String(virtualLineId)) || info?.virtualLineInfo;
      const physicalStationList = stationResult.status === "fulfilled" ? unwrapRecords(stationResult.value) : [];
      normalStaffList.value = staffResult.status === "fulfilled" ? unwrapRecords(staffResult.value) : [];
      const sourceDetail = {
        ...info,
        virtualLineInfo,
      };

      staffSignList.value = buildStaffSignList(sourceDetail, physicalStationList);
      selectedRowKeys.value = [];

      sourceInfo.value = {
        ...sourceDetail,
        lineId,
        taskId,
        taskInfo: taskInfo || info?.taskInfo,
      };
      syncProductCraftSelection(sourceDetail);

      if (taskResult.status === "rejected") {
        console.error("生产任务单详情加载失败", taskResult.reason);
        message.warning("生产任务单详情加载失败，请稍后重试");
      }
      if (stationResult.status === "rejected") {
        console.error("物理产线工位加载失败", stationResult.reason);
        message.warning("物理产线工位加载失败，请稍后重试");
      }
      if (virtualLineResult.status === "rejected") {
        console.error("虚拟产线详情加载失败", virtualLineResult.reason);
        message.warning("虚拟工位加载失败，已使用原登记数据兜底");
      }
      if (staffResult.status === "rejected") {
        console.error("员工列表加载失败", staffResult.reason);
        message.warning("员工列表加载失败，仅可选择工位当前绑定员工");
      }
    } catch (error) {
      sourceInfo.value = undefined;
      staffSignList.value = [];
      selectedRowKeys.value = [];
      message.error("原登记数据加载失败");
      console.error("加载重新登记数据失败", error);
    } finally {
      loading.value = false;
    }
  }

  function confirmMissingStation() {
    return new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: "存在未登记工位",
        content: "未登记工位的信号将无法上报，是否继续开始生产？",
        okText: "继续",
        cancelText: "返回检查",
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  }

  async function createRegistration() {
    const info = sourceInfo.value;
    if (!info) return;

    const unboundVirtualStations = staffSignList.value.filter((item) => item.checked && !item.virtualStationId);
    if (unboundVirtualStations.length) {
      const stationNames = unboundVirtualStations
        .slice(0, 3)
        .map((item) => `${item.stationNo ? `${item.stationNo}-` : ""}${item.stationName}`)
        .join("、");
      message.error(
        `${stationNames}${unboundVirtualStations.length > 3 ? "等工位" : ""}尚未关联当前虚拟产线，暂时无法登记`
      );
      return;
    }

    const latestRegistration = await registrationDetailGetByLatest(info.lineId);
    if (latestRegistration?.registrationStatus === RegistrationStatus.IN_REGISTRATION) {
      message.warning(`产线当前已有进行中的登记：${latestRegistration.registrationNo}`);
      return;
    }

    const registrationData = {
      lineId: info.lineId,
      taskId: info.taskId || undefined,
      virtualLineId: formState.virtualLineId,
      productId: formState.productId,
      productAttrValueIdsList: [...formState.productAttrValueIdsList],
      craftId: formState.craftId,
      planProductNumber: Number(formState.planProductNumber || 0),
      memo: formState.memo || "",
      filePathList: [],
    };

    if (
      !registrationData.lineId ||
      !registrationData.productId ||
      !registrationData.virtualLineId ||
      !registrationData.craftId
    ) {
      message.error("原登记缺少产线、产品或工艺数据，无法重新登记");
      return;
    }

    const registrationId = await registrationAdd(registrationData);
    const now = formatDateByDayjs(Date.now(), "YYYY-MM-DD HH:mm:ss");
    const selectedStaffSignList = staffSignList.value
      .filter((item) => item.checked)
      .flatMap((item) => {
        const staffOptions = getStaffOptions(item.staffList);
        const selectedStaffList = item.selectedStaffIds
          .map((staffId) => staffOptions.find((staffInfo) => String(staffInfo.id) === String(staffId)))
          .filter(Boolean) as StaffSignFormItem["staffList"];
        // 员工允许为空；为空时仍生成一条工位登记数据。
        const registrationStaffList = selectedStaffList.length ? selectedStaffList : [undefined];

        return registrationStaffList.map((staffInfo) => ({
          staffName: staffInfo?.staffName || "",
          virtualStationName: item.virtualStationName,
          startDate: now,
          endDate: "",
          signStatus: StaffSignStatus.DOING,
          absentMemo: "",
          productRegistrationId: registrationId,
          lineId: info.lineId,
          virtualLineId: formState.virtualLineId,
          stationId: item.stationId,
          virtualStationId: item.virtualStationId,
          staffId: staffInfo?.id,
        }));
      });

    if (selectedStaffSignList.length) {
      await registrationStaffSign(selectedStaffSignList);
    }

    const newRegistrationId = (await registrationStart(registrationId)) || registrationId;
    message.success(`已根据 ${info.registrationNo} 创建新登记`);
    emit("success", newRegistrationId);
  }

  async function handleSubmit() {
    if (!sourceInfo.value || submitting.value) return;

    if (!isAllStationSelected.value) {
      const confirmed = await confirmMissingStation();
      if (!confirmed) return;
    }

    submitting.value = true;
    try {
      await createRegistration();
    } catch (error) {
      console.error("重新登记失败", error);
      message.error("重新登记失败，请稍后重试");
    } finally {
      submitting.value = false;
    }
  }
  /** 复选框只选择批量操作目标，不直接改变登记状态。 */
  function onSelectChange(rowKeys: Array<string | number>) {
    selectedRowKeys.value = rowKeys;
  }

  function handleInvertSelect() {
  if (!staffSignList.value.length) return;

  const selectedSet = new Set(selectedRowKeys.value.map((key) => String(key)));
  staffSignList.value.forEach(({ rowKey }) => {
    if (rowKey === undefined || rowKey === null) return;
    const key = String(rowKey);
    if (selectedSet.has(key)) {
      selectedSet.delete(key);
    } else {
      selectedSet.add(key);
    }
  });

  selectedRowKeys.value = Array.from(selectedSet);
}

  /** 仅修改已勾选工位的登记状态，未勾选项保持不变。 */
  function setSelectedRegistration(checked: boolean) {
    const selectedKeySet = new Set(selectedRowKeys.value.map((key) => String(key)));
    staffSignList.value.forEach((item) => {
      if (selectedKeySet.has(String(item.rowKey))) {
        item.checked = checked;
      }
    });
  }
  watch(() => props.sourceId, loadSourceInfo);
  onMounted(loadSourceInfo);
</script>

<style lang="less" scoped>
  .re-register {
    padding: 0 4px 4px;
  }

  .re-register__tip {
    margin-bottom: 20px;
  }

  .re-register__content {
    max-height: calc(80vh - 150px);
    padding-right: 8px;
    overflow-y: auto;
  }

  .form-row {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
  }

  .form-row--top {
    align-items: flex-start;
  }

  .form-label {
    flex: 0 0 112px;
    padding-right: 12px;
    color: rgba(0, 0, 0, 0.85);
    text-align: right;
  }

  .required .form-label::before {
    margin-right: 4px;
    color: #ff4d4f;
    content: "*";
  }

  .form-value {
    min-width: 0;
    flex: 1;
  }

  .readonly-box {
    min-height: 32px;
    padding: 5px 11px;
    line-height: 20px;
    background: #fafafa;
    border: 1px solid #d9d9d9;
    border-radius: 2px;
  }

  .task-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px 20px;
    margin-top: 8px;
    padding: 12px;
    color: #666;
    background: #fafafa;
    border-radius: 2px;
  }
  .selection-column-title {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 22px;

    .invert-select-link {
      max-width: 0;
      margin-left: 0;
      overflow: hidden;
      color: #1677ff;
      font-weight: 400;
      white-space: nowrap;
      cursor: pointer;
      opacity: 0;
      user-select: none;
      transition: max-width 0.2s ease, margin-left 0.2s ease, opacity 0.2s ease;

      &:hover {
        text-decoration: underline;
      }
    }

    &:hover .invert-select-link {
      max-width: 32px;
      margin-left: 6px;
      opacity: 1;
    }
  }

  :deep(.ant-table-selection-column:hover) .selection-column-title .invert-select-link {
    max-width: 32px;
    margin-left: 6px;
    opacity: 1;
  }
  .task-summary__memo {
    grid-column: 1 / -1;
  }

  .summary-label {
    color: #999;
  }

  .product-craft {
    display: flex;
    align-items: center;
  }

  .craft-name {
    margin-left: 6px;
    color: #666;
  }

  .inline-control,
  .station-summary {
    display: flex;
    align-items: center;
  }

  .control-tip,
  .station-summary__tip {
    margin-left: 10px;
    color: #999;
  }

  .station-summary {
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
    font-size: 15px;
  }

  .station-summary__info,
  .station-summary__actions {
    display: flex;
    align-items: center;
  }

  .station-summary__actions {
    flex-shrink: 0;
    gap: 8px;
  }

  .text-warning {
    color: #faad14;
  }

  .evidence-tip {
    color: #999;
  }

  .footer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 8px;
  }

  .empty-state {
    padding: 48px 0;
    color: #999;
    text-align: center;
  }
</style>
