import request from "../config/request";

enum Api {
  fileUpload = "/file/upload",
  parseCheckExcel = "/file/parseCheckExcel",
}

/** 文件上传 */
export function fileUpload(file: FormData) {
  return request.post<string>(Api.fileUpload, file);
}

/** 解析检测字典文件 */
export function parseCheckExcel(data: FormData) {
  return request.post<string>(Api.parseCheckExcel, data);
}
