import request from "../config/request";
import { BindModuleData } from "./model/mqtt";

enum Api {
  mqttBindModule = "/mqtt/bindModule",
}

/** MQTT-绑定模组 */
export function mqttBindModule(data: BindModuleData) {
  return request.post<string>(Api.mqttBindModule, {
    ...data,
  });
}
