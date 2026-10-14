<template>
  <div class="pcInfo" v-if="procedureInfo">
    <section class="pcInfo-sec">
      <div class="pcInfo-main">
        <Form class="detail0" :labelCol="sectionLabelCol">
          <!-- <Form.Item label="工序编号">
            <p>{{ procedureInfo.procedureSort + 1 }}</p>
          </Form.Item> -->
          <Form.Item label="工序名称">
            <p>{{ procedureInfo.procedureName }}</p>
          </Form.Item>
          <Form.Item label="工序类型">
            <p>
              {{ getListItemLabel(ProcedureTypeList, procedureInfo.procedureType) }}
            </p>
          </Form.Item>
          <!-- <Form.Item label="过程特性">
            <p v-if="procedureInfo.procedureProcessInfo" class="text-primary">具备</p>
            <p v-else class="text-gray-400">不具备</p>
          </Form.Item> -->
          <Form.Item label="工序描述">
            <p class="max-w-420px">{{ procedureInfo.procedureDesc || "/" }}</p>
          </Form.Item>
        </Form>
      </div>
    </section>

    <!-- <template v-if="procedureInfo.procedureProcessInfo">
      <section class="pcInfo-sec">
        <p class="pcInfo-title !text-primary">2.2 工序过程特性-基础信息</p>
        <div class="pcInfo-main">
          <Form class="detail0" :labelCol="sectionLabelCol">
            <Form.Item label="特性名称">
              <p>{{ procedureInfo.procedureProcessInfo.characterName }}</p>
            </Form.Item>
            <Form.Item label="特性编号">
              <p>{{ procedureInfo.procedureProcessInfo.characterNo }}</p>
            </Form.Item>
            <Form.Item label="特性权重">
              <p class="text-primary">关键特性</p>
            </Form.Item>
            <Form.Item label="特性维度">
              <p class="text-primary">防流出</p>
            </Form.Item>
            <Form.Item label="特性维度">
              <p class="text-primary">计量型</p>
              <p class="whitespace-nowrap">[ 99 ≤ CL ≤ 102 ] </p>
            </Form.Item>
          </Form>
        </div>
      </section>

      <section class="pcInfo-sec">
        <p class="pcInfo-title !text-primary">2.2 工序过程特性-点检信息</p>
        <div class="pcInfo-main">
          <Form class="detail0" :labelCol="sectionLabelCol2">
            <Form.Item label="过程特性-方法与措施">
              <p>{{ procedureInfo.procedureProcessInfo.characterMeasure }}</p>
            </Form.Item>
            <Form.Item label="过程特性-失效模式">
              <p>{{ procedureInfo.procedureProcessInfo.characterInvalid }}</p>
            </Form.Item>
            <Form.Item label="点检方法">
              <p>{{ procedureInfo.procedureProcessInfo.spotcheckMethod }}</p>
            </Form.Item>
            <Form.Item label="点检频率">
              <p class="text-primary">1天</p>
            </Form.Item>
            <Form.Item label="点检位置">
              <div @click.stop>
                <ImageGallery :size="110" :urls="[spotcheckDemoImg]" />
              </div>
            </Form.Item>
          </Form>
        </div>
      </section>
    </template> -->
  </div>
</template>

<script setup lang="ts">
  import { defineEmits, withDefaults, defineProps, onMounted, reactive, ref, nextTick, computed } from "vue";
  import { Form } from "ant-design-vue";
  import { CommonComponentMode } from "/@/enums/commonEnum";
  import { CraftProcedureDetail } from "/@/api/model/craftProcedure";
  import { ProcedureTypeList, getListItemLabel } from "/@/config/data";
  import ImageGallery from "/@/components/Application/ImageGallery.vue";
  import { getAssetsFile } from "/@/utils/util";

  interface Props {
    mode?: CommonComponentMode;
    procedureInfo: CraftProcedureDetail;
  }

  const spotcheckDemoImg = getAssetsFile("spotcheck-demo.png");

  const sectionLabelCol = { style: { width: "90px" } };
  const sectionLabelCol2 = { style: { width: "150px" } };

  const props = withDefaults(defineProps<Props>(), {
    mode: CommonComponentMode.EDIT,
    procedureInfo: undefined,
  });
</script>

<style lang="less" scoped>
  .pcInfo {
    display: flex;
    &-sec {
      &:nth-child(1) {
        flex: 1;
        .pcInfo-main {
          border-left: 1px solid #ccc;
        }
      }
      &:nth-child(2) {
        flex: 1;
      }
      &:nth-child(3) {
        flex: 1.7;
      }
    }
    &-title {
      color: #999;
      margin-bottom: 12px;
    }
    &-main {
      min-width: 150px;
      // height: calc(100% - 34px);
      padding: 12px 6px;
      border-top: 1px solid #ccc;
      border-bottom: 1px solid #ccc;
      border-right: 1px solid #ccc;
    }
  }
</style>
