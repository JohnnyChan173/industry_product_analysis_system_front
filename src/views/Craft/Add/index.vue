<template>
  <Form
    autocomplete="off"
    :model="formData"
    :rules="formRules"
    ref="formRef"
    :class="`${resetCSSPrefix}-form-normal`"
    :labelCol="formNormalParams.labelCol"
  >
    <!-- 1、工艺信息 -->
    <SubTitle :size="AntUniversalSize.small" title="1、工艺信息" />
    <div :style="formNormalParams.divItemStyle">
      <Form.Item name="craftNo" label="工艺编号">
        <div class="flex items-center">
          <Input v-model:value="formData.craftNo" placeholder="请输入" />
          <LinkOutlined class="text-20px !text-primary ml-6px hover-opacity" @click="handleRandomNo" />
        </div>
      </Form.Item>

      <Form.Item name="craftName" label="工艺名称">
        <Input v-model:value="formData.craftName" placeholder="请输入" />
      </Form.Item>

      <Form.Item name="craftProductIds" label="工艺适用产品">
        <div class="flex items-center" style="width: 480px;">
          <InputSelectPanel
            multiple
            :raw-select-list="rawProductSelectList"
            :labelFn="selectLabelFn"
            v-model:value="formData.craftProductIds"
            placeholder="请输入产品名称或编号过滤"
          />
          <span class="text-primary text-underline hover-opacity whitespace-nowrap pl-6px" @click="handleProductAdd">
            创建产品
          </span>
        </div>
      </Form.Item>
    </div>

    <!-- 2、工艺 - 工序列表： -->
    <SubTitle :size="AntUniversalSize.small" title="2、工艺 - 工序列表：" />

    <Form.Item name="craftProcedureList" label="">
      <ProcessRectProcedureList v-model:list="formData.craftProcedureList"></ProcessRectProcedureList>
    </Form.Item>

    <div :style="formNormalParams.divBtnStyle">
      <Form.Item>
        <Button class="mr-12px" type="primary" :style="normalBtnStyle" @click="handleClick">{{ modeText }}</Button>
        <Button :style="normalBtnStyle" @click="handleResetClick">重置</Button>
      </Form.Item>
    </div>
  </Form>

  <!-- 弹窗 - 创建产品 -->
  <Modal v-model:visible="modalAddState.visible" :title="modalAddState.title" :footer="null" destroyOnClose>
    <ProductAdd :id="modalAddState.id" @change="handleProductAddChange" />
  </Modal>
</template>

<script setup lang="ts">
  import { FormInstance, Button, Form, Select, Input, DatePicker, InputNumber, Modal, message } from "ant-design-vue";
  import { onMounted, ref, reactive, unref, withDefaults, defineProps, defineEmits, computed } from "vue";
  import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import { useFormUtils } from "/@/hooks/antd/form";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { getFormRules } from "./useForm";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import { craftDetail, craftEdit, craftAdd } from "/@/api/craft";
  import { CraftInfo } from "/@/api/model/craft";
  import { setPropertyValue } from "/@/utils/typeTools";
  import InputSelectPanel from "/@/views/components/InputSelectPanel/index.vue";
  import ProcessRectProcedureList from "/@/views/components/ProcessRectProcedureList/index.vue";
  import { CommonComponentMode, CommonComponentSize, CommonOperatorTip } from "/@/enums/commonEnum";
  import { CraftProcedureInfo } from "/@/api/model/craftProcedure";
  import { ProductInfo } from "/@/api/model/product";
  import { productListAll } from "/@/api/product";
  import { craftProcedureAdd, craftProcedureEdit } from "/@/api/craftProcedure";
  import ProductAdd from "/@/views/Product/Add/index.vue";
  import { randomCraftNo } from "/@/config/parse/number";
  import { LinkOutlined } from "@ant-design/icons-vue";
  import { addCraft } from "/@/utils/data-copy";

  const resetCSSPrefix = getResetCSSPrefix();

  interface Props {
    id?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    id: undefined,
  });

  const emits = defineEmits(["change"]);

  const formRef = ref<FormInstance>();
  const { validForm, resetForm } = useFormUtils(formRef);

  type FormDataParam = CraftInfo & {
    craftProcedureList: CraftProcedureInfo[];
  };

  const formData = reactive<Partial<FormDataParam>>({
    id: undefined,
    craftNo: undefined,
    craftName: undefined,
    craftProductIds: [],

    craftProcedureList: [
      // {
      //   "id": 1,
      //   "craftId": 1,
      //   "procedureName": "铜片传送",
      //   "procedureType": 1,
      //   "procedureProcess": 1,
      //   "procedureSort": 1,
      //   "memo": "",
      // },
    ],
  });

  /** 弹窗 - 创建产品 */
  const modalAddState = reactive<{
    id?: number;
    visible: boolean;
    title: string;
  }>({
    id: undefined,
    visible: false,
    title: "创建产品",
  });

  const formRules = getFormRules();

  const rawProductSelectList = ref<ProductInfo[]>([]);

  const isEditMode = !!props.id;
  const modeText = isEditMode ? "编辑" : "创建";

  onMounted(async () => {
    await toGetAllProductList();

    if (isEditMode) {
      // 获取工艺详情数据
      const { id } = props;
      const info = await craftDetail(id!!);
      formData.id = id;
      console.log(info);

      Object.keys(formData).forEach((key: keyof CraftInfo) => {
        setPropertyValue(formData, key, info[key]);
      });
    } else {
      // 赋值随机编号
      handleRandomNo();
    }
  });

  /** 随机生成任务单号 */
  async function handleRandomNo() {
    const no = randomCraftNo();
    formData.craftNo = no;
  }

  /** Add 组件变化 */
  async function handleProductAddChange() {
    await toGetAllProductList();
    modalAddState.visible = false;
    message.success(CommonOperatorTip.OK);
  }

  /** 点击 - 创建产品 */
  function handleProductAdd() {
    modalAddState.id = undefined;
    modalAddState.visible = true;
    modalAddState.title = "创建产品";
  }

  function selectLabelFn(item: ProductInfo) {
    return `[${item.productNo}]-${item.productName}`;
  }

  /** 获取全部产品列表 */
  async function toGetAllProductList() {
    const pList = await productListAll();
    rawProductSelectList.value = pList;
  }

  /** 点击 - 创建|编辑 */
  async function handleClick() {
    await validForm();

    // 编辑模式
    if (isEditMode) {
      const { craftProcedureList, ...editCraftInfo } = formData;
      // 先编辑工艺
      const craftId = await craftEdit(editCraftInfo);

      // 工序注入 craftId 与 procedureSort
      craftProcedureList?.forEach((i, index) => {
        i.craftId = craftId;
        i.procedureSort = index;
      });

      // 编辑工序
      await craftProcedureEdit(craftProcedureList!!);
    } else {
      const { craftProcedureList, ...newCraftData } = formData;

      await addCraft(newCraftData, craftProcedureList!!);
    }

    emits("change");
  }

  /** 点击 - 重置 */
  function handleResetClick() {
    resetForm();
  }
</script>

<style></style>
