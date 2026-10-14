<template>
  <!-- 工作区 -->
  <AreaWorkSpace>
    <!-- 1、顶部导航 - 左侧 -->
    <template #nav-left>
      <Input.Search
        allowClear
        :style="{ width: AntButtonWidth.xl }"
        v-model:value="pageState.keyword"
        placeholder="输入租户名称搜索"
        enter-button="搜索"
        @search="handleSearch"
      />
    </template>

    <!-- 2、顶部导航 - 右侧 -->
    <template #nav-right>
      <Button type="primary" @click="handleTenantAdd">创建租户 + </Button>
    </template>

    <!-- 3、主体区 -->
    <template #default>
      <Table
        class="!max-w-880px my-table"
        rowKey="id"
        :loading="state.loading"
        :dataSource="dataSource"
        :columns="columns"
        :pagination="{
          size: 'default',
          total: state.total,
          pageSize: pageState.pageSize,
          showSizeChanger: false,
          onChange: onPageChange,
        }"
      >
        <template #bodyCell="{ text, record, index, column }: BodyCellData<TenantDetail>">
          <!-- 序号 -->
          <template v-if="column.key === 'order'">
            <span>{{ index + 1 }}</span>
          </template>

          <!-- 租户名称 -->
          <template v-if="column.dataIndex === 'tenantName'">
            <span>{{ text }}</span>
          </template>

          <!-- 租户主账号 -->
          <template v-if="column.key === 'tenantMainUsername'">
            <span>{{ record.mainUserInfo.username }}</span>
          </template>

          <!-- 有效期至-->
          <template v-if="column.dataIndex === 'validDate'">
            <span :class="record.checkDateValid ? 'text-primary' : 'text-gray-400'">{{ text.split(" ")[0] }}</span>
          </template>

          <!-- 租户成员-->
          <template v-if="column.dataIndex === 'tenantUserTotal'">
            <span>{{ text }} </span>
          </template>

          <!-- 租户状态-->
          <template v-if="column.dataIndex === 'tenantStatus'">
            <span :class="text === TenantStatus.FREEZE ? 'text-warn' : 'text-success'">
              ●{{ getListItemLabel(TenantStatusList, text) }}
            </span>
          </template>

          <!-- 操作 -->
          <template v-if="column.key === 'action'">
            <a class="!text-primary" @click="() => handleTenantEdit(record.id)"> 编辑 </a>

            <Divider type="vertical" />

            <span>
              <Dropdown>
                <a class="ant-dropdown-link" @click.prevent>
                  更多
                  <DownOutlined />
                </a>
                <template #overlay>
                  <Menu>
                    <Menu.Item @click="() => handleSsoLoginClick(record.id, record)">
                      <a class="!text-primary"> 免登链接 </a>
                    </Menu.Item>

                    <Menu.Divider />
                    <Menu.Item @click="() => handleResetPasswordClick(record.id, record)">
                      <a class="!text-warn"> 重置密码 </a>
                    </Menu.Item>

                    <Menu.Divider />
                    <Menu.Item>
                      <a
                        v-if="record.tenantStatus === TenantStatus.NORMAL"
                        class="!text-warn"
                        @click="() => handleTenantFreezeClick(record.id, record)"
                      >
                        冻结租户
                      </a>
                      <a v-else class="!text-warn" @click="() => handleTenantFreezeCancelClick(record.id, record)">
                        取消冻结
                      </a>
                    </Menu.Item>

                    <Menu.Divider />
                    <Menu.Item @click="() => handleTenantDelClick(record.id, record)">
                      <a class="!text-danger"> 删除 </a>
                    </Menu.Item>
                  </Menu>
                </template>
              </Dropdown>
            </span>
          </template>
        </template>
      </Table>
    </template>
  </AreaWorkSpace>

  <!-- 弹窗 - 创建租户 -->
  <Modal
    v-model:visible="modalAddState.visible"
    :title="compModeText(modalAddState.id, '租户')"
    :footer="null"
    destroyOnClose
  >
    <Add :id="modalAddState.id" @change="handleAddChange" />
  </Modal>
</template>

<script setup lang="ts">
  import { Button, Dropdown, Menu, Input, Modal, Table, Divider, message, Tooltip } from "ant-design-vue";
  import { onMounted, reactive, watch } from "vue";
  import { useRouter } from "vue-router";
  import { DownOutlined } from "@ant-design/icons-vue";
  import { AntButtonWidth, AntInputType } from "/@/enums/antEnum";
  import AreaWorkSpace from "/@/components/Area/Workspace.vue";
  import { useTable } from "./useTable";
  import { defaultPageSize, defaultSort } from "/@/config";
  import { debounce, formatDateByDayjs, compModeText, clipSsoLoginUrl, checkDateNotExpired } from "/@/utils/util";
  import { getListItemLabel, TenantStatusList } from "/@/config/data";
  import { BodyCellData } from "/#/antd";
  import { CommonOperatorTip } from "/@/enums/commonEnum";
  import { createInputModal } from "../../../components/Modal/createModalInput";
  import { tenantFreeze, tenantFreezeCancel, tenantList } from "/@/api/tenant";
  import { userResetPassword } from "/@/api/user";
  import Add from "../Add/index.vue";
  import { TenantDetail } from "/@/api/model/tenant";
  import { tenantDel } from "/@/api/tenant";
  import { TenantStatus } from "/@/enums/model";

  const router = useRouter();
  /** 数据 */
  const state = reactive({
    loading: true,
    total: 0,
  });

  /** 分页数据 */
  const pageState = reactive({
    pageNum: 1,
    pageSize: defaultPageSize,
    sort: defaultSort,
    keyword: "",
  });

  /** 表单数据 */
  const { columns, dataSource } = useTable();

  /** 弹窗 - 创建租户 */
  const modalAddState = reactive<{
    id?: number;
    visible: boolean;
  }>({
    id: undefined,
    visible: false,
  });

  const debounceToGetList = debounce(toGetList, 200);

  // 检测分页变化
  watch(
    () => pageState,
    () => {
      debounceToGetList();
    },
    {
      deep: true,
    }
  );

  // mounted
  onMounted(() => {
    toGetList();
  });

  /** 点击 - 冻结租户 */
  async function handleTenantFreezeClick(id: number, record: TenantDetail) {
    await tenantFreeze(id);
    await toGetList();
    message.success(CommonOperatorTip.OK);
  }

  /** 点击 - 取消冻结租户 */
  async function handleTenantFreezeCancelClick(id: number, record: TenantDetail) {
    await tenantFreezeCancel(id);
    await toGetList();
    message.success(CommonOperatorTip.OK);
  }

  /** 点击 - 租户删除 */
  async function handleTenantDelClick(id: number, record: TenantDetail) {
    const { tenantName } = record;

    Modal.confirm({
      title: `确认删除租户: [${tenantName}]`,
      content: "",
      okText: "删除",
      cancelText: "取消",
      async onOk() {
        await tenantDel(id);
        await toGetList();
        message.success(CommonOperatorTip.OK);
      },
      onCancel() {},
    });
  }

  /** 点击 - 获取免登链接 */
  async function handleSsoLoginClick(id: number, record: TenantDetail) {
    const { mainUserInfo } = record;
    const { username, nickname } = mainUserInfo;
    clipSsoLoginUrl(username, nickname);
  }

  /** 点击 - 重置密码 */
  async function handleResetPasswordClick(id: number, record: TenantDetail) {
    const { mainUserInfo, mainUserId } = record;
    const { username, nickname } = mainUserInfo;
    createInputModal({
      title: `重置密码 租户主账号:${username} [${nickname}]`,
      placeholder: "请输入重置的密码",
      mode: AntInputType.PASSWORD,
      async onOk(password) {
        if (!password) {
          message.warn("请输入密码");
          return Promise.reject("");
        }

        await userResetPassword(mainUserId, password);

        message.success(CommonOperatorTip.OK);
      },
    });
  }

  /** 获取列表 */
  async function toGetList() {
    state.loading = true;
    const { records, total } = await tenantList(pageState);

    records.forEach((i) => {
      i.checkDateValid = checkDateNotExpired(i.validDate);
    });

    dataSource.value = records;
    state.total = total;
    state.loading = false;
  }

  /** 点击 - 创建租户 */
  function handleTenantAdd() {
    modalAddState.id = undefined;
    modalAddState.visible = true;
  }

  /** 点击 - 编辑租户 */
  function handleTenantEdit(id: number) {
    modalAddState.id = id;
    modalAddState.visible = true;
  }

  /** Add 组件变化 */
  async function handleAddChange() {
    await toGetList();
    modalAddState.visible = false;
    message.success(CommonOperatorTip.OK);
  }

  /** 搜索 */
  function handleSearch() {
    toGetList();
  }

  /** 变化 - 页变化 */
  function onPageChange(current: number, size: number) {
    pageState.pageNum = current;
    pageState.pageSize = size;
  }
</script>

<style lang="less" scoped></style>
