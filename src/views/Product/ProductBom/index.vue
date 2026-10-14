<template>
  <BackBtn v-if="!isStockCheckMode" />

  <div class="w-1180px">
    <div class="flex items-center mt-12px">
      <p>
        <span class="text-gray-400">产品名称：</span>
        <span class="text-primary">{{ productInfo?.productName }}</span>
      </p>

      <p v-if="isStockCheckMode" class="ml-18px">
        <span class="text-gray-400">生产数量：</span>
        <span class="font-bold text-20px">{{ props.number }}</span>
      </p>
    </div>

    <!-- 1、产品-基础BOM -->
    <SubTitle :size="AntUniversalSize.small" title="1、产品-基础BOM" />

    <div class="ml-160px w-1020px">
      <BasicBom
        :mode="bomMode"
        :number="number"
        :showStock="showStock"
        :productId="productId"
        :productAttrId="undefined"
        :productAttrValueId="undefined"
        :disabledMaterialSpecsIds="disabledMaterialSpecsIds"
        v-model:value="productBomBasicList"
        @update:value="updateDisabledMaterialSpecsIds"
      />
    </div>

    <!-- 2、产品-选项BOM -->
    <SubTitle v-if="productGroupBomList.length > 0" :size="AntUniversalSize.small" title="2、产品-选项BOM" />
    <div
      v-for="({ productAttrId, productAttrInfo, productAttrValueBomList }, index) in productGroupBomList"
      :key="productAttrId"
    >
      <p class="text-primary">选项{{ index + 1 }}：{{ productAttrInfo.attrName }}</p>
      <Table
        class="headerify borderify"
        bordered
        rowKey="id"
        :dataSource="productAttrValueBomList"
        :columns="columns"
        :pagination="false"
        size="small"
      >
        <template #bodyCell="{ text, record, index, column }: BodyCellData<GroupItemData>">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>

          <!-- 选项值 -->
          <template v-if="column.key === 'productAttrValue'">
            <p>
              <span>{{ productAttrInfo.attrName }}-</span>
              <span>{{ record.productAttrValueInfo.attrValue }}</span>
            </p>
          </template>

          <!-- 选项BOM列表 -->
          <template v-if="column.key === 'bomList'">
            <div class="w-1020px">
              <BasicBom
                :mode="bomMode"
                :number="number"
                :showStock="showStock"
                :productId="productId"
                :productAttrId="productAttrId"
                :productAttrValueId="record.productAttrValueInfo.id"
                :disabledMaterialSpecsIds="disabledMaterialSpecsIds"
                :showHeader="false"
                v-model:value="record.bomList"
                @update:value="updateDisabledMaterialSpecsIds"
              />
            </div>
          </template>
        </template>
      </Table>
    </div>
  </div>
</template>

<script setup lang="ts">
  import BackBtn from "/@/components/BackBtn/index.vue";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import { onMounted, reactive, ref, withDefaults, defineProps, computed } from "vue";
  import { parseSearch } from "/@/utils/util";
  import { productBomListAll } from "/@/api/productBom";
  import BasicBom from "/@/views/components/ProductBomSetting/basic-bom.vue";
  import { ProductBomDetail, ProductBomDetailExpand } from "/@/api/model/productBom";
  import { CommonComponentMode } from "/@/enums/commonEnum";
  import { productDetail } from "/@/api/product";
  import { ProductDetail } from "/@/api/model/product";
  import { useTable, GroupBomData, GroupItemData } from "./useTable";
  import { BodyCellData } from "/#/antd";
  import { Table } from "ant-design-vue";
  import { ProductAttrValueDetail } from "/@/api/model/productAttrValue";
  import { ProductBomPageMode } from "./type";
  import { useDataStore } from "/@/store";
  import { cloneDeep } from "lodash";
  import { ProductAttrDetail } from "/@/api/model/productAttr";

  interface Props {
    mode?: ProductBomPageMode;
    productId: number;
    productAttrValueIdsList?: number[];
    number?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: "edit",
    number: 1,
  });

  const dataStore = useDataStore();

  const searchParams = parseSearch();

  // 兼容两种模式(props search)
  const mode: ProductBomPageMode = props.mode ? props.mode : (searchParams.mode as ProductBomPageMode) || "edit";
  const productId = props.productId ? props.productId : Number(searchParams.productId);
  const number = props.number ? props.number : Number(searchParams.number) || 1;

  const isEditMode = mode === "edit";
  const isStockCheckMode = mode === "stock-check";
  const showStock = isStockCheckMode;

  const { columns, dataSource } = useTable();

  const productInfo = computed(() => {
    const pi = dataStore.getProductInfo(productId);
    return pi;
  });

  const productBomAllList = ref<ProductBomDetailExpand[]>([]);
  const productBomBasicList = ref<ProductBomDetailExpand[]>([]);

  const productGroupBomList = ref<GroupBomData[]>([]);
  const disabledMaterialSpecsIds = ref<number[]>([]);

  const bomMode = computed(() => {
    if (isEditMode) {
      return CommonComponentMode.EDIT;
    } else {
      return CommonComponentMode.DETAIL;
    }
  });

  onMounted(async () => {
    await toGetNeedInfo();
  });

  /** 分组BOM列表 */
  function toGroupBomList() {
    const { productAttrValueIdsList: pavIdsList } = props;
    const groupBomList: GroupBomData[] = [];
    let productAttrList = productInfo.value!!.productAttrList;

    // 如果 pavIdsList 存在
    if (pavIdsList) {
      if (pavIdsList.length === 0) {
        productAttrList = [];
      } else {
        const newPaList = [] as ProductAttrDetail[];
        // 选项下的选项值 必须对上才合法
        for (let i = 0; i < productAttrList.length; i++) {
          const paInfo = productAttrList[i];
          const { productAttrValueList } = paInfo;
          const validPavList = productAttrValueList.filter((i) => pavIdsList.includes(i.id));
          if (validPavList.length > 0) {
            const validPaInfo = Object.assign({}, paInfo, {
              productAttrValueList: validPavList,
            });
            newPaList.push(validPaInfo);
          }
        }
        productAttrList = newPaList;
      }
    }

    // 按照选项&值顺序生成结构数据
    for (let i = 0; i < productAttrList.length; i++) {
      const productAttrInfo = productAttrList[i];
      const productAttrValueList = productAttrInfo.productAttrValueList;

      const bomData: GroupBomData = {
        productAttrId: productAttrInfo.id,
        productAttrInfo,
        productAttrValueBomList: [],
      };

      groupBomList.push(bomData);

      for (let j = 0; j < productAttrValueList.length; j++) {
        const productAttrValueInfo = productAttrValueList[j];
        const productAttrValueBomData: GroupItemData = {
          productAttrValueId: productAttrValueInfo.id,
          productAttrValueInfo,
          bomList: [],
        };
        bomData.productAttrValueBomList.push(productAttrValueBomData);
      }
    }

    console.log(groupBomList);

    // 循环治理BOMData
    const pbList = productBomAllList.value;
    for (let i = 0; i < pbList.length; i++) {
      const bomData = pbList[i];

      const { productAttrId, productAttrValueId } = bomData;

      // 如果一二级项均不存在，说明是基础配置
      if (!productAttrId && !productAttrValueId) {
        productBomBasicList.value = [...productBomBasicList.value, bomData];
        continue;
      }
      console.log(productAttrId, productAttrValueId);

      // 匹配一级项
      const firstItem = groupBomList.find((i) => i.productAttrId === productAttrId);

      if (firstItem) {
        // 再匹配二级项
        const secondItem = firstItem.productAttrValueBomList.find((i) => i.productAttrValueId === productAttrValueId);
        if (secondItem) {
          secondItem.bomList.push(bomData);
        }
      }
    }

    console.log(groupBomList);
    // 设置分组BOM列表
    productGroupBomList.value = groupBomList;

    updateDisabledMaterialSpecsIds();
  }

  /** 更新禁用物料规格ids */
  function updateDisabledMaterialSpecsIds() {
    // 设置物料禁选ids
    // 分别从 productGroupBomList productBomBasicList 完成更新
    const specsIds: number[] = [];
    const basicSpecsIds = productBomBasicList.value.map((i) => i.materialSpecsId);

    specsIds.push(...basicSpecsIds);

    for (let i = 0; i < productGroupBomList.value.length; i++) {
      const pgb = productGroupBomList.value[i];
      const groupSpecsIds = pgb.productAttrValueBomList.map((i) => i.bomList.map((i) => i.materialSpecsId)).flat();
      specsIds.push(...groupSpecsIds);
    }

    disabledMaterialSpecsIds.value = specsIds;
  }

  /** 获取产品BOM列表全部 */
  async function toGetBomListAll() {
    const pbList = await productBomListAll(productId);
    productBomAllList.value = pbList;
  }

  /** 获取必要数据 */
  async function toGetNeedInfo() {
    await toGetBomListAll();

    toGroupBomList();
  }
</script>

<style></style>
