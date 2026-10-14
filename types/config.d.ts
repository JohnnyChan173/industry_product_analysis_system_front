export interface GlobConfig {
  title: string;
  apiUrlPrefix: string;
  domainUrl: string;
  universalUploadUrl: string;
  universalBucketUrl: string;
}

export interface GlobEnvConfig {
  // document.title 页面标题
  VITE_GLOB_APP_TITLE: string;
  // 接口前置命名
  VITE_GLOB_API_URL_PREFIX: string;
  // 接口地址
  VITE_GLOB_DOMAIN_URL: string;
  // 通用上传地址
  VITE_GLOB_UNIVERSAL_UPLOAD_URL: string;
  // 通用仓库地址
  VITE_GLOB_UNIVERSAL_BUCKET_URL: string;
}
