<template>
  <!-- 工作区 -->
  <AreaWorkSpace>
    <!-- 1、顶部导航 - 左侧 -->
    <template #nav-left>
      <div class="flex">
        <Select
          v-model:value="workshopId"
          placeholder="选择车间"
          style="width: 150px; margin-right: 6px"
          :disabled="isXz"
          allowClear
          @change="handleWorkshopIdChange"
        >
          <Select.Option v-for="item in workshopSelectList" :key="item.id" :value="item.id">
            {{ item.workshopName }}
          </Select.Option>
        </Select>

        <Select
          v-model:value="pageState.lineId"
          placeholder="选择产线"
          style="width: 150px; margin-right: 6px"
          :disabled="isXz || !workshopId"
          @change="handleLineIdChange"
        >
          <Select.Option v-for="item in filteredLineList" :key="item.id" :value="item.id">
            {{ item.lineName }}
          </Select.Option>
        </Select>

        <Select
          allowClear
          placeholder="任务单状态"
          v-model:value="pageState.taskStatus"
          style="width: 150px; margin-right: 6px"
        >
          <Select.Option v-for="{ label, value } in RegistrationStatusList" :key="value" :value="value">
            {{ label }}
          </Select.Option>
        </Select>
        <Input
          :style="{ width: '240px', marginRight: '6px' }"
          v-model:value="pageState.productTaskNo"
          placeholder="请输入任务单号过滤"
          enter-button="搜索"
          allowClear
          @search="handleSearch"
        />
        <Input
          :style="{ width: '240px', marginRight: '6px' }"
          v-model:value="pageState.productName"
          placeholder="请输入产品名称过滤"
          allowClear
          @search="handleSearch"
        />
        <Input.Search
          :style="{ width: '240px' }"
          v-model:value="pageState.keyword"
          placeholder="请输入关键字过滤"
          enter-button="搜索"
          allowClear
          @search="handleSearch"
        />
      </div>
    </template>

    <!-- 2、顶部导航 - 右侧 -->
    <template #nav-right> </template>

    <!-- 2、主体区 -->
    <template #default>
      <Table
        class="headerify"
        rowKey="id"
        :loading="otherState.loading"
        :dataSource="dataSource"
        :columns="columns"
        :pagination="{
          total: otherState.total,
          current: pageState.pageNum,
          pageSize: pageState.pageSize,
          showSizeChanger: false,
          onChange: onPageChange,
        }"
      >
        <template #bodyCell="{ text, record, index, column }: BodyCellData<RegistrationDetail>">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>

          <!-- 产线名称 -->
          <template v-if="column.dataIndex === 'lineInfo'">
            {{ record.lineInfo?.lineName }}
          </template>

          <!-- 关联任务单 -->
          <template v-if="column.dataIndex === 'taskInfo'">
            <span v-if="record.taskInfo" class="text-primary hover-underline" @click="handle2ProductTask(record)">
              {{ record.taskInfo.taskNo }}
            </span>
            <span v-else class="text-gray-400">/</span>
          </template>

          <!-- 生产产品 -->
          <template v-if="column.dataIndex === 'productInfo'">
            <ProductRelate
              class="text-primary"
              :mode="CommonComponentMode.DETAIL"
              :productId="record.productId"
              :productAttrValueIdsList="record.productAttrValueIdsList"
            />
            <!-- <TagProduct :info="record.productInfo" /> -->
          </template>

          <!-- 实际生产 -->
          <template v-if="column.dataIndex === 'actualProductNumber'">
            <span v-if="record.registrationStatus === RegistrationStatus.IN_REGISTRATION" class="text-gray-400">
              生产中
            </span>
            <span v-else class="font-bold text-primary">{{ text }}</span>
          </template>

          <!-- 开始时间 -->
          <template v-if="column.dataIndex === 'startDate'">
            <span v-if="text">
              <span>{{ record.startDate.split(" ")[0] }}</span>
              <br />
              <span>{{ record.startDate.split(" ")[1] }}</span>
            </span>
            <span v-else class="text-gray-400">/</span>
          </template>

          <!-- 结束时间 -->
          <template v-if="column.dataIndex === 'endDate'">
            <span v-if="text">
              <span>{{ record.endDate.split(" ")[0] }}</span>
              <br />
              <span>{{ record.endDate.split(" ")[1] }}</span>
            </span>
            <span v-else class="text-gray-400">/</span>
          </template>

          <!-- 生产状态 -->
          <template v-if="column.dataIndex === 'registrationStatus'">
            <TagRegistrationStatus :value="record.registrationStatus" />
          </template>

          <template v-if="column.key === 'action'">
            <span class="text-primary hover-opacity" @click="handleRegistrationDetail(record.id)">查看</span>

            <Divider type="vertical" />
            <Dropdown>
              <a class="whitespace-nowrap">
                更多
                <DownOutlined />
              </a>
              <template #overlay>
                <Menu>
                  <Menu.Item @click="handleRecreate(record)">
                    <span class="text-primary hover-opacity">重新登记</span>
                  </Menu.Item>
                  <Menu.Item @click="handleDelete(record, record.id)">
                    <span class="text-danger hover-opacity">删除</span>
                  </Menu.Item>
                  <Menu.Item @click="handleEnd(record, record.id)">
                    <span class="text-primary hover-opacity">结束</span>
                  </Menu.Item>

                  <Menu.Item @click="handleUpdate(record)">
                    <span class="text-primary hover-opacity">修改生产结果</span>
                  </Menu.Item>
                </Menu>
              </template>
            </Dropdown>
          </template>
        </template>
      </Table>
    </template>
  </AreaWorkSpace>

  <!-- 弹窗 - 创建任务单 -->
  <Modal
    :style="{ minWidth: '580px' }"
    v-model:visible="modalAddState.visible"
    :title="modalAddState.title"
    :footer="null"
    destroyOnClose
  >
    <Add :id="modalAddState.id" @change="handleAddChange" />
  </Modal>

  <!-- 重新登记：先回显原登记配置，确认后再创建新登记 -->
  <Modal
    v-model:visible="reRegisterState.visible"
    :title="reRegisterState.title"
    :width="920"
    :footer="null"
    destroyOnClose
    :maskClosable="false"
  >
    <ReRegister
      v-if="reRegisterState.sourceId"
      :sourceId="reRegisterState.sourceId"
      @success="handleReRegisterSuccess"
      @cancel="reRegisterState.visible = false"
    />
  </Modal>
</template>

<script setup lang="ts">
  import {
    Input,
    InputNumber,
    Modal,
    Table,
    Dropdown,
    Menu,
    Divider,
    message,
    Select,
  } from "ant-design-vue";
  import { computed, defineComponent, h, onMounted, reactive, ref, watch } from "vue";
  import AreaWorkSpace from "/@/components/Area/Workspace.vue";
  import { defaultPageSize } from "/@/config";
  import { useTable } from "./useTable";
  import { debounce } from "/@/utils/util";
  import { registrationList, registrationDel, registrationEnd, registrationEdit } from "/@/api/registration";
  import { lineListAll } from "/@/api/line";
  import { workshopListAll } from "/@/api/workshop";
  import { useRouter } from "vue-router";
  import { DownOutlined } from "@ant-design/icons-vue";
  import Add from "../Add/index.vue";
  import { CommonComponentMode, CommonOperatorTip } from "/@/enums/commonEnum";
  import { BodyCellData } from "/#/antd";
  import { useUserInfoStore } from "/@/store";
  import { RegistrationStatusList } from "/@/config/data";
  import { RegistrationDetail } from "/@/api/model/registration";
  import TagRegistrationStatus from "../../baseComponents/TagRegistrationStatus.vue";
  import { PageEnum } from "/@/enums/pageEnum";
  import { RegistrationStatus } from "/@/enums/model";
  import ProductRelate from "/@/views/components/ProductRelate/index.vue";
  import ReRegister from "../ReRegister/index.vue";

  const router = useRouter();
  const { isXz, manageLineId, isCjzr, staffInfo } = useUserInfoStore();

  /** 顶部选择：车间 -> 产线 */
  const workshopId = ref<number | undefined>();
  const workshopSelectList = ref<any[]>([]);
  const lineList = ref<any[]>([]);

  function getLineWorkshopId(item: any) {
    return item?.workshopId ?? item?.workshopInfo?.id;
  }

  const filteredLineList = computed(() => {
    if (!workshopId.value) return [];

    return lineList.value.filter(
      (item: any) => String(getLineWorkshopId(item)) === String(workshopId.value)
    );
  });

  /** 分页数据 */
  const pageState = reactive<any>({
    pageNum: 1,
    pageSize: defaultPageSize,
    sort: "id desc",
    keyword: "",
    taskStatus: undefined,
    lineId: undefined,
  });

  /** 其他数据 */
  const otherState = reactive({
    loading: true,
    total: 0,
  });

  /** 表单数据 */
  const { columns, dataSource } = useTable();

  /** 弹窗 - 创建任务单 */
  const modalAddState = reactive<{
    id?: number;
    visible: boolean;
    title: string;
  }>({
    id: undefined,
    visible: false,
    title: "生产任务单-创建",
  });

  /** 重新登记弹窗 */
  const reRegisterState = reactive({
    visible: false,
    sourceId: undefined as number | undefined,
    title: "重新登记",
  });

  const debounceToGetList = debounce(toGetList, 200);

  // 重置页码
  watch([() => pageState.keyword], () => {
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

  /** 跳转生产任务单 */
  function handle2ProductTask(record: RegistrationDetail) {
    const {
      taskInfo: { taskNo },
    } = record;
    const query = {
      taskNo,
    };

    router.push({
      path: PageEnum.PRODUCT_TASK_LIST,
      query,
    });
  }

  /** 变化 - 车间；只有车间主任默认选择当前车间第一条产线 */
  function handleWorkshopIdChange() {
    pageState.pageNum = 1;
    pageState.lineId = filteredLineList.value[0]?.id;
  }

  /** 变化 - 产线 */
  function handleLineIdChange() {
    pageState.pageNum = 1;
  }

  /** 获取车间列表；车间主任只保留自己负责的车间 */
  async function toGetWorkshopList() {
    const records = await workshopListAll();
    workshopSelectList.value = isCjzr
      ? records.filter((item: any) => String(item.staffId) === String(staffInfo?.id))
      : records;
  }

  /** 获取产线，并初始化顶部车间/产线 */
  async function toGetLineList() {
    lineList.value = await lineListAll();

    // 线长固定到自己管理的产线，并反推所属车间。
    if (isXz && manageLineId) {
      const managedLine = lineList.value.find((item: any) => String(item.id) === String(manageLineId));
      workshopId.value = getLineWorkshopId(managedLine);
      pageState.lineId = managedLine?.id ?? manageLineId;
      return;
    }

    // 只有车间主任默认选中自己的第一个车间及该车间第一条产线。
    // 其他角色保持未选择状态，由用户手动选择。
    if (isCjzr) {
      workshopId.value = workshopSelectList.value[0]?.id;
      pageState.lineId = filteredLineList.value[0]?.id;
    } else {
      workshopId.value = undefined;
      pageState.lineId = undefined;
    }
  }

  /** 获取必要数据 */
  async function toGetNeedInfo() {
    await toGetWorkshopList();
    await toGetLineList();
  }

  /** 获取任务单列表 */
  async function toGetList() {
    otherState.loading = true;

    // 如果是线长
    if (isXz) {
      pageState.lineId = manageLineId;
    }

    // 车间主任未匹配到所属车间，或当前车间没有产线时，不请求全量数据。
    if ((isCjzr && !workshopId.value) || (workshopId.value && !pageState.lineId)) {
      dataSource.value = [];
      otherState.total = 0;
      otherState.loading = false;
      return;
    }

    const data = {
      ...pageState,
    };

    const { records, total } = await registrationList(data);
    dataSource.value = records;
    otherState.total = total;
    otherState.loading = false;
    console.log(records);
  }

  /** 打开重新登记页面，先回显原登记数据，不再直接创建。 */
  function handleRecreate(record: RegistrationDetail) {
    if (record.registrationStatus !== RegistrationStatus.END_REGISTRATION) {
      message.warning("该记录未结束，不能重新登记");
      return;
    }
    reRegisterState.sourceId = record.id;
    reRegisterState.title = `重新登记 - ${record.registrationNo}`;
    reRegisterState.visible = true;
  }

  /** 重新登记成功后刷新列表，并进入新登记详情。 */
  async function handleReRegisterSuccess(id: number) {
    reRegisterState.visible = false;
    await toGetList();
  }

  /** 点击 - 删除 */
  function handleDelete(record: RegistrationDetail, id: number) {
    const { registrationNo } = record;
    Modal.confirm({
      title: `确认删除登记记录: ${registrationNo}`,
      content: "",
      okText: "删除",
      cancelText: "取消",
      async onOk() {
        await registrationDel(id);
        await toGetList();
        message.success(CommonOperatorTip.OK);
      },
      onCancel() {},
    });
  }

  /** 点击 - 结束 */
  function handleEnd(record: RegistrationDetail, id: number) {
    if (record.registrationStatus === RegistrationStatus.END_REGISTRATION) {
      message.warning("该记录已结束");
      return;
    }
    const actualNumber = ref<number | undefined>(record.actualProductNumber || undefined);

    const content = h("div", { style: "display: flex; flex-direction: column; gap: 8px;" }, [
      h("span", "请输入实际生产数量："),
      h(Input, {
        value: actualNumber.value,
        onInput: (e: any) => {
          actualNumber.value = Number(e.target.value);
        },
        type: "number",
        placeholder: "请输入数量",
        style: "width: 100%;",
      }),
    ]);

    Modal.confirm({
      title: `确认结束登记记录: ${record.registrationNo}`,
      content,
      okText: "结束",
      cancelText: "取消",
      async onOk() {
        if (!actualNumber.value || actualNumber.value <= 0) {
          message.error("请输入有效的实际生产数量");
          return Promise.reject("Invalid number");
        }
        await registrationEnd(id, actualNumber.value);
        await toGetList();
        message.success(CommonOperatorTip.OK);
      },
      onCancel() {},
    });
  }

  // ================================================================
  // 「修改生产结果」弹窗内容子组件（同一文件内定义）
  // 用 v-model 让 a-input-number 接管受控逻辑，外面通过 getValue() 取值
  // ================================================================
  const UpdateResultContent = defineComponent({
    name: "UpdateResultContent",
    props: {
      defaultValue: {
        type: Number,
        default: undefined,
      },
    },
    setup(props, { expose }) {
      const value = ref<number | undefined>(props.defaultValue);

      expose({
        getValue: () => value.value,
      });

      return () =>
        h(
          "div",
          { style: "display: flex; flex-direction: column; gap: 8px;" },
          [
            h("span", "请输入实际生产数量："),
            h(InputNumber, {
              value: value.value,
              "onUpdate:value": (val: number | null) => {
                value.value = val ?? undefined;
              },
              min: 1,
              placeholder: "请输入数量",
              style: "width: 100%;",
            }),
          ]
        );
    },
  });

  /** 点击 - 修改生产结果 */
  function handleUpdate(record: RegistrationDetail) {
    // 用来拿子组件实例
    const contentRef = ref<any>(null);

    Modal.confirm({
      title: `确认修改生产结果: ${record.registrationNo}`,
      content: () =>
        h(UpdateResultContent, {
          defaultValue: record.actualProductNumber ?? undefined,
          ref: (el: any) => {
            contentRef.value = el;
          },
        }),
      okText: "修改",
      cancelText: "取消",
      async onOk() {
        const val = contentRef.value?.getValue?.();

        if (!val || val <= 0) {
          message.error("请输入有效的实际生产数量");
          return Promise.reject("Invalid number");
        }

        await registrationEdit({ ...record, actualProductNumber: val });
        await toGetList();
        message.success(CommonOperatorTip.OK);
      },
      onCancel() {},
    });
  }

  /** 点击 - 查看任务单 */
  function handleRegistrationDetail(id: number) {
    const query = {
      id,
    };

    router.push({
      path: PageEnum.PRODUCT_REGISTRY_DETAIL,
      query,
    });
  }

  /** Add 组件变化 */
  async function handleAddChange() {
    await toGetList();
    modalAddState.visible = false;
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
</script>

<style lang="less" scoped></style>