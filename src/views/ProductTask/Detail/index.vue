<template>
  <BackBtn />

  <div class="w-1200px" v-loading:absolute="loading">
    <Form v-if="info" class="detail0" :labelCol="{ style: { width: '110px' } }">
      <!-- 1、生产任务单 - 基础信息： -->
      <SubTitle :size="AntUniversalSize.small" title="1、生产任务单 - 基础信息：" />
      <div class="flex">
        <div :style="formNormalParams.divItemStyle">
          <Form.Item label="任务单编号">
            <p>{{ info.taskNo }}</p>
          </Form.Item>
          <Form.Item label="关联销售订单">
            <p>{{ info.saleOrderNo || "/" }}</p>
          </Form.Item>
          <Form.Item label="生产产品">
            <ProductRelate
              class="text-primary"
              :mode="CommonComponentMode.DETAIL"
              :productId="info.productId"
              :productAttrValueIdsList="info.productAttrValueIdsList"
            />
          </Form.Item>
          <Form.Item label="生产数量">
            <p>{{ info.productNumber }}</p>
          </Form.Item>
          <Form.Item label="生产产线">
            <p>{{ info.lineInfo.lineName }}</p>
          </Form.Item>
          <Form.Item label="备注">
            <p>{{ info.memo || "/" }}</p>
          </Form.Item>
        </div>

        <div :style="formNormalParams.divItemStyle">
          <Form.Item label="备料单状态">
            <TagMaterialPrepareTaskStatus :value="info.materialPrepareTaskInfo.prepareTaskStatus" v-if="info.materialPrepareTaskInfo"  />
          </Form.Item>
          <Form.Item label="任务单状态">
            <TagProductTaskStatus :info="info" />
          </Form.Item>
          <Form.Item label="退料单状态">
            <TagMaterialReturnTaskStatus
              :value="info.materialReturnTaskInfo?.returnTaskStatus"
              :productTaskStatus="info.taskStatus"
            />
          </Form.Item>
          <Form.Item label="计划完成时间">
            <p>{{ formatDateByDayjs(info.planCompleteDate) }}</p>
          </Form.Item>
          <Form.Item label="开始时间">
            <p>{{ info.startDate }}</p>
          </Form.Item>
          <Form.Item label="完成时间">
            <p>{{ info.completeDate }}</p>
          </Form.Item>
        </div>

        <div :style="formNormalParams.divItemStyle">
          <Form.Item label="生产进度">
            <div class="flex items-center">
              <Progress :ratio="info.registrationActualProductNumber / info.productNumber" />
              <p class="text-gray-400 ml-3px">({{ info.registrationActualProductNumber }}/{{ info.productNumber }})</p>
            </div>
          </Form.Item>
          <Form.Item label="关联产品批">
            <div
              v-if="info.productBatchIdList"
              class="text-primary hover-underline"
              @click="handleRelateProductBatch(info)"
            >
              {{ info.productBatchIdList.length }} 批
            </div>
            <span v-else class="text-gray-400">(暂无批关联)</span>
          </Form.Item>
        </div>
      </div>

      <!-- 2、生产任务单-关联登记： -->
      <SubTitle :size="AntUniversalSize.small" title="2、生产任务单-关联登记：" />
      <RegistrationTable v-if="info" :taskNo="info.taskNo" />
    </Form>
  </div>
</template>

<script setup lang="ts">
  import { FormInstance, Button, Form, Input, Radio, Checkbox, Spin, Tag } from "ant-design-vue";
  import { onMounted, ref, reactive, unref, withDefaults, defineProps, defineEmits, computed, watch } from "vue";
  import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { getFormRules } from "./useForm";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import { formatDateByDayjs, parseSearch, randomId } from "/@/utils/util";
  import BackBtn from "/@/components/BackBtn/index.vue";
  import ProcessRectProcedureList from "/@/views/components/ProcessRectProcedureList/index.vue";
  import { productTaskDetail } from "/@/api/productTask";
  import { ProductTaskDetail } from "/@/api/model/productTask";
  import { CommonComponentMode } from "/@/enums/commonEnum";
  import TagProduct from "../../baseComponents/TagProduct.vue";
  import Progress from "/@/components/Progress/index.vue";
  import RegistrationTable from "../../components/RegistrationTable/index.vue";
  import ProductRelate from "/@/views/components/ProductRelate/index.vue";
  import TagProductTaskStatus from "../../baseComponents/TagProductTaskStatus.vue";
  import TagMaterialPrepareTaskStatus from "/@/views/baseComponents/TagMaterialPrepareTaskStatus.vue";
  import TagMaterialReturnTaskStatus from "/@/views/baseComponents/TagMaterialReturnTaskStatus.vue";
  import { useRouter } from "vue-router";
  import { PageEnum } from "/@/enums/pageEnum";

  const router = useRouter();

  const info = ref<ProductTaskDetail>();
  const id = Number(parseSearch().id);
  const loading = ref(false);

  onMounted(async () => {
    loading.value = true;
    await toGetNeedInfo();
    loading.value = false;
  });

  /** 跳转产品批次页 */
  async function handleRelateProductBatch(record: ProductTaskDetail) {
    const { taskNo } = record;
    const query = {
      productTaskNo: taskNo,
    };

    router.push({
      path: PageEnum.PRODUCT_BATCH_LIST,
      query,
    });
  }

  /** 获取必要信息 */
  async function toGetNeedInfo() {
    const productTaskInfo = await productTaskDetail(id);
    info.value = productTaskInfo;
  }
</script>

<style lang="less" scoped>
p{
  margin-bottom: 0;
}
</style>
