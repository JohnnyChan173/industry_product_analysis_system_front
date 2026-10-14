import { defineConfig } from "windicss/helpers";
import formsPlugin from "windicss/plugin/forms";
import { themeColor } from "./src/settings/var";

export default defineConfig({
  darkMode: "class",
  safelist: "p-3 p-4 p-5",
  theme: {
    extend: {
      colors: {
        ...themeColor,
      },
    },
  },
  plugins: [
    formsPlugin, //
    createEnterPlugin(),
    // createPlatformColorPlugin(),
  ],
});

// 创建进入动画（顺序延迟进入）
function createEnterPlugin(maxOutput = 8) {
  const createCss = (index: number, d = "x") => {
    const upd = d.toUpperCase();

    return {
      [`* > .enter-${d}:nth-child(${index})`]: {
        transform: `translate${upd}(50px)`,
      },
      [`* > .-enter-${d}:nth-child(${index})`]: {
        transform: `translate${upd}(-50px)`,
      },
      [`* > .enter-${d}:nth-child(${index}), * > .-enter-${d}:nth-child(${index})`]: {
        "z-index": `${10 - index}`,
        opacity: "0",
        animation: `enter-${d}-animation 0.4s ease-in-out 0.3s`,
        "animation-fill-mode": "forwards",
        "animation-delay": `${(index * 1) / 10}s`,
      },
    };
  };

  const handler = ({ addBase }) => {
    const addRawCss = {};
    for (let index = 1; index < maxOutput; index++) {
      Object.assign(addRawCss, {
        ...createCss(index, "x"),
        ...createCss(index, "y"),
      });
    }
    addBase({
      ...addRawCss,
      [`@keyframes enter-x-animation`]: {
        to: {
          opacity: "1",
          transform: "translateX(0)",
        },
      },
      [`@keyframes enter-y-animation`]: {
        to: {
          opacity: "1",
          transform: "translateY(0)",
        },
      },
    });
  };

  return {
    handler,
  };
}

// 创建主题下颜色(不需要，可以直接通过 theme.extend.colors 去注入新颜色)
// function createPlatformColorPlugin() {
//   return {
//     handler: ({ addBase }) => {
//       const colorClass = {};
//       const bgClass = {};
//       Object.entries(themeColor).forEach(([key, val]) => {
//         colorClass[`.color-${key}`] = {
//           "color": val,
//         };
//         bgClass[`.bg-${key}`] = {
//           "background-color": val,
//         };
//       });

//       addBase({
//         ...colorClass,
//         ...bgClass,
//       });
//     },
//   };
// }
