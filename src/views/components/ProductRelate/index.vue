<template>
  <div v-if="isEditMode" class="hover-opacity">
    <slot>
      <Input
        placeholder="请选择产品+选项"
        :value="productText"
        showArrow
        allowClear
        @change="onInputChange"
        @click="handleClick"
      >
        <template #suffix>
          <BranchesOutlined class="!text-gray-400" />
        </template>
      </Input>
    </slot>
  </div>

  <div v-else style="font-size: 14px;">
    <div>{{ productText }}</div>
  </div>

  <!-- 弹窗 - 选择 -->
  <Modal
    :style="{ width: AntModalWidth.sm }"
    v-model:visible="modalSelectState.visible"
    :title="modalSelectState.title"
    :footer="null"
    destroyOnClose
  >
    <div class="mt-24px w-340px">
      <Form :labelCol="{ style: { width: '90px' } }">
        <Form.Item class="!mb-12px" label="产品名称" required>
          <Select
            allowClear
            placeholder="请选择"
            v-model:value="formData.productId"
            :showSearch="true"
            showArrow
            :filterOption="false"
            @search="onProductSearch"
            @change="onProductChange"
          >
            <Select.Option v-for="{ id, productName } in productFilterSelectList" :key="id" :value="id">
              {{ productName }}
            </Select.Option>
          </Select>
        </Form.Item>
      </Form>

      <p class="text-gray-400">-选项列表</p>
      <Form :labelCol="{ style: { width: '90px' } }">
        <Form.Item v-for="item in selectProductAttrList" :key="item.id">
          <template #label>
            <span class="text-primary">{{ item.attrName }}</span>
          </template>
          <Select allowClear placeholder="可选项" v-model:value="item.selectAttrValueId">
            <Select.Option v-for="{ id, attrValue } in item.productAttrValueList" :key="id" :value="id">
              {{ attrValue }}
            </Select.Option>
          </Select>
        </Form.Item>
      </Form>
      <div class="my-12px mt-48px">
        <div>
          <Button class="w-220px" type="primary" @click="handleSubmit">确定</Button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
  import { BranchesOutlined } from "@ant-design/icons-vue";
  import { Modal, Form, Input, Select, Button } from "ant-design-vue";
  import { defineExpose, defineEmits, withDefaults, defineProps, reactive, computed, ref, onMounted, watch } from "vue";
  import { AntModalWidth } from "/@/enums/antEnum";
  import { ProductInfo } from "/@/api/model/product";
  import { useDataStore } from "/@/store";
  import { ProductAttrValueInfo } from "/@/api/model/productAttrValue";
  import { getProductAttrValueListText, getProductWholeText } from "/@/config/parse";
  import { ProductAttrDetail, ProductAttrDetailExpand } from "/@/api/model/productAttr";
  import { CommonComponentMode } from "/@/enums/commonEnum";
  import { parseIds2List } from "/@/utils/util";

  interface Props {
    mode?: CommonComponentMode;
    productId?: number;
    productAttrValueIdsList?: number[];
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: CommonComponentMode.EDIT,
    productId: undefined,
    productAttrValueIdsList: () => [],
  });

  const formData = reactive({
    productId: props.productId,
    productAttrValueIdsList: props.productAttrValueIdsList,
  });

  defineExpose({
    openSelectModal: handleClick,
  });

  const emits = defineEmits(["update:productId", "update:productAttrValueIdsList", "change:ok"]);

  const dataStore = useDataStore();

  const productFilterSelectList = ref<ProductInfo[]>(dataStore.productListAll);

  const selectProductAttrList = ref<ProductAttrDetailExpand[]>([]);

  const isDetailMode = props.mode === CommonComponentMode.DETAIL;
  const isEditMode = props.mode === CommonComponentMode.EDIT;

  /** 弹窗 - 接收退回 */
  const modalSelectState = reactive<{
    id?: number;
    visible: boolean;
    title: string;
  }>({
    id: undefined,
    visible: false,
    title: "",
  });

  const productText = computed(() => {
    const { productId, productAttrValueIdsList } = props;

    const text = getProductWholeText(productId!!, productAttrValueIdsList);
    return text;
  });

  const selectproductAttrValueIdsList = computed(() => {
    // 遍历 selectProductAttrList
    const spaList = selectProductAttrList.value;
    let ids: number[] = [];
    for (let i = 0; i < spaList.length; i++) {
      const { selectAttrValueId } = spaList[i];
      if (selectAttrValueId) {
        ids.push(selectAttrValueId);
      }
    }
    //升序
    ids.sort((a, b) => a - b);

    return ids;
  });

  watch(
    [() => props.productId, () => props.productAttrValueIdsList],
    () => {
      // 同步一次数据
      const { productId, productAttrValueIdsList } = props;

      formData.productId = productId;
      formData.productAttrValueIdsList = productAttrValueIdsList;

      console.log(productId, productAttrValueIdsList);
      toUpdateSelectProductAttrList(productId, productAttrValueIdsList);
    },
    { immediate: true }
  );

  watch(
    () => dataStore.productListAll,
    () => {
      onProductSearch();
    }
  );

  onMounted(() => {});

  /** 输入框变化 */
  function onInputChange(e: any) {
    const value = e.target.value;
    if (!value) {
      formData.productId = undefined;
      selectProductAttrList.value = [];
      handleSubmit();
    }
  }

  /** 提交 */
  function handleSubmit() {
    const productId = formData.productId;
    const productAttrValueIdsList = selectproductAttrValueIdsList.value;

    // ids按顺序排
    productAttrValueIdsList.sort((a, b) => a - b);

    emits("update:productId", productId);
    emits("update:productAttrValueIdsList", productAttrValueIdsList);
    emits("change:ok", productId, productAttrValueIdsList);

    modalSelectState.visible = false;
  }

  /** 变更产品选项列表 */
  function toUpdateSelectProductAttrList(productId?: number, productAttrValueIdsList?: number[]) {
    const { productListAll } = dataStore;
    const pavIds = productAttrValueIdsList;

    let spaList: ProductAttrDetailExpand[] = [];

    if (productId) {
      const productInfo = productListAll.find((i) => i.id === productId)!!;
      const { productAttrList } = productInfo;
      spaList = productAttrList;

      // 遍历选项，为每个选项注入 selectAttrValueId
      for (let i = 0; i < spaList.length; i++) {
        const paInfo = spaList[i];
        const pavList = paInfo.productAttrValueList;
        const selectAttrValueId = pavList.find((i) => pavIds!!.includes(i.id));
        paInfo.selectAttrValueId = selectAttrValueId?.id;
      }
    }
    selectProductAttrList.value = spaList;
  }

  /** 产品变更 */
  function onProductChange(productId?: number) {
    toUpdateSelectProductAttrList(productId, []);
  }

  /** 产品搜索 */
  function onProductSearch(input?: string) {
    if (input) {
      const fList = dataStore.productListAll.filter((i) => i.productName.includes(input));
      productFilterSelectList.value = fList;
    } else {
      productFilterSelectList.value = dataStore.productListAll;
    }
  }

  function handleClick() {
    // 实测一个页面如果应用当前组件多个，可能导致组件更新异常
    // 故点击时要重置下组件
    const { productId, productAttrValueIdsList } = props;
    toUpdateSelectProductAttrList(productId, productAttrValueIdsList);
    modalSelectState.visible = true;
  }
</script>

<style></style>
