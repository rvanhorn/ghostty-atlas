import { useEffect, useRef, useState } from "react";

export const balancedPadding = (
  padding,
  width,
  height,
  cellWidth,
  cellHeight,
) => {
  const [top, right, bottom, left] = padding;
  const extraX = (Math.max(0, width - left - right) % cellWidth) / 2;
  const extraY = (Math.max(0, height - top - bottom) % cellHeight) / 2;
  return [top + extraY, right + extraX, bottom + extraY, left + extraX];
};

const fontAvailable = (context, font) => {
  const text = "mmmmmmmmmmWWWWiiii0123456789";
  return ["monospace", "serif"].some((fallback) => {
    context.font = `72px ${fallback}`;
    const base = context.measureText(text).width;
    context.font = `72px ${JSON.stringify(font)}, ${fallback}`;
    return context.measureText(text).width !== base;
  });
};

export const usePreviewMetrics = (preview, compact) => {
  const viewportRef = useRef(null);
  const textRef = useRef(null);
  const [fontNotice, setFontNotice] = useState("");
  useEffect(() => {
    if (compact) return;
    const viewport = viewportRef.current;
    const pre = textRef.current;
    const canvas = window.document.createElement("canvas");
    const context = canvas.getContext("2d");
    let cancelled = false;
    const update = () => {
      if (cancelled || !context) return;
      const style = getComputedStyle(pre);
      context.font = `${style.fontSize} ${style.fontFamily}`;
      const cellWidth = context.measureText("M").width || 1;
      const cellHeight = parseFloat(style.lineHeight) || 1;
      const padding = preview.padding.split(" ").map(parseFloat);
      pre.style.padding = (
        preview.balance
          ? balancedPadding(
              padding,
              viewport.clientWidth,
              viewport.clientHeight,
              cellWidth,
              cellHeight,
            )
          : padding
      )
        .map((value) => `${value}px`)
        .join(" ");
      const family = preview.fontNames?.[0];
      const titleFamily = preview.titleFontName;
      const missing = [family, titleFamily].filter(
        (font) => font && !fontAvailable(context, font),
      );
      setFontNotice(
        missing.length
          ? `${[...new Set(missing)].join(", ")} is unavailable in this browser. Showing the fallback font; your chosen font remains in the config.`
          : "",
      );
    };
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    window.document.fonts.ready.then(update);
    window.document.fonts.addEventListener("loadingdone", update);
    return () => {
      cancelled = true;
      observer.disconnect();
      window.document.fonts.removeEventListener("loadingdone", update);
    };
  }, [preview, compact]);
  return { viewportRef, textRef, fontNotice };
};
