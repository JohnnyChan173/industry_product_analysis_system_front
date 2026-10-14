<script lang="tsx">
  import { onMounted, defineComponent, reactive, toRefs, watch } from "vue";
  import { MailOutlined, CalendarOutlined, SettingOutlined, AppstoreOutlined } from "@ant-design/icons-vue";
  import { Layout, Menu, MenuProps } from "ant-design-vue";
  import { useAppStore, useUserRoutesStore } from "/@/store";
  import { AppRouteRecordRaw } from "../../router/types";
  import { MenuInfo } from "ant-design-vue/lib/menu/src/interface";
  import { useRouter } from "vue-router";
  import { duplicateArray, windowOpen } from "/@/utils/util";
  import { regTestHttp } from "/@/utils/validate";

  export default defineComponent({
    name: "Sider",
    components: { Layout, Menu },
    setup() {
      const state = reactive<MenuProps>({
        openKeys: [],
        selectedKeys: [],
      });

      const appState = useAppStore();

      const { routes } = useUserRoutesStore();
      const router = useRouter();

      // 监听路由变化
      watch(
        [() => router.currentRoute.value, () => appState.siderCollapsed],
        ([route, collapsed]) => {
          const { path, meta, matched } = route;
          const { hideMenu, activeMenu } = meta;
          // 1、选中项设置
          let selectKey = path;

          // 如果当前 meta 内 是菜单项为隐藏
          if (hideMenu) {
            // 按目前业务 直接找第一个路由匹配项即可
            selectKey = matched[0].path;
          }

          // 如果存在 activeMenu 取它
          if (activeMenu) {
            selectKey = activeMenu;
          }

          console.log({ hideMenu, activeMenu, path, selectKey });

          state.selectedKeys = [selectKey];

          // console.log("collapsed:" + collapsed);

          // 如果 collapsed  不展开子菜单
          if (collapsed) {
            return;
          }

          // 2、展开集设置
          let openedKeys = state.openKeys!!;
          if (!hideMenu && matched.length > 1) {
            const key = matched[0].path;
            openedKeys = duplicateArray([...openedKeys, key]);
          }
          state.openKeys = openedKeys;
        },
        { immediate: true }
      );

      onMounted(() => {
        // 展开当前菜单
        const { matched } = router.currentRoute.value;
        const keys = matched.map((i) => i.path);
        state.openKeys = keys as any;

        // 默认为子菜单全部展开
        if (appState.defaultMenuSpreadAll) {
          const keys = routes.map((i) => i.children && i.children.length && i.path);
          state.openKeys = keys as any;
        }
      });

      /** 变化 - 菜单集点击 */
      const onMenuOpenChange = (openKeys: string[]) => {
        // console.log("onMenuOpenChange", openKeys);
        state.openKeys = openKeys;
      };

      /** 变化 - 菜单项点击 */
      const onMenuItemClick = ({ item, key, keyPath }: MenuInfo) => {
        const keyItem = key as string;
        // console.log("onMenuItemClick", item, key);
        if (regTestHttp(keyItem)) {
          windowOpen(keyItem);
        } else {
          router.push(keyItem);
        }
      };

      /** 检测路由是否为菜单单项 */
      function checkRouteIsMenuItem(route: AppRouteRecordRaw): boolean {
        const { children } = route;
        // 如果是 含有 children
        if (children) {
          const allChildrenHide = children.every((r) => r.meta!!.hideMenu);
          return allChildrenHide ? true : false;
        } else {
          return true;
        }
      }

      /** 循环渲染路由 */
      function renderMenu(routes: AppRouteRecordRaw[]) {
        return routes.map((route) => {
          const { path, name, meta, children } = route;
          const { title, icon, hideMenu } = meta;
          const Icon = icon;
          if (!checkRouteIsMenuItem(route)) {
            const subMenuSlots = {
              icon: () => Icon && <Icon />,
              title: () => <span>{title}</span>,
              default: () => renderMenu(children!!),
            };

            return <Menu.SubMenu key={path}>{subMenuSlots}</Menu.SubMenu>;
          } else {
            return (
              !hideMenu && (
                <Menu.Item key={path}>
                  {{
                    default: () => title,
                    icon: () => Icon && <Icon />,
                  }}
                </Menu.Item>
              )
            );
          }
        });
      }

      return () => (
        <Menu
          class="sider-menu"
          selectedKeys={state.selectedKeys}
          openKeys={state.openKeys}
          mode="inline"
          theme="dark"
          onOpenChange={onMenuOpenChange}
          onClick={onMenuItemClick}
        >
          {{
            default: () => renderMenu(routes),
          }}
        </Menu>
      );
    },
  });
</script>

<style lang="less" scoped>
  @sider-bcg: #39485c !important;
  @sider-subMenu-bcg: #586475 !important;
  @sider-selected-bcg: #d99b96 !important;

  .sider-menu {
    // width: @sider-width;
    height: calc(100vh - @header-height);
    background: @sider-bcg;
    overflow-y: auto;
  }

  :deep {
    &.sider-menu {
      .ant-menu-sub {
        background: @sider-subMenu-bcg;
      }

      .ant-menu-item-selected {
        background: @sider-selected-bcg;
      }

      .ant-menu-item {
        height: 52px !important;
        padding-top: 4px !important;
        padding-bottom: 4px !important;
        margin-top: 0 !important;
        margin-bottom: 0 !important;
      }
    }
  }
</style>

<style lang="less">
  /* 暂时全局样式覆盖 */
  @sider-bcg: #39485c !important;
  @sider-subMenu-bcg: #586475 !important;
  @sider-selected-bcg: #d99b96 !important;

  .ant-menu.ant-menu-sub.ant-menu-vertical {
    background: @sider-bcg;
  }
  .ant-menu-dark.ant-menu-dark:not(.ant-menu-horizontal) .ant-menu-item-selected {
    background: @sider-selected-bcg;
  }
</style>
