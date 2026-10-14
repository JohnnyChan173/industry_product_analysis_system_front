<template>
  <div>
    <Table
      class="!max-w-880px my-table"
      rowKey="id"
      size="small"
      :loading="state.loading"
      :dataSource="dataSource"
      :columns="columns"
      :pagination="false"
    >
      <template #bodyCell="{ text, record, index, column }">
        <!-- 序号 -->
        <template v-if="column.key === 'order'">
          <span>{{ index + 1 }}</span>
        </template>

        <template v-if="['itemValue', 'itemSort'].includes(column.dataIndex)">
          <div>
            <InputNumber
              v-if="editableData[record.id] && column.dataIndex === 'itemSort'"
              min="0"
              v-model:value="editableData[record.id][column.dataIndex]"
              style="margin: -5px 0"
              @keyup.enter="save(record.id)"
            />
            <Input
              v-else-if="editableData[record.id] && column.dataIndex !== 'itemSort'"
              v-focus
              v-model:value="editableData[record.id][column.dataIndex]"
              style="margin: -5px 0"
              @keyup.enter.stop="save(record.id)"
            />
            <template v-else>
              {{ text }}
            </template>
          </div>
        </template>
        <template v-else-if="column.key === 'action'">
          <div class="editable-row-operations">
            <span v-if="editableData[record.id]">
              <a @click="save(record.id)">保存</a>
              <Divider type="vertical" />

              <a @click="cancel(record.id)">取消</a>
            </span>
            <span v-else>
              <a @click="edit(record.id)">编辑</a>
              <Divider type="vertical" />

              <Popconfirm title="确认删除数据值?（不建议）" @confirm="del(record.id)">
                <span class="text-danger hover-opacity">删除</span>
              </Popconfirm>
            </span>
          </div>
        </template>
      </template>
    </Table>
    <div class="flex justify-end mt-10px">
      <Button type="primary" ghost @click="add">新增 + </Button>
    </div>
    <div class="ml-12px">
      <p class="text-warn">- “删除”操作：请确保系统没有地方用到该值，避免数据异常。</p>
      <p class="text-gray-400">- "回车键"可快捷新增&保存</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Button, Input, Table, Divider, Popconfirm, InputNumber, message } from "ant-design-vue";
  import { onMounted, ref, reactive, withDefaults, defineProps, defineEmits, onUnmounted } from "vue";
  import { dictItemAdd, dictItemDel, dictItemEdit, dictItemList } from "/@/api/dictItem";
  import { useTable } from "./useTable";
  import { maxPageSize } from "/@/config";
  import { cloneDeep } from "lodash";
  import { useKeypress } from "/@/hooks/web/useKeypress";
  import { useDataStore } from "/@/store";
  import { dictDetail } from "/@/api/dict";
  import { DictDetail } from "/@/api/model/dict";

  interface Props {
    dictId?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    dictId: undefined,
  });

  const emits = defineEmits(["change:ok"]);

  /** 数据 */
  const state = reactive({
    loading: true,
    total: 0,
  });

  const dictInfo = ref<DictDetail>();
  const editableData = reactive<any>({});

  const { columns, dataSource } = useTable();
  const { updateDictItemData } = useDataStore();

  useKeypress("Enter", add);

  onMounted(() => {
    toGetList();
  });

  onUnmounted(() => {
    const dInfo = dictInfo.value!!;
    const { dictNo } = dInfo;
    updateDictItemData(dictNo);
  });

  async function toGetList() {
    const { dictId } = props;

    const dInfo = await dictDetail(dictId!!);

    dictInfo.value = dInfo;
    dataSource.value = dInfo.dictItemList;

    state.loading = false;

    emits("change:ok");
  }

  function edit(id: number) {
    editableData[id] = cloneDeep(dataSource.value.filter((item: any) => id === item.id)[0]);
  }

  async function save(id: number) {
    const editData = editableData[id];
    console.log(editData);
    if (editableData[id].itemValue == "") {
      return message.error("请输入数据值");
    }
    // 调用字典数据操作接口
    const data = {
      id: editData.id,
      itemValue: editData.itemValue,
      itemSort: editData.itemSort,
    };

    await dictItemEdit(data);
    await toGetList();

    Object.assign(dataSource.value.filter((item: any) => id === item.id)[0], editableData[id]);
    delete editableData[id];
  }

  function cancel(id: number) {
    if (editableData[id].itemValue == "") {
      return message.error("请输入数据值");
    }
    delete editableData[id];
  }

  async function add() {
    const { dictId } = props;

    // 找到最大的排序值
    const l = dataSource.value;
    let maxItemSort = 0;

    if (l.length) {
      maxItemSort = Math.max(...dataSource.value.map((i) => i.itemSort));
    }

    const itemSort = (maxItemSort || 0) + 1;

    // 追加空行
    const data = {
      dictId,
      itemValue: "",
      itemSort,
    };
    console.log(data);

    // 找到最大的排序值
    const newDictItemId = await dictItemAdd(data);

    // 刷新列表
    await toGetList();

    // 追加编辑项
    edit(newDictItemId);
  }

  async function del(id: number) {
    // 必须存在一条数据
    const dataSourceLength = dataSource.value.length;
    if (dataSourceLength <= 1) {
      message.warn("必须存在一条数据");
      return;
    }
    await dictItemDel(id);
    await toGetList();
  }
</script>

<style></style>
