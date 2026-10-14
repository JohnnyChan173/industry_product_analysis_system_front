<template>
  <Upload
    multiple
    :list-type="props.listType"
    :headers="uploadHeaders"
    name="file"
    v-model:file-list="fileListRef"
    :accept="props.accept"
    :max-count="props.maxCount"
    :action="props.actionUrl"
    :before-upload="handleBeforeUpload"
    @change="onUploadChange"
    :disabled="isDetailMode"
    :showUploadList="showUploadList"
  >
    <!-- 附件模式 -->
    <template v-if="props.listType === 'text'">
      <template v-if="isDetailMode">
        <p v-if="!props.value.length" class="text-gray-400">暂无文件</p>
      </template>
      <template v-else>
        <slot>
          <Button>
            <UploadOutlined />
            上传文件
          </Button>
        </slot>
      </template>
    </template>

    <!-- 图片模式 -->
    <template v-else>
      <div class="text-gray-400">
        <PlusOutlined></PlusOutlined>
        <!-- <div class="ant-upload-text">上传照片</div> -->
      </div>
    </template>
  </Upload>
</template>
<script lang="ts">
  import { message, Upload, Button } from "ant-design-vue";
  import { LoadingOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons-vue";
  import { defineComponent, onMounted, ref, unref, watch, PropType, computed } from "vue";
  import type { UploadChangeParam } from "ant-design-vue";
  import { useGlobSetting } from "/@/hooks/setting";
  import { UploadFileInfo } from "/@/api/model/file";
  import { createDownload, randomId } from "/@/utils/util";
  import { numberToFixed } from "/@/utils/math";
  import { defaultUploadMaxCount, defaultUploadFileSize } from "/@/config";
  import authStorage from "/@/utils/storage/auth";
  import props from "ant-design-vue/lib/dropdown/props";
  import { TokenPrefix } from "/@/config/auth";
  import { AUTHORIZATION_HEADER } from "/@/config/request";
  import { CommonComponentMode } from "/@/enums/commonEnum";
  import { UploadListType } from "ant-design-vue/lib/upload/interface";
  import { getOSSUniversalPath } from "/@/config/path";

  const token = authStorage.getToken();

  const uploadHeaders = {
    [AUTHORIZATION_HEADER]: TokenPrefix + " " + token,
  };

  const { universalUploadUrl } = useGlobSetting();

  export default defineComponent({
    components: {
      Upload,
      Button,
      UploadOutlined,
      PlusOutlined,
    },
    props: {
      mode: {
        type: String as unknown as PropType<CommonComponentMode>,
        default: CommonComponentMode.DEFAULT,
      },
      listType: {
        type: String as unknown as PropType<UploadListType>,
        default: "text",
      },
      value: {
        type: Array,
        default: () => [],
      },
      maxCount: {
        type: Number,
        default: defaultUploadMaxCount,
      },
      accept: {
        type: String,
      },
      maxSize: {
        type: Number,
        default: defaultUploadFileSize,
      },
      actionUrl: {
        type: String,
        default: universalUploadUrl,
      },
      showUploadList: {
        type: Boolean,
        default: true,
      },
    },
    emits: ["update:value", "uploaded", "all-uploaded", "error"],
    expose: ["toUpdateFileList"],
    setup(props, { emit }) {
      const fileListRef = ref<any[]>([]);

      const isDetailMode = computed(() => props.mode === CommonComponentMode.DETAIL);

      watch(
        () => props.value,
        (defaultList: string[]) => {
          // 可能存在未知BUG 后续优化
          // fileListRef 有值就不赋值
          if (!defaultList || unref(fileListRef).length !== 0) {
            return;
          }
          toUpdateFileList(defaultList);
        },
        {
          immediate: true,
        }
      );

      /** 更新文件列表 */
      function toUpdateFileList(newFileList: string[]) {
        fileListRef.value = newFileList.map((relativePath: string) => ({
          uid: randomId(),
          url: getOSSUniversalPath(relativePath),
          name: relativePath,
          relativePath,
        }));
      }

      /** 上传前校验 */
      function handleBeforeUpload(file: UploadFileInfo, fileList: UploadFileInfo[]) {
        // 检测文件
        const { size, type } = file;
        const { maxSize, maxCount, listType } = props;
        const { length } = fileListRef.value;

        console.log(type);

        // 如果是图片模式，检测是否为图片格式
        if (listType === "picture-card" && !/image\//.test(type!!)) {
          message.warn(`请上传图片格式文件`);
          return Upload.LIST_IGNORE;
        }

        // 校验数量
        if (maxCount && length + 1 > maxCount) {
          message.warn(`文件数量超出${maxCount}个`);
          return Upload.LIST_IGNORE;
        }

        // 校验大小
        if (size!! > maxSize) {
          message.warn(`文件大小超出${numberToFixed(maxSize / 1024 / 1024)}mb`);
          return Upload.LIST_IGNORE;
        }

        return Promise.resolve(true);
      }

      /** 文件上传状态变化 */
      const onUploadChange = (info: UploadChangeParam) => {
        console.log(info);
        // 处理文件
        const file = info.file as UploadFileInfo;
        const { status, response } = file;

        const fileList = info.fileList as UploadFileInfo[];

        console.log(fileList);

        if (status === "removed") {
          emitRelativeFileList();
        } else if (status === "done") {
          // 格式化文件
          formatUploadedFile(file);
          emitRelativeFileList();

          // 暂时设计触发一个 success 事件
          if (response.code === 200) {
            emit("uploaded", file, info);
          } else {
            emit("error", file, response?.message);
          }

          // message.success(`${name} file uploaded successfully`);
        } else if (status === "error") {
          message.error(`上传失败`);
          emit("error", file, response?.message);
        }

        // 检测是否全部文件上传完毕
        const allUploaded = fileList.every((i) => i.status === "done");
        if (allUploaded) {
          emit("all-uploaded");
        }
      };

      /** 格式化已上传文件 */
      function formatUploadedFile(fileInfo: UploadFileInfo) {
        // 读取响应体中的data
        const relativePath = fileInfo.response.data;
        fileInfo.uid = randomId();
        fileInfo.url = getOSSUniversalPath(relativePath);
        fileInfo.name = relativePath;
        fileInfo.relativePath = relativePath;
      }

      /** 上报待上传文件 */
      function emitRelativeFileList() {
        const relativeFilelist = fileListRef.value.map((i) => i.relativePath!!);
        console.log(relativeFilelist);
        emit("update:value", relativeFilelist);
      }

      return {
        isDetailMode,
        fileListRef,
        headers: {
          // authorization: "authorization-text",
        },
        onUploadChange,
        handleBeforeUpload,
        universalUploadUrl,
        props,
        uploadHeaders,
        toUpdateFileList,
      };
    },
  });
</script>
