import type { GlobConfig } from "/#/config";
import { getAppEnvConfig } from "/@/utils/env";

export const useGlobSetting = () => {
  const {
    VITE_GLOB_API_URL_PREFIX,
    VITE_GLOB_APP_TITLE,
    VITE_GLOB_DOMAIN_URL,
    VITE_GLOB_UNIVERSAL_UPLOAD_URL,
    VITE_GLOB_UNIVERSAL_BUCKET_URL,
  } = getAppEnvConfig();

  // const glob: Readonly<GlobConfig> = {
  const glob: GlobConfig = {
    title: VITE_GLOB_APP_TITLE,
    domainUrl: VITE_GLOB_DOMAIN_URL,
    apiUrlPrefix: VITE_GLOB_API_URL_PREFIX,
    universalUploadUrl: VITE_GLOB_UNIVERSAL_UPLOAD_URL,
    universalBucketUrl: VITE_GLOB_UNIVERSAL_BUCKET_URL,
  };

  return glob;
};
