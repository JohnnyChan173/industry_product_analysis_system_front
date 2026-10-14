<template>
  <section class="course-player">
    <!-- 保留原来的选集区域 -->
    <aside class="playlist">
      <!-- 播放列表内容 -->
    </aside>

    <main class="main">
      <div :id="playerId" class="video-player" />
      <div v-if="!url" class="player-message">请选择岗位视频</div>
      <div v-if="errorMessage" class="player-message" role="alert">
        <span>{{ errorMessage }}</span>
        <button type="button" @click="createPlayer">重新加载</button>
        <button v-if="usingMp4Plugin" type="button" @click="playNative">
          切换普通播放
        </button>
      </div>
    </main>
  </section>
</template>

<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref, watch, type PropType } from "vue";
  import Player from "xgplayer";
  import Mp4Plugin from "xgplayer-mp4";
  import "xgplayer/dist/index.min.css";

  const props = defineProps({
    url: { type: String, default: "" },
    // 无 .mp4 后缀的 MP4 接口地址，可传 format="mp4"。
    // WebM 等格式使用浏览器原生播放，不能交给 MP4 插件解析。
    format: {
      type: String as PropType<"auto" | "mp4" | "native">,
      default: "auto",
    },
  });

  const emit = defineEmits<{ (event: "error", error: unknown): void }>();
  const playerId = `xgplayer-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const errorMessage = ref("");
  const usingMp4Plugin = ref(false);
  let player: Player | null = null;
  let mounted = false;
  let forceNative = false;

  const destroyPlayer = () => {
    const previous = player;
    player = null;
    if (previous) previous.destroy();
  };

  const createPlayer = () => {
    if (!mounted) return;
    destroyPlayer();
    errorMessage.value = "";
    usingMp4Plugin.value = false;
    const url = props.url.trim();
    if (!url) return;

    const isMp4 = props.format === "mp4" ||
      (props.format === "auto" && /\.mp4(?:[?#]|$)/i.test(url));
    const useMp4 = isMp4 && !forceNative && typeof MediaSource !== "undefined";
    usingMp4Plugin.value = useMp4;

    try {
      const instance = new Player({
        id: playerId,
        url,
        width: "100%",
        height: 480,
        autoplay: true,
        playsinline: true,
        preload: "auto",
        playbackRate: [0.75, 1, 1.25, 1.5, 2],
        lang: "zh-cn",
        // xgplayer 3.x 配置名称是 mp4plugin（全部小写）。
        // 分段请求 MP4 -> 解析/重新封装 -> MSE -> 浏览器解码播放。
        // 不下载整段生成 Blob，也不在 JS 中预先解码整个视频。
        ...(useMp4 ? {
          plugins: [Mp4Plugin],
          mp4plugin: {
            minBufferLength: 10,
            maxBufferLength: 30,
            segmentDuration: 5,
            enableWorker: true, // 将解析/封装交给 Worker，不代表强制 GPU 解码。
            timeout: 15000,
            retryCount: 2,
            retryDelay: 1000,
            reqOptions: {
              method: "GET",
              mode: "cors",
              credentials: "include", // 使用浏览器允许发送的现有认证信息。
            },
          },
        } : {}),
      });
      player = instance;
      instance.on("error", (error: unknown) => {
        if (player !== instance) return;
        errorMessage.value = "视频加载失败，请重新加载或尝试普通播放。";
        emit("error", error);
      });
      instance.on("playing", () => {
        if (player === instance) errorMessage.value = "";
      });
    } catch (error) {
      destroyPlayer();
      errorMessage.value = "播放器初始化失败，请检查播放器依赖版本。";
      emit("error", error);
    }
  };

  const playNative = () => {
    forceNative = true;
    createPlayer();
  };

  watch(() => [props.url, props.format], () => {
    forceNative = false;
    createPlayer();
  }, { flush: "post" });

  onMounted(() => {
    mounted = true;
    createPlayer();
  });
  onBeforeUnmount(() => {
    mounted = false;
    destroyPlayer();
  });
</script>

<style scoped>
  .main { min-width: 0; width: 100%; }
  .video-player { width: 100%; min-height: 480px; background: #000; }
  .player-message {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    padding: 12px;
    color: #606266;
  }
  .player-message button { cursor: pointer; }
</style>
