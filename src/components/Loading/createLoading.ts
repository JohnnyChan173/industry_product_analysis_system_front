import { reactive, watch } from "vue";
import { LoadingProps } from "./typing";
import { TimeoutHandle } from "/#/global";

type LoadingData = {
  tip?: string;
  loading?: boolean;
  absolute?: boolean;
  [key: string]: any;
};

type LoadingMethod = {
  open: () => void;
  close: () => void;
  destroy: () => void;
  data: LoadingData;
};

let bodyLoadingMethod: LoadingMethod | null = null;

/**
 * 公共 Loading（兼容旧调用方式的安全版）
 *
 * 目标：
 * 1. 其他业务页面、v-loading 指令全部不用改；
 * 2. 不再渲染 ./index.vue，彻底绕开 fast-dataview-ui 的 mounted DOM 异常；
 * 3. 兼容：
 *    - createLoading()
 *    - createLoading(props, el)
 *    - 旧指令通过 el.data.loading = true / false 反复控制
 */
export function createLoading(
  props: Partial<LoadingProps> = {},
  target: HTMLElement = document.body
) {
  if (target === document.body && bodyLoadingMethod) {
    Object.assign(bodyLoadingMethod.data, props);
    bodyLoadingMethod.open();
    return bodyLoadingMethod;
  }

  let timer: TimeoutHandle | null = null;
  let destroyed = false;
  let overlay: HTMLDivElement | null = null;

  // 普通元素若为 static，需要改为 relative，
  // 否则 absolute 遮罩可能不会以当前元素作为定位父级。
  let changedTargetPosition = false;
  let originalTargetPosition = "";

  const data = reactive<LoadingData>({
    tip: "数据记载中",
    loading: true,
    ...props,
  });

  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function ensureOverlay() {
    if (destroyed || overlay || !target) {
      return;
    }

    const el = document.createElement("div");
    el.setAttribute("data-safe-loading", "true");

    const isBody = target === document.body;

    if (!isBody) {
      const position = window.getComputedStyle(target).position;
      if (!position || position === "static") {
        originalTargetPosition = target.style.position;
        target.style.position = "relative";
        changedTargetPosition = true;
      }
    }

    Object.assign(el.style, {
      position: isBody ? "fixed" : "absolute",
      left: "0",
      top: "0",
      right: "0",
      bottom: "0",
      zIndex: "9999",
      display: "none",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      background:
        "radial-gradient(circle at 50% 45%, rgba(24, 144, 255, 0.08), transparent 34%), rgba(248, 251, 255, 0.82)",
      backdropFilter: "blur(1px)",
      WebkitBackdropFilter: "blur(1px)",
      boxSizing: "border-box",
    });

    const content = document.createElement("div");
    Object.assign(content.style, {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      transform: "translateY(-12px)",
    });

    const spinner = document.createElement("div");
    spinner.className = "safe-loading-spinner";

    const spinnerOuter = document.createElement("span");
    spinnerOuter.className = "safe-loading-spinner__outer";

    const spinnerInner = document.createElement("span");
    spinnerInner.className = "safe-loading-spinner__inner";

    spinner.appendChild(spinnerOuter);
    spinner.appendChild(spinnerInner);

    const tip = document.createElement("div");
    tip.setAttribute("data-safe-loading-tip", "true");
    tip.className = "safe-loading-tip";

    const dots = document.createElement("span");
    dots.className = "safe-loading-dots";

    // 双层 loading 动画及文字样式只注入一次。
    if (!document.getElementById("safe-loading-style")) {
      const style = document.createElement("style");
      style.id = "safe-loading-style";
      style.textContent = `
        .safe-loading-spinner {
          position: relative;
          width: 52px;
          height: 52px;
          margin-bottom: 18px;
        }

        .safe-loading-spinner__outer,
        .safe-loading-spinner__inner {
          position: absolute;
          display: block;
          box-sizing: border-box;
          border-radius: 50%;
          border: 3px solid transparent;
        }

        .safe-loading-spinner__outer {
          inset: 0;
          border-top-color: #1677ff;
          border-right-color: #1677ff;
          animation: safe-loading-rotate 0.9s linear infinite;
        }

        .safe-loading-spinner__inner {
          inset: 7px;
          border-bottom-color: #69b1ff;
          border-left-color: #69b1ff;
          animation: safe-loading-rotate-reverse 1.2s linear infinite;
        }

        .safe-loading-tip {
          color: #606b7a;
          font-size: 14px;
          font-weight: 500;
          line-height: 22px;
          letter-spacing: 1px;
          text-align: center;
          white-space: nowrap;
        }

        .safe-loading-dots {
          display: inline-block;
          width: 24px;
          text-align: left;
        }

        .safe-loading-dots::after {
          content: "";
          animation: safe-loading-dots 1.4s steps(4, end) infinite;
        }

        @keyframes safe-loading-rotate {
          to { transform: rotate(360deg); }
        }

        @keyframes safe-loading-rotate-reverse {
          to { transform: rotate(-360deg); }
        }

        @keyframes safe-loading-dots {
          0% { content: ""; }
          25% { content: "."; }
          50% { content: ".."; }
          75%, 100% { content: "..."; }
        }
      `;
      document.head.appendChild(style);
    }

    content.appendChild(spinner);
    content.appendChild(tip);
    content.appendChild(dots);
    el.appendChild(content);

    // target 在 directive.created 阶段即使还没进 document，
    // appendChild 到 target 本身也是安全的；
    // 等 Vue 把 target 挂到页面时，遮罩会跟着一起进入 DOM。
    target.appendChild(el);
    overlay = el;

    syncDom();
  }

  function syncDom() {
    if (destroyed) {
      return;
    }

    ensureOverlay();

    if (!overlay) {
      return;
    }

    const tipEl = overlay.querySelector(
      '[data-safe-loading-tip="true"]'
    ) as HTMLDivElement | null;

    if (tipEl) {
      tipEl.textContent = String(data.tip || "数据记载中");
      tipEl.style.display = "block";
    }

    overlay.style.display = data.loading ? "flex" : "none";
  }

  function open() {
    if (destroyed) {
      return;
    }

    data.loading = true;
    syncDom();

    // 保留原来 body loading 的 10 秒兜底。
    // 普通 v-loading 不做自动超时，避免业务请求超过 10 秒后状态错乱。
    if (target === document.body) {
      clearTimer();
      timer = setTimeout(() => {
        close();
      }, 10000);
    }
  }

  function close() {
    clearTimer();
    data.loading = false;
    syncDom();

    // body 单例仍保留实例，下次 createLoading() 可直接复用。
    // 普通 v-loading 也不能在 close 时销毁，
    // 因为旧 loading.ts 后续只会执行 el.data.loading = true。
  }

  function destroy() {
    if (destroyed) {
      return;
    }

    destroyed = true;
    clearTimer();
    stopWatch();

    if (overlay?.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    overlay = null;

    if (changedTargetPosition) {
      target.style.position = originalTargetPosition;
    }

    if (target === document.body && bodyLoadingMethod === methods) {
      bodyLoadingMethod = null;
    }
  }

  // 兼容原 loading.ts：
  // updated() 只是 el.data.loading = value，因此这里监听 reactive data。
  const stopWatch = watch(
    data,
    () => {
      syncDom();
    },
    {
      deep: true,
      flush: "post",
    }
  );

  const methods: LoadingMethod = {
    data,
    open,
    close,
    destroy,
  };

  // 初始化。
  ensureOverlay();
  syncDom();

  if (target === document.body) {
    bodyLoadingMethod = methods;

    if (data.loading) {
      clearTimer();
      timer = setTimeout(() => {
        close();
      }, 10000);
    }
  } else {
    // 兼容旧指令 unmounted(el) { el.close(); }。
    // close 本身不销毁，所以利用 MutationObserver 在宿主真正离开 document 后回收。
    const observer = new MutationObserver(() => {
      if (!target.isConnected) {
        observer.disconnect();
        destroy();
      }
    });

    // target 在 created 阶段可能暂时还没连到 document，
    // 不能此时直接判定为卸载，因此下一帧以后再开始观察。
    requestAnimationFrame(() => {
      if (destroyed) {
        return;
      }

      if (!target.isConnected) {
        observer.disconnect();
        destroy();
        return;
      }

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    });
  }

  return methods;
}
