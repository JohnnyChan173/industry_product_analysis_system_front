<template>
  <!-- <BackBtn /> -->
  <div>
    <FormTitle :size="AntUniversalSize.small" title="车间列表" />

    <div class="!mx-30px">
      <Table
        rowKey="id"
        :loading="state.loading"
        :dataSource="dataSource"
        :columns="columns"
        size="small"
        :pagination="{
          total: state.total,
          pageSize: pageState.pageSize,
          showSizeChanger: false,
          onChange: onPageChange,
        }"
      >
        <template #bodyCell="{ text, record, index, column }">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>

          <!-- 操作 -->
          <template v-else-if="column.key === 'action'">
            <span>
              <a @click="() => handleEditClick(record.id)">编辑</a>
              <Divider type="vertical" />

              <Popconfirm
                title="确认删除车间?"
                @confirm="() => handleDelClick(record.id)"
                ok-text="删除"
                cancel-text="取消"
              >
                <a href="javascript:;" class="!text-danger">删除</a>
              </Popconfirm>
            </span>
          </template>
        </template>
      </Table>

      <div class="text-right">
        <Button type="primary" ghost @click="handleAddClick">创建车间 +</Button>
      </div>
    </div>
  </div>

  <!-- 弹窗 - 新增车间 -->
  <Modal
    :style="{ width: AntModalWidth.md }"
    v-model:visible="modalCharacterAddState.visible"
    :title="`车间管理-${modalCharacterAddState.id ? '编辑' : '创建'}车间`"
    :footer="null"
    destroyOnClose
  >
    <WorkshopAdd @change="handleCharacterAddChange" :id="modalCharacterAddState.id" />
  </Modal>
</template>

<script setup lang="ts">
  import { Button, Table, Divider, Modal, message, Popconfirm } from "ant-design-vue";
  import { onMounted, reactive, defineEmits, watch, unref } from "vue";
  import { useTable } from "./useTable";
  import { workshopDel, workshopList } from "/@/api/workshop";
  import FormTitle from "/@/components/Title/FormTitle.vue";
  import { defaultPageSize, defaultSort } from "/@/config";
  import { AntModalWidth, AntUniversalSize } from "/@/enums/antEnum";
  import WorkshopAdd from "/@/views/Workshop/Add/index.vue";

  /** 数据 */
  const state = reactive({
    loading: true,
    total: 0,
  });

  /** 分页数据 */
  const pageState = reactive({
    keyword: "",
    pageNum: 1,
    pageSize: defaultPageSize,
    sort: defaultSort,
  });

  /** 表单数据 */
  const { columns, dataSource } = useTable();

  /** 弹窗 - 创建物料 */
  const modalCharacterAddState = reactive<{
    visible: boolean;
    id?: number;
  }>({
    visible: false,
    id: undefined,
  });

  // mounted
  onMounted(() => {
    toGetList();
  });

  /** 获取列表 */
  async function toGetList() {
    state.loading = true;

    const { records, total } = await workshopList({
      ...pageState,
    });

    dataSource.value = records;
    state.total = total;

    state.loading = false;
  }

  /** 变化 - 页变化 */
  function onPageChange(current: number, size: number) {
    pageState.pageNum = current;
    pageState.pageSize = size;
  }

  /** 变化 - Add组件  */
  function handleCharacterAddChange(isEditMode: boolean) {
    toGetList();

    if (isEditMode) {
      message.success("编辑成功");
    } else {
      message.success("创建成功");
    }

    modalCharacterAddState.visible = false;
  }

  /** 点击 - 编辑 */
  function handleEditClick(id: number) {
    modalCharacterAddState.id = id;
    modalCharacterAddState.visible = true;
  }

  /** 点击 - 删除 */
  async function handleDelClick(id: number) {
    await workshopDel(id);
    toGetList();
    message.success("已删除");
  }

  /** 点击 - 新增 */
  function handleAddClick() {
    modalCharacterAddState.id = undefined;
    modalCharacterAddState.visible = true;
  }
</script>

<style></style>
