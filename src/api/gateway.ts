import { generateApiKeyParams } from "../config/auth";
import request from "../config/request";

enum Api {
  gatewayReceiveSignal = "/gateway/receiveSignal",
  gatewayReceiveVideo = "/gateway/receiveVideo",
  getVideoStorageAddress = "/signal/getVideoStorageAddress",
}

type SendSignalData = {
  apiKey: string;
  moduleUuid: string;
  data: Array<{ name: string; payload: string }>;
  timestamp: number;
};

/** 网关-信号量接收 */
export function gatewayReceiveSignal(data: Partial<SendSignalData>) {
  const apiKeyParams = generateApiKeyParams(data.timestamp);

  const wholeData = {
    ...apiKeyParams,
    ...data,
  };

  return request.post<any>(Api.gatewayReceiveSignal, wholeData);
}

export function gatewayReceiveVideo(data:{ messageId: string, videoUrl: string}) {



  return request.post<any>(Api.gatewayReceiveVideo, data);
}


export function getVideoStorageAddress(data:{ messageId: string,startDate: string, endDate: string}) {



  return request.get<any>(Api.getVideoStorageAddress, { params: {
    ...data,
  } });
}
