<template>
  <div class="vinfo">
    <SubTitle2 class="!my-16px" title="虚拟产线列表" />
    <div class="vinfo-box">
      <section v-for="(item, index) in virtualLineList" :key="item.id" class="vinfo-sec">
        <p class="vinfo-sec-title">{{ index + 1 }}、{{ item.virtualLineName }}：</p>

        <div class="vinfo-sec-subTitle">
          <p class="vinfo-sec-subTitle-name">工艺适用产品</p>
          <div class="vinfo-sec-subTitle-value">
            <p v-for="product in item.craftInfo.craftProductList" :key="product.id">
              - {{ product.productNo }}【{{ product.productName }}】
            </p>
          </div>
        </div>

        <ProcessRectVirtualStationList
          :mode="CommonComponentMode.DETAIL"
          v-model:list="item.virtualStationList"
          @mouse:enter="handleVirtualStationMouseEnter"
        >
          <template #item="{ record }: any">
            <Popover placement="bottom">
              <template #content>
                <VirtualStationPanel class="w-520px" :info="record" />
              </template>
              <div class="rect-mask"></div>
            </Popover>
          </template>
        </ProcessRectVirtualStationList>
      </section>

      <p v-if="virtualLineList.length === 0" class="text-gray-400">暂无虚拟产线，请创建</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { CSSProperties, computed, onMounted, reactive, ref } from "vue";
  import SubTitle2 from "/@/components/Title/SubTitle2.vue";
  import { CommonComponentMode } from "/@/enums/commonEnum";
  import ProcessRectVirtualStationList from "/@/views/components/ProcessRectVirtualStationList/index.vue";
  import { virtualLineListByLineId } from "/@/api/virtualLine";
  import { parseSearch } from "/@/utils/util";
  import { VirtualLineDetail } from "/@/api/model/virtualLine";
  import { VirtualStationDetail } from "/@/api/model/virtualStation";
  import { AntModalWidth, AntUniversalSize } from "/@/enums/antEnum";
  import { Form, Modal, Popover, Tag } from "ant-design-vue";
  import { themeColor } from "/@/settings/var";
  import { getListItemLabel, CommonCheckList, UseCheckList } from "/@/config/data";
  import VirtualStationPanel from "./virtual-station-panel.vue";

  const lineId = Number(parseSearch().id);

  const virtualLineList = ref<VirtualLineDetail[]>([]);

  /** 弹窗 - 虚拟工位详情 */
  const modalVirtualStationState = reactive<{
    visible: boolean;
    virtualStation?: VirtualStationDetail;
    style?: CSSProperties;
  }>({
    visible: false,
  });

  onMounted(() => {
    toGetNeedInfo();
  });

  /** 虚拟工位鼠标划入 */
  async function handleVirtualStationMouseEnter(e: MouseEvent, item: VirtualStationDetail) {
    const { clientX: x, clientY: y } = e;
    const { innerWidth } = window;
    // 虚拟工位赋值
    modalVirtualStationState.virtualStation = item;

    // 检测弹窗呼出方向
    const effectWidth = parseInt(AntModalWidth.lg) + x;
    const innerOffset = 10;

    if (effectWidth > innerWidth) {
      modalVirtualStationState.style = {
        position: "absolute",
        right: innerWidth - innerOffset - x + "px",
      };
    } else {
      modalVirtualStationState.style = {
        position: "absolute",
        left: x - innerOffset + "px",
      };
    }

    modalVirtualStationState.visible = true;
  }

  /** 获取虚拟产线列表 */
  async function toGetList() {
    const list = await virtualLineListByLineId(lineId);
    const data =list.map(item=>{
      return {
        ...item,
        virtualStationList: item.virtualStationList.sort((a, b) => a.virtualStationSort-b.virtualStationSort) || [],
      }
    }) 
    virtualLineList.value = data;
  }

  /** 获取必要数据 */
  function toGetNeedInfo() {
    toGetList();
  }
</script>

<style lang="less" scoped>
  .vinfo {
    max-width: 1080px;
    &-box {
      margin-left: 32px;
    }
    &-sec {
      &-title {
        color: @color-primary;
        font-weight: bold;
        font-size: 15px;
      }
      &-subTitle {
        display: flex;
        align-items: flex-start;
        line-height: 32px;
        padding: 8px 32px;
        &-name {
          color: #999;
          margin-right: 8px;
        }
        &-value {
          color: @color-primary;
        }
      }
    }
  }

  .rect-mask {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
</style>
