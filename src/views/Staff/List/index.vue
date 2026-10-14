<template>
  <!-- 工作区 -->
  <AreaWorkSpace>
    <!-- 1、顶部导航 - 左侧 -->
    <template #nav-left>
      <div>
        <!-- <Select
          :allowClear="!isCjzr"
          placeholder="选择车间"
          v-model:value="pageState.workshopId"
          style="width: 150px; margin-right: 6px"
        >
          <Select.Option v-for="{ id, workshopName } in workshopSelectList" :key="id" :value="id">
            {{ workshopName }}
          </Select.Option>
        </Select> -->

        <Select
          allowClear
          placeholder="员工类型"
          v-model:value="pageState.staffType"
          style="width: 150px; margin-right: 6px"
        >
          <Select.Option v-for="{ label, value } in StaffTypeList" :key="value" :value="value">
            {{ label }}
          </Select.Option>
        </Select>

        <!-- <Select
          allowClear
          placeholder="登记状态"
          v-model:value="pageState.staffSignStatus"
          style="width: 150px; margin-right: 6px"
        >
          <Select.Option v-for="{ label, value } in StaffSignStatusList" :key="value" :value="value">
            {{ label }}
          </Select.Option>
        </Select> -->

        <Input.Search
          :style="{ width: '300px' }"
          v-model:value="pageState.keyword"
          placeholder="请输入员工编号或名称过滤"
          enter-button="搜索"
          @search="handleSearch"
        />
      </div>
    </template>

    <!-- 2、顶部导航 - 右侧 -->
    <template #nav-right>
      <Button type="primary" @click="handleBatchEdit">批量编辑</Button>
      <!-- <Button
        style="margin-right: 6px"
        :disabled="!state.selectedRowKeys.length"
        @click="handleBindWorkshopClick"
      >
        一键绑定车间
      </Button> -->

      <Button type="primary" @click="handleStaffAddClick">创建员工 + </Button>

      <Button :loading="xlsxDownloading" @click="handleDownloadXlsx">
        <DownloadOutlined />
        下载员工模板
      </Button>

      <a-upload :beforeUpload="handleImportXlsxClick" :showUploadList="false" accept=".xlsx">
        <Button type="primary" class="success">
          <UploadOutlined />
          上传员工数据
        </Button>
      </a-upload>
    </template>

    <!-- 2、主体区 -->
    <template #default>
      <Table
        class="headerify !max-w-1280px"
        rowKey="id"
        :loading="otherState.loading"
        :dataSource="dataSource"
        :columns="columns"
        :row-selection="rowSelectionConfig"
        :pagination="{
          total: otherState.total,
          current: pageState.pageNum,
          pageSize: pageState.pageSize,
          showSizeChanger: true,
          onChange: onPageChange,
        }"
      >
        <template #bodyCell="{ text, record, index, column }: BodyCellData<StaffDetail>">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>

          <!-- 员工编号 -->
          <template v-if="column.dataIndex === 'staffNo'">
            <span>{{ record.staffNo }}</span>
          </template>

          <!-- 员工账号 -->
          <template v-if="column.dataIndex === 'userInfo'">
            <span>{{ record.userInfo.username }}</span>
          </template>

          <!-- 员工名称 -->
          <template v-if="column.dataIndex === 'staffName'">
            <span>{{ record.staffName }}</span>
          </template>

          <!-- 所属车间 -->
          <template v-if="column.dataIndex === 'workshopInfo'">
            <span>{{ record.workshopInfo?.workshopName || "/" }}</span>
          </template>

          <!-- 员工类型 -->
          <template v-if="column.dataIndex === 'staffType'">
            <Tag color="blue">{{ getListItemLabel(StaffTypeList, text) }}</Tag>
          </template>

          <!-- 手机号 -->
          <template v-if="column.key === 'phoneNumber'">
            <span>{{ record.userInfo.phoneNumber || "/" }} </span>
          </template>

          <!-- 登记状态 -->
          <template v-if="column.key === 'staffSignStatus'">
            <!-- <span
              v-if="isPuGong(record.staffType)"
              class="prefix-circle border primary"
              :class="_getStaffSignStatusColor(record.latestSignInfo?.signStatus)"
            >
              {{ getListItemLabel(StaffSignStatusList, record.latestSignInfo?.signStatus || StaffSignStatus.NOT_DO) }}
            </span> -->
            <TagStaffSignStatus :info="record.latestSignInfo" />
          </template>

          <!-- 登记工位 -->
          <template v-if="column.key === 'staffSignStation'">
            <div v-if="isPuGong(record.staffType)">
              <p class="text-gray-400">
                {{ record.latestSignInfo?.lineInfo.lineName }}
              </p>
              <p>
                {{ record.latestSignInfo?.stationInfo.stationName }}
              </p>
            </div>
          </template>

          <!-- 最近登记开始 -->
          <template v-if="column.key === 'staffSignStart'">
            <p v-if="isPuGong(record.staffType)" class="text-13px leading-20px text-gray-400">
              <span v-if="record.latestSignInfo">
                <span>{{ record.latestSignInfo?.startDate?.split(" ")[0] }}</span>
                <br />
                <span>{{ record.latestSignInfo?.startDate?.split(" ")[1] }}</span>
              </span>
              <span v-else>/</span>
            </p>
          </template>

          <!-- 备注 -->
          <template v-if="column.key === 'memo'">
            <span>{{ record.memo || "/" }}</span>
          </template>

          <!-- 最近登记结束 -->
          <template v-if="column.key === 'staffSignEnd'">
            <p v-if="isPuGong(record.staffType)" class="text-13px leading-20px text-gray-400">
              <span v-if="record.latestSignInfo">
                <span>{{ record.latestSignInfo?.endDate?.split(" ")[0] }}</span>
                <br />
                <span>{{ record.latestSignInfo?.endDate?.split(" ")[1] }}</span>
              </span>
              <span v-else>/</span>
            </p>
          </template>

          <template v-if="column.key === 'action'">
            <a class="!text-primary" @click="handleStaffEdit(record.id)"> 编辑 </a>
            <Divider type="vertical" />

            <Dropdown>
              <a class="whitespace-nowrap">
                更多
                <DownOutlined />
              </a>
              <template #overlay>
                <Menu>
                  <Menu.Item @click="() => handleResetPasswordClick(record.id, record)">
                    <a class="!text-warn"> 重置密码 </a>
                  </Menu.Item>

                  <Menu.Divider />
                  <Menu.Item @click="handleDelete(record.id, record)">
                    <span class="text-danger hover-opacity">删除</span>
                  </Menu.Item>
                </Menu>
              </template>
            </Dropdown>
          </template>
        </template>
      </Table>
    </template>
  </AreaWorkSpace>

  <!-- 弹窗 - 创建员工 -->
  <Modal v-model:visible="modalStaffAddState.visible" :title="modalStaffAddState.title" :footer="null" destroyOnClose>
    <Add :id="modalStaffAddState.id" @change="handleStaffAddChange" />
  </Modal>

  <!-- 批量编辑只修改本页展示数据，不调用员工编辑接口 -->
  <Modal
    v-model:visible="modalBatchEditState.visible"
    title="批量编辑员工"
    :width="1200"
    :footer="null"
    destroyOnClose
  >
    <BatchEdit
      v-if="modalBatchEditState.visible"
      :list="modalBatchEditState.list"
      :workshop-list="workshopSelectList"
      @save="handleBatchEditSave"
      @cancel="modalBatchEditState.visible = false"
    />
  </Modal>

  <!-- 弹窗 - 一键绑定车间 -->
  <Modal
    v-model:visible="modalBindWorkshopState.visible"
    title="一键绑定车间"
    :confirm-loading="modalBindWorkshopState.loading"
    ok-text="确定绑定"
    cancel-text="取消"
    @ok="handleBindWorkshopOk"
  >
    <p class="text-gray-400 mb-12px">
      已选中 <span class="text-primary">{{ state.selectedRowKeys.length }}</span> 名员工，绑定后将覆盖其原有车间
    </p>
    <Select
      v-model:value="modalBindWorkshopState.workshopId"
      placeholder="请选择车间"
      style="width: 100%"
      showArrow
      allowClear
    >
      <Select.Option v-for="{ id, workshopName } in workshopSelectList" :key="id" :value="id">
        {{ workshopName }}
      </Select.Option>
    </Select>
  </Modal>
</template>

<script setup lang="ts">
  import {
    Input,
    Button,
    Modal,
    Table,
    Dropdown,
    Menu,
    Divider,
    message,
    Popover,
    Select,
    Tooltip,
    Tag,
    Checkbox,
  } from "ant-design-vue";
  import { computed, h, nextTick, onMounted, reactive, ref, watch } from "vue";
  import AreaWorkSpace from "/@/components/Area/Workspace.vue";
  import { XLSX_TEMPLATE_PATH, defaultPageSize, defaultSort } from "/@/config";
  import { StaffSignStatusList, StaffTypeList, getListItemLabel } from "/@/config/data";
  import { useTable } from "./useTable";
  import { createDownload, debounce, delay } from "/@/utils/util";
  import { staffList, staffDel, staffWorkshopList,staffImport } from "/@/api/staff";
  import { workshopListAll } from "/@/api/workshop";
  import { WorkshopInfo } from "/@/api/model/workshop";
  import { useRouter } from "vue-router";
  import { DownOutlined, DownloadOutlined, UploadOutlined } from "@ant-design/icons-vue";
  import Add from "../Add/index.vue";
  import BatchEdit from "../Edit/index.vue";
  import { CommonOperatorTip } from "/@/enums/commonEnum";
  import { AntInputType } from "/@/enums/antEnum";
  import { StaffSignStatus } from "/@/enums/model";
  import { BodyCellData } from "/#/antd";
  import { StaffDetail, StaffInfo } from "/@/api/model/staff";
  import { createInputModal } from "/@/components/Modal/createModalInput";
  import { userResetPassword } from "/@/api/user";
  import { isPuGong } from "/@/config/parse";
  import { useUserInfoStore } from "/@/store";
  import TagStaffSignStatus from "../../baseComponents/TagStaffSignStatus.vue";


  const xlsxDownloading = ref(false);
  const router = useRouter();
  const { isCjzr, staffInfo } = useUserInfoStore();

  /** 选中行数据 */
  const state = reactive({
    selectedRowKeys: [] as number[],
  });

  // 保留跨页勾选的员工快照，以及本次打开页面期间的模拟编辑结果。
  const selectedStaff = new Map<number, StaffDetail>();
  const simulatedStaff = new Map<number, StaffDetail>();
  const modalBatchEditState = reactive({
    visible: false,
    list: [] as StaffDetail[],
  });

  /** 选中行数据改变 */
  function onSelectChange(selectedRowKeys: number[], selectedRows: StaffDetail[]) {
    state.selectedRowKeys = selectedRowKeys;
    const selectedSet = new Set(selectedRowKeys);
    for (const id of selectedStaff.keys()) {
      if (!selectedSet.has(id)) selectedStaff.delete(id);
    }
    selectedRows.forEach((record) => selectedStaff.set(record.id, record));
    dataSource.value.forEach((record) => {
      if (selectedSet.has(record.id)) selectedStaff.set(record.id, record);
    });
  }

  function handleBatchEdit() {
    if (!state.selectedRowKeys.length) {
      message.warning("请先选择员工");
      return;
    }
    const list = state.selectedRowKeys.map((id) => selectedStaff.get(id)).filter((item): item is StaffDetail => !!item);
    if (!list.length) {
      message.warning("未找到选中员工，请重新选择");
      return;
    }
    modalBatchEditState.list = list;
    modalBatchEditState.visible = true;
  }

  async function handleBatchEditSave(list: StaffDetail[]) {
    modalBatchEditState.visible = false;
    modalBatchEditState.list = [];
    await toGetList();
  }

  /** 点击 - 反选（仅针对当前页数据） */
  function handleInvertSelect() {
    if (!dataSource.value.length) return;

    const selectedSet = new Set(state.selectedRowKeys);
    dataSource.value.forEach(({ id }) => {
      if (id === undefined || id === null) return;
      if (selectedSet.has(id)) {
        selectedSet.delete(id);
      } else {
        selectedSet.add(id);
      }
    });

    state.selectedRowKeys = Array.from(selectedSet);
    onSelectChange(state.selectedRowKeys, dataSource.value.filter(({ id }) => selectedSet.has(id)));
  }

  /** 分页数据 */
  const pageState = reactive<any>({
    pageNum: 1,
    pageSize: defaultPageSize,
    sort: "id asc",
    keyword: "",
    staffType: undefined,
    staffSignStatus: undefined,
    workshopId: undefined,
  });

  /** 其他数据 */
  const otherState = reactive({
    loading: true,
    total: 0,
  });

  /** 表单数据 */
  const { columns, dataSource } = useTable();

  const currentPageSelectedCount = computed(() => {
    const selectedSet = new Set(state.selectedRowKeys);
    return dataSource.value.filter(({ id }) => id != null && selectedSet.has(id)).length;
  });

  function handleCurrentPageSelectAll(checked: boolean) {
    const selectedSet = new Set(state.selectedRowKeys);

    dataSource.value.forEach(({ id }) => {
      if (id == null) return;
      if (checked) {
        selectedSet.add(id);
      } else {
        selectedSet.delete(id);
      }
    });

    state.selectedRowKeys = Array.from(selectedSet);
    onSelectChange(state.selectedRowKeys, dataSource.value.filter(({ id }) => selectedSet.has(id)));
  }

  const rowSelectionConfig = computed(() => ({
    selectedRowKeys: state.selectedRowKeys,
    onChange: onSelectChange,
    columnWidth: 76,
    columnTitle: h("div", { class: "selection-column-title" }, [
      h(Checkbox, {
        checked: !!dataSource.value.length && currentPageSelectedCount.value === dataSource.value.length,
        indeterminate:
          currentPageSelectedCount.value > 0 && currentPageSelectedCount.value < dataSource.value.length,
        disabled: !dataSource.value.length,
        onClick: (event: MouseEvent) => event.stopPropagation(),
        onChange: (event: any) => handleCurrentPageSelectAll(!!event?.target?.checked),
      }),
      h(
        "span",
        {
          class: "invert-select-link",
          title: "反选当前页",
          onClick: (event: MouseEvent) => {
            event.stopPropagation();
            handleInvertSelect();
          },
        },
        "反选"
      ),
    ]),
  }));

  /** 车间下拉列表 */
  const workshopSelectList = ref<WorkshopInfo[]>([]);

  /** 弹窗 - 创建员工 */
  const modalStaffAddState = reactive<{
    id?: number;
    visible: boolean;
    title: string;
  }>({
    id: undefined,
    visible: false,
    title: "创建员工",
  });

  /** 弹窗 - 一键绑定车间 */
  const modalBindWorkshopState = reactive<{
    visible: boolean;
    loading: boolean;
    workshopId?: number;
  }>({
    visible: false,
    loading: false,
    workshopId: undefined,
  });

  const debounceToGetList = debounce(toGetList, 200);

  // 重置页码
  watch([() => pageState.keyword, () => pageState.workshopId], () => {
    pageState.pageNum = 1;
  });

  // 检测变化刷新列表
  watch(
    () => pageState,
    () => {
      debounceToGetList();
    },
    { deep: true }
  );

  // mounted
  onMounted(async () => {
    await toGetNeedInfo();

    // 获取列表
    await toGetList();
  });

  /** 获取员工登记状态颜色 */
  function _getStaffSignStatusColor(status: StaffSignStatus) {
    if (status === StaffSignStatus.NOT_DO) {
      return "dark";
    } else if (status === StaffSignStatus.DOING) {
      return "primary";
    } else if (status === StaffSignStatus.ABSENT) {
      return "danger";
    } else if (status === StaffSignStatus.DONE) {
      return "success";
    }
  }

  /** 点击 - 重置密码 */
  async function handleResetPasswordClick(id: number, record: StaffDetail) {
    const { staffName, userId } = record;
    createInputModal({
      title: `员工:${staffName},重置密码`,
      placeholder: "请输入重置的密码",
      mode: AntInputType.PASSWORD,
      async onOk(password) {
        if (!password) {
          message.warn("请输入密码");
          return Promise.reject("");
        }

        await userResetPassword(userId, password);

        message.success(CommonOperatorTip.OK);
      },
    });
  }

  /** 获取必要数据 */
  async function toGetNeedInfo() {
    // 获取车间列表；车间主任只保留自己负责的车间。
    const records = await workshopListAll();
    workshopSelectList.value = isCjzr
      ? records.filter((item: any) => String(item.staffId) === String(staffInfo?.id))
      : records;

    // 只有车间主任默认选中自己的第一个车间；
    // 其他角色保持未选择状态；刷新时尽量保留当前有效选择。
    if (isCjzr) {
      const currentWorkshopStillValid = workshopSelectList.value.some(
        (item) => String(item.id) === String(pageState.workshopId)
      );
      if (!currentWorkshopStillValid) {
        pageState.workshopId = workshopSelectList.value[0]?.id;
      }
    }
  }

  /** 获取员工列表 */
  async function toGetList() {
    otherState.loading = true;

    // 车间主任必须限定在自己的车间内查询；未匹配到所属车间时不请求全量员工。
    if (isCjzr && !pageState.workshopId) {
      dataSource.value = [];
      otherState.total = 0;
      otherState.loading = false;
      return;
    }

    const data = {
      ...pageState,
    };

    const { records, total } = await staffList(data);
    dataSource.value = records.map((record: StaffDetail) => simulatedStaff.get(record.id) || record);
    dataSource.value.forEach((record) => {
      if (state.selectedRowKeys.includes(record.id)) selectedStaff.set(record.id, record);
    });
    otherState.total = total;
    otherState.loading = false;
    console.log(records);
  }

  /** 点击 - 创建员工 */
  function handleStaffAddClick() {
    modalStaffAddState.id = undefined;
    modalStaffAddState.visible = true;
    modalStaffAddState.title = "创建员工";
  }

  /** 点击 - 编辑员工 */
  function handleStaffEdit(id: number) {
    modalStaffAddState.id = id;
    modalStaffAddState.visible = true;
    modalStaffAddState.title = "编辑员工";
  }

  /** 点击 - 删除 */
  function handleDelete(id: number, record: StaffInfo) {
    const { staffNo } = record;
    Modal.confirm({
      title: `确认删除员工: ${staffNo}`,
      content: "",
      okText: "删除",
      cancelText: "取消",
      async onOk() {
        await staffDel(id);
        await toGetList();
        message.success(CommonOperatorTip.OK);
      },
      onCancel() {},
    });
  }

  /** 点击 - 一键绑定车间 */
  async function handleBindWorkshopClick() {
    if (!state.selectedRowKeys.length) {
      message.warn("请先选择员工");
      return;
    }

    // 车间列表尚未加载时兜底拉取，避免车间主任场景下漏数据。
    if (!workshopSelectList.value.length) {
      await toGetNeedInfo();
    }

    modalBindWorkshopState.workshopId = undefined;
    modalBindWorkshopState.visible = true;
  }

  /** 确认 - 绑定车间 */
  async function handleBindWorkshopOk() {
    const { workshopId } = modalBindWorkshopState;

    if (!workshopId) {
      message.warn("请选择车间");
      return;
    }

    modalBindWorkshopState.loading = true;
    try {
      const data = state.selectedRowKeys.map((id) => ({ id, workshopId }));
      await staffWorkshopList(data);

      message.success(CommonOperatorTip.OK);
      modalBindWorkshopState.visible = false;
      state.selectedRowKeys = [];
      await toGetList();
    } finally {
      modalBindWorkshopState.loading = false;
    }
  }

  /** Add 组件变化 */
  async function handleStaffAddChange() {
    if (modalStaffAddState.id != null) simulatedStaff.delete(modalStaffAddState.id);
    await toGetList();
    modalStaffAddState.visible = false;
    message.success(CommonOperatorTip.OK);
  }

  /** 搜索 */
  function handleSearch() {
    toGetList();
  }

  /** 变化 - 页变化 */
  function onPageChange(current: number, size: number) {
    pageState.pageNum = current;
    pageState.pageSize = size;
  }

  /** 无数据时下载原模板，有数据时填入当前列表第一条员工。 */
  async function handleDownloadXlsx() {
    if (xlsxDownloading.value) return;

    // 优先使用项目配置；未配置 STAFF 时，将模板放在 public/template-staff.xlsx。
    const xlsxPath = (XLSX_TEMPLATE_PATH as Record<string, string>).STAFF || "/template-staff.xlsx";
    const fileName = "员工导入模板.xlsx";
    const firstStaff = dataSource.value?.[0];
    if (!firstStaff) {
      createDownload(xlsxPath, fileName);
      return;
    }

    // 与产品界面一致，使用 index.html 已加载的 xlsx-js-style。
    const XLSX = (window as any).XLSX;
    if (!XLSX?.read || !XLSX?.utils?.sheet_add_aoa || !XLSX?.writeFile) {
      message.error("xlsx-js-style 未加载，请检查 /xlsx-style.min.js 是否可访问");
      return;
    }

    // 在请求模板前固定第一条数据；类型和车间按模板要求填写名称。
    const staffType = StaffTypeList.find((item) => String(item.value) === String(firstStaff.staffType))?.label ?? "";
    const workshopName =
      firstStaff.workshopInfo?.workshopName ??
      workshopSelectList.value.find((item) => String(item.id) === String(firstStaff.workshopId))?.workshopName ??
      "";
    const exampleRow = [
      String(firstStaff.staffNo ?? ""),
      String(firstStaff.staffName ?? ""),
      String(firstStaff.userInfo?.phoneNumber ?? firstStaff.phoneNumber ?? ""),
      String(staffType),
      String(workshopName),
    ];

    xlsxDownloading.value = true;
    try {
      const response = await fetch(xlsxPath);
      if (!response.ok) throw new Error(`模板读取失败：${response.status}`);
      const workbook = XLSX.read(await response.arrayBuffer(), { type: "array", cellStyles: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!worksheet) throw new Error("模板中没有可用的工作表");

      // A2:E2 填入示例，F1 的说明及其他工作表保留。
      XLSX.utils.sheet_add_aoa(worksheet, [exampleRow], { origin: "A2" });
      applyStaffTemplateStyles(worksheet);
      XLSX.writeFile(workbook, fileName, { bookType: "xlsx", cellStyles: true });
    } catch (error) {
      console.error("员工导入模板下载失败", error);
      message.error("员工导入模板下载失败，请检查模板路径后重试");
    } finally {
      xlsxDownloading.value = false;
    }
  }

  /** 按 template-staff.xlsx 恢复样式，编号和手机号使用文本格式。 */
  function applyStaffTemplateStyles(worksheet: Record<string, any>) {
    worksheet["!cols"] = [12.375, 17.125, 14, 15.625, 14.625, 30.75].map((width) => ({ width }));
    worksheet["!rows"] = [{ hpt: 30 }, { hpt: 13.5 }];

    for (const column of ["A", "B", "C", "D", "E"]) {
      for (const row of [1, 2]) {
        const cell = worksheet[`${column}${row}`];
        if (!cell) continue;
        cell.z = row === 2 ? "@" : "General";
        cell.s = {
          font: { name: "宋体", sz: 11, color: { rgb: "000000" } },
          alignment: { horizontal: row === 1 ? "center" : "left", vertical: "center" },
          fill: { patternType: "none" },
          border: {},
          numFmt: cell.z,
        };
      }
    }

    if (worksheet.F1) {
      worksheet.F1.s = {
        font: { name: "宋体", sz: 11, bold: true, color: { rgb: "FF0000" } },
        alignment: { vertical: "center", wrapText: true },
        fill: { patternType: "none" },
        border: {},
        numFmt: "General",
      };
    }
  }

  async function handleImportXlsxClick(file: File) {
    otherState.loading = true;
    try {
      const formData = new FormData();
      formData.append("file", file);
      await staffImport(formData);
      message.success("导入成功");
      await toGetList();
    } catch (e) {
      // 接口失败/异常都会走到这里
      // 如果 request 层已经统一弹了 message.error，这里可以只 console 或留空
      console.error("员工导入失败:", e);
    } finally {
      otherState.loading = false;
    }
    // 阻止 a-upload 默认上传行为
    return Promise.reject();
  }
</script>

<style lang="less" scoped>
  .selection-column-title {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 22px;

    .invert-select-link {
      max-width: 0;
      margin-left: 0;
      overflow: hidden;
      color: @color-primary;
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
</style>
