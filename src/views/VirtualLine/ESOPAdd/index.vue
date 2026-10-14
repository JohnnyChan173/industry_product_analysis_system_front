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
    <!-- 1、ESOP方案-基础信息 -->
    <SubTitle :size="AntUniversalSize.small" title="1、ESOP方案-基础信息" />

    <div :style="formNormalParams.divItemStyle">
      <Form.Item label="虚拟产线">
        {{ formData.virtualLineName }}
        <!-- <Input v-model:value="formData.virtualLineName" placeholder="请输入" disabled /> -->
      </Form.Item>

      <!-- <Form.Item name="sopSchemeName" label="ESOP方案">
        <Input v-model:value="formData.sopSchemeName" placeholder="请输入" />
      </Form.Item> -->
    </div>

    <!-- 2、虚拟产线-虚拟工位列表 -->
    <SubTitle :size="AntUniversalSize.small" title="2、ESOP方案-虚拟工位列表" />

    <!-- <Form.Item name="virtualStationList" label="">
      {{ formData.virtualStationList }}
    </Form.Item> -->
    <div v-if="uploadProgress.total" class="mb-12px text-primary">
      共 {{ uploadProgress.total }} 个工位，正在上传第 {{ uploadProgress.current }} 个：
      {{ uploadProgress.stationName }}
    </div>
    <a-tabs v-model:activeKey="activeKey" :tab-position="'left'" :style="{ height: '640px' }" @change="handleChange">
      <a-tab-pane v-for="i in formData.virtualStationList" :key="i.id" :tab="i.virtualStationName">
        <div class="clearfix">
          <a-upload
            v-model:file-list="fileList"
            list-type="picture-card"
            accept="image/*,.pdf,application/pdf,video/*,.mp4,.avi,.mov"
            multiple
            :disabled="uploadingStationId !== undefined || loading"
            :before-upload="beforeUpload"
            @change="handleFileListChange(Number(i.id), $event.fileList)"
            @preview="handlePreview"
          >
            <div>
              <plus-outlined />
              <div style="margin-top: 8px">添加ESOP文件</div>
              <!-- <div style="margin-top: 4px; color: #999; font-size: 12px">
                图片可多选，PDF最多1个
              </div> -->
            </div>
          </a-upload>
          <a-modal v-model:visible="previewVisible" :title="previewTitle" :footer="null" @cancel="handleCancel">
            <video
              v-if="previewVideo && previewVisible"
              :src="previewVideo"
              controls
              autoplay
              style="width: 100%; max-height: 70vh"
            />
            <img v-else alt="example" style="width: 100%" :src="previewImage" />
          </a-modal>
          <div>
            <Button
              type="primary"
              :loading="uploadingStationId === Number(i.id)"
              :disabled="uploadingStationId !== undefined && uploadingStationId !== Number(i.id)"
              @click="handleUploadClick(Number(i.id))"
            >
              {{ isStationUploaded(Number(i.id)) ? "已上传" : "上传至服务器" }}
            </Button>
          </div>
        </div>
      </a-tab-pane>
    </a-tabs>

    <div :style="formNormalParams.divBtnStyle">
      <Form.Item>
        <Button
          class="mr-12px"
          type="primary"
          :style="normalBtnStyle"
          :loading="loading"
          :disabled="uploadingStationId !== undefined"
          @click="handleClick"
        >
          保存
        </Button>
        <Button :style="normalBtnStyle" @click="handleResetClick">取消</Button>
      </Form.Item>
    </div>
  </Form>
</template>

<script setup lang="ts">
  import { FormInstance, Button, Form, message, Upload, UploadProps } from "ant-design-vue";
  import { onBeforeUnmount, onMounted, ref, reactive, computed } from "vue";
  import { getResetCSSPrefix, normalBtnStyle, formNormalParams } from "/@/config/domStyle";
  import { useFormUtils } from "/@/hooks/antd/form";
  import SubTitle from "/@/components/Title/SubTitle.vue";
  import { getFormRules } from "./useForm";
  import { AntUniversalSize } from "/@/enums/antEnum";
  import { virtualLineDetail } from "/@/api/virtualLine";
  import { VirtualLineInfo } from "/@/api/model/virtualLine";
  import { setPropertyValue } from "/@/utils/typeTools";
  import { LineInfo } from "/@/api/model/line";
  import { lineListAll } from "/@/api/line";
  import { VirtualStationDetail } from "/@/api/model/virtualStation";
  import { PlusOutlined } from "@ant-design/icons-vue";
  import { fileUpload } from "/@/api/file";
  import JSZip from "jszip";
  import { esopAdd, esopEdit, esopList } from "/@/api/esop";
  import { ESOPInfo } from "/@/api/model/esop";
  import { getOSSUniversalPath } from "/@/config/path";

  const resetCSSPrefix = getResetCSSPrefix();

  interface Props {
    id?: number;
    lineId?: number;
    virtualStationId?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    id: undefined,
    lineId: undefined,
    virtualStationId: undefined,
  });

  const emits = defineEmits(["change"]);

  const formRef = ref<FormInstance>();
  const { validForm, resetForm } = useFormUtils(formRef);

  type FormDataParam = VirtualLineInfo & {
    virtualStationList: VirtualStationDetail[];
    exceedAvgBeatMax: number;
    targetLineBalance: number;
    sopSchemeName: string;
  };

  const formData = reactive<Partial<FormDataParam>>({
    id: undefined,
    virtualLineName: undefined,
    lineId: undefined,
    craftId: undefined,
    standardBeat: undefined,
    targetLineBalance: undefined,
    exceedAvgBeatMax: undefined,
    virtualStationList: [],
    sopSchemeName: undefined,
  });

  const formRules = getFormRules();
  const loading = ref(false);
  const lineSelectList = ref<LineInfo[]>([]);

  const activeKey = ref<number>();
  type UploadFileItem = NonNullable<UploadProps["fileList"]>[number] & { sourceFile?: File };
  type UploadFileList = UploadFileItem[];

  const stationFileLists = reactive<Record<number, UploadFileList>>({});
  const stationEsopRecords = reactive<Record<number, Partial<ESOPInfo>>>({});
  const stationObjectUrls = new Map<number, string[]>();
  const changedStationIds = new Set<number>();
  const stationFileVersions = reactive<Record<number, number>>({});
  const stationUploadResults = reactive<Record<number, { version: number; sopFileUrl: string } | undefined>>({});
  const uploadingStationId = ref<number>();
  const uploadProgress = reactive({
    total: 0,
    current: 0,
    stationName: "",
  });

  const fileList = computed<UploadFileList>({
    get() {
      if (activeKey.value === undefined) return [];
      return stationFileLists[activeKey.value] ?? (stationFileLists[activeKey.value] = []);
    },
    set(value) {
      if (activeKey.value !== undefined) stationFileLists[activeKey.value] = value;
    },
  });
  const previewVisible = ref(false);
  const previewImage = ref("");
  const previewVideo = ref("");
  const previewTitle = ref("");
  const handleCancel = () => {
    previewVisible.value = false;
    previewVideo.value = "";
    previewTitle.value = "";
  };
  /** 判断 UploadFile / File 是否为 PDF */
  function isPdfUploadFile(file: any) {
    const type = String(file?.type || "").toLowerCase();
    const name = String(file?.name || file?.url || "").toLowerCase();
    return type === "application/pdf" || name.endsWith(".pdf");
  }

  /** 判断 UploadFile / File 是否为视频 */
  function isVideoUploadFile(file: any) {
    const type = String(file?.type || "").toLowerCase();
    const name = String(file?.name || file?.url || "").toLowerCase();
    return type.startsWith("video/") || /\.(mp4|m4v|webm|ogv|ogg|avi|mov|mkv)$/i.test(name);
  }

  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    const isImage = file.type.startsWith("image/");
    const isPdf = isPdfUploadFile(file);
    const isVideo = isVideoUploadFile(file);

    if (!isImage && !isPdf && !isVideo) {
      message.warning(`${file.name} 不是支持的文件类型，仅支持图片或 PDF 或视频`);
      return Upload.LIST_IGNORE;
    }

    // 图片数量不限制；PDF 最多只能有 1 个。
    if (isPdf) {
      const hasPdf = fileList.value.some((item: any) => isPdfUploadFile(item));
      if (hasPdf) {
        message.warning("每个工位最多只能上传 1 个 PDF 文件");
        return Upload.LIST_IGNORE;
      }
    }

    // 每个工位最多保留 1 个视频。
    if (isVideo) {
      if (file.size > 1024 * 1024 * 50) {
        message.warning(`视频大小不能超过 50MB`);
        return Upload.LIST_IGNORE;
      }
      const hasVideo = fileList.value.some((item: any) => isVideoUploadFile(item));
      if (hasVideo) {
        message.warning("每个工位最多只能上传 1 个视频文件");
        return Upload.LIST_IGNORE;
      }
    }

    // 使用现有手动上传逻辑，不让 Upload 组件自动请求。
    return false;
  };

  function handleFileListChange(stationId: number, list: UploadFileList) {
    const pdfList = list.filter((item: any) => isPdfUploadFile(item));
    const videoList = list.filter((item: any) => isVideoUploadFile(item));
    // 兜底：即使通过拖拽等方式一次塞进多个 PDF，也只保留第一个 PDF，
    // 其余图片全部保留。
    if (pdfList.length > 1) {
      const firstPdfUid = pdfList[0]?.uid;
      list = list.filter((item: any) => !isPdfUploadFile(item) || item.uid === firstPdfUid);
      message.warning("每个工位最多只能上传 1 个 PDF 文件");
    }

    // 每个工位最多保留 1 个视频。
    if (videoList.length > 1) {
      const firstVideoUid = videoList[0]?.uid;
      list = list.filter((item: any) => !isVideoUploadFile(item) || item.uid === firstVideoUid);
      message.warning("每个工位最多只能上传 1 个视频文件");
    }

    stationFileLists[stationId] = [...list];
    stationFileVersions[stationId] = (stationFileVersions[stationId] ?? 0) + 1;
    delete stationUploadResults[stationId];
    changedStationIds.add(stationId);
  }

  function getSourceFile(item: UploadFileItem): File | undefined {
    if (item.originFileObj instanceof File) return item.originFileObj;
    if (item.sourceFile instanceof File) return item.sourceFile;

    const rawItem = item as unknown;
    return rawItem instanceof File ? rawItem : undefined;
  }

  function hasStationFiles(stationId: number) {
    return (stationFileLists[stationId] ?? []).some((item) => !!getSourceFile(item));
  }

  function getUploadedPath(stationId: number) {
    const result = stationUploadResults[stationId];
    return result?.version === (stationFileVersions[stationId] ?? 0) ? result.sopFileUrl : undefined;
  }

  function isStationUploaded(stationId: number) {
    return !!getUploadedPath(stationId);
  }

  function resetUploadProgress() {
    uploadingStationId.value = undefined;
    uploadProgress.total = 0;
    uploadProgress.current = 0;
    uploadProgress.stationName = "";
  }

  async function uploadStationWithProgress(station: VirtualStationDetail, current: number, total: number) {
    const stationId = station.id!!;
    uploadProgress.total = total;
    uploadProgress.current = current;
    uploadProgress.stationName = station.virtualStationName ?? "";
    uploadingStationId.value = stationId;

    message.loading({
      key: "esop-upload-progress",
      content: `共 ${total} 个工位，正在上传第 ${current} 个：${station.virtualStationName}`,
      duration: 0,
    });

    const uploadVersion = stationFileVersions[stationId] ?? 0;
    const sopFileUrl = await uploadStationImages(stationId);
    if (!sopFileUrl) throw new Error(`${station.virtualStationName}上传后未返回文件路径`);

    if (uploadVersion !== (stationFileVersions[stationId] ?? 0)) {
      throw new Error("上传期间文件已修改，请重新上传");
    }
    stationUploadResults[stationId] = {
      version: uploadVersion,
      sopFileUrl,
    };
    return sopFileUrl;
  }

  const handleUploadClick = async (stationId: number) => {
    if (uploadingStationId.value !== undefined || loading.value) return;

    const station = formData.virtualStationList?.find((item) => item.id === stationId);
    if (!station) return;
    if (!hasStationFiles(stationId)) {
      message.warning(`${station.virtualStationName}没有需要上传的文件`);
      return;
    }
    if (isStationUploaded(stationId)) {
      message.info(`${station.virtualStationName}当前文件已上传`);
      return;
    }

    try {
      await uploadStationWithProgress(station, 1, 1);
      message.success({
        key: "esop-upload-progress",
        content: `${station.virtualStationName}文件上传成功，请点击保存使工位生效`,
      });
    } catch (error) {
      console.error(error);
      message.error({
        key: "esop-upload-progress",
        content: error instanceof Error ? error.message : `${station.virtualStationName}上传失败，请稍后重试`,
      });
    } finally {
      resetUploadProgress();
    }
  };

  async function uploadStationImages(stationId: number) {
    const station = formData.virtualStationList?.find((item) => item.id === stationId);
    if (!station) return;

    const esopFiles = (stationFileLists[stationId] ?? [])
      .map(getSourceFile)
      .filter(
        (file): file is NonNullable<typeof file> =>
          !!file && (file.type.startsWith("image/") || isPdfUploadFile(file) || isVideoUploadFile(file))
      );

    if (!esopFiles.length) return;

    try {
      const zip = new JSZip();
      esopFiles.forEach((file, index) => {
        const safeName = file.name.replace(/[\\/:*?"<>|]/g, "_");
        const sequence = String(index + 1).padStart(3, "0");
        // 视频通常已经压缩，直接存储，避免再次压缩大视频耗时。
        zip.file(`${sequence}_${safeName}`, file, {
          compression: isVideoUploadFile(file) ? "STORE" : "DEFLATE",
        });
      });

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });
      const uploadData = new FormData();
      uploadData.append("file", zipBlob, `ESOP_${formData.virtualLineName}_${station.virtualStationName}.zip`);
      console.log(uploadData.get("file"));
      const zipPath = await fileUpload(uploadData);
      if (typeof zipPath !== "string" || !zipPath.trim()) {
        throw new Error("文件上传接口未返回有效路径，请检查 fileUpload 返回值");
      }
      return zipPath;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  function getStationZipName(station: VirtualStationDetail) {
    return `ESOP_${formData.virtualLineName}_${station.virtualStationName}.zip`;
  }

  async function loadStationEsop(stationId: number) {
    const station = formData.virtualStationList?.find((item) => item.id === stationId);

    if (!station) return;

    const record = stationEsopRecords[stationId];
    const hasLocalChanges = changedStationIds.has(stationId);

    // 新增工位尚未保存到分页记录，保留本地图片，不请求服务器。
    if (record?.id === undefined) {
      if (!hasLocalChanges) {
        stationFileLists[stationId] = [];
      }
      return;
    }

    // 已修改的文件（包括已上传但未保存）保留在本地，避免切换工位覆盖。
    if (hasLocalChanges) {
      return;
    }

    // 优先使用记录中的实际路径，旧记录无路径时才按原文件名读取。
    const zipPath = record?.sopFileUrl || getStationZipName(station);
    await loadStationImages(stationId, zipPath);
  }

  async function loadStationImages(stationId: number, zipName: string) {
    const fileVersion = stationFileVersions[stationId] ?? 0;
    const urls: string[] = [];
    try {
      const ossUrl = /^https?:\/\//i.test(zipName) ? new URL(zipName).href : getOSSUniversalPath(zipName);
      const separator = ossUrl.includes("?") ? "&" : "?";

      // 增加时间戳并禁止浏览器缓存，确保读取最新 ZIP
      const response = await fetch(`${ossUrl}${separator}_t=${Date.now()}`, {
        cache: "no-store",
      });

      if (response.status === 404) {
        throw new Error("ESOP ZIP 不存在（404），请检查已保存的文件路径");
      }

      if (!response.ok) {
        throw new Error(`下载 ZIP 失败：${response.status}`);
      }

      const zip = await JSZip.loadAsync(await response.arrayBuffer());

      const entries = Object.values(zip.files)
        .filter(
          (entry) =>
            !entry.dir && /\.(png|jpe?g|gif|webp|bmp|svg|avif|pdf|mp4|m4v|webm|ogv|ogg|avi|mov|mkv)$/i.test(entry.name)
        )
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, {
            numeric: true,
          })
        );

      const images: UploadFileList = [];

      for (const [index, entry] of entries.entries()) {
        const archivedName = entry.name.split("/").pop() || `image-${index + 1}`;

        const name = archivedName.replace(/^\d{3}_/, "");
        const blob = await entry.async("blob");

        const sourceFile = new File([blob], name, {
          type: getFileMimeType(name),
        });

        const url = URL.createObjectURL(sourceFile);

        urls.push(url);

        images.push({
          uid: `zip-${stationId}-${index}-${Date.now()}-${name}`,
          name,
          status: "done",
          url,
          type: sourceFile.type,
          sourceFile,
        });
      }

      if (changedStationIds.has(stationId) || fileVersion !== (stationFileVersions[stationId] ?? 0)) {
        urls.forEach((url) => URL.revokeObjectURL(url));
        return;
      }
      releaseStationObjectUrls(stationId);
      stationObjectUrls.set(stationId, urls);
      stationFileLists[stationId] = images;
    } catch (error) {
      console.error(error);
      urls.forEach((url) => URL.revokeObjectURL(url));
      message.error(error instanceof Error ? error.message : "ESOP文件读取失败");
    }
  }

  function getFileMimeType(filename: string) {
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
      pdf: "application/pdf",
      mp4: "video/mp4",
      m4v: "video/mp4",
      webm: "video/webm",
      ogv: "video/ogg",
      ogg: "video/ogg",
      mov: "video/quicktime",
      avi: "video/x-msvideo",
      mkv: "video/x-matroska",
    };
    return mimeTypes[extension ?? ""] ?? "application/octet-stream";
  }

  function releaseStationObjectUrls(stationId: number) {
    stationObjectUrls.get(stationId)?.forEach((url) => URL.revokeObjectURL(url));
    stationObjectUrls.delete(stationId);
  }

  function getBase64(file: File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }
  const handlePreview = async (file: UploadProps["fileList"][number]) => {
    const sourceFile = getSourceFile(file as UploadFileItem);
    const isPdf =
      file.type === "application/pdf" || sourceFile?.type === "application/pdf" || /\.pdf$/i.test(file.name ?? "");

    if (isVideoUploadFile(sourceFile ?? file)) {
      const videoUrl = file.url || (sourceFile ? URL.createObjectURL(sourceFile) : "");
      if (!videoUrl) {
        message.warning("视频文件不可用，请重新选择");
        return;
      }
      if (!file.url) {
        file.url = videoUrl;
        if (activeKey.value !== undefined) {
          const urls = stationObjectUrls.get(activeKey.value) ?? [];
          urls.push(videoUrl);
          stationObjectUrls.set(activeKey.value, urls);
        }
      }
      previewVideo.value = videoUrl;
      previewTitle.value = file.name ?? "视频预览";
      previewVisible.value = true;
      return;
    }
    previewVideo.value = "";
    if (isPdf) {
      const pdfUrl = file.url || (sourceFile ? URL.createObjectURL(sourceFile) : "");
      if (pdfUrl) {
        if (!file.url) {
          file.url = pdfUrl;
          if (activeKey.value !== undefined) {
            const urls = stationObjectUrls.get(activeKey.value) ?? [];
            urls.push(pdfUrl);
            stationObjectUrls.set(activeKey.value, urls);
          }
        }
        window.open(pdfUrl, "_blank", "noopener,noreferrer");
      }
      return;
    }

    if (!file.url && !file.preview) {
      if (sourceFile) file.preview = (await getBase64(sourceFile)) as string;
    }
    previewImage.value = file.url || file.preview || "";
    previewVisible.value = true;
    previewTitle.value = file.name || (file.url ? file.url.substring(file.url.lastIndexOf("/") + 1) : "");
  };
  // const callback: TabsProps["onTabScroll"] = (val) => {
  //   console.log(val);
  // };

  async function handleChange(key: number) {
    activeKey.value = Number(key);
    await loadStationEsop(Number(key));
  }

  onMounted(async () => {
    loading.value = true;
    try {
      await toGetNeedInfo();
      const { lineId, virtualStationId } = props;
      const info = await virtualLineDetail(lineId!!);
      formData.lineId = lineId!!;
      const allStations = [...(info.virtualStationList ?? [])].sort(
        (a, b) => (a.virtualStationSort ?? 0) - (b.virtualStationSort ?? 0)
      );

      Object.keys(formData).forEach((key: keyof VirtualLineInfo) => {
        setPropertyValue(formData, key, info[key]);
      });

      // 始终展示虚拟产线下的全部工位，分页结果只用于区分新增和修改。
      formData.virtualStationList = allStations;
      // activeKey.value = virtualStationId;
      const { records = [] } = await esopList({
        pageNum: 1,
        pageSize: 1000,
        virtualLineId: formData.id ?? lineId,
      } as any);
      records.forEach((record) => {
        const station = allStations.find(
          (item) => item.id === record.virtualStationId || item.virtualStationUuid === record.stationUuid
        );
        if (station?.id !== undefined) stationEsopRecords[station.id] = record;
      });

      activeKey.value = virtualStationId ? virtualStationId : allStations[0]?.id;
      if (activeKey.value !== undefined) await loadStationEsop(activeKey.value);
      syncStandardBeat();
    } catch (error) {
      console.error(error);
      message.error("ESOP数据加载失败");
    } finally {
      loading.value = false;
    }
  });

  function syncStandardBeat() {
    const beatBase = lineSelectList.value.find((i) => i.id === formData.lineId)?.beatBase;
    if (!formData.standardBeat) {
      formData.standardBeat = beatBase;
    }
  }

  async function toGetNeedInfo() {
    const lList = await lineListAll();
    lineSelectList.value = lList;
  }

  async function handleClick() {
    if (loading.value) return;
    if (uploadingStationId.value !== undefined) {
      message.warning("当前工位文件正在上传，请等待上传完成后再保存");
      return;
    }

    try {
      loading.value = true;
      await validForm();

      // 只处理本次改动并且仍然包含文件的工位；没有文件时不上传，也不调用新增/修改接口。
      const stationsWithImages = (formData.virtualStationList ?? []).filter((station) => {
        if (station.id === undefined || !changedStationIds.has(station.id)) return false;
        return hasStationFiles(station.id);
      });
      if (!stationsWithImages.length) {
        message.warning("没有需要保存的文件");
        return;
      }

      // 保存兜底：只顺序上传尚未上传，或上传后又修改过文件的工位。
      const pendingStations = stationsWithImages.filter((station) => !getUploadedPath(station.id!!));
      for (const [index, station] of pendingStations.entries()) {
        await uploadStationWithProgress(station, index + 1, pendingStations.length);
      }
      if (pendingStations.length) {
        message.success({
          key: "esop-upload-progress",
          content: `共 ${pendingStations.length} 个工位，文件上传完成`,
        });
        resetUploadProgress();
      }

      const addData: Partial<ESOPInfo>[] = [];
      const editData: Partial<ESOPInfo>[] = [];
      for (const station of stationsWithImages) {
        const stationId = station.id!!;
        const record = stationEsopRecords[stationId];
        const sopFileUrl = getUploadedPath(stationId);
        if (!sopFileUrl) continue;
        const commonData: Partial<ESOPInfo> = {
          virtualStationId: stationId,
          virtualStationName: station.virtualStationName,
          virtualLineName: formData.virtualLineName,
          virtualLineId: formData.id ?? props.lineId,
          sopSchemeName: record?.sopSchemeName || `ESOP_${formData.virtualLineName}_${station.virtualStationName}`,
          sopFileUrl,
        };

        if (record?.id !== undefined) {
          // 修改只带分页记录 id 和业务字段，不再携带 stationUuid。
          const recordWithoutStationUuid = { ...record };
          delete recordWithoutStationUuid.stationUuid;
          // fileModified: 1,
          editData.push({ ...recordWithoutStationUuid, ...commonData, fileModified: 1 });
        } else {
          addData.push({ ...commonData, stationUuid: station.stationInfo.moduleUuid });
        }
      }

      if (!addData.length && !editData.length) return;
      if (editData.length) await esopEdit(editData as any);
      if (addData.length) await esopAdd(addData as ESOPInfo[]);
      changedStationIds.clear();
      message.success("保存成功");
      emits("change");
    } catch (error) {
      console.error(error);
      message.error({
        key: "esop-upload-progress",
        content: "工位文件上传或保存失败，请稍后重试",
      });
    } finally {
      resetUploadProgress();
      loading.value = false;
    }
  }

  function handleResetClick() {
    emits("change");
  }

  onBeforeUnmount(() => {
    stationObjectUrls.forEach((_, stationId) => releaseStationObjectUrls(stationId));
  });
</script>

<style></style>
