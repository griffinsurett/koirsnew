// src/components/icons/TikTok.jsx
import React from "react";

export default function TikTokIcon({
  className = "h-auto w-5",
  fill = "currentColor",
  width,
  height,
  stroke,
  style,
  ...props
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill={fill}
      width={width}
      height={height}
      stroke={stroke}
      style={style}
      {...props}
    >
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .77-5.06v-3.13a5.7 5.7 0 0 0-.77-.05A5.68 5.68 0 1 0 15.54 15V8.9a7.35 7.35 0 0 0 4.3 1.38V7.19a4.29 4.29 0 0 1-3.24-1.37z" />
    </svg>
  );
}
