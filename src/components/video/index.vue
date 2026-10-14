<template>
  <div ref="playerRef" class="video-player"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import Artplayer from "artplayer";

const props = defineProps<{
  videoUrl: string;
}>();

const playerRef = ref<HTMLElement>();
let art: Artplayer | null = null;

function initPlayer() {
  if (!playerRef.value || !props.videoUrl) return;

  art?.destroy(false);

  art = new Artplayer({
    container: playerRef.value,
    url: props.videoUrl,

    autoplay: true,
    volume: 0.5,
    isLive: false,
    muted: false,
    autoSize: false,
    autoMini: false,
    screenshot: false,
    setting: true,
    loop: false,
    flip: true,
    playbackRate: true,
    aspectRatio: true,
    fullscreen: true,
    fullscreenWeb: true,
  });

  art.on("video:error", (error) => {
    console.error("视频播放失败:", error);
  });
}

onMounted(() => {
  initPlayer();
});

watch(
  () => props.videoUrl,
  () => {
    initPlayer();
  }
);

onBeforeUnmount(() => {
  art?.destroy(false);
  art = null;
});
</script>

<style scoped>
.video-player {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>