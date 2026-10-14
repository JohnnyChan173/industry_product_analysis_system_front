import { defineStore } from "pinia";
import { PrintStateData } from "./types";

const defaultPrintIdState: PrintStateData = {
  /** 打印模式 */
  printMode: "",
  /** 打印显示 */
  printShow: false,
  /** 打印id */
  printId: 0,
};

/** 应用仓库 */
export const usePrintStore = defineStore("print", {
  state: () => defaultPrintIdState,
  actions: {
    setPrintMode(mode: string) {
      this.printMode = mode;
    },

    setPrintShow(visible: boolean) {
      this.printShow = visible;

      if (visible === false) {
        // 清除其他n+1个 print
        const otherPrintDoms = Array.from(document.querySelectorAll(".print"));
        if (otherPrintDoms.length > 1) {
          const l = otherPrintDoms.slice(1);
          l.forEach((dom) => {
            dom.parentElement?.removeChild(dom);
          });
        }
      }
    },

    setPrintId(id: number) {
      this.printId = id;
    },

    /** 打开打印视图 */
    async toOpenPrintView(mode: string, printId: number) {
      this.setPrintMode(mode);
      this.setPrintId(printId);
      this.setPrintShow(true);
    },
  },
});
