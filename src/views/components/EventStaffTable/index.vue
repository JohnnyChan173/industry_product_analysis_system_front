<template>
  <div class="w-360px">
    <Table
      class="borderify"
      bordered
      rowKey="id"
      size="small"
      :dataSource="dataSource"
      :columns="columns"
      :pagination="false"
    >
      <template #bodyCell="{ text, record, index, column }">
        <!-- 序号 -->
        <template v-if="column.key === 'order'">
          <span>{{ index + 1 }}</span>
        </template>

        <!-- 事件类型 -->
        <template v-if="column.dataIndex === 'addonEventType'">
          {{ getListItemLabel(AddonEventTypeList, text) }}
        </template>

        <!-- 负责人（可变） -->
        <template v-if="['staffId'].includes(column.dataIndex)">
          <div>
            <Select
              v-if="editableData[record.id] && column.dataIndex === 'staffId'"
              placeholder="请选择"
              v-model:value="editableData[record.id][column.dataIndex]"
            >
              <Select.Option v-for="{ id, staffName } in eventStaffList" :key="id" :value="id">
                {{ staffName }}
              </Select.Option>
            </Select>

            <template v-else>{{ getStaffById(text)?.staffName || "/" }}</template>
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
              <a @click="edit(record.id)">修改</a>
            </span>
          </div>
        </template>
      </template>
    </Table>
    <div v-if="isEditMode" class="text-right mt-3px flex justify-end">
      <div class="flex items-center">
        <p class="text-primary hover-opacity" @click="handleStaffAddClick">创建员工</p>
        <span class="mx-8px">|</span>
        <p class="text-primary hover-opacity" @click="handleAllSet">一键设定</p>
      </div>
    </div>
  </div>
  <!-- 弹窗 - 创建员工 -->
  <Modal v-model:visible="modalStaffAddState.visible" :title="modalStaffAddState.title" :footer="null" destroyOnClose>
    <StaffAdd :id="modalStaffAddState.id" :staffType="modalStaffAddState.staffType" @change="handleStaffAddChange" />
  </Modal>
</template>

<script setup lang="ts">
  import { Modal, Table, Divider, Select, message } from "ant-design-vue";
  import {
    defineExpose,
    defineEmits,
    withDefaults,
    defineProps,
    onMounted,
    reactive,
    ref,
    nextTick,
    computed,
    watch,
  } from "vue";
  import { useTable } from "./useTable";
  import { staffListAll } from "/@/api/staff";
  import { StaffType } from "/@/enums/model";
  import { StaffInfo } from "/@/api/model/staff";
  import { cloneDeep } from "lodash";
  import { AddonEventTypeList, getListItemLabel } from "/@/config/data";
  import { createInputModal } from "/@/components/Modal/createModalInput";
  import { AntInputType } from "/@/enums/antEnum";
  import { CommonComponentMode, CommonOperatorTip } from "/@/enums/commonEnum";
  import StaffAdd from "/@/views/Staff/Add/index.vue";

  interface Props {
    mode?: CommonComponentMode;
    materialEventStaffId?: number;
    deviceEventStaffId?: number;
    qualityEventStaffId?: number;
    otherEventStaffId?: number;
    multipleEventStaffId?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: CommonComponentMode.EDIT,
    materialEventStaffId: undefined,
    deviceEventStaffId: undefined,
    qualityEventStaffId: undefined,
    otherEventStaffId: undefined,
    multipleEventStaffId: undefined,
  });

  const emits = defineEmits([
    "update:materialEventStaffId",
    "update:deviceEventStaffId",
    "update:qualityEventStaffId",
    "update:otherEventStaffId",
    "update:multipleEventStaffId",
  ]);

  /** 弹窗 - 创建员工 */
  const modalStaffAddState = reactive<{
    id?: number;
    visible: boolean;
    title: string;
    staffType?: StaffType;
  }>({
    id: undefined,
    visible: false,
    title: "创建员工",
  });

  /** 表单数据 */
  const { columns, dataSource } = useTable();

  const eventStaffList = ref<StaffInfo[]>([]);

  const editableData = reactive<any>({});

  const isDetailMode = computed(() => props.mode === CommonComponentMode.DETAIL);
  const isEditMode = computed(() => props.mode === CommonComponentMode.EDIT);

  if (isDetailMode.value) {
    columns.pop();
  }

  watch(
    [
      () => props.materialEventStaffId,
      () => props.deviceEventStaffId,
      () => props.qualityEventStaffId,
      () => props.otherEventStaffId,
      () => props.multipleEventStaffId,
    ],
    () => {
      updateDataSource();
    },
    { immediate: true }
  );

  // mounted
  onMounted(async () => {
    await toGetNeedInfo();
    // updateDataSource();
  });

  /** 点击 - 创建员工 */
  function handleStaffAddClick() {
    modalStaffAddState.id = undefined;
    modalStaffAddState.visible = true;
    modalStaffAddState.title = "创建员工";
    modalStaffAddState.staffType = StaffType.EVENT;
  }

  /** StaffAdd 组件变化 */
  async function handleStaffAddChange() {
    await toGetEventStaffListAll();
    modalStaffAddState.visible = false;
    message.success(CommonOperatorTip.OK);
  }

  /** 获取员工信息 */
  function getStaffById(staffId: any) {
    console.log(staffId, eventStaffList.value);
    const staff = eventStaffList.value.find((i) => i.id === staffId);
    return staff;
  }

  /** 一键设定 */
  async function handleAllSet() {
    // 过滤出普工 且无绑定工位
    const options = eventStaffList.value.map((i) => ({ label: i.staffName, value: i.id }));

    createInputModal({
      mode: AntInputType.SELECT,
      options,
      title: `一键绑定员工`,
      value: undefined,
      placeholder: "请选择员工",
      async onOk(newStaffId) {
        const staffId = Number(newStaffId);
        dataSource.value.forEach((i) => {
          const emitKey = `update:${i.field}` as any;
          emits(emitKey, staffId);
        });

        nextTick(() => {
          updateDataSource();
        });
      },
    });
  }

  /** 更新 dataSource */
  async function updateDataSource() {
    const ds = Array.from(dataSource.value);

    ds.forEach((i) => {
      i.staffId = (props as any)[i.field];
    });
    console.log(ds);
    dataSource.value = ds;
  }

  /** 获取事件管理员列表 */
  async function toGetEventStaffListAll() {
    // 获取事件员工列表
    const esList = await staffListAll(StaffType.EVENT);
    const esList2 = await staffListAll(StaffType.XIANZHANG);
    eventStaffList.value = [...esList, ...esList2];
  }

  /** 获取必要数据 */
  async function toGetNeedInfo() {
    await toGetEventStaffListAll();
  }

  function edit(id: number) {
    editableData[id] = cloneDeep(dataSource.value.filter((item: any) => id === item.id)[0]);
  }

  async function save(id: number) {
    const editData = editableData[id];
    console.log(editData);
    const { field, staffId } = editData;

    const emitKey = `update:${field}` as any;
    emits(emitKey, staffId);

    Object.assign(dataSource.value.filter((item: any) => id === item.id)[0], editableData[id]);
    delete editableData[id];
  }

  function cancel(id: number) {
    delete editableData[id];
  }
</script>

<style lang="less" scoped></style>
