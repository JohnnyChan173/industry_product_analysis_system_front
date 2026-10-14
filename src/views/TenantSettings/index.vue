<template>
  <div>
    <FormTitle :size="AntUniversalSize.small" title="1、安灯事件播报" />
    <div class="flex items-center">
      <Select class="!w-180px" placeholder="请选择" v-model:value="selectLineId">
        <Select.Option v-for="{ id, lineName } in lineSelectList" :key="id" :value="id">
          {{ lineName }}
        </Select.Option>
      </Select>
      <Button type="primary" @click="handleCopyLink()">复制链接</Button>
    </div>
    <p class="text-warn">注：目前《数据分析-状态分析》已集成安灯播报</p>
    <FormTitle :size="AntUniversalSize.small" title="2、检测字典导入" />
    <Form
      autocomplete="off"
      :model="formData"
      ref="formRef"
      :class="`${resetCSSPrefix}-form-normal`"
      :labelCol="formNormalParams.labelCol"
      :rules="formRules"
      label-width="120px"
      label-align="left"
    >
      <div :style="formNormalParams.divItemStyle">
        <Form.Item
          name="file"
          label="检测字典文件"
          :validate-status="fileValidateMessage ? 'error' : undefined"
          :help="fileValidateMessage"
        >
          <Upload
            class="!w-180px"
            :show-upload-list="false"
            :custom-request="customRequest"
            :accept="'.xlsx'"
            :max-size="1024 * 1024 * 10"
            :max-count="1"
          >
            <Button type="link">{{ formData.file?.name || "点击上传" }}</Button>
          </Upload>
        </Form.Item>
        <Form.Item name="workshopId" label="车间">
          <Select class="!w-180px" placeholder="请选择" v-model:value="formData.workshopId">
            <Select.Option v-for="{ id, workshopName } in workshopSelectList" :key="id" :value="id">
            {{ workshopName }}
          </Select.Option>
          </Select>
            <Button type="link" @click="downloadTemplate">下载模板</Button>

        </Form.Item>

      </div>
      <Button class="!w-180px" type="primary" @click="handleSubmit()">提交</Button>
      <!-- <Button class="!w-180px" type="primary" @click="test">测试</Button> -->
      
    </Form>
  </div>
</template>

<script setup lang="ts">
  import { Button, Select, message, Form, FormInstance, Upload } from "ant-design-vue";
  import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import { XLSX_TEMPLATE_PATH } from "/@/config";

  import FormTitle from "/@/components/Title/FormTitle.vue";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import { LineInfo } from "/@/api/model/line";
  import { onMounted, reactive, ref } from "vue";
  import { lineListAll } from "/@/api/line";
  import { CommonOperatorTip } from "/@/enums/commonEnum";
  import { clipboardCopy } from "/@/utils/dom";
  import { parseCheckExcel } from "/@/api/file";
import { WorkshopInfo } from "/@/api/model/workshop";
import { workshopListAll } from "/@/api/workshop";
  import { createDownload, debounce, delay } from "/@/utils/util";
  import { createLoading } from "/@/components/Loading/createLoading";
import { signalSpecifyDateData } from "/@/api/signal";


  const resetCSSPrefix = getResetCSSPrefix();
  const workshopSelectList = ref<WorkshopInfo[]>([]);
  const lineSelectList = ref<LineInfo[]>([]);
  const selectLineId = ref(undefined);
  const formRef = ref<FormInstance>();
  const formData = reactive<
    Partial<{
      file: File;
      workshopId: number;
    }>
  >({
    file: undefined,
    workshopId: undefined,
  });
  onMounted(() => {
    toGetNeedInfo();
  });

  const fileValidateMessage = ref("");

  const formRules = reactive({
    workshopId: [{ required: true, message: "请选择车间" }],
    file: [{ required: true, message: "请上传文件" }],
  });

  /** 复制链接 */
  async function handleCopyLink() {
    const lid = selectLineId.value;

    // 简单校验
    if (!lid) {
      message.warn("请选择产线");
      return;
    }

    const { origin } = window.location;
    const wholeUrl = `${origin}/addonBoard/index?lineId=${lid}`;
    clipboardCopy(wholeUrl);
    message.success(`链接已复制到剪切板: ${wholeUrl}`);
  }
  const customRequest = async (options: any) => {
    const { file } = options;
    formData.file = file;
    fileValidateMessage.value = "";
  };
  /** 获取必要数据 */
  async function toGetNeedInfo() {
    const lList = await lineListAll();
    lineSelectList.value = lList;
    const records = await workshopListAll();
    workshopSelectList.value = records;
  }
  /** 提交表单 */
  async function handleSubmit() {
    console.log(formData);
    fileValidateMessage.value = formData.file ? "" : "请上传文件";

    try {
      await formRef.value?.validate();
    } catch (error) {
      return;
    }

    const data = new FormData();
    data.append("file", formData.file as File);
    data.append("workshopId", formData.workshopId?.toString() || "");
    const { close } = createLoading();

    try {
      const res = await parseCheckExcel(data);
      message.success("导入成功");
    } catch (error) {
      message.error("导入失败");
    } finally {
      close();
    }
  }
  function downloadTemplate() {
    createDownload(XLSX_TEMPLATE_PATH.DICT, "检测字典模板.xlsx");
  }
  /** 测试 */
  // async function test() {
  //   signalSpecifyDateData();
  // }
</script>

<style></style>
