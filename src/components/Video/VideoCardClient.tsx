/**
 * VideoCard (client)
 *
 * A video card with a custom overlay play button and poster. On the first play
 * the overlay button disappears for good and the native HTML video controls
 * take over pause/scrub/volume. The card's aspect ratio is set by `videoAspect`.
 *
 * Rendered from the VideoCard.astro wrapper, which generates the poster at
 * build time. An optional `name`/`role` renders a caption over the poster.
 *
 * Styling is self-contained Tailwind (no global CSS): the outer `group` lets
 * the parent hover drive the play-button styles, and the triangle glyph is an
 * `after:` pseudo-element border trick tinted with the brand accent.
 */

import { useState, useRef, type KeyboardEvent } from 'react';
import Video from '@/components/Video/Video';

interface VideoCardProps {
  name?: string;
  role?: string;
  video: string;
  poster?: string;
  className?: string;
  spanColumns?: boolean;
  spanRows?: boolean;
  videoAspect?: 'portrait' | 'landscape' | 'square' | 'natural';
  centered?: boolean;
  /** Render the name/role caption over the poster. Off hides it while keeping
   *  `name` for the aria-label. */
  showCaption?: boolean;
}

const ASPECT_CLASSES: Record<NonNullable<VideoCardProps['videoAspect']>, string> = {
  natural: '',
  portrait: 'aspect-[9/16]',
  landscape: 'aspect-[16/9]',
  square: 'aspect-square',
};

const VideoCard = ({
  name = '',
  role,
  video,
  poster,
  className = '',
  spanColumns = false,
  spanRows = false,
  videoAspect = 'portrait',
  centered = false,
  showCaption = true,
}: VideoCardProps) => {
  const isNatural = videoAspect === 'natural';
  const [isPlaying, setIsPlaying] = useState(false);
  // Latches true on the first play and stays true — used to swap the custom
  // overlay button for the native controls. (isPlaying flips back on pause, so
  // it can't drive that swap or the overlay would return every time you pause.)
  const [hasStarted, setHasStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Video is rendered with lazy={true}, so its src lives in data-video-src and
  // no bytes load until we attach it here on the first click. This is what keeps
  // the poster-only payload small while still playing on demand.
  const ensureVideoSource = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (!videoEl.getAttribute('src')) {
      videoEl.src = video;
      videoEl.preload = 'metadata';
      videoEl.load();
    }
  };

  // Card-level click only STARTS the video (via the overlay button). Once it
  // has started, native controls own pause/scrub/volume, so a click on the card
  // is ignored here and left to bubble to those controls.
  const handlePlayClick = () => {
    const videoEl = videoRef.current;
    if (!videoEl || hasStarted) return;

    ensureVideoSource();
    videoEl.muted = false;
    videoEl.play().catch(() => {
      // Retry with a fuller preload if the first attempt was blocked.
      if (videoEl.getAttribute('src')) {
        videoEl.preload = 'auto';
        videoEl.load();
        videoEl.play().catch(() => {});
      }
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handlePlayClick();
    }
  };

  // Drive isPlaying from the media element's own events, not the click, so the
  // overlay/state stays correct even when playback starts/stops on its own.
  const handleVideoPlay = () => {
    setIsPlaying(true);
    setHasStarted(true);
  };
  const handleVideoPause = () => setIsPlaying(false);
  const handleVideoEnd = () => setIsPlaying(false);

  const cardClasses = [
    // In `natural` mode the card is only a play-button host — the caller owns
    // the surface (radius/shadow), so none of the testimonial-card chrome
    // (28px radius, border, dark fill, lg shadow) is applied.
    isNatural
      ? 'video-card group relative overflow-hidden cursor-pointer'
      : 'video-card group relative overflow-hidden rounded-[28px] border border-slate-100/60 shadow-lg cursor-pointer bg-slate-900',
    ASPECT_CLASSES[videoAspect],
    spanColumns ? 'col-span-2' : '',
    spanRows ? 'row-span-2' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      onClick={handlePlayClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={name ? `${name} — play video` : 'Play video'}
      aria-pressed={isPlaying}
    >
      {/* Optimized shared Video component. lazy={true} defers the mp4 entirely —
          only the small webp poster loads on page render; the src is attached
          on first click above. */}
      <Video
        ref={videoRef}
        src={video}
        poster={poster}
        wrapperClass={isNatural ? 'relative z-0' : 'absolute inset-0 z-0'}
        className={isNatural ? 'w-full h-auto' : 'w-full h-full object-cover'}
        lazy={true}
        autoPlay={false}
        loop={false}
        muted={false}
        controls={hasStarted}
        playsInline
        onEnded={handleVideoEnd}
        onPlay={handleVideoPlay}
        onPause={handleVideoPause}
      />

      {/* Gradient overlay + play button exist only until the first play. Once
          started they vanish for good and native controls take over — keying
          off hasStarted (not isPlaying) so they don't return when paused. */}
      <div
        className={`absolute inset-0 z-10 bg-gradient-to-t from-black/95 via-black/40 to-black/20 transition-opacity duration-300 ${hasStarted ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      />

      {/* Custom play button — starts the video, then hands off to native
          controls. Triangle glyph is an after: pseudo-element in the brand
          accent; parent-group hover grows/brightens it. */}
      <div
        className={[
          'play-btn absolute z-20 flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-[0_4px_15px_rgba(0,0,0,0.3)] transition-all duration-300',
          'group-hover:scale-110 group-hover:bg-white',
          "after:content-[''] after:ml-1.5 after:h-0 after:w-0 after:border-y-[10px] after:border-l-[16px] after:border-y-transparent after:border-l-[var(--color-accent)]",
          centered
            ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
            : 'left-5 bottom-[70px]',
          hasStarted ? 'opacity-0 pointer-events-none' : 'opacity-100',
        ].join(' ')}
      />

      {/* Optional caption - hide once started */}
      {showCaption && name && (
        <div className={`absolute bottom-5 z-20 transition-opacity duration-300 ${hasStarted ? 'opacity-0' : 'opacity-100'} ${centered ? 'left-1/2 -translate-x-1/2 text-center' : 'left-5'}`}>
          <div className={`font-bold text-white ${centered ? 'text-[22px]' : 'text-xl'}`}>
            {name}
          </div>
          {role && <div className="text-slate-300 text-sm">{role}</div>}
        </div>
      )}
    </div>
  );
};

export default VideoCard;
