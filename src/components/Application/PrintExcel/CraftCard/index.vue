<template>
  <div class="ct" v-loading:absolute="loading">
    <!-- 标题 -->
    <div class="ct-title">生产工艺流程卡 </div>

    <div class="ct-qrcode">
      <canvas id="qrcode"></canvas>
      <div class="ct-text text-gray-400">
        <p>小程序扫码</p>
        <p>可快捷登记</p>
      </div>
    </div>

    <!-- 表格-基础信息-->
    <p>1.生产任务单-基础信息</p>
    <PrintTable :class="[basicTableClass]" :tableMaxWidth="tableMaxWidth" :tableData="productTaskTableData" />

    <!-- 空行 -->
    <div :style="{ height: emptyLineHeight + 'px' }"></div>

    <!-- 表格-备料列表 -->
    <p>2.生产任务单-备料单列表(&退料)</p>
    <PrintTable
      :class="[listTableClass]"
      :tableMaxWidth="tableMaxWidth"
      :tableData="materialPrepareTaskDemandListTableData"
    />
    <!-- 空行 -->
    <div :style="{ height: emptyLineHeight + 'px' }"></div>

    <!-- 表格-工艺工序列表 -->
    <p>3.生产任务单-工艺工序列表</p>
    <PrintTable
      :class="[listTableClass]"
      :tableMaxWidth="tableMaxWidth"
      :tableData="virtualStationCraftProcedureListTableData"
    />
  </div>
</template>

<script setup lang="ts">
  import { onMounted, reactive, ref, nextTick } from "vue";
  import { Button, Radio, Select, message } from "ant-design-vue";
  import PrintTable from "../PrintTable.vue";
  import {
    getProductTaskTableData,
    getMaterialPrepareTaskDemandListTableData,
    getVirtualStationCraftProcedureListTableData,
  } from "./data";
  import { usePrintStore } from "/@/store";
  import { ProductTaskDetail } from "/@/api/model/productTask";
  import { productTaskDetail } from "/@/api/productTask";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import { MaterialPrepareTaskDemandInfo } from "/@/api/model/materialPrepareTaskDemand";
  import { MaterialPrepareTaskDetail, MaterialPrepareTaskInfo } from "/@/api/model/materialPrepareTask";
  import { materialPrepareTaskDetail } from "/@/api/materialPrepareTask";
  import { LineDetail } from "/@/api/model/line";
  import { lineDetail } from "/@/api/line";
  import { VirtualLineDetail } from "/@/api/model/virtualLine";
  import { virtualLineGetByProductParam } from "/@/api/virtualLine";
  import { createLoading } from "/@/components/Loading/createLoading";
  import QRCode from "qrcode";

  const printStore = usePrintStore();

  const tableMaxWidth = 1180;

  const loading = ref(false);

  const productTaskInfo = ref<ProductTaskDetail>();
  const lineInfo = ref<LineDetail>();
  const materialPrepareTaskInfo = ref<MaterialPrepareTaskDetail>();
  const virtualLineInfo = ref<VirtualLineDetail>();

  const productTaskTableData = ref<any>();
  const materialPrepareTaskDemandListTableData = ref<any>();
  const virtualStationCraftProcedureListTableData = ref<any>();

  const basicTableClass = "basicTable";
  const listTableClass = "listTable";

  const emptyLineHeight = 18;

  onMounted(async () => {
    await toGetNeedInfo();
    // 预生成表格
    initTable();
  });

  /** 获取必须数据 */
  async function toGetNeedInfo() {
    loading.value = true;
    const { printId } = printStore;

    // 获取产线信息
    try {
      // 获取生产任务单信息
      const ptInfo = await productTaskDetail(printId);
      const { lineId, materialPrepareTaskId, productId, taskNo } = ptInfo;

      const lInfo = await lineDetail(lineId);

      // 获取虚拟产线信息
      const vlInfo = await virtualLineGetByProductParam(productId, lineId);

      // 获取备料任务单信息
      const mptInfo = materialPrepareTaskId ? await materialPrepareTaskDetail(materialPrepareTaskId) : {};
      // 注入二维码
      QRCode.toCanvas(document.getElementById(`qrcode`), taskNo, { width: 60, margin: 0 }, function (error) {
        if (error) console.error(error);
      });

      productTaskInfo.value = ptInfo;
      lineInfo.value = lInfo;
      virtualLineInfo.value = vlInfo;
      materialPrepareTaskInfo.value = mptInfo;

      loading.value = false;
    } catch (e: any) {
      message.warn(e.message ? e.message : e);
    }
  }

  /** 预生成表格 */
  function initTable() {
    const pttd = getProductTaskTableData(productTaskInfo.value!!, lineInfo.value!!);
    const mptdltd = getMaterialPrepareTaskDemandListTableData(
      materialPrepareTaskInfo.value?.materialPrepareTaskDemandList!!
    );
    const cscpltd = getVirtualStationCraftProcedureListTableData(virtualLineInfo.value?.virtualStationList || []);

    productTaskTableData.value = pttd;
    materialPrepareTaskDemandListTableData.value = mptdltd;
    virtualStationCraftProcedureListTableData.value = cscpltd;
  }
</script>

<style lang="less" scoped>
  .ct {
    position: relative;
    &-qrcode {
      position: absolute;
      right: 12px;
      top: 6px;
    }
    &-text {
      position: absolute;
      right: 110%;
      bottom: 0;
      white-space: nowrap;
      font-size: 12px;
    }
    &-title {
      text-align: center;
      // font-weight: bolder;
      text-shadow: 0.15pt 0px 0px black, 0.25pt 0px 0px black, 0.35pt 0px 0px black, -0.25pt 0px 0px black,
        0px 0.25pt 0px black, 0px -0.25pt 0px black;
      font-size: 28px;
      height: 52px;
      line-height: 52px;
    }
  }

  #qrcode {
  }
</style>
