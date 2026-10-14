// @ts-ignore
import QRCode from "qrcode";

/** canvas 实例 */

const canvasWidth = 360;
const canvasHeight = 420;

const qrcodeSize = 256;
const logoSize = 90;

const nameHeight = 86;
const uuidHeight = 72;

/** 生成定制工位二维码 */
export function text2QRCode(uuid: string, name: string, account = ""): Promise<string> {
  const logoUrl = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAABUFBMVEUAAAAAV/4S0qwwevIwevIwevQwgO8wevIwefIwevEwevIwevILZPgaafcwfPMDWf0S0qwebfchb/Yca/cEW/wPYvoS0qwR06wwefIN2bMKYvgS06wS0qwwevIXaPgSwrgHh94IYfkS0qwS0qwTxrUCYvYS0qwS0qsUyrEAv58S0awS06sGgeESeOkLjtgRgeMebvcU0aoCZfUR06wR0q0wevILsLsIjNsQtMINaPUwevMR0qwA/6oUzK0GhOALieAMzqobo9QGjtgR0a0ZkOEwe/ECZvQU06wUhOMcj+EIkt8TyLMS06cLafQV1KoS0qwT06wS060OYPoNavMV1qwS07AMaPcQz68KcPACXfoQ1awIitsS0qwRj9oOavIGjdsSeusOYvgS06wHfOUR0qsS0qsS060S0awHhOET064RY/oS06wT0q0T060PbfIT0ayeHOQqAAAAcHRSTlMA////8DAQYNCAwKD//0D/Vv/////XqZRQFP+zzLD/////x7n//cKr/wj2Rv/RSIq6J/q+duAtXZ/skPgDGe1zFS9PhWVw+TScdj//Hf8MoJfQ2fMlHfcQ//4xZNdL8lXX34v/W4/+nP8p1M+kefM3gMtoSgAAAaRJREFUeJzt1FdTwkAQwPHsniJgV0RQsICKvffee++99/r93wwRMHfZpY0vzmRfd37/hJCcZo899vyPGVyZ92evlz89AFBccD2TFb841PXPeDqy8F3RqyfmMmM/VWz2AHsZ+jPp+tEZycgPnage4CYDf9Vo9QC7aftZ0gNUpOk7e2mfbmF1kfMAr2n4g0neA3Sn9BNvWMf7MpGfwvsDiHyhTIgUhaOQ7hGfeS9EXhK/2WR4xHbKlxo+WaGlL+YR73jPF8bDCY94zHu2UG3yiBuyLzd5phCRPDYX8F6IIqv/kL1cUL3Icah+/VEN4FqiUKh6IVxqYM7i9UIV6623cE4EsMEoUF4In+ynKY9YWw9QQ3r1N5zSAb3AeBGUA19MAIedTMAtB3oY/6A5mMKo8hDHSF+pb3JzyMCCEpDf49hsGyu6kKsESgj/FNtRBaf6Imnxo+B3thI7omD9GJZU/25aWgrUwXYve6+0VApOy7dkPIZW5flLBfO/GSS9pu1743ynxLJ0uOI3MZDkWH3pj4QC4ds2cunw5bvdbhdxlthjjz1/MN8urSVT8rMoawAAAABJRU5ErkJggg==`;
  return new Promise((resolve, reject) => {
    QRCode.toDataURL(uuid, { margin: 0, width: canvasWidth }, async function (err: any, url: string) {
      if (err) {
        reject(err);
        return;
      }

      // resolve(url);
      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const ctx = canvas.getContext("2d")!!;
      // 绘制白色背景
      ctx.fillStyle = "#fff";
      // 形状 矩形
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const [qrcodeImage, logoImage, nameImage, uuidImage] = await Promise.all([
        loadImage(url),
        loadImage(logoUrl),
        _createNameImage(name),
        _createUuidImage(account),
      ]);

      // console.log(nameImage);

      // 绘制二维码
      ctx.drawImage(
        qrcodeImage,
        (canvasWidth - qrcodeSize) / 2,
        (canvasHeight - qrcodeSize) / 2,
        qrcodeSize,
        qrcodeSize
      );
      // 绘制logo
      ctx.drawImage(logoImage, (canvasWidth - logoSize) / 2, (canvasHeight - logoSize) / 2, logoSize, logoSize);
      // 绘制名称
      ctx.drawImage(nameImage, 0, 0, canvasWidth, nameHeight);
      // 绘制uuid
      if (account) {
        ctx.drawImage(uuidImage, 0, canvasHeight - uuidHeight, canvasWidth, uuidHeight);
      }

      // 提取组合图片
      const wholeImageUrl = canvas.toDataURL("image/png", 1);
      // console.log(wholeImageUrl);
      resolve(wholeImageUrl);

      // 创建一个canvas画布 将当前图片塞进去
    });
  });
}

/** 加载图片 */
async function loadImage(url: string): Promise<CanvasImageSource> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.src = url;

    // 加载logo图片
    image.onload = function () {
      // image.setAttribute("crossOrigin", "Anonymous");
      resolve(image);
    };
  });
}

/** 生成二维码顶部名称 */
async function _createNameImage(name: string) {
  const data = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${nameHeight}"> 
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-size: ${
          (nameHeight * 14) / 30
        }px;text-align:center; line-height:${nameHeight}px"> 
          <span style="color:#000;">${name}</span> 
        </div> 
      </foreignObject>
    </svg>
  `;

  const image = await _svgHtml2Image(data);
  return image;
}

/** 生成二维码底部uuid */
async function _createUuidImage(uuid: string) {
  const data = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${uuidHeight}"> 
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-size: ${
          (uuidHeight * 12) / 30
        }px;text-align:center; line-height:${uuidHeight}px"> 
          <span style="
            color: #096dd9;
            background: #e6f7ff;
            border: 1px solid #91d5ff;
            border-radius: 2px;
            padding: 0 7px;      
          ">${uuid}</span> 
        </div> 
      </foreignObject>
    </svg>
  `;

  const image = await _svgHtml2Image(data);
  return image;
}

/** svgHtml 转图片 */
async function _svgHtml2Image(svgHtml: string) {
  const dom = document.createElement("div");
  dom.innerHTML = svgHtml;

  const svgHTML = dom.children[0];

  const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(svgHTML));

  const image = await loadImage(src);

  return image;
}
