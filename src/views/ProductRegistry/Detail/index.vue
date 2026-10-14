<template>
  <div class="registration-detail-page" v-loading:absolute="loading">
    <div class="detail-toolbar">
      <div class="detail-toolbar__left">
        <BackBtn />
        <div class="detail-toolbar__title">
          <span class="detail-toolbar__bar"></span>
          <span>生产登记 · 基础信息</span>
        </div>
      </div>
      <div class="detail-toolbar__right">
        <span v-if="info" class="detail-toolbar__no">
          {{ info.registrationNo }}
        </span>
      </div>
    </div>
    <a-descriptions
      v-if="info && lineInfo"
      size="small"
      class="compact-descriptions"
      :column="{ xxl: 6, xl: 6, lg: 6, md: 2, sm: 2, xs: 1 }"
    >
      <a-descriptions-item label="产线编号">{{ lineInfo.lineNo }}</a-descriptions-item>
      <a-descriptions-item label="关联车间">{{ lineInfo.workshopInfo.workshopName }}</a-descriptions-item>
      <a-descriptions-item label="生产产线">{{ lineInfo.lineName }}</a-descriptions-item>
      <a-descriptions-item label="线长">{{ lineInfo.lineLeaderStaffInfo?.staffName || "/" }}</a-descriptions-item>
      <a-descriptions-item label="登记编号">{{ info.registrationNo }}</a-descriptions-item>
      <a-descriptions-item label="关联任务单">
        <p
          v-if="info.taskId"
          class="text-primary hover-underline cursor-pointer"
          @click="handle2TaskDetail(info.taskId)"
        >
          {{ info.taskInfo.taskNo }}
        </p>
        <p v-else>/</p>
      </a-descriptions-item>
      <a-descriptions-item label="开始时间">{{ info.startDate || "/" }}</a-descriptions-item>
      <a-descriptions-item label="结束时间">{{ info.endDate || "/" }}</a-descriptions-item>
      <a-descriptions-item label="生产产品" :span="2">
        <TagProduct :info="info.productInfo" :size="'small'" />
      </a-descriptions-item>
      <a-descriptions-item label="生产状态">
        <TagRegistrationStatus :value="info.registrationStatus" :size="'small'" />
      </a-descriptions-item>
      <a-descriptions-item label="员工考勤">
        <Popover placement="top" trigger="click" :overlay-style="{ maxWidth: '800px' }">
          <template #content>
            <div class="sign-table-popover">
              <StaffSignTable :staff-sign-list="info.staffSignList" />
            </div>
          </template>
          <p class="hover-underline cursor-pointer sign-text">
            {{ _getSignRatio(info.staffSignList) }}
          </p>
        </Popover>
      </a-descriptions-item>
      
      <a-descriptions-item label="工序数量">{{ virtualLineInfo?.virtualStationTotal || "/" }}</a-descriptions-item>
      <a-descriptions-item label="备注">{{ info.remark || "/" }}</a-descriptions-item>
      <a-descriptions-item label="登记计划生产数量">{{ info.planProductNumber || "/" }}</a-descriptions-item>
      <a-descriptions-item label="登记生产产出">{{ info.beatProductNumber || "/" }}</a-descriptions-item>
      <a-descriptions-item label="实际生产">{{ info.actualProductNumber || "/" }}</a-descriptions-item>
    </a-descriptions>

    <!-- 详情数据分析：岗位登记总产能 + 岗位标准标准小时产能 + 当日线平衡 -->
    <div v-if="info && lineInfo" class="detail-analysis-section">
      <DataAnaly :lineInfo="lineInfo" :info="info" />
    </div>

    <Modal v-model:open="open" title="照片存证" @ok="handleOk">
      <ImageGallery :urls="info?.filePathList || []" />
    </Modal>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from "vue";
  import { Form, Popover, Button, Modal } from "ant-design-vue";
  import { parseSearch } from "/@/utils/util";
  import BackBtn from "/@/components/BackBtn/index.vue";
  import { registrationDetail, registrationLatestBeatProductNumber } from "/@/api/registration";
  import type { RegistrationDetail } from "/@/api/model/registration";
  import { lineDetail } from "/@/api/line";
  import type { LineDetail } from "/@/api/model/line";
  import type { StaffSignDetail } from "/@/api/model/staffSign";
  import { RegistrationStatus, StaffSignStatus } from "/@/enums/model";
  import TagProduct from "../../baseComponents/TagProduct.vue";
  import TagRegistrationStatus from "../../baseComponents/TagRegistrationStatus.vue";
  import StaffSignTable from "../../components/StaffSignTable/index.vue";
  import ImageGallery from "/@/components/Application/ImageGallery.vue";
  import DataAnaly from "../../DataAnaly/DataAnaly.vue";
  import { PageEnum } from "/@/enums/pageEnum";
  import { useRouter } from "vue-router";
import { virtualLineDetail } from "/@/api/virtualLine";
import { VirtualLineDetail } from "/@/api/model/virtualLine.js";
  const router = useRouter();
  const id = Number(parseSearch().id);
  const loading = ref(false);
  const info = ref<RegistrationDetail>();
  const lineInfo = ref<LineDetail>();
  const virtualLineInfo = ref<VirtualLineDetail>();
  onMounted(async () => {
    loading.value = true;
    try {
      await toGetNeedInfo();
    } finally {
      loading.value = false;
    }
  });
  const open = ref(false);
  function handleOk() {
    open.value = false;
  }
  async function toGetNeedInfo() {
    const registrationInfo = await registrationDetail(id);
    if (registrationInfo.registrationStatus === RegistrationStatus.IN_REGISTRATION) {
      try {
        const beatProductNumber = await registrationLatestBeatProductNumber(id);
        if (beatProductNumber !== undefined && beatProductNumber !== null) {
          registrationInfo.beatProductNumber = beatProductNumber;
        }
      } catch (error) {
        // 最新节拍产量属于补充数据，接口异常不能阻断登记详情展示。
        console.warn("最新节拍产量获取失败，继续使用登记详情数据", error);
      }
    }
    info.value = registrationInfo;
    lineInfo.value = await lineDetail(registrationInfo.lineId);
    virtualLineInfo.value = await virtualLineDetail(registrationInfo.virtualLineId);
  }
  function handle2TaskDetail(taskId: number) {
    router.push({
      path: PageEnum.PRODUCT_TASK_DETAIL,
      query: { id: taskId },
    });
  }
  function _getSignRatio(staffSignList: StaffSignDetail[]) {
    const total = staffSignList.length;
    const signedTotal = staffSignList.filter((item) => item.signStatus > StaffSignStatus.NOT_DO).length;
    return `${signedTotal} / ${total}`;
  }
</script>

<style lang="less" scoped>
  .registration-detail-page {
    width: 100%;
    min-width: 0;
    padding-top: 0;
    background: #fff;
  }

  /* ==================== 顶部工具栏 ==================== */
  .detail-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    height: 52px;
    padding: 0 16px;
    background: linear-gradient(180deg, #fbfcfd 0%, #f5f7fa 100%);
    border-bottom: 1px solid #e8ecf1;
    box-sizing: border-box;

    &__left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      flex: 1 1 auto;
    }

    &__right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    &__title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 600;
      color: #1f2329;
      line-height: 1;
      white-space: nowrap;
    }

    &__bar {
      width: 3px;
      height: 14px;
      border-radius: 2px;
      background: @color-primary;
    }

    &__no {
      font-size: 12px;
      color: #8b95a5;
      font-variant-numeric: tabular-nums;
      padding: 3px 10px;
      background: #fff;
      border: 1px solid #e8ecf1;
      border-radius: 12px;
      white-space: nowrap;
    }
  }

  /* ==================== 描述列表（紧凑化） ==================== */
  .compact-descriptions {
    /* 表格整体呼吸空间 */
    padding: 12px 16px 4px;

    :deep(.ant-descriptions-view) {
      border: none;
    }

    :deep(.ant-descriptions-row) {
      > th,
      > td {
        padding: 6px 0 !important;
        border-bottom: 1px dashed #f0f2f5;
      }

      &:last-child > th,
      &:last-child > td {
        border-bottom: none;
      }
    }

    :deep(.ant-descriptions-item-label) {
      line-height: 20px;
      font-size: 12px;
      padding-right: 8px;
      color: #8b95a5;
      white-space: nowrap;

      &::after {
        display: none !important; /* 去掉 antd 自带的冒号，改用下方 ::before */
      }

      &::before {
        content: "";
        display: inline-block;
        width: 3px;
        height: 10px;
        margin-right: 6px;
        border-radius: 2px;
        background: #d6dde5;
        vertical-align: middle;
        transform: translateY(-1px);
      }
    }

    :deep(.ant-descriptions-item-content) {
      line-height: 20px;
      font-size: 13px;
      color: #2b3440;
      font-weight: 500;
      font-variant-numeric: tabular-nums;

      p {
        margin: 0;
      }
    }

    .sign-text {
      font-size: 12px;
    }
  }

  /* ==================== 分析区块 ==================== */
  .detail-analysis-section {
    width: 100%;
    margin-top: 4px;
    padding: 8px 16px 0;
    border-top: 1px dashed #e1e4e8;
  }

  /* ==================== 窄屏兜底 ==================== */
  @media (max-width: 1440px) {
    .detail-toolbar {
      height: 48px;
      padding: 0 12px;

      &__title {
        font-size: 14px;
      }
    }

    .compact-descriptions {
      padding: 10px 12px 2px;
    }

    .detail-analysis-section {
      padding: 6px 12px 0;
    }
  }
  .sign-table-popover {
    max-height: 480px; /* 关键：限制高度，超过就滚动 */
    min-width: 480px;
    overflow: auto; /* 纵向滚动；表格宽时横向也能滚 */
    overscroll-behavior: contain;
    padding-right: 4px; /* 给滚动条留点空隙，避免贴住内容 */

    /* 可选：滚动条美化 */
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background: #d6dde5;
      border-radius: 3px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }
  /* ==================== 以下为历史保留样式，不影响当前渲染 ==================== */
  .registration-summary {
    width: min(1440px, 100%);
    margin: 0;
    padding: 0 0 3px;
  }
  .summary-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 5px;
  }
  .summary-group {
    min-width: 0;
    padding: 0 10px 3px;
    border: 1px solid #eef0f3;
    border-radius: 4px;
    background: #fff;
  }
  .summary-group-title {
    height: 26px;
    display: flex;
    align-items: center;
    margin: 0 -2px 2px;
    padding: 0 2px;
    border-bottom: 1px solid #f0f1f3;
    color: #303133;
    font-size: 13px;
    font-weight: 600;
  }
  .summary-group-content {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    column-gap: 12px;
  }
  .registration-field-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    column-gap: 12px;
    row-gap: 0;
  }
  .photo-field {
    grid-column: span 2;
  }
  .production-progress {
    font-weight: 500;
    color: #303133;
  }
  .production-actual {
    color: #1890ff;
    font-size: 14px;
    font-weight: 600;
  }
  .linfo-main {
    min-width: 0;
    max-height: 32px;
    overflow: hidden;
  }

  :deep(.ant-form-item) {
    margin-bottom: 0;
  }
  :deep(.ant-form-item-label) {
    padding: 0;
    line-height: 24px;
  }
  :deep(.ant-form-item-label > label) {
    height: 24px;
    color: #6b7280;
    font-size: 12px;
    white-space: nowrap;
  }
  :deep(.ant-form-item-control-input) {
    min-height: 24px;
  }
  :deep(.ant-form-item-control-input-content) {
    min-width: 0;
    line-height: 24px;
    font-size: 13px;
  }
  :deep(.ant-form-item-control-input-content > p) {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .photo-field :deep(.ant-image),
  .photo-field :deep(img) {
    width: 28px !important;
    height: 28px !important;
    object-fit: cover;
  }
  @media (max-width: 1280px) {
    .summary-group-content,
    .registration-field-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .photo-field {
      grid-column: auto;
    }
  }
  @media (max-width: 760px) {
    .summary-group-content,
    .registration-field-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
