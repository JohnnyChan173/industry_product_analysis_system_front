<template>
  <div class="staff-batch-edit">


    <Table :dataSource="draftList" :columns="columns" rowKey="id" size="small" bordered :pagination="false" :scroll="{ x: 1250, y: 420 }">
      <template #bodyCell="{ record, index, column }">
        <template v-if="column.key === 'order'">{{ index + 1 }}</template>
        <template v-else-if="column.key === 'staffNo'">
          <Input v-model:value="record.staffNo" placeholder="员工编号" />
        </template>
        <template v-else-if="column.key === 'staffName'">
          <Input v-model:value="record.staffName" placeholder="员工姓名" />
        </template>
        <template v-else-if="column.key === 'username'">{{ record?.userInfo.username || '/' }}</template>
        <template v-else-if="column.key === 'staffType'">
          <Select v-model:value="record.staffType" style="width: 100%" placeholder="员工类型">
            <Select.Option v-for="item in StaffTypeList" :key="item.value" :value="item.value">
              {{ item.label }}
            </Select.Option>
          </Select>
        </template>
        <template v-else-if="column.key === 'workshopId'">
          <Select v-model:value="record.workshopId" allowClear style="width: 100%" placeholder="所属车间" @change="(id) => syncWorkshop(record, id)">
            <Select.Option v-for="item in workshopList" :key="item.id" :value="item.id">
              {{ item.workshopName }}
            </Select.Option>
          </Select>
        </template>
        <template v-else-if="column.key === 'phoneNumber'">
          <Input v-model:value="record.phoneNumber" :maxlength="11" placeholder="手机号" />
        </template>
        <template v-else-if="column.key === 'roleKeys'">
          <Select v-model:value="record.roleKeys" mode="multiple" style="width: 100%" placeholder="用户角色">
            <Select.Option v-for="item in TenantValidRoleKeyList" :key="item.value" :value="item.value">
              {{ item.label }}
            </Select.Option>
          </Select>
        </template>
        <template v-else-if="column.key === 'memo'">
          <Input v-model:value="record.memo" placeholder="备注" />
        </template>
      </template>
    </Table>

    <div class="actions">
      <Button :disabled="saving" @click="emit('cancel')">取消</Button>
      <Button type="primary" :loading="saving" @click="save">确认修改</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from "vue";
  import { Button, Input, Select, Table, message } from "ant-design-vue";
  import { StaffTypeList, TenantValidRoleKeyList } from "/@/config/data";
  import type { StaffDetail } from "/@/api/model/staff";
  import type { WorkshopInfo } from "/@/api/model/workshop";
import { staffUpdateBatch } from "/@/api/staff";

  const props = defineProps<{
    list: StaffDetail[];
    workshopList: WorkshopInfo[];
  }>();
  const emit = defineEmits<{ (event: "save", records: StaffDetail[]): void; (event: "cancel"): void }>();

  // 独立草稿：关闭弹窗不会更改父页面列表。
  const saving = ref(false);
  const draftList = ref<StaffDetail[]>(JSON.parse(JSON.stringify(props.list)));
  draftList.value.forEach((record: any) => {
    record.userInfo ||= {};
    // 列表手机号在 userInfo 中，编辑和差异提交统一使用外层字段。
    record.phoneNumber = record.userInfo.phoneNumber ?? record.phoneNumber ?? "";
    record.workshopId = record.workshopId ?? record.workshopInfo?.id;
    record.roleKeys ||= [];
  });



  // 在草稿初始化完成后保留基准，避免默认值被误判为修改。
  const originalList: StaffDetail[] = JSON.parse(JSON.stringify(draftList.value));
  const editableFields = ['staffNo', 'staffName', 'staffType', 'workshopId', 'phoneNumber', 'roleKeys', 'memo'] as const;

  function getChangedRecords(): StaffDetail[] {
    return draftList.value.flatMap((record, index) => {
      const current = record as unknown as Record<string, unknown>;
      const original = originalList[index] as unknown as Record<string, unknown>;
      const changes: Record<string, unknown> = { id: current.id };
      for (const field of editableFields) {
        const normalize = (value: unknown) => {
          // 多选角色顺序不影响实际内容；空值采用相同口径比较。
          if (Array.isArray(value)) return JSON.stringify([...value].sort());
          return value == null || value === "" ? null : value;
        };
        if (normalize(current[field]) !== normalize(original[field])) {
          // undefined 在 JSON 中会被忽略，清空选择时显式传 null。
          changes[field] = current[field] === undefined ? null : current[field];
        }
      }
      return Object.keys(changes).length > 1 ? [changes as unknown as StaffDetail] : [];
    });
  }

  const columns = [
    { title: "序号", key: "order", width: 55 },
    { title: "员工编号", key: "staffNo", width: 150 },
    { title: "员工姓名", key: "staffName", width: 140 },
    { title: "员工账号", key: "username", width: 150 },
    { title: "员工类型", key: "staffType", width: 150 },
    { title: "所属车间", key: "workshopId", width: 160 },
    { title: "手机号", key: "phoneNumber", width: 160 },
    { title: "用户角色", key: "roleKeys", width: 200 },
    { title: "备注", key: "memo", width: 180 },
  ];

  function syncWorkshop(record: StaffDetail, id?: number) {
    const workshop = props.workshopList.find((item) => item.id === id);
    (record as any).workshopInfo = workshop ? { ...workshop } : undefined;
  }

  async function save() {
    if (saving.value) return;
    if (draftList.value.some((item) => !item.staffNo?.trim() || !item.staffName?.trim())) {
      message.warning("员工编号和员工姓名不能为空");
      return;
    }
    const changedRecords = getChangedRecords();
    if (!changedRecords.length) {
      message.info("没有修改的数据");
      return;
    }
    saving.value = true;
    try {
      await staffUpdateBatch(changedRecords);
      message.success("保存成功");
      emit("save", draftList.value);
    } catch (error) {
      message.error("保存失败，请重试");
    } finally {
      saving.value = false;
    }
  }
</script>

<style scoped>
  .hint { margin-bottom: 12px; color: #888; }
  .bulk-fields { display: flex; align-items: end; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
  .bulk-field { flex: 1 1 170px; min-width: 150px; }
  .bulk-field label { display: block; margin-bottom: 6px; }
  .actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
</style>
