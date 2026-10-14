import { useGlobSetting } from "../hooks/setting";

/** 获取资源OSS通用路径 */
export function getOSSUniversalPath(url: string): string {
  const { universalBucketUrl } = useGlobSetting();
  return universalBucketUrl + url;
}
