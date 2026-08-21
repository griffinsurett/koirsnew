// src/scripts/marqueeOnView.ts
/**
 * Start marquee animations when they scroll into view.
 *
 * The marquees (gallery, testimonial showcase, testimonial carousel) are pure
 * CSS animations, so without this they run from page load and are already
 * mid-cycle — often scrolled past their first items — by the time the section
 * is actually on screen. Gating on intersection makes each band start from its
 * first item, the same effect `client:visible` gives a hydrated island.
 *
 * Tracks are paused via the `.marquee-paused` class (animation-play-state), not
 * `animation: none`, so the keyframes stay attached and hover-to-pause plus the
 * reduced-motion fallback keep working.
 */
const SELECTOR = [
  ".gallery-marquee-track",
  ".showcase-track",
  ".testimonial-marquee-track",
].join(",");

export function initMarqueeOnView(): void {
  const tracks = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));
  if (!tracks.length) return;

  // Respect reduced motion: those tracks already have animation disabled in CSS.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // No IntersectionObserver: leave them running rather than frozen.
  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.remove("marquee-paused");
          observer.unobserve(entry.target);
        }
      }
    },
    // A small bottom margin so the band is genuinely visible before it starts.
    { rootMargin: "0px 0px -10% 0px", threshold: 0.01 }
  );

  for (const track of tracks) {
    track.classList.add("marquee-paused");
    observer.observe(track);
  }
}
