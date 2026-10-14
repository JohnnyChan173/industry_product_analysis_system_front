import { UploadFile } from "ant-design-vue";

/** 响应体 常规返回格式 */
export interface UploadFileInfo extends UploadFile {
  relativePath?: string;
}
