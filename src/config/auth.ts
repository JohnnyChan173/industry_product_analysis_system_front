// import JsEncrypt from "jsencrypt";

// /** 令牌前缀 */
// export const TokenPrefix = "Bearer ";

// /** RSA加密公钥 */
// export const RSA_PUBLIC_KEY =
//   "-----BEGIN PUBLIC KEY-----MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC1QQRl0HlrVv6kGqhgonD6A9SU6ZJpnEN+Q0blT/ue6Ndt97WRfxtSAs0QoquTreaDtfC4RRX4o+CU6BTuHLUm+eSvxZS9TzbwoYZq7ObbQAZAY+SYDgAA5PHf1wNN20dGMFFgVS/y0ZWvv1UNa2laEz0I8Vmr5ZlzIn88GkmSiQIDAQAB-----END PUBLIC KEY-----";

// /** apiKey 参数生成 */
// export function generateApiKeyParams() {
//   const timestamp = Date.now();
//   // 创建 JsEncrypt 实例
//   const jse = new JsEncrypt();
//   // 设置公钥
//   jse.setPublicKey(RSA_PUBLIC_KEY);
//   // 加密操作
//   const apiKey = jse.encrypt(timestamp.toString());

//   const data = {
//     timestamp,
//     apiKey,
//   };

//   return data;
// }

import md5 from "md5";

/** 令牌前缀 */
export const TokenPrefix = "Bearer ";
export const PREFIX_KEY = "Ws@~1]%89)q_";

/** apiKey 参数生成 */
export function generateApiKeyParams(timestamp = Date.now()) {
  // 加密操作
  const data = `${PREFIX_KEY}${timestamp}`;
  const apiKey = md5(data);

  const params = {
    timestamp,
    apiKey,
  };

  return params;
}
