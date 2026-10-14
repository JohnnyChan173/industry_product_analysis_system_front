<template>
  <!-- 工作区 -->
  <AreaWorkSpace>
    <!-- 1、顶部导航 - 左侧 -->
    <template #nav-left>
      <div class="flex">
        <!-- 车间主任：只能选择自己负责的车间，以及该车间下的产线 -->
        <template v-if="isCjzr">
          <Select
            v-model:value="workshopId"

            :style="{ width: '180px', marginRight: '8px' }"
            placeholder="选择车间"
            :allowClear="false"
            @change="handleWorkshopIdChange"
          >
            <Select.Option v-for="item in workshopSelectList" :key="item.id" :value="item.id">
              {{ item.workshopName }}
            </Select.Option>
          </Select>

          <Select
            v-model:value="pageState.lineId"

            :style="{ width: '180px', marginRight: '8px' }"
            placeholder="选择产线"
            :disabled="!workshopId"
            :allowClear="false"
          >
            <Select.Option v-for="item in filteredLineList" :key="item.id" :value="item.id">
              {{ item.lineName }}
            </Select.Option>
          </Select>
        </template>

        <!-- 其他角色保持原来的产线筛选 -->
        <LineRelate v-else class="mr-6px" v-model:lineId="pageState.lineId" />

        <Input.Search
          :style="{ width: '300px' }"
          v-model:value="pageState.keyword"
          placeholder="请输入虚拟名称过滤"
          enter-button="搜索"
          @search="handleSearch"
        />
      </div>
    </template>

    <!-- 2、顶部导航 - 右侧 -->
    <template #nav-right>
      <Button class="mr-4px" type="primary" @click="handleVirtualLineAdd">创建虚拟产线 + </Button>
    </template>

    <!-- 2、主体区 -->
    <template #default>
      <Table
        class="headerify !w-1080px"
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
        <template #bodyCell="{ text, record, index, column }: BodyCellData<VirtualLineDetail>">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>

          <!-- 虚拟产线名称 -->
          <template v-if="column.dataIndex === 'virtualLineName'">
            <span class="text-primary">{{ record.virtualLineName }}</span>
          </template>

          <!-- 所属车间 -->
          <template v-if="column.dataIndex === 'workshopInfo'">
            <span>{{ record.workshopInfo.workshopName }}</span>
          </template>

          <!--虚拟工位数 -->
          <template v-if="column.dataIndex === 'virtualStationTotal'">
            <span>{{ record.virtualStationTotal }}</span>
          </template>

          <!-- 操作 -->
          <template v-else-if="column.key === 'action'">
            <a class="!text-secondary" @click="handleVirtualLineDetailClick(record)">查看</a>

            <Divider type="vertical" />
            <Dropdown>
              <a class="whitespace-nowrap">
                更多
                <DownOutlined />
              </a>

              <template #overlay>
                <Menu>
                  <Menu.Item @click="handleVirtualLineEdit(record)">
                    <a class="!text-secondary">编辑</a>
                  </Menu.Item>
                  <Menu.Item @click="handleESOPAdd(record)">
                    <a class="!text-secondary"> 添加ESOP方案 </a>
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item @click="handleVirtualLineCopy(record)">
                    <a class="!text-secondary"> 复制虚拟产线 </a>
                  </Menu.Item>

                  <Menu.Divider />
                  <Menu.Item @click="handleVirtualLineDel(record)">
                    <a class="!text-danger"> 删除 </a>
                  </Menu.Item>
                </Menu>
              </template>
            </Dropdown>
          </template>
        </template>
      </Table>
    </template>
  </AreaWorkSpace>

  <!-- 弹窗 - 创建虚拟产线 -->
  <Modal
    :style="{ width: AntModalWidth.lg }"
    v-model:visible="modalAddState.visible"
    :title="modalAddState.title"
    :footer="null"
    :mask-closable="false"
    destroyOnClose
  >
    <Add class="!-mt-20px" :id="modalAddState.id" @change="handleAddChange" />
  </Modal>

  <!-- 弹窗 - 添加ESOP方案 -->
  <Modal
    :style="{ width: '80vw' }"
    v-model:visible="esopAddState.visible"
    :title="esopAddState.title"
    :footer="null"
    :mask-closable="false"
    destroyOnClose
  >
    <ESOPAdd class="!-mt-20px" :lineId="esopAddState.lineId" @change="handleAddChange" />
  </Modal>
</template>

<script setup lang="ts">
  import { Input, Button, Modal, Table, Dropdown, Menu, Divider, message, Select } from "ant-design-vue";
  import { computed, onMounted, reactive, ref, watch } from "vue";
  import AreaWorkSpace from "/@/components/Area/Workspace.vue";
  import { defaultPageSize } from "/@/config";
  import { useTable } from "./useTable";
  import { debounce } from "/@/utils/util";
  import { virtualLineList, virtualLineDel } from "/@/api/virtualLine";
  import { useRouter } from "vue-router";
  import { DownOutlined } from "@ant-design/icons-vue";
  import Add from "../Add/index.vue";
  import ESOPAdd from "../ESOPAdd/index.vue";
  import { CommonOperatorTip } from "/@/enums/commonEnum";
  import { BodyCellData } from "/#/antd";
  import { VirtualLineDetail, VirtualLineInfo } from "/@/api/model/virtualLine";
  import { AntModalWidth } from "/@/enums/antEnum";
  import { LineDetailTabEnum, PageEnum } from "/@/enums/pageEnum";
  import { lineListAll } from "/@/api/line";
  import { workshopListAll } from "/@/api/workshop";
  import { LineInfo } from "/@/api/model/line";
  import LineRelate from "/@/views/components/LineRelate/index.vue";
  import { copyVirtualLine } from "/@/utils/data-copy";
  import { useUserInfoStore } from "/@/store";

  const router = useRouter();
  const { isCjzr, staffInfo } = useUserInfoStore();

  /** 车间主任顶部筛选 */
  const workshopId = ref<number | undefined>();
  const workshopSelectList = ref<any[]>([]);
  const lineSelectList = ref<LineInfo[]>([]);

  function getLineWorkshopId(item: any) {
    return item?.workshopId ?? item?.workshopInfo?.id;
  }

  /** 车间主任只能看到当前所选车间下的产线 */
  const filteredLineList = computed(() => {
    if (!isCjzr || !workshopId.value) return [];

    return lineSelectList.value.filter(
      (item: any) => String(getLineWorkshopId(item)) === String(workshopId.value)
    );
  });

  /** 分页数据 */
  const pageState = reactive<any>({
    pageNum: 1,
    pageSize: defaultPageSize,
    sort: "id asc",
    lineId: undefined,
    keyword: "",
    dictLineTypeId: undefined,
  });

  /** 其他数据 */
  const otherState = reactive({
    loading: true,
    total: 0,
  });

  /** 表单数据 */
  const { columns, dataSource } = useTable();

  /** 弹窗 - 创建虚拟产线 */
  const modalAddState = reactive<{
    id?: number;
    visible: boolean;
    title: string;
  }>({
    id: undefined,
    visible: false,
    title: "创建虚拟产线",
  });

  const esopAddState = reactive<{
    lineId?: number;
    visible: boolean;
    title: string;
  }>({
    lineId: undefined,
    visible: false,
    title: "添加ESOP方案",
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
    // 先完成权限相关的车间/产线初始化，再查询列表，避免车间主任首次进入时查询到全量数据。
    await toGetNeedInfo();

    // 获取列表
    await toGetList();
  });

  /** 复制虚拟产线 */
  async function handleVirtualLineCopy(record: VirtualLineInfo) {
    const { id, virtualLineName } = record;
    Modal.confirm({
      title: `确认复制虚拟产线: ${virtualLineName}`,
      content: "",
      okText: "确认",
      cancelText: "取消",
      async onOk() {
        await copyVirtualLine(id);
        await toGetList();
        message.success(CommonOperatorTip.COPY_OK);
      },
      onCancel() {},
    });
  }

  /** 变化 - 车间；车间主任自动切换到该车间第一条产线 */
  function handleWorkshopIdChange() {
    pageState.pageNum = 1;
    pageState.lineId = filteredLineList.value[0]?.id;
  }

  /** 获取必要数据 */
  async function toGetNeedInfo() {
    // 普通角色仍沿用原来的 LineRelate，不额外加载车间筛选。
    if (!isCjzr) {
      lineSelectList.value = await lineListAll();
      return;
    }

    // 车间主任：只保留 staffId 属于自己的车间。
    const workshopRecords = await workshopListAll();
    workshopSelectList.value = workshopRecords.filter(
      (item: any) => item.staffId === staffInfo?.id
    );

    // 再加载物理产线，并默认选中“自己的第一个车间 -> 该车间第一条产线”。
    lineSelectList.value = await lineListAll();
    workshopId.value = workshopSelectList.value[0]?.id;
    pageState.lineId = filteredLineList.value[0]?.id;
  }

  /** 获取虚拟产线列表 */
  async function toGetList() {
    otherState.loading = true;

    // 车间主任如果没有匹配到所属车间/产线，直接返回空列表，禁止无 lineId 查询全量数据。
    if (isCjzr && (!workshopId.value || !pageState.lineId)) {
      dataSource.value = [];
      otherState.total = 0;
      otherState.loading = false;
      return;
    }

    const { records, total } = await virtualLineList(pageState);
    dataSource.value = records;
    otherState.total = total;
    otherState.loading = false;
    console.log(records);
  }

  /** 点击 - 虚拟产线查看 */
  function handleVirtualLineDetailClick(record: VirtualLineInfo) {
    const { lineId } = record;
    const query = {
      id: lineId,
      tab: LineDetailTabEnum.VIRTUAL_LINE,
    };

    router.push({
      path: PageEnum.LINE_DETAIL,
      query,
    });
  }

  /** 点击 - 创建虚拟产线 */
  function handleVirtualLineAdd() {
    modalAddState.id = undefined;
    modalAddState.visible = true;
    modalAddState.title = "创建虚拟产线";
  }

  /** 点击 - 编辑虚拟产线 */
  function handleVirtualLineEdit(record: VirtualLineInfo) {
    const { id } = record;
    modalAddState.id = id;
    modalAddState.visible = true;
    modalAddState.title = "编辑虚拟产线";
  }

  /** 点击 - 删除虚拟产线 */
  function handleVirtualLineDel(record: VirtualLineDetail) {
    const { id } = record;
    const { virtualLineName } = record;
    Modal.confirm({
      title: `确认删除虚拟产线: ${virtualLineName}`,
      content: "",
      okText: "删除",
      cancelText: "取消",
      async onOk() {
        await virtualLineDel(id);
        await toGetList();
        message.success(CommonOperatorTip.OK);
      },
      onCancel() {},
    });
  }

  /** Add 组件变化 */
  async function handleAddChange() {
    await toGetList();
    modalAddState.visible = false;
    esopAddState.visible = false;
    message.success(CommonOperatorTip.OK);
  }

  /** 点击 - 添加ESOP方案 */
  function handleESOPAdd(record: VirtualLineInfo) {
    esopAddState.lineId = record.id;
    esopAddState.visible = true;
    esopAddState.title = "添加ESOP方案";
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
