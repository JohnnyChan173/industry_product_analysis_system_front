<template>
  <BackBtn />

  <div class="w-1080px" v-loading:absolute="loading">
    <Form v-if="info" class="detail" :labelCol="formNormalParams.labelCol">
      <!-- 1、工艺-基础信息 -->
      <SubTitle :size="AntUniversalSize.small" title="1、工艺-基础信息" />
      <div :style="formNormalParams.divItemStyle">
        <Form.Item label="工艺编号">
          <p>{{ info.craftNo }}</p>
        </Form.Item>

        <Form.Item label="工艺名称">
          <p>{{ info.craftName }}</p>
        </Form.Item>

        <Form.Item label="工艺适用产品">
          <Tag class="!mb-3px large" color="blue" v-for="item in craftProductList" :key="item.id">
            {{ item.productName }}
          </Tag>
        </Form.Item>
      </div>

      <!-- 2、工艺-工序列表 -->
      <SubTitle :size="AntUniversalSize.small" title="2、工艺-工序列表" />

      <div class="ml-16px">
        <SubTitle class="!text-gray-400 !border-none" :size="AntUniversalSize.small" title="1.工艺工序展示" />

        <Form.Item name="craftProcedureList" label="">
          <ProcessRectProcedureList
            :mode="CommonComponentMode.DETAIL"
            v-model:list="craftProcedureList"
            @select:click="handleProcedureSelectClick"
          ></ProcessRectProcedureList>
        </Form.Item>
      </div>
      <div class="ml-16px" v-if="curProcedure">
        <SubTitle class="!text-gray-400 !border-none" :size="AntUniversalSize.small">
          <p>
            <span> 2.选中工序信息 </span>
            <Tag class="large" color="blue">{{ craftProcedureList[procedureIndex].procedureName }}</Tag>
          </p>
        </SubTitle>

        <ProcedurePanel :procedureInfo="curProcedure" />
      </div>
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
  import { parseSearch, randomId } from "/@/utils/util";
  import BackBtn from "/@/components/BackBtn/index.vue";
  import ProcessRectProcedureList from "/@/views/components/ProcessRectProcedureList/index.vue";
  import { craftDetail } from "/@/api/craft";
  import { CraftDetail } from "/@/api/model/craft";
  import { CommonComponentMode } from "/@/enums/commonEnum";
  import { CraftProcedureDetail, CraftProcedureInfo } from "/@/api/model/craftProcedure";
  import { craftProcedureDetail } from "/@/api/craftProcedure";
  import ProcedurePanel from "/@/views/components/ProcedurePanel/index.vue";

  const info = ref<CraftDetail>();
  const id = Number(parseSearch().id);
  const loading = ref(false);

  const procedureIndex = ref(0);
  const curProcedure = ref<CraftProcedureDetail>();

  const craftProductList = computed(() => unref(info)?.craftProductList || []);
  const craftProcedureList = computed(() => unref(info)?.craftProcedureList || []);

  watch(
    () => procedureIndex.value,
    () => {
      toGetProcedureDetailInfo();
    }
  );

  onMounted(async () => {
    loading.value = true;

    const craftInfo = await craftDetail(id);
    info.value = craftInfo;

    toGetProcedureDetailInfo();

    loading.value = false;
  });

  /** 选择工序 */
  async function handleProcedureSelectClick(item: CraftProcedureInfo) {
    console.log(item);

    const index = craftProcedureList.value.findIndex((i) => i.procedureUuid === item.procedureUuid);
    procedureIndex.value = index;
  }

  /** 获取工序详情（获取特性信息） */
  async function toGetProcedureDetailInfo() {
    const id = craftProcedureList.value[procedureIndex.value].id;
    const proInfo = await craftProcedureDetail(id);
    curProcedure.value = proInfo;
  }
</script>

<style lang="less" scoped></style>
