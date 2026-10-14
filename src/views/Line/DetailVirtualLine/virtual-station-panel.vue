<template>
  <Form class="detail0" :labelCol="{ style: { width: '130px' } }">
    <!-- 1、虚拟工位 - 基础信息： -->
    <SubTitle :size="AntUniversalSize.small" title="1、虚拟工位 - 基础信息：" />
    <div class="flex">
      <section>
        <Form.Item label="虚拟工位名称">
          <p class="whitespace-nowrap">{{ info?.virtualStationName }}</p>
        </Form.Item>
        <Form.Item label="关联物理工位">
          <p class="whitespace-nowrap">{{ info?.stationInfo?.stationName }}</p>
        </Form.Item>
        <Form.Item label="关联工序">
          <Tag
            class="!mb-3px hover-opacity"
            v-for="(item, index) in info?.craftProcedureList"
            :key="item.id"
            color="blue"
            :style="getProcedureTagColor(index)"
            @click="handleProcedureTagClick(index)"
          >
            {{ item.procedureName }}
          </Tag>
        </Form.Item>
      </section>
      <section>
        <Form.Item label="工位产品重量">
          <p class="text-gray-400">{{ info?.virtualStationProductWeight || "" }}克</p>
        </Form.Item>

        <!-- <Form.Item label="节拍数值处理">
          <p class="text-gray-400">{{ info?.beatFormat || "/" }}</p>
        </Form.Item> -->

        <Form.Item label="启用功能">
          <p class="text-primary">
            {{ _getModuleAbilityText(info) }}
          </p>
        </Form.Item>
        <Form.Item label="产出工位">
          <p :class="info?.outputStation ? 'text-primary font-bold' : 'text-gray-400'">
            {{ getListItemLabel(CommonCheckList, info?.outputStation!!) }}</p
          >
        </Form.Item>
      </section>
    </div>

    <!-- 2、虚拟工位 - 选中工序信息： -->
    <SubTitle :size="AntUniversalSize.small" title="2、虚拟工位 - 选中工序信息：" />

    <ProcedurePanel v-if="curProcedure" :procedureInfo="curProcedure" />
  </Form>
</template>

<script setup lang="ts">
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { withDefaults, defineProps, computed, ref } from "vue";
  import ProcedurePanel from "/@/views/components/ProcedurePanel/index.vue";
  import { VirtualStationDetail } from "/@/api/model/virtualStation";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import { Form, Tag } from "ant-design-vue";
  import { CommonCheckList, UseCheckList, getListItemLabel } from "/@/config/data";
  import { themeColor } from "/@/settings/var";
  import { ModuleAbility } from "/@/enums/model";

  interface Props {
    info?: VirtualStationDetail;
  }

  const props = withDefaults(defineProps<Props>(), {
    info: undefined,
  });

  const selectProcedureIndex = ref(0);
  const curProcedure = computed(() => props.info?.craftProcedureList[selectProcedureIndex.value]);

  /** 获取模块能力文案 */
  function _getModuleAbilityText(record?: VirtualStationDetail) {
    if (!record) {
      return "";
    }

    const { needGeneral, needAddon, needWristband, needGround, needScale } = record;

    const list = [];
    needGeneral && list.push(ModuleAbility.GENERAL);
    needAddon && list.push(ModuleAbility.ADDON);
    needWristband && list.push(ModuleAbility.WRISTBAND);
    needGround && list.push(ModuleAbility.GROUND);
    needScale && list.push(ModuleAbility.SCALE);
    const text = list.join(",");

    return text;
  }

  /** 点击-工序 */
  function handleProcedureTagClick(index: number) {
    console.log(index);
    selectProcedureIndex.value = index;
  }

  /** 获取工序标签颜色 */
  function getProcedureTagColor(index: number) {
    if (index === selectProcedureIndex.value) {
      return themeColor.primary;
    } else {
      return "blue";
    }
  }
</script>

<style></style>
