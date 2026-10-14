<template>
  <div>
    <Form
      autocomplete="off"
      :model="formData"
      :rules="formRules"
      ref="formRef"
      :class="`${resetCSSPrefix}-form-normal`"
      :labelCol="{ style: { width: '130px' } }"
    >
      <SubTitle :size="AntUniversalSize.small" title="1、产品选项-基础信息" />

      <div class="w-380px">
        <Form.Item name="attrName" label="选项名称">
          <Input v-focus v-model:value="formData.attrName" placeholder="请输入" />
        </Form.Item>

        <Form.Item name="attrSort" label="选项顺序">
          <InputNumber v-model:value="formData.attrSort" placeholder="请输入" :min="0" />
        </Form.Item>
      </div>
      <SubTitle :size="AntUniversalSize.small" title="2、产品选项-选项值列表" />

      <div>
        <Form.Item name="productAttrValueList" label="" :autoLink="false">
          <Table
            class="headerify borderify"
            bordered
            rowKey="uuid"
            :dataSource="formData.productAttrValueList"
            :columns="columns"
            size="small"
            :pagination="false"
          >
            <template #emptyText>
              <span class="text-gray-400">暂无选项值</span>
            </template>
            <template #bodyCell="{ text, record, index, column }: BodyCellData<ProductAttrValueInfo>">
              <!-- 序号 -->
              <template v-if="column.key === 'order'">
                <span>{{ index + 1 }}</span>
              </template>

              <!-- 可编辑项 -->
              <template v-if="['attrValue', 'attrValueSort'].includes(column.dataIndex)">
                <div>
                  <!-- 选项值 -->
                  <Input
                    v-if="editableData[record.uuid] && column.dataIndex == 'attrValue'"
                    v-focus
                    v-model:value="editableData[record.uuid][column.dataIndex]"
                    style="margin: -5px 0"
                    @keyup.enter.stop="save(record.uuid)"
                  />

                  <!-- 选项值顺序 -->
                  <InputNumber
                    v-else-if="editableData[record.uuid] && column.dataIndex == 'attrValueSort'"
                    v-model:value="editableData[record.uuid][column.dataIndex]"
                    :min="0"
                    style="margin: -5px 0"
                    @keyup.enter.stop="save(record.uuid)"
                  />

                  <!-- 文本项 -->
                  <template v-else>
                    {{ text }}
                  </template>
                </div>
              </template>

              <template v-if="column.key === 'action'">
                <div class="editable-row-operations">
                  <span v-if="editableData[record.uuid]">
                    <a @click="save(record.uuid)">确定</a>
                    <Divider type="vertical" />

                    <span class="text-gray-400 hover-opacity" @click="cancel(record.uuid)">取消</span>
                  </span>
                  <span v-else>
                    <a @click="edit(record.uuid)">编辑</a>
                    <Divider type="vertical" />

                    <Popconfirm title="确认删除选项值？" @confirm="del(record.uuid)">
                      <span class="text-danger hover-opacity">删除</span>
                    </Popconfirm>
                  </span>
                </div>
              </template>
            </template>
          </Table>
          <div class="text-right mt-12px">
            <Button type="primary" ghost @click="handleAttrAdd">创建选项值 +</Button>
          </div>
        </Form.Item>
      </div>

      <div :style="formNormalParams.divBtnStyle">
        <Form.Item>
          <Button class="mr-12px" type="primary" :style="normalBtnStyle" @click="handleClick">{{ modeText }}</Button>
          <Button :style="normalBtnStyle" @click="handleResetClick">重置</Button>
        </Form.Item>
      </div>
    </Form>
  </div>
</template>

<script setup lang="ts">
  import { Button, Table, Divider, Select, Input, Popconfirm, InputNumber, FormInstance, Form } from "ant-design-vue";
  import { defineEmits, withDefaults, defineProps, onMounted, reactive, ref, nextTick, computed } from "vue";
  import { useTable } from "./useTable";
  import { staffListAll } from "/@/api/staff";
  import { StaffType } from "/@/enums/model";
  import { StaffInfo } from "/@/api/model/staff";
  import { cloneDeep } from "lodash";
  import { AddonEventTypeList, getListItemLabel } from "/@/config/data";
  import { createInputModal } from "/@/components/Modal/createModalInput";
  import { AntInputType, AntUniversalSize } from "/@/enums/antEnum";
  import { BodyCellData } from "/#/antd";
  import { ProductAttrAddData, ProductAttrDetail, ProductAttrInfo } from "/@/api/model/productAttr";
  import {
    productAttrAdd,
    productAttrDel,
    productAttrDetail,
    productAttrEdit,
    productAttrList,
    productAttrListAll,
  } from "/@/api/productAttr";
  import { ProductAttrValueInfo } from "/@/api/model/productAttrValue";
  import { randomId } from "/@/utils/util";
  import { useFormUtils } from "/@/hooks/antd/form";
  import { getFormRules } from "./useForm";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { formNormalParams, getResetCSSPrefix, normalBtnStyle } from "/@/config/domStyle";
  import { setPropertyValue } from "/@/utils/typeTools";
  import { useDataStore } from "/@/store";

  interface Props {
    id: number;
    productId: number;
    attrSort: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    id: undefined,
    productId: undefined,
    attrSort: undefined,
  });

  const dataStore = useDataStore();

  const emits = defineEmits(["change:ok"]);

  const resetCSSPrefix = getResetCSSPrefix();

  const formRef = ref<FormInstance>();
  const { validForm, resetForm } = useFormUtils(formRef);

  const formData = reactive<ProductAttrAddData>({
    id: undefined,
    productId: undefined,
    attrName: "",
    attrSort: 0,
    productAttrValueList: [],
  });

  /** 表单数据 */
  const { columns } = useTable();

  const formRules = getFormRules();

  const editableData = reactive<any>({});

  const isEditMode = !!props.id;
  const modeText = isEditMode ? "编辑" : "创建";

  // mounted
  onMounted(async () => {
    if (isEditMode) {
      const { id } = props;
      const info = await productAttrDetail(id!!);
      formData.id = id;

      console.log(info);
      Object.keys(formData).forEach((key: keyof ProductAttrDetail) => {
        setPropertyValue(formData, key, info[key]);
      });
    } else {
      const { productId, attrSort } = props;
      formData.productId = productId;
      formData.attrSort = attrSort;
    }
  });

  /** 点击 - 重置 */
  function handleResetClick() {
    resetForm();
  }

  /** 点击 - 创建|编辑 */
  async function handleClick() {
    await validForm();

    // 编辑模式
    if (isEditMode) {
      const data = formData;
      // 编辑工序
      await productAttrEdit(data);
    } else {
      // 创建
      const data = formData;
      await productAttrAdd(data);
    }

    await dataStore.initProductList();

    emits("change:ok");
  }

  /** 创建选项值 */
  async function handleAttrAdd() {
    const ds = Array.from(formData.productAttrValueList);
    const dsLen = ds.length;

    const attrValue = "";
    const attrValueSort = dsLen + 1;

    const uuid = randomId();
    const newAttrValueInfo: Partial<ProductAttrValueInfo> = {
      uuid,
      attrValue,
      attrValueSort,
    };

    const newAttrValueList = [...formData.productAttrValueList!!, newAttrValueInfo] as ProductAttrValueInfo[];
    formData.productAttrValueList = newAttrValueList;

    // 追加编辑项
    edit(uuid);
  }

  // 重排列表
  function toSortAttrValueList() {
    const newAttrValueList = Array.from(formData.productAttrValueList);
    newAttrValueList.sort((a, b) => a.attrValueSort!! - b.attrValueSort!!);
    formData.productAttrValueList = newAttrValueList;
  }

  function edit(uuid: string) {
    editableData[uuid] = cloneDeep(formData.productAttrValueList.filter((item: any) => uuid === item.uuid)[0]);
  }

  async function save(uuid: string) {
    Object.assign(formData.productAttrValueList.filter((item: any) => uuid === item.uuid)[0], editableData[uuid]);
    delete editableData[uuid];

    toSortAttrValueList();
  }

  function cancel(uuid: string) {
    delete editableData[uuid];
  }

  async function del(uuid: string) {
    const newAttrValueList = formData.productAttrValueList.filter((i) => i.uuid !== uuid);
    formData.productAttrValueList = newAttrValueList;

    toSortAttrValueList();
  }
</script>

<style lang="less" scoped></style>
