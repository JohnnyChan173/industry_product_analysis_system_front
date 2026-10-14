<template>
  <div class="h-32px flex items-center justify-center">
    <div v-if="!isEditMode">
      <Tooltip placement="top" v-if="moduleUuid">
        <template #title>
          <div>
            <p v-if="gatewayUuid">网关UUID：{{ gatewayUuid }}</p>
            <p v-else class="text-warn">模块未关联网关</p>
            <p>模块UUID：{{ moduleUuid }}</p>
          </div>
        </template>
        <div class="module flex items-center" :style="finalStyle">
          <div v-for="{ id, img, value, title } in moduleList" :key="id">
            <img
              draggable="false"
              class="ml-3px"
              :src="img"
              :width="finalSize"
              :title="title"
              :style="_getImgStyle(value)"
            />
          </div>
        </div>
      </Tooltip>
      <p v-else class="text-warn font-bold">未绑定模组</p>
    </div>
    <div v-else>
      <div class="module flex items-center" :style="finalStyle">
        <div v-for="{ id, img, value, title } in moduleList" :key="id" @click="handleModuleClick(id, value)">
          <img
            draggable="false"
            class="ml-3px"
            :src="img"
            :width="finalSize"
            :title="title"
            :style="_getImgStyle(value)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Tooltip } from "ant-design-vue";
  import { defineEmits, withDefaults, defineProps, onMounted, reactive, ref, nextTick, computed } from "vue";
  import { getAssetsFile } from "/@/utils/util";
  import { CommonComponentMode, CommonComponentSize } from "/@/enums/commonEnum";
  import { themeColor } from "/@/settings/var";
import { ModuleAbility } from "/@/enums/model";

  const moduleAddonImg = getAssetsFile("module-addon.png");
  const moduleWristbandImg = getAssetsFile("module-wristband.png");
  const moduleGeneralImg = getAssetsFile("module-general.png");
  const moduleGroundImg = getAssetsFile("module-ground.png");
  const moduleScaleImg = getAssetsFile("module-scale.png");

  interface Props {
    mode?: CommonComponentMode;
    size?: CommonComponentSize;
    useMode: boolean;
    gatewayUuid: string;
    moduleUuid: string;
    isUsedAddon: number;
    isUsedWristband: number;
    isUsedGround: number;
    isUsedGeneral: number;
    isUsedScale: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: undefined,
    size: CommonComponentSize.NORMAL,
    useMode: false,
    gatewayUuid: "",
    moduleUuid: "",
    isUsedAddon: 0,
    isUsedWristband: 0,
    isUsedGround: 0,
    isUsedGeneral: 0,
    isUsedScale: 0,
  });

  const emits = defineEmits([
    "update:isUsedAddon",
    "update:isUsedWristband",
    "update:isUsedGround",
    "update:isUsedGeneral",
    "update:isUsedScale",
  ]);

  const isEditMode = props.mode === CommonComponentMode.EDIT;

  const finalSize = computed(() => {
    if (props.size === CommonComponentSize.SMALL) {
      return 18;
    } else {
      return 24;
    }
  });

  const finalStyle = computed(() => {
    const { useMode, moduleUuid, gatewayUuid } = props;
    if (useMode) {
      return {
        border: "none",
        boxShadow: "none",
      };
    } else {
      if (gatewayUuid) {
        return {
          border: `2px solid ${themeColor["primary"]}`,
        };
      } else {
        return {
          border: `1px solid #ccc`,
        };
      }
    }
  });

  const moduleList = computed(() => [
    {
      id: "isUsedAddon",
      title: ModuleAbility.ADDON,
      img: moduleAddonImg,
      value: props.isUsedAddon,
    },
    {
      id: "isUsedWristband",
      title: ModuleAbility.WRISTBAND,
      img: moduleWristbandImg,
      value: props.isUsedWristband,
    },
    {
      id: "isUsedGround",
      title: ModuleAbility.GROUND,
      img: moduleGroundImg,
      value: props.isUsedGround,
    },
    {
      id: "isUsedGeneral",
      title: ModuleAbility.GENERAL,
      img: moduleGeneralImg,
      value: props.isUsedGeneral,
    },
    {
      id: "isUsedScale",
      title: ModuleAbility.SCALE,
      img: moduleScaleImg,
      value: props.isUsedScale,
    },
  ]);

  /** 模块点击-编辑模式 */
  function handleModuleClick(id: string, value: number) {
    const emitEvent = `update:${id}` as any;
    emits(emitEvent, value ? 0 : 1);
  }

  function _getImgStyle(value: number) {
    if (props.useMode) {
      return { opacity: value ? 1 : 0 };
    } else {
      return { opacity: value ? 1 : 0.1 };
    }
  }
</script>

<style lang="less" scoped>
  .module {
    padding: 3px;

    .simple-shadow();
  }
</style>
