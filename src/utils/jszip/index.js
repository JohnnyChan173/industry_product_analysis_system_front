import JSZip from "jszip";
import saveAs from "file-saver";

/** 生成并下载zip */
export async function genDownloadJSZip(fileList, name = Date.now()) {
  const Zip = new JSZip();

  fileList.map((file) => {
    const { blob } = file;

    Zip.file(file.name, blob);
  }); /*根据具体情况处理每个文件的数据*/

  const files = await Zip.generateAsync({ type: "blob" });
  saveAs(files, `${name}.zip`);
}
