<template>
  <!-- 工作区 -->
  <AreaWorkSpace>
    <!-- 1、顶部导航 - 左侧 -->
    <template #nav-left>
      <div class="exception-filter-bar">
        <a-range-picker
          v-model:value="pageState.dateRange"
          class="exception-filter-bar__date"
          format="YYYY-MM-DD"
          allowClear
        />
        <a-select
          v-model:value="pageState.virtualLineIdList"
          :options="virtualLineOptions"
          :loading="virtualLineLoading"
          class="exception-filter-bar__select"
          mode="multiple"
          placeholder="请选择虚拟产线"
          optionFilterProp="label"
          :maxTagCount="1"
          showSearch
          allowClear
          @change="handleVirtualLineChange"
        />
        <a-select
          v-model:value="pageState.virtualStationIdList"
          :options="virtualStationOptions"
          :loading="virtualStationLoading"
          :disabled="!pageState.virtualLineIdList?.length"
          class="exception-filter-bar__select"
          mode="multiple"
          placeholder="请选择虚拟工位"
          optionFilterProp="label"
          :maxTagCount="1"
          showSearch
          allowClear
        />
        <a-select
          v-model:value="pageState.beatType"
          :options="BeatTypeList"
          class="exception-filter-bar__type"
          placeholder="请选择异常类型"
          allowClear
        />

      </div>

      <div class="exception-total ml-20px">
        异常合计：<span class="exception-total__value">{{ otherState.total }}</span>
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
        <template #bodyCell="{ text, record, index, column }: BodyCellData">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>
          <!-- 事件类型 -->
          <template v-if="column.dataIndex === 'registrationStatus'">
            {{ record.registrationStatus === 1 ? "登记中" : "登记完成" }}
          </template>
          <!-- 异常类型 -->
          <template v-if="column.dataIndex === 'beatType'">
            {{ getListItemLabel(BeatTypeList, record.beatType) || "/" }}
          </template>
          <!-- 异常时间 -->
          <template v-if="column.dataIndex === 'sumAvg'">
            {{ record.sumAvg || "/" }}
          </template>
          <!-- 异常时间 -->
          <template v-if="column.dataIndex === 'singleConSum'">
            <span>{{ record.singleConSum || "/" }}</span>
          </template>
        </template>
      </Table>
    </template>
  </AreaWorkSpace>

  <!-- 弹窗 - 详情 -->
  <Modal
    v-model:visible="modalDetailState.visible"
    :title="modalDetailState.title"
    :footer="null"
    destroyOnClose
  >
    <Detail class="!-mt-20px" :id="modalDetailState.id" />
  </Modal>
</template>

<script setup lang="ts">
  import { Input, Modal, Table, Dropdown, Menu, Divider, message, Select, Tag } from "ant-design-vue";
  import { onMounted, reactive, watch, ref } from "vue";
  import AreaWorkSpace from "/@/components/Area/Workspace.vue";
  import { defaultPageSize, maxPageSize } from "/@/config";
  import { useTable } from "./useTable";
  import { debounce } from "/@/utils/util";
  import { beatExceptionList } from "/@/api/beatException";
  import { virtualLineDetail, virtualLineList } from "/@/api/virtualLine";
  import { lineListAll } from "/@/api/line";
  import { workshopListAll } from "/@/api/workshop";
  import { useRouter } from "vue-router";
  import { DownOutlined } from "@ant-design/icons-vue";
  import { CommonOperatorTip } from "/@/enums/commonEnum";
  import { BodyCellData } from "/#/antd";
  import { AddonEventTypeList, AddonEventStatusList, getListItemLabel } from "/@/config/data";
  import Detail from "../Detail/index.vue";
  import TagProduct from "../../baseComponents/TagProduct.vue";
  import TagAddonEventStatus from "../../baseComponents/TagAddonEventStatus.vue";
  import TagAddonEventType from "../../baseComponents/TagAddonEventType.vue";
  import TagVirtualStation from "../../baseComponents/TagVirtualStation.vue";
  import LineRelate from "/@/views/components/LineRelate/index.vue";
  import { useUserInfoStore } from "/@/store";
  import { BeatTypeList } from "/@/config/data";

  import type { Dayjs } from "dayjs";
  type RangeValue = [Dayjs, Dayjs];
  const date = ref<RangeValue>([]);

  const { isXz, manageLineId, isCjzr, staffInfo } = useUserInfoStore();

  /** 弹窗 - 安灯事件详情 */
  const modalDetailState = reactive<{
    id?: number;
    visible: boolean;
    title: string;
  }>({
    id: undefined,
    visible: false,
    title: "安灯事件详情",
  });

  /** 分页数据 */
  const pageState = reactive<any>({
    pageNum: 1,
    pageSize: defaultPageSize,
    sort: "id desc",
    startDate: "",
    endDate: "",
    dateRange: [],
    virtualLineIdList: [], // 多选：number[]
    virtualStationIdList: [], // 多选：number[]
    beatType: undefined,
  });

  /** 其他数据 */
  const otherState = reactive({
    loading: true,
    total: 0,
  });

  /** 表单数据 */
  const { columns, dataSource } = useTable();
  const virtualLineOptions = ref<Array<{ label: string; value: number }>>([]);
  const virtualStationOptions = ref<Array<{ label: string; value: number }>>([]);
  const virtualLineLoading = ref(false);
  const virtualStationLoading = ref(false);

  const debounceToGetList = debounce(toGetList, 200);

  // 重置页码（注意：字段名与模板/接口保持一致）
  watch(
    [
      () => pageState.dateRange,
      () => pageState.virtualLineIdList,
      () => pageState.virtualStationIdList,
      () => pageState.beatType,
    ],
    () => {
      pageState.pageNum = 1;
    },
    { deep: true }
  );

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
    await toGetList();
  });

  /**
   * 计算车间主任自己车间的物理产线ID列表
   * - 先查自己负责的车间（staffId === 当前用户）
   * - 再查所有物理产线，过滤出属于这些车间的产线
   * - 返回逗号分隔字符串；非车间主任返回 undefined
   */
  async function getOwnLineIdList(): Promise<string | undefined> {
    if (!isCjzr) return undefined;

    const workshopRecords = await workshopListAll();
    const myWorkshops = workshopRecords.filter(
      (item: any) => String(item.staffId) === String(staffInfo?.id)
    );

    if (!myWorkshops.length) return "";

    const myWorkshopIds = myWorkshops.map((w: any) => String(w.id));

    const allLines = await lineListAll();
    const myLineIds = allLines
      .filter((line: any) => {
        const wsId = line?.workshopId ?? line?.workshopInfo?.id;
        return myWorkshopIds.includes(String(wsId));
      })
      .map((line: any) => line.id);

    return myLineIds.join(",");
  }

  /** 获取必要数据：虚拟产线选项 */
  async function toGetNeedInfo() {
    virtualLineLoading.value = true;
    try {
      // 车间主任：只加载自己车间的虚拟产线
      const lineIdList = await getOwnLineIdList();

      // 车间主任但自己车间下没有任何物理产线，直接置空，不请求
      if (lineIdList === "") {
        virtualLineOptions.value = [];
        return;
      }

      const result: any = await virtualLineList({
        pageNum: 1,
        pageSize: maxPageSize,
        sort: "id asc",
        lineIdList,
      });

      const lineList = Array.isArray(result) ? result : result?.records || [];
      virtualLineOptions.value = lineList.map((item: any) => ({
        label: item.virtualLineName,
        value: Number(item.id),
      }));
    } catch (error) {
      virtualLineOptions.value = [];
      message.error("虚拟产线数据加载失败");
    } finally {
      virtualLineLoading.value = false;
    }
  }

  /** 提取接口返回的虚拟工位列表 */
  function pickStationList(result: any): any[] {
    return result?.virtualStationList || result?.data?.virtualStationList || [];
  }

  /** 虚拟产线变化时，重新加载对应（多个）虚拟产线的虚拟工位 */
  async function handleVirtualLineChange(virtualLineIds?: number[]) {
    // 产线变化后，清空已选工位
    pageState.virtualStationIdList = [];
    virtualStationOptions.value = [];

    if (!virtualLineIds?.length) return;

    virtualStationLoading.value = true;
    try {
      // 并发拉取所有已选产线的详情
      const results = await Promise.all(
        virtualLineIds.map((id) => virtualLineDetail(id).catch(() => null))
      );

      // 合并所有工位并按 id 去重
      const stationMap = new Map<number, any>();
      results.forEach((result: any) => {
        pickStationList(result).forEach((item: any) => {
          const id = Number(item.id);
          if (!stationMap.has(id)) stationMap.set(id, item);
        });
      });

      virtualStationOptions.value = [...stationMap.values()]
        .sort((a: any, b: any) => (a.virtualStationSort || 0) - (b.virtualStationSort || 0))
        .map((item: any) => ({
          label: item.stationInfo?.stationNo+"-" + item.virtualStationName,
          value: Number(item.id),
        }));
    } catch (error) {
      virtualStationOptions.value = [];
      message.error("虚拟工位数据加载失败");
    } finally {
      virtualStationLoading.value = false;
    }
  }

  /** 获取事件列表 */
  async function toGetList() {
    otherState.loading = true;
    try {
      let startDate = "";
      let endDate = "";
      if (pageState.dateRange?.length === 2) {
        startDate = pageState.dateRange[0].format("YYYY-MM-DD 00:00:00");
        endDate = pageState.dateRange[1].format("YYYY-MM-DD 23:59:59");
      }

      const data = {
        ...pageState,
        // 多选数组 -> 逗号分隔字符串
        virtualLineIdList: pageState.virtualLineIdList?.length
          ? pageState.virtualLineIdList.join(",")
          : undefined,
        virtualStationIdList: pageState.virtualStationIdList?.length
          ? pageState.virtualStationIdList.join(",")
          : undefined,
        startDate,
        endDate,
      };
      // delete data.dateRange;
      // delete data.virtualLineIdList;
      // delete data.virtualStationIdList;

      const { records = [], total = 0 } = await beatExceptionList(data);
      dataSource.value = records;
      otherState.total = total;
    } finally {
      otherState.loading = false;
    }
  }

  /** 变化 - 页变化 */
  function onPageChange(current: number, size: number) {
    pageState.pageNum = current;
    pageState.pageSize = size;
  }
</script>

<style lang="less" scoped>
  .exception-filter-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;

    &__date {
      width: 240px;
    }

    &__select {
      width: 260px;
    }

    &__type {
      width: 150px;
    }
  }

  .exception-total {
    padding: 5px 14px;
    color: #595959;
    background: #f5f7fa;
    border: 1px solid #e8eaed;
    border-radius: 4px;
    white-space: nowrap;

    &__value {
      color: #ff4d4f;
      font-size: 18px;
      font-weight: 600;
    }
  }
</style>