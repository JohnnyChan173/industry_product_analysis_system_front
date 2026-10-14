<template>
  <Form
    autocomplete="off"
    :model="formData"
    :rules="formRules"
    ref="formRef"
    class="detail"
    :class="`${resetCSSPrefix}-form-normal`"
    :labelCol="formNormalParams.labelCol"
  >
    <!-- 1、物料-基础信息 -->
    <SubTitle :size="AntUniversalSize.small" title="1、物料-基础信息" />
    <div :style="formNormalParams.divItemStyle">
      <Form.Item name="materialNo" label="种类编号">
        <div class="flex items-center">
          <Input v-focus v-model:value="formData.materialNo" placeholder="请输入" />
          <LinkOutlined class="text-20px !text-primary ml-6px hover-opacity" @click="handleRandomNo" />
        </div>
      </Form.Item>

      <Form.Item name="materialName" label="种类名称">
        <Input v-model:value="formData.materialName" placeholder="请输入" />
      </Form.Item>

      <Form.Item name="dictItemMaterialTypeId" label="物料类型">
        <div class="flex items-center">
          <Select
            allowClear
            :showSearch="true"
            :filterOption="dictItemFilterOption"
            placeholder="物料类型"
            v-model:value="formData.dictItemMaterialTypeId"
          >
            <Select.Option
              v-for="{ id, itemValue } in dataStore.dictItemMaterialTypeList"
              :label="itemValue"
              :key="id"
              :value="id"
            >
              {{ itemValue }}
            </Select.Option>
          </Select>
          <div class="text-primary hover-opacity whitespace-nowrap ml-6px" @click="handleDictMaterialTypeClick">
            管理
          </div>
        </div>
      </Form.Item>

      <Form.Item name="dictItemMaterialUnitId" label="用量单位">
        <div class="flex items-center">
          <Select
            allowClear
            :showSearch="true"
            :filterOption="dictItemFilterOption"
            placeholder="用量单位"
            v-model:value="formData.dictItemMaterialUnitId"
          >
            <Select.Option
              v-for="{ id, itemValue } in dataStore.dictItemMaterialUnitList"
              :label="itemValue"
              :key="id"
              :value="id"
            >
              {{ itemValue }}
            </Select.Option>
          </Select>
          <div class="text-primary hover-opacity whitespace-nowrap ml-6px" @click="handleDictMaterialUnitClick">
            管理
          </div>
        </div>
      </Form.Item>
    </div>

    <!-- 2、物料-规格列表 -->
    <SubTitle :size="AntUniversalSize.small" title="2、物料-规格列表" />
    <Form.Item name="materialSpecsList" label="">
      <SpecsTable v-model:value="formData.materialSpecsList" />
    </Form.Item>

    <div :style="formNormalParams.divBtnStyle">
      <Form.Item>
        <Button class="mr-12px" type="primary" :style="normalBtnStyle" @click="handleClick">{{ modeText }}</Button>
        <Button :style="normalBtnStyle" @click="handleResetClick">重置</Button>
      </Form.Item>
    </div>
  </Form>

  <!-- 弹窗 - 配置字典 -->
  <Modal
    :style="{ width: '520px' }"
    v-model:visible="modalConfigState.visible"
    :title="`配置字典: ${modalConfigState.dictName}`"
    :footer="null"
    destroyOnClose
    @cancel="handleConfigModalCancel"
  >
    <Config :dictId="modalConfigState.id" :dictNo="modalConfigState.dictNo" />
  </Modal>
</template>

<script setup lang="ts">
  import { FormInstance, Button, Form, Select, Input, Modal } from "ant-design-vue";
  import { onMounted, ref, reactive, withDefaults, defineProps, defineEmits } from "vue";
  import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import { useFormUtils } from "/@/hooks/antd/form";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { getFormRules } from "./useForm";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import { materialDetail, materialEdit, materialAdd } from "/@/api/material";
  import { MaterialInfo, MaterialAddData } from "/@/api/model/material";
  import { setPropertyValue } from "/@/utils/typeTools";
  import { useDataStore } from "/@/store";
  import { DictInfo } from "/@/api/model/dict";
  import { dictDetail } from "/@/api/dict";
  import Config from "/@/views/TenantDict/Config/index.vue";
  import { randomId, dictItemFilterOption } from "/@/utils/util";
  import { LinkOutlined } from "@ant-design/icons-vue";
  import { useTable } from "./useTable";
  import { MaterialSpecsInfo } from "/@/api/model/materialSpecs";
  import { cloneDeep } from "lodash";
  import SpecsTable from "./specs-table.vue";
  import { randomMaterialNo } from "/@/config/parse/number";

  const resetCSSPrefix = getResetCSSPrefix();

  const dataStore = useDataStore();

  interface Props {
    id?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    id: undefined,
  });

  const emits = defineEmits(["change"]);

  const formRef = ref<FormInstance>();
  const { validForm, resetForm } = useFormUtils(formRef);

  const formData = reactive<MaterialAddData>({
    id: undefined,
    materialNo: undefined,
    materialName: undefined,
    dictItemMaterialTypeId: undefined,
    dictItemMaterialUnitId: undefined,
    materialSpecsList: [],
  });

  const { columns } = useTable();

  const formRules = getFormRules();

  const isEditMode = !!props.id;
  const modeText = isEditMode ? "编辑" : "创建";

  /** 弹窗 - 配置字典 */
  const modalConfigState = reactive<{
    id?: number;
    visible: boolean;
    dictName: string;
    dictNo: string;
  }>({
    id: undefined,
    visible: false,
    dictName: "",
    dictNo: "",
  });

  onMounted(async () => {
    if (isEditMode) {
      const { id } = props;
      const info = await materialDetail(id!!);
      formData.id = id;
      console.log(info);

      Object.keys(formData).forEach((key: keyof MaterialInfo) => {
        setPropertyValue(formData, key, info[key]);
      });
    } else {
      // 赋值随机编号
      handleRandomNo();
    }
  });

  /** 点击 - 物料类型字典管理 */
  async function handleDictMaterialTypeClick() {
    const { dictId } = dataStore.dictItemMaterialTypeList[0];
    // 获取字典类型
    const dictInfo = await dictDetail(dictId);
    handleDictConfig(dictId, dictInfo);
  }

  /** 点击 - 物料单位字典管理 */
  async function handleDictMaterialUnitClick() {
    const { dictId } = dataStore.dictItemMaterialUnitList[0];
    // 获取字典类型
    const dictInfo = await dictDetail(dictId);
    handleDictConfig(dictId, dictInfo);
  }

  /** 点击 - 配置字典 */
  function handleDictConfig(id: number, record: DictInfo) {
    modalConfigState.id = id;
    modalConfigState.dictName = record.dictName;
    modalConfigState.visible = true;
  }

  /** ConfigModal 弹窗关闭 */
  async function handleConfigModalCancel() {
    modalConfigState.visible = false;
  }

  /** 点击 - 创建|编辑 */
  async function handleClick() {
    await validForm();

    // 编辑模式
    if (isEditMode) {
      await materialEdit(formData);
    } else {
      await materialAdd(formData);
    }

    await dataStore.initMaterialList();
    emits("change");
  }

  /** 点击 - 重置 */
  function handleResetClick() {
    resetForm();
  }

  /** 随机生成编号 */
  async function handleRandomNo() {
    const no = randomMaterialNo();
    formData.materialNo = no;
  }
</script>

<style></style>
