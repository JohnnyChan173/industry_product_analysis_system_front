<template>
  <Layout.Header class="header !px-12px !bg-white flex items-center">
    <div class="flex-1 flex items-center">
      <!-- 菜单折叠按钮 -->
      <div class="header-collapsed h-full flex items-center mr-12px hover-opacity" @click="toggleSider">
        <MenuFoldOutlined class="text-20px" />
      </div>

      <!-- 面包屑导航 -->
      <Breadcrumb>
        <template v-for="{ meta, path } in breadcrumbList" :key="path">
          <Breadcrumb.Item v-if="!meta.hideBreadcrumb">
            <a v-if="regTestHttp(path)" :href="path">{{ meta.title }}wwww</a>
            <RouterLink v-else :to="path">{{ meta.title }}</RouterLink>
          </Breadcrumb.Item>
        </template>
      </Breadcrumb>
    </div>

    <!-- 用户面板 -->
    <div class="h-full flex items-center">
      <!-- <span v-permission="[UserType.ADMIN, UserType.SUPPLIER]" class="flex items-center">
        <Badge :count="userInfo.unreadCount" class="hover-opacity">
          <MailOutlined class="text-20px !text-gray-500" @click="handleMailClick" />
        </Badge>
        <Divider class="!bg-gray-300 !h-20px" type="vertical" />
      </span> -->
      <div class="h-full flex items-center">
        <Dropdown trigger="click">
          <p class="h-full flex items-center hover-opacity">
            <img class="h-28px" :src="userIcon" />
            <span class="px-6px">{{ userInfo.nickname }}</span>
            <DownOutlined />
          </p>
          <template #overlay>
            <Menu>
              <!-- <Menu.Item>
                <a href="javascript:;" @click="handleUserCenterClick">用户中心</a>
              </Menu.Item> -->
              <!-- <Menu.Item>
                <a href="javascript:;" @click="handleModifyPasswordClick">修改密码</a>
              </Menu.Item> -->
              <Menu.Item>
                <a href="javascript:;" @click="handleLogoutClick">退出</a>
              </Menu.Item>
            </Menu>
          </template>
        </Dropdown>
      </div>
    </div>

    <!-- 弹窗 - 修改密码 -->
    <Modal
      :style="{ width: AntModalWidth.md }"
      v-model:visible="modalModifyPasswordState.visible"
      title="修改密码"
      :footer="null"
      destroyOnClose
    >
      <ModifyPassword />
    </Modal>
  </Layout.Header>
</template>

<script setup lang="ts">
  import { MenuFoldOutlined, DownOutlined } from "@ant-design/icons-vue";
  import { Modal, Layout, Breadcrumb, Dropdown, Menu } from "ant-design-vue";
  import { computed, reactive, ref, watch } from "vue";
  import { useAppStore, useUserInfoStore, useUserRoutesStore } from "/@/store";
  import { UserType } from "/@/enums/model";
  import { RouterLink, useRouter } from "vue-router";
  import { BreadcrumbRouteItem } from "./types";
  import { regTestHttp } from "/@/utils/validate";
  import { AntModalWidth } from "/@/enums/antEnum";
  import ModifyPassword from "/@/components/Application/ModifyPassword/index.vue";
  import { cloneDeep } from "lodash";
  import { getAssetsFile } from "/@/utils/util";

  const adminIcon = getAssetsFile("icon/admin.png");
  const supplierIcon = getAssetsFile("icon/supplier.png");
  const subSupplierIcon = getAssetsFile("icon/sub-supplier.png");

  const userInfo = useUserInfoStore();
  const userRoutesStore = useUserRoutesStore();
  const appState = useAppStore();

  const { logout } = useUserInfoStore();
  const userIcon = computed(() => {
    return userInfo.type === UserType.ADMIN ? adminIcon : UserType.SUPPLIER ? supplierIcon : subSupplierIcon;
  });

  const router = useRouter();
  const breadcrumbList = ref<BreadcrumbRouteItem[]>([]);

  const modalModifyPasswordState = reactive({
    visible: false,
  });

  watch(
    () => router.currentRoute.value,
    (route) => {
      const list: BreadcrumbRouteItem[] = [];

      // 获取索引1的路由
      const firstRoute = cloneDeep(userRoutesStore.routes[1]);
      firstRoute.meta.title = "首页";
      // console.log(userRoutesStore.routes);

      // 1、注入首页
      list.push(firstRoute!!);

      // 2、注入后续页
      const { matched } = route;
      list.push(...matched);
      console.log(list);
      breadcrumbList.value = list;
    },
    { immediate: true }
  );

  /** 变更侧边栏状态 */
  function toggleSider() {
    appState.toggleSiderCollapsed();
  }

  /** 点击 - 退出登录 */
  function handleLogoutClick() {
    logout();
  }
</script>

<style lang="less" scoped>
  .header {
    position: fixed;
    z-index: 9;
    top: 0;
    left: 0;
    right: 0;
    height: @header-height;
    margin-left: @sider-width;
    background-color: white;
    &-collapsed {
      transition: transform @ant-transition-time;
    }
  }
  .collapsed {
    .header {
      margin-left: @sider-collapsed-width;
      &-collapsed {
        transform: rotateY(180deg);
      }
    }
  }
</style>
