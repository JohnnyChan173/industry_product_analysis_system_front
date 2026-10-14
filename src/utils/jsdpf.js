import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/** 下载PDF */
export function downloadPDF(dom, pdfName) {
  console.log(dom);
  html2canvas(dom, {
    async: false, // 同步执行
    useCORS: true, // 使用跨域(当allowTaint为true时这段代码没什么用)
    scale: window.devicePixelRatio * 2,
  }).then(function (canvas) {
    console.log(canvas);
    canvas2PDF(canvas, pdfName);
  });
}

/** canvas2PDF */
const canvas2PDF = (canvas, pdfName) => {
  let contentWidth = canvas.width;
  let contentHeight = canvas.height;

  console.dir(canvas);

  // let imgHeight = contentHeight;
  // let imgWidth = contentWidth;

  // a4纸的尺寸[595.28,841.89]，html页面生成的canvas在pdf中图片的宽高
  const baseWidth = 595.28;
  let imgWidth = baseWidth;
  let imgHeight = (baseWidth / contentWidth) * contentHeight;
  //
  // 第一个参数： l：横向  p：纵向
  // 第二个参数：测量单位（"pt"，"mm", "cm", "m", "in" or "px"）
  let pdf = new jsPDF("l", "px");

  pdf.addImage(canvas.toDataURL("image/jpeg", 1.0), "JPG", 0, 0, imgWidth, imgHeight);
  console.log(imgWidth, imgHeight);

  pdf.save(`${pdfName}.pdf`);
};
