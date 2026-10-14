<template>
  <Form
    v-loading:absolute="loading"
    autocomplete="off"
    :model="esopDetailData"
    ref="formRef"
    :class="`${resetCSSPrefix}-form-normal`"
    :labelCol="formNormalParams.labelCol"
    label-width="120px"
  >
    <SubTitle :size="AntUniversalSize.small" title="1、ESOP方案-基础信息" />

    <div :style="formNormalParams.divItemStyle">
      <Form.Item name="virtualLineName" label="虚拟产线">
        {{ esopDetailData.virtualLineName }}
      </Form.Item>

      <Form.Item label="当前ESOP方案">
        {{ esopDetailData.sopSchemeName }}
      </Form.Item>
      <Form.Item label="虚拟工位">
        {{ esopDetailData.virtualStationName }}
      </Form.Item>
    </div>
    <SubTitle :size="AntUniversalSize.small" title="2、ESOP方案-ESOP文件" />
    <div v-if="pdfFiles.length" class="pdf-files">
      <div v-for="file in pdfFiles" :key="file.uid" class="pdf-file">
        <a-tag color="red">PDF</a-tag>
        <a :href="file.url" target="_blank" rel="noopener noreferrer" :title="file.name">
          {{ file.name }}
        </a>
      </div>
    </div>
    <a-row v-if="showImages.length" :gutter="16">
      <a-col class="gutter-row" :span="3" v-for="item in showImages" :key="item.uid">
        <a-image-preview-group>
          <a-image :src="item.url" alt="" width="100px" />
        </a-image-preview-group>
      </a-col>
    </a-row>
  </Form>
</template>

<script setup lang="ts">
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import { getResetCSSPrefix, formNormalParams } from "/@/config/domStyle";

  import { Form, message } from "ant-design-vue";
  import { ref, onBeforeUnmount, onMounted } from "vue";
  import { getOSSUniversalPath } from "/@/config/path";
  import JSZip from "jszip";
  import { ESOPInfo } from "/@/api/model/esop";

  const resetCSSPrefix = getResetCSSPrefix();

  const esopDetailData = ref<ESOPInfo>({});

  const props = defineProps({
    esopDetailData: {
      type: Object,
      default: () => {},
    },
  });
  const loading = ref(false);

  const showImages = ref<any[]>([]);
  const pdfFiles = ref<Array<{ uid: string; name: string; url: string; sourceFile?: File }>>([]);
  const previewObjectUrls: string[] = [];

  onMounted(() => {
    toGetDetail();
  });

  onBeforeUnmount(() => {
    clearPreviewImages();
  });

  /** 获取ESOP详情 */
  async function toGetDetail() {
    loading.value = true;
    try {
      // const data = await esopDetail(props.id);
      esopDetailData.value = props.esopDetailData;
      await loadStationImages(props.esopDetailData.sopFileUrl);
    } catch (error) {
      showImages.value = [];
    } finally {
      loading.value = false;
    }
  }

  function getImageMimeType(filename: string) {
    const extension = filename.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      bmp: "image/bmp",
      svg: "image/svg+xml",
      avif: "image/avif",
    };
    return mimeTypes[extension ?? ""] ?? "application/octet-stream";
  }

  function clearPreviewImages() {
    previewObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    previewObjectUrls.length = 0;
    showImages.value = [];
    pdfFiles.value = [];
  }

  function getFileName(fileUrl: string) {
    const fileName = fileUrl.split(/[?#]/)[0].split("/").pop() || "ESOP文件.pdf";

    try {
      return decodeURIComponent(fileName);
    } catch (error) {
      return fileName;
    }
  }

  function isPdfFile(fileUrl: string) {
    return fileUrl.split(/[?#]/)[0].toLowerCase().endsWith(".pdf");
  }

  async function loadStationImages(fileName: string) {
    clearPreviewImages();

    if (!fileName) {
      return;
    }

    if (isPdfFile(fileName)) {
      pdfFiles.value = [
        {
          uid: `pdf-direct-${props.esopDetailData.id}`,
          name: getFileName(fileName),
          url: getOSSUniversalPath(fileName),
        },
      ];
      return;
    }

    try {
      const ossUrl = getOSSUniversalPath(fileName);
      const separator = ossUrl.includes("?") ? "&" : "?";

      // 增加时间戳并禁止浏览器缓存，确保读取最新 ZIP
      const response = await fetch(`${ossUrl}${separator}_t=${Date.now()}`, {
        cache: "no-store",
      });

      if (response.status === 404) {
        return;
      }

      if (!response.ok) {
        throw new Error(`下载 ZIP 失败：${response.status}`);
      }

      const zip = await JSZip.loadAsync(await response.arrayBuffer());
      const entries = Object.values(zip.files)
        .filter((entry) => !entry.dir)
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, {
            numeric: true,
          })
        );
      const imageEntries = entries.filter((entry) => /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(entry.name));
      const pdfEntries = entries.filter((entry) => /\.pdf$/i.test(entry.name));

      const images: any[] = [];

      for (const [index, entry] of imageEntries.entries()) {
        const archivedName = entry.name.split("/").pop() || `image-${index + 1}`;

        const name = archivedName.replace(/^\d{3}_/, "");
        const blob = await entry.async("blob");

        const sourceFile = new File([blob], name, {
          type: getImageMimeType(name),
        });
        const url = URL.createObjectURL(sourceFile);

        previewObjectUrls.push(url);

        images.push({
          uid: `zip-${props.esopDetailData.id}-${index}-${Date.now()}-${name}`,
          name,
          status: "done",
          url,
          sourceFile,
        });
      }

      showImages.value = images;

      const files = [];

      for (const [index, entry] of pdfEntries.entries()) {
        const archivedName = entry.name.split("/").pop() || `ESOP文件-${index + 1}.pdf`;
        const name = archivedName.replace(/^\d{3}_/, "");
        const blob = await entry.async("blob");
        const sourceFile = new File([blob], name, { type: "application/pdf" });
        const url = URL.createObjectURL(sourceFile);

        previewObjectUrls.push(url);
        files.push({
          uid: `zip-pdf-${props.esopDetailData.id}-${index}-${Date.now()}-${name}`,
          name,
          url,
          sourceFile,
        });
      }

      pdfFiles.value = files;
    } catch (error) {
      console.error(error);
      clearPreviewImages();
      message.error("ESOP文件解压失败");
    }
  }
</script>

<style scoped>
  .pdf-files {
    padding: 8px 0;
  }

  .pdf-file {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
</style>
