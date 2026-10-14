import type { UserConfigExport } from "vite";
import { loadEnv } from "vite";
// import { defineConfig } from "vite";
import { resolve } from "path";
import path from "path";
import vue from "@vitejs/plugin-vue";
import vuejsx from "@vue/babel-plugin-jsx";
import WindiCSS from "vite-plugin-windicss";
import { themeColor } from "./src/settings/var";
import { createHtmlPlugin } from "vite-plugin-html";
import viteCompression from "vite-plugin-compression";
import VueSetupExtend from "vite-plugin-vue-setup-extend";
import { createSvgIconsPlugin } from "vite-plugin-svg-icons";
const outDir = "dist";

// 构建 less 颜色变量
const lessThemeColorVars = Object.entries(themeColor)
  .map(
    ([key, value]) => `
      @color-${key}:${value};
    `
  )
  .join("");

/** 颜色变量映射
    @colorMap: {
      primary: @color-primary;
      secondary: @color-secondary;
      success: @color-success;
      warn: @color-warn;
      danger: @color-danger;
      dark: @color-dark;
    };
  */

const lessThemeColorVarsMap =
  "@colorMap: {" +
  Object.entries(themeColor)
    .map(
      ([key, value]) => `
    ${key}: @color-${key};
  `
    )
    .join("") +
  "};";

function pathResolve(dir: string) {
  return resolve(process.cwd(), ".", dir);
}

export default ({ command, mode }: any): UserConfigExport => {
  console.log(command, mode);

  const root = process.cwd();
  const env = loadEnv(mode, root);
  const isBuild = command === "build";

  const { VITE_PORT, VITE_GLOBAL_APP_TITLE, VITE_BASE_URL } = env;

  console.log(env);

  return {
    base: VITE_BASE_URL,
    root,
    resolve: {
      alias: [
        {
          find: /\/@\//,
          replacement: pathResolve("src") + "/",
        },
        {
          find: /\/#\//,
          replacement: pathResolve("types") + "/",
        },
      ],
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          modifyVars: {
            hack: `
              true;
              @import "${path.resolve("src/design/comp-index.less")}";
              ${lessThemeColorVars};
              ${lessThemeColorVarsMap};
            `,
            // antd 变量重写
            // "@primary-color": "#E11717",
            "@primary-color": "#4286ec",
          },
        },
      },
    },
    server: {
      host: "0.0.0.0",
      port: Number(VITE_PORT),
    },
    build: {
      minify: true,
      target: "esnext",
    },
    plugins: [
      vue(), //
      vuejsx({}),
      VueSetupExtend(),
      WindiCSS(),
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), "src/ruoyi/assets/icons/svg")],
        symbolId: "icon-[dir]-[name]",
        svgoOptions: isBuild,
      }),
      createHtmlPlugin({
        inject: {
          data: {
            title: VITE_GLOBAL_APP_TITLE,
          },
        },
      }),
      isBuild && viteCompression(),
    ],
    esbuild: {
      jsxFactory: "h",
      jsxFragment: "Fragment",
      jsxInject: "import { h } from 'vue';",
    },
  };
};
