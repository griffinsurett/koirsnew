import { registerScrollAnimationPlugin } from "@/integrations/scroll-animations/plugin-registry";

type LazyVideoElement = HTMLVideoElement & {
  dataset: HTMLVideoElement["dataset"] & {
    videoSrc?: string;
    videoLoaded?: string;
    videoAutoplay?: string;
    videoPause?: string;
  };
};

function isLazyVideo(el: Element | null): el is LazyVideoElement {
  if (!(el instanceof HTMLVideoElement)) return false;
  return Boolean(
    el.dataset.videoSrc ||
      el.querySelector("source[data-video-src]"),
  );
}

function hydrateVideoSources(video: LazyVideoElement) {
  if (video.dataset.videoLoaded === "true") return true;
  let hasSource = false;

  const direct = video.dataset.videoSrc;
  if (direct && video.src !== direct) {
    video.src = direct;
    hasSource = true;
  }

  const sources = video.querySelectorAll<HTMLSourceElement>("source[data-video-src]");
  sources.forEach((source) => {
    const src = source.dataset.videoSrc;
    if (src && source.src !== src) {
      source.src = src;
      hasSource = true;
    }
  });

  if (hasSource) {
    video.load();
    video.dataset.videoLoaded = "true";
  }

  return hasSource;
}

function playVideo(video: LazyVideoElement) {
  const shouldAutoplay = video.dataset.videoAutoplay !== "false";
  if (!shouldAutoplay) return;

  const playResult = video.play();
  if (typeof playResult?.catch === "function") {
    playResult.catch(() => undefined);
  }
}

function pauseVideo(video: LazyVideoElement) {
  const shouldPause = video.dataset.videoPause !== "false";
  if (!shouldPause) return;
  video.pause();
}

registerScrollAnimationPlugin({
  name: "lazy-video-scroll-animation",
  matches: (el) => isLazyVideo(el),
  onEnter: (el) => {
    if (!isLazyVideo(el)) return;
    const ready = hydrateVideoSources(el);
    if (ready) {
      playVideo(el);
    }
  },
  onExit: (el) => {
    if (!isLazyVideo(el)) return;
    pauseVideo(el);
  },
});
