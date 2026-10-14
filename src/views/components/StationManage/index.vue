<template>
  <div>
    <Table bordered rowKey="id" :dataSource="dataSource" :loading="state.loading" :columns="columns" size="small"
      :pagination="false" :customRow="isEdit ? undefined : customRow">
      <template #bodyCell="{ text, record, index, column }: BodyCellData<StationInfo>">
        <!-- 序号 -->
        <template v-if="column.key === 'order'">
          <span>{{ index + 1 }}</span>
        </template>

        <!-- 可编辑项 -->
        <template v-if="['stationNo', 'stationName', 'staffList', 'moduleUuid'].includes(column.dataIndex)">
          <div>
            <!-- 工位编号 -->
            <Input v-if="editableData[record.id] && column.dataIndex == 'stationNo'"
              v-model:value="editableData[record.id][column.dataIndex]" style="margin: -5px 0"
              @mousedown="disableDrag" />
            <!-- 工位名称 -->
            <Input v-else-if="editableData[record.id] && column.dataIndex == 'stationName'"
              v-model:value="editableData[record.id][column.dataIndex]" style="margin: -5px 0"
              @mousedown="disableDrag" />
            <!-- 绑定员工 -->
            <Select v-else-if="editableData[record.id] && column.dataIndex === 'staffList'" autofocus defaultOpen
              class="w-full" placeholder="选填" v-model:value="editableData[record.id].staffIdList" allow-clear
              mode="multiple">
              <Select.Option v-for="{ id, staffName } in normalStaffList" :key="id" :value="id">
                {{ staffName }}
              </Select.Option>
            </Select>
            <!-- 绑定模组 -->
            <div v-else-if="editableData[record.id] && column.dataIndex == 'moduleUuid'" style="margin: -5px 0">
              <Input class="m-4px" v-model:value="editableData[record.id][column.dataIndex]" @mousedown="disableDrag"
                placeholder="请输入模组uuid" />
              <ModuleEnable :mode="CommonComponentMode.EDIT"
                v-model:isUsedAddon="editableData[record.id]['isUsedAddon']"
                v-model:isUsedWristband="editableData[record.id]['isUsedWristband']"
                v-model:isUsedGround="editableData[record.id]['isUsedGround']"
                v-model:isUsedGeneral="editableData[record.id]['isUsedGeneral']"
                v-model:isUsedScale="editableData[record.id]['isUsedScale']" />
            </div>

            <!-- 文本项 -->
            <template v-else>
              <!-- 绑定员工 -->
              <template v-if="column.dataIndex === 'staffList'">
                <span v-if="getStationStaffNames(record)">
                  {{ getStationStaffNames(record) }}
                </span>
                <span v-else class="text-gray-400">未绑定</span>
              </template>
              <!-- 绑定模块 -->
              <template v-else-if="column.dataIndex === 'moduleUuid'">
                <ModuleEnable :gatewayUuid="record.gatewayUuid" :moduleUuid="record.moduleUuid"
                  :isUsedAddon="record.isUsedAddon" :isUsedWristband="record.isUsedWristband"
                  :isUsedGround="record.isUsedGround" :isUsedGeneral="record.isUsedGeneral"
                  :isUsedScale="record.isUsedScale" />
              </template>
              <template v-else>
                {{ text }}
              </template>
            </template>
          </div>
        </template>

        <template v-if="column.key === 'action'">
          <div class="editable-row-operations">
            <span v-if="editableData[record.id]">
              <a @click="save(record.id)">确定</a>
              <Divider type="vertical" />

              <span class="text-gray-400 hover-opacity" @click="cancel(record.id)">取消</span>
            </span>
            <span v-else>
              <a @click="edit(record.id)">编辑</a>
              <Divider type="vertical" />

              <Popconfirm title="确认删除工位？" @confirm="del(record.id)">
                <span class="text-danger hover-opacity">删除</span>
              </Popconfirm>
            </span>
          </div>
        </template>
      </template>
    </Table>
    <div class="flex justify-end mt-12px">
      <div class="flex items-center">
        <p class="hover-underline text-gray-400 mr-12px" @click="handleFastBindGateway">快捷绑网关</p>
        <Button type="primary" @click="handleStationAdd">创建工位 +</Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button, Table, Divider, Select, Input, Popconfirm, message } from "ant-design-vue";
import { defineEmits, withDefaults, defineProps, onMounted, reactive, ref, nextTick, computed } from "vue";
import { useTable } from "./useTable";
import { staffListAll } from "/@/api/staff";
import { StaffType } from "/@/enums/model";
import { StaffInfo } from "/@/api/model/staff";
import { cloneDeep } from "lodash";
import { AddonEventTypeList, getListItemLabel } from "/@/config/data";
import { createInputModal } from "/@/components/Modal/createModalInput";
import { AntInputType } from "/@/enums/antEnum";
import { BodyCellData } from "/#/antd";
import { StationInfo } from "/@/api/model/station";
import { stationAdd, stationDel, stationEdit, stationList, stationListAll, stationSort, stationBindStaff } from "/@/api/station";
import ModuleEnable from "/@/views/components/ModuleEnable/index.vue";
import { findParentDom } from "/@/utils/dom";
import { generateStationName, generateStationNo } from "/@/config/parse/number";
import { CommonComponentMode, CommonOperatorTip } from "/@/enums/commonEnum";
import { mqttBindModule } from "/@/api/mqtt";

interface Props {
  lineId: number;
}

const props = withDefaults(defineProps<Props>(), {
  lineId: undefined,
});

/** 表单数据 */
const { columns, dataSource, customRowHandler } = useTable();

/** 数据 */
const state = reactive({
  loading: true,
  total: 0,
});

const normalStaffList = ref<StaffInfo[]>([]);

const editableData = reactive<any>({});

const isEdit = computed(() => Object.keys(editableData).length > 0);

// mounted
onMounted(async () => {
  await toGetNeedInfo();
  await toGetList();
});

const customRow = customRowHandler(handleSort);

/** 快捷绑定网关 */
function handleFastBindGateway() {
  // 确保全部工位已绑定模组
  const sList = dataSource.value;

  const allStationBindModule = sList.every((i) => !!i.moduleUuid);
  // if (!allStationBindModule) {
  //   message.warn("请确保全部工位已绑定模组！");
  //   return;
  // }

  // 默认网关UUID
  const defaultGatewayUuid = sList[0].gatewayUuid || "";

  // 如果网关不在，

  createInputModal({
    title: `绑定网关uuid,全部工位都会生效！`,
    value: defaultGatewayUuid,
    placeholder: "请输入网关uuid",
    mode: AntInputType.INPUT,
    async onOk(gatewayUuid) {
      if (!gatewayUuid) {
        message.warn("请输入网关uuid");
        return Promise.reject("");
      }
      const sList = dataSource.value;

      const bindList = sList.map((i) => ({
        uuid: i.moduleUuid,
        isUsedAddon: i.isUsedAddon,
        isUsedWristband: i.isUsedWristband,
        isUsedGround: i.isUsedGround,
        isUsedGeneral: i.isUsedGeneral,
        isUsedScale: i.isUsedScale,
      }));

      // 判定数据是否合法
      const existModuleEqualsGateway = bindList.find((i) => i.uuid === gatewayUuid);
      if (existModuleEqualsGateway) {
        message.warn("存在非法UUID：网关和模块不能相同！");
        return;
      }
      let list = bindList.filter(i => i.uuid)
      await mqttBindModule({
        gatewayUuid,
        data: list,
      });

      await toGetList();

      message.success(CommonOperatorTip.OK);
    },
  });
}

function disableDrag(event: any) {
  var ev = event || window.event;
  const node = findParentDom(ev.target, "ant-table-row");
  if (node) {
    node.draggable = false;
  }
}

function setbleDrag(event: any) {
  var ev = event || window.event;
  const node = findParentDom(ev.target, "ant-table-row");
  if (node) {
    node.draggable = true;
  }
}

/** 获取工位列表 */
async function toGetList() {
  const { lineId } = props;
  const records = await stationListAll(lineId);

  state.loading = false;
  dataSource.value = Array.isArray(records)
    ? records.map((item: any) => ({
      ...item,
      // 当前接口 staffIdList 可能为 null，统一从 staffList/staffId 补全，供编辑框回显。
      staffIdList: getStationStaffIds(item),
    }))
    : [];
}

/**
 * 统一获取工位已绑定的员工 ID。
 * 新接口以 staffList 为准，同时兼容 staffIdList 和旧版单员工 staffId。
 */
function getStationStaffIds(stationInfo?: any): number[] {
  if (!stationInfo) return [];

  const staffIdList = Array.isArray(stationInfo.staffIdList)
    ? stationInfo.staffIdList
    : [];
  const staffListIds = Array.isArray(stationInfo.staffList)
    ? stationInfo.staffList.map((item: any) => item?.id ?? item?.staffId)
    : [];
  const source = staffIdList.length
    ? staffIdList
    : staffListIds.length
      ? staffListIds
      : stationInfo.staffId != null
        ? [stationInfo.staffId]
        : [];

  return Array.from(
    new Set(
      source
        .map((staffId: unknown) => Number(staffId))
        .filter((staffId: number) => Number.isFinite(staffId))
    )
  );
}

/** 获取员工信息 */
function getStaffById(staffId: number) {
  const staff = normalStaffList.value.find((i) => Number(i.id) === Number(staffId));
  return staff;
}

/** 获取已绑定员工名称 */
function getStaffNames(staffIdList?: number[]) {
  if (!Array.isArray(staffIdList)) {
    return "";
  }

  return staffIdList
    .map((staffId) => getStaffById(staffId)?.staffName)
    .filter(Boolean)
    .join("、");
}

/** 优先展示接口返回的员工详情，详情缺失时再通过员工 ID 匹配名称。 */
function getStationStaffNames(stationInfo?: any) {
  const staffNames = Array.isArray(stationInfo?.staffList)
    ? stationInfo.staffList
      .map((item: any) => item?.staffName)
      .filter(Boolean)
    : [];

  return staffNames.length
    ? staffNames.join("、")
    : getStaffNames(getStationStaffIds(stationInfo));
}

/** 获取必要数据 */
async function toGetNeedInfo() {
  // 获取普工员工列表
  const esList = await staffListAll();
  normalStaffList.value = esList.filter((i) => i.roleKeys?.includes("pg"));
}

/** 触发排序 */
async function handleSort(startId: number, endId: number) {
  console.log(startId, endId);

  if (startId === endId) {
    return;
  }

  // 获取数据
  const curList = Array.from(dataSource.value);
  const startIndex = curList.findIndex((i) => i.id === startId);
  const endIndex = curList.findIndex((i) => i.id === endId);
  const startInfo = curList[startIndex];

  // 去掉首元素
  curList.splice(startIndex, 1);
  // 插至尾元素位置
  curList.splice(endIndex, 0, startInfo);

  // curList 即最新顺序的数组
  dataSource.value = curList;

  // 结构化排序字段
  const sortList = curList.map((i, index) => ({ id: i.id, stationSort: index }));
  // 触发服务端排序
  await stationSort(sortList);
}

/** 创建工位 */
async function handleStationAdd() {
  const ds = Array.from(dataSource.value);
  const dsLen = ds.length;
  const { lineId } = props;

  const stationNo = generateStationNo(dsLen + 1);
  const stationName = generateStationName(dsLen + 1);

  const newStationInfo: any = {
    lineId,
    staffIdList: [],
    stationNo,
    stationName,
    stationSort: dsLen,
  };

  // 创建工位
  const newStationId = await stationAdd(newStationInfo);

  // 刷新列表
  await toGetList();

  // 追加编辑项
  edit(newStationId);
}

function edit(id: number) {
  const stationInfo: any = cloneDeep(dataSource.value.find((item: any) => id === item.id));

  // Select 多选值只使用员工 ID，不能直接绑定 staffList 对象数组。
  stationInfo.staffIdList = getStationStaffIds(stationInfo);
  delete stationInfo.staffId;
  editableData[id] = stationInfo;
}

async function save(id: number) {
  const editData = editableData[id];
  if (!editData) return;

  const newStationInfo = cloneDeep(editData);
  // 保存时必须以 Select 当前值为准；即使清空为 []，也不能再回退到旧 staffList。
  const staffIdList = Array.from(
    new Set(
      (Array.isArray(newStationInfo.staffIdList) ? newStationInfo.staffIdList : [])
        .map((staffId: unknown) => Number(staffId))
        .filter((staffId: number) => Number.isFinite(staffId))
    )
  );

  // staffList 是接口回显详情，不提交给编辑接口，绑定关系由 stationBindStaff 单独维护。
  delete newStationInfo.staffId;
  delete newStationInfo.staffIdList;
  delete newStationInfo.staffList;

  // 编辑工位
  await stationEdit(newStationInfo);
  await stationBindStaff({
    id: newStationInfo.id,
    staffIdList,
    lineId: newStationInfo.lineId,
  });
  await toGetList();
  delete editableData[id];
}

function cancel(id: number) {
  delete editableData[id];
}

async function del(id: number) {
  await stationDel(id);
  await toGetList();
}
</script>

<style lang="less" scoped></style>
