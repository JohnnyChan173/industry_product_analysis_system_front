<template>
  <div>
    <Table
      class="headerify borderify"
      bordered
      rowKey="uuid"
      :dataSource="props.value"
      :columns="curColumns"
      size="small"
      :pagination="false"
      :showHeader="props.showHeader"
    >
      <template #emptyText>
        <span class="text-gray-400">物料未设置规格</span>
      </template>
      <template #bodyCell="{ text, record, index, column }: BodyCellData<MaterialSpecsInfo>">
        <!-- 序号 -->
        <template v-if="column.key === 'order'">
          <span>{{ index + 1 }}</span>
        </template>

        <!-- 可编辑项 -->
        <template v-if="['specsNo', 'specsName', 'drawNo', 'memo', 'specsSort'].includes(column.dataIndex)">
          <div>
            <!-- 规格 -->
            <!-- 如果是规格料号 焦点 -->
            <a-form-item
              :rules="[{ required: true, message: '请输入名称' }]"
              v-if="editableData[record.uuid] && column.dataIndex === 'specsNo'"
              :name="[editableData[record.uuid], column.dataIndex]"
            >
              <Input
                v-focus
                v-model:value="editableData[record.uuid][column.dataIndex]"
                style="margin: -5px 0"
                @keyup.enter.stop="save(record.uuid)"
              />
            </a-form-item>

            <!-- 其他编辑项 -->
            <a-form-item
              v-else-if="
                editableData[record.uuid] && ['specsName', 'drawNo', 'memo', 'specsSort'].includes(column.dataIndex)
              "
            >
              <Input
                :rules="[{ required: true, message: '请输入名称' }]"
                v-model:value="editableData[record.uuid][column.dataIndex]"
                style="margin: -5px 0"
                @keyup.enter.stop="save(record.uuid)"
              />
            </a-form-item>

            <!-- 文本项 -->
            <template v-else>
              {{ text }}
            </template>
          </div>
        </template>

        <template v-if="column.key === 'action'">
          <div class="editable-row-operations">
            <span v-if="editableData[record.uuid]">
              <a @click="save(record.uuid)">确定</a>
              <Divider type="vertical" />

              <span class="text-gray-400 hover-opacity" @click="cancel(record.uuid)">取消</span>
            </span>
            <span v-else>
              <a @click="edit(record.uuid)">编辑</a>
              <Divider type="vertical" />

              <Popconfirm title="确认删除规格？" @confirm="del(record.uuid)">
                <span class="text-danger hover-opacity">删除</span>
              </Popconfirm>
            </span>
          </div>
        </template>
      </template>
    </Table>
    <div v-if="isEditMode" class="text-right mt-12px">
      <Button type="primary" ghost @click="handleSpecsAdd">创建规格 +</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { FormInstance, Button, Input, Table, Divider, Popconfirm, message } from "ant-design-vue";
  import { onMounted, ref, reactive, withDefaults, defineProps, defineEmits, watch } from "vue";
  import { useFormUtils } from "/@/hooks/antd/form";
  import { MaterialAddData } from "/@/api/model/material";
  import { randomId } from "/@/utils/util";
  import { useTable } from "./useTable";
  import { MaterialSpecsInfo } from "/@/api/model/materialSpecs";
  import { BodyCellData } from "/#/antd";
  import { cloneDeep } from "lodash";
  import { CommonComponentMode } from "/@/enums/commonEnum";
  import { useColumnsTools } from "/@/hooks/web/useColumnsTools";

  interface Props {
    mode?: CommonComponentMode;
    value: MaterialSpecsInfo[];
    showHeader?: boolean;
    hideColumns?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: CommonComponentMode.EDIT,
    value: () => [],
    showHeader: true,
  });

  const emits = defineEmits(["update:value"]);

  const materialSpecsList = ref<MaterialSpecsInfo[]>([]);

  const { columns } = useTable();
  const { curColumns, toHideColumns } = useColumnsTools(columns);

  toHideColumns(props.hideColumns);

  const editableData = reactive<any>({});

  const isEditMode = props.mode === CommonComponentMode.EDIT;
  const isDetailMode = props.mode === CommonComponentMode.DETAIL;

  watch(
    () => props.value,
    (v) => {
      materialSpecsList.value = v;
    },
    { immediate: true }
  );

  watch(
    () => materialSpecsList.value,
    (v) => {
      emits("update:value", v);
    },
    { immediate: true }
  );

  onMounted(async () => {});

  /** 更新列 */
  function toUpdateColumns(columns: any[]) {
    const { hideColumns } = props;
    const hl = hideColumns.split(",");
    const newColumns = columns.filter((i) => !hl.includes(i.key));
    return newColumns;
  }

  /** 创建规格 */
  async function handleSpecsAdd() {
    const ds = Array.from(materialSpecsList.value);
    const dsLen = ds.length;

    const uuid = randomId();
    const specsSort = dsLen + 1;
    const specsNo = "";
    const specsName = "";
    const drawNo = "";
    const memo = "";

    const newSpecsInfo: Partial<MaterialSpecsInfo> = {
      uuid,
      specsSort,
      specsNo,
      specsName,
      drawNo,
      memo,
    };

    const newSpecsList = [...materialSpecsList.value!!, newSpecsInfo] as MaterialSpecsInfo[];
    materialSpecsList.value = newSpecsList;

    console.log(newSpecsList);
    // 追加编辑项
    edit(uuid);
  }

  // 重排列表
  function toSortSpecsList() {
    const newSpecsList = Array.from(materialSpecsList.value);
    newSpecsList.sort((a, b) => a.specsSort!! - b.specsSort!!);
    materialSpecsList.value = newSpecsList;
  }

  function edit(uuid: string) {
    editableData[uuid] = cloneDeep(materialSpecsList.value.filter((item: any) => uuid === item.uuid)[0]);
  }

  async function save(uuid: string) {
    if (editableData[uuid].specsNo == "") {
      message.error("规格编号不能为空");
      return;
    }
    Object.assign(materialSpecsList.value.filter((item: any) => uuid === item.uuid)[0], editableData[uuid]);
    delete editableData[uuid];

    toSortSpecsList();
  }

  function cancel(uuid: string) {
    console.log("editableData", editableData[uuid]);
    if (editableData[uuid].specsNo == "") {
      message.error("规格编号不能为空");
      return;
    }
    delete editableData[uuid];
  }

  async function del(uuid: string) {
    const newSpecsList = materialSpecsList.value.filter((i) => i.uuid !== uuid);
    materialSpecsList.value = newSpecsList;

    toSortSpecsList();
  }
</script>

<style></style>
