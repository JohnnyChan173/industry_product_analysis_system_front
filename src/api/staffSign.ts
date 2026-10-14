import request from "../config/request";
import { StaffSignInfo } from "./model/staffSign";

enum Api {
    staffSignFindByRegId = "/staffSign/findByRegId",
}

export function staffSignFindByRegId(registrationId: number) {
    return request.get<StaffSignInfo[]>(Api.staffSignFindByRegId, {
        params: { registrationId },
    });
}