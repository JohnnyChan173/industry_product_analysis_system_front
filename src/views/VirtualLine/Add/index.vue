<template>
  <Form
    v-loading:absolute="loading"
    autocomplete="off"
    :model="formData"
    :rules="formRules"
    ref="formRef"
    :class="`${resetCSSPrefix}-form-normal`"
    :labelCol="formNormalParams.labelCol"
    label-width="120px"
  >
    <!-- 1、虚拟产线-基础信息 -->
    <SubTitle :size="AntUniversalSize.small" title="1、虚拟产线-基础信息" />
    <div :style="formNormalParams.divItemStyle">
      <Form.Item name="lineId" label="关联物理产线">
        <Select allowClear placeholder="请选择" v-model:value="formData.lineId" @change="handleLineIdSelect">
          <Select.Option v-for="{ id, lineName } in lineSelectList" :key="id" :value="id">
            {{ lineName }}
          </Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="craftId" label="关联工艺">
        <Select
          allowClear
          showSearch
          :filterOption="false"
          placeholder="请选择"
          v-model:value="formData.craftId"
          @change="handleCraftIdSelect"
          @search="onCraftIdSearch"
        >
          <Select.Option v-for="{ id, craftName } in craftSelectOptions" :key="id" :value="id">
            {{ craftName }}
          </Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="virtualLineName" label="虚拟产线名称">
        <Input v-model:value="formData.virtualLineName" placeholder="请输入" />
      </Form.Item>

      <Form.Item name="standardBeat" label="标准节拍">
        <InputNumber
          class="!w-90px"
          v-model:value="formData.standardBeat"
          :min="0"
          placeholder="请输入"
          addon-after="秒"
        />
      </Form.Item>
      <Form.Item name="targetLineBalance" label="目标线平衡">
        <InputNumber
          class="!w-90px"
          v-model:value="formData.targetLineBalance"
          :min="0"
          :max="100"
          placeholder="请输入"
          addon-after="%"
        />
      </Form.Item>
    </div>

    <!-- 2、虚拟产线-虚拟工位列表 -->

    <SubTitle :size="AntUniversalSize.small" title="2、虚拟产线-虚拟工位列表" />

    <Form.Item name="virtualStationList" label="">
      <ProcessRectVirtualStationList
        :productWeight="productWeight"
        :stationList="stationList"
        :craftProcedureList="craftProcedureList"
        v-model:list="formData.virtualStationList"
      ></ProcessRectVirtualStationList>
    </Form.Item>

    <div :style="formNormalParams.divBtnStyle">
      <Form.Item>
        <Button class="mr-12px" type="primary" :style="normalBtnStyle" @click="handleClick">{{ modeText }}</Button>
        <Button :style="normalBtnStyle" @click="handleResetClick">重置</Button>
      </Form.Item>
    </div>
  </Form>
</template>

<script setup lang="ts">
  import { FormInstance, Button, Form, Select, Input, DatePicker, InputNumber, Modal, message } from "ant-design-vue";
  import { onMounted, ref, reactive, unref, withDefaults, defineProps, defineEmits, computed } from "vue";
  import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import { useFormUtils } from "/@/hooks/antd/form";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { getFormRules } from "./useForm";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import { virtualLineDetail, virtualLineEdit, virtualLineAdd } from "/@/api/virtualLine";
  import { VirtualLineInfo } from "/@/api/model/virtualLine";
  import { setPropertyValue } from "/@/utils/typeTools";
  import InputSelectPanel from "/@/views/components/InputSelectPanel/index.vue";
  import ProcessRectVirtualStationList from "/@/views/components/ProcessRectVirtualStationList/index.vue";
  import { CommonComponentMode, CommonComponentSize } from "/@/enums/commonEnum";
  import { ProductInfo } from "/@/api/model/product";
  import { productDetail, productListAll } from "/@/api/product";
  import { LineInfo } from "/@/api/model/line";
  import { lineListAll } from "/@/api/line";
  import { craftDel, craftDetail, craftListAll } from "/@/api/craft";
  import { CraftInfo } from "/@/api/model/craft";
  import { VirtualStationDetail, VirtualStationInfo } from "/@/api/model/virtualStation";
  import { StationInfo } from "/@/api/model/station";
  import { CraftProcedureDetail } from "/@/api/model/craftProcedure";
  import { stationListAll } from "/@/api/station";
  import { craftProcedureListAll } from "/@/api/craftProcedure";
  import { virtualStationAdd, virtualStationEdit } from "/@/api/virtualStation";
  import { addVirtualLine } from "/@/utils/data-copy";

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

  type FormDataParam = VirtualLineInfo & {
    virtualStationList: VirtualStationDetail[];
    exceedAvgBeatMax: number;
    targetLineBalance: number;
  };

  const formData = reactive<Partial<FormDataParam>>({
    id: undefined,
    virtualLineName: undefined,
    lineId: undefined,
    craftId: undefined,
    standardBeat: undefined,
    targetLineBalance: undefined,
    exceedAvgBeatMax: undefined,
    virtualStationList: [
      // {
      //   "virtualLineId": 1,
      //   "virtualStationName": "测试虚拟工位-02",
      //   "virtualStationSort": 1,
      //   "virtualStationUuid": "8f9q36z",
      //   "beatFormat": "x/4",
      //   "needWristband": 1,
      //   "outputStation": 1,
      //   "stationId": 1,
      //   "craftProcedureIds": [1, 2],
      //   "craftProcedureList": [
      //     {
      //       "id": 1,
      //       "procedureName": "铜片传送",
      //       "procedureType": 1,
      //       "procedureProcess": 1,
      //       "procedureSort": 1,
      //     },
      //   ],
      // },
    ],
  });

  const formRules = getFormRules();
  const loading = ref(false);

  const lineSelectList = ref<LineInfo[]>([]);
  const craftSelectList = ref<CraftInfo[]>([]);
  const craftSelectOptions = ref<CraftInfo[]>([]);

  const selectLine = computed(() => {
    if (formData.lineId) {
      return lineSelectList.value.find((i) => i.id === formData.lineId);
    }
    return undefined;
  });

  const stationList = ref<StationInfo[]>([]);
  const craftProcedureList = ref<CraftProcedureDetail[]>([]);
  const productWeight = ref<number>();

  const isEditMode = !!props.id;
  const modeText = isEditMode ? "编辑" : "创建";

  onMounted(async () => {
    loading.value = true;

    await toGetNeedInfo();

    if (isEditMode) {
      const { id } = props;
      const info = await virtualLineDetail(id!!);
      formData.id = id;

      // 对虚拟工位列表按 virtualStationSort 排序
      if (info.virtualStationList && Array.isArray(info.virtualStationList)) {
        info.virtualStationList.sort((a, b) => (a.virtualStationSort ?? 0) - (b.virtualStationSort ?? 0));
      }

      Object.keys(formData).forEach((key: keyof VirtualLineInfo) => {
        setPropertyValue(formData, key, info[key]);
      });

      await toGetStationList();
      await toGetCraftProcedureList();
    }

    syncStandardBeat();

    loading.value = false;
  });

  /** 物理产线-选择 */
  async function handleLineIdSelect() {
    syncVirtualLineName();
    syncStandardBeat();
    await toGetStationList();
  }

  /** 工艺-选择 */
  async function handleCraftIdSelect() {
    syncVirtualLineName();
    await toGetCraftProcedureList();
  }

  /** 变化 - 工艺关键字搜索  */
  function onCraftIdSearch(input: string) {
    const filterList = craftSelectList.value.filter((item: CraftInfo) => item.craftName.includes(input));
    craftSelectOptions.value = filterList;
  }

  /** 同步标准节拍 */
  function syncStandardBeat() {
    const beatBase = selectLine.value?.beatBase;
    if (!formData.standardBeat) {
      formData.standardBeat = beatBase;
    }
  }

  /** 同步虚拟产线名称 */
  function syncVirtualLineName() {
    // 找到产线
    const { lineId, craftId } = formData;

    let virtualLineName = "";
    const lineInfo = lineSelectList.value.find((i) => i.id === lineId);
    const craftInfo = craftSelectList.value.find((i) => i.id === craftId);

    if (lineInfo) {
      virtualLineName += lineInfo.lineName;
    }

    if (craftInfo) {
      virtualLineName += "-" + craftInfo.craftName;
    }

    formData.virtualLineName = virtualLineName;
  }

  /** 获取物理产线下-物理工位 */
  async function toGetStationList() {
    const { lineId } = formData as any;
    const sList = await stationListAll(lineId);
    stationList.value = sList;
  }

  /** 获取工艺下-工序 */
  async function toGetCraftProcedureList() {
    const { craftId } = formData as any;

    // 2024-9-18 新增虚拟工位需要录入工位产品重量，需要获取原产品重量
    // 【称重方案理论必须废弃，屏蔽下属逻辑】
    // const craftInfo = await craftDetail(craftId);
    // const productInfo = await productDetail(craftInfo.craftProductIds[0]);

    // productWeight.value = productInfo.productWeight;

    const cList = await craftProcedureListAll(craftId);
    craftProcedureList.value = cList;
  }

  /** 获取必要信息 */
  async function toGetNeedInfo() {
    // 获取产线列表
    const lList = await lineListAll();
    lineSelectList.value = lList;

    // 获取工艺列表
    const cList = await craftListAll();
    craftSelectList.value = cList;
    craftSelectOptions.value = cList;
  }

  /** 点击 - 创建|编辑 */
  async function handleClick() {
    await validForm();

    // 校验产出工位是否存在
    const vsl = formData.virtualStationList!!;

    const findOutputStation = vsl.find((i) => i.outputStation);

    if (!findOutputStation) {
      message.warn("请设置一个产出工位");
      return;
    }

    // 编辑模式
    if (isEditMode) {
      const { virtualStationList, ...editCraftInfo } = formData;
      // 先编辑虚拟产线
      const virtualLineId = await virtualLineEdit(editCraftInfo);

      // 工位注入 virtualLineId 与 virtualStationSort
      virtualStationList?.forEach((i, index) => {
        i.virtualLineId = virtualLineId;
        i.virtualStationSort = index;
      });

      const sList = virtualStationList as VirtualStationInfo[];

      // 编辑虚拟工位
      await virtualStationEdit(sList);
    } else {
      const { virtualStationList, ...newVirtualLineInfo } = formData;

      await addVirtualLine(newVirtualLineInfo, virtualStationList!!);
    }

    emits("change");
  }

  /** 点击 - 重置 */
  function handleResetClick() {
    resetForm();
  }
</script>

<style></style>
