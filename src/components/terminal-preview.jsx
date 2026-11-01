import { useEffect, useId, useMemo, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { CircleHelp, Folder, X } from "lucide-react";
import {
  getConfigurationPreview,
  getWindowAppearance,
} from "../features/config/preview.js";
import { adjustContrast } from "../features/config/contrast.js";
import { usePreviewMetrics } from "../features/config/use-preview-metrics.js";
import { TerminalSample } from "./terminal-sample.jsx";

export const TerminalPreview = ({
  theme,
  sample,
  compact = false,
  document,
  platform = "macos",
  scrollRef,
  label = "Terminal Preview",
}) => {
  const linux = platform === "linux";
  const panelId = useId();
  const [activeTab, setActiveTab] = useState("shell");
  const preview = useMemo(() => getConfigurationPreview(document), [document]);
  const { viewportRef, textRef, fontNotice } = usePreviewMetrics(
    preview,
    compact,
  );
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  useEffect(() => {
    if (compact) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [compact]);
  const textColor = (color, background = theme.bg) =>
    compact
      ? color
      : adjustContrast(color, background, preview.minimumContrast);
  const palette = compact ? theme.palette.slice(0, 8) : theme.palette;
  const variables = {
    "--terminal-bg": theme.bg,
    "--terminal-fg": textColor(theme.fg),
    "--terminal-cursor": theme.cursor,
    "--terminal-selection": theme.selection,
    "--terminal-selection-text": textColor(
      theme.selectionText,
      theme.selection,
    ),
    "--terminal-opacity": preview.opacity ?? 1,
    "--terminal-blur": `${preview.blur || 0}px`,
    "--terminal-dim-opacity": preview.minimumContrast > 1 ? 1 : 0.55,
    ...Object.fromEntries(
      theme.palette.map((color, index) => [
        `--ansi-${index}`,
        textColor(color),
      ]),
    ),
    // Minimum contrast changes text only, so color blocks keep the palette color.
    ...Object.fromEntries(
      theme.palette.map((color, index) => [`--ansi-bg-${index}`, color]),
    ),
    // Linux titlebars with window-theme = ghostty.
    "--titlebar-bg": preview.titlebarBackground || theme.bg,
    "--titlebar-fg": preview.titlebarForeground || theme.fg,
  };
  const title =
    activeTab === "editor" ? "config — nvim" : `${theme.name} · zsh`;
  // Linux chrome: Ghostty's GTK titlebar, or a plain window manager titlebar, and a
  // tab bar that can sit in the titlebar, above the terminal, or below it.
  const linuxTitlebar = linux && !compact && !preview.hideDecoration;
  const linuxTabBar = linux && !compact && preview.tabBar !== "never";
  const tabsInTitlebar =
    linuxTitlebar &&
    linuxTabBar &&
    preview.gtkTitlebar &&
    preview.gtkTitlebarStyle === "tabs";
  const separateTabBar = linuxTabBar && !tabsInTitlebar;
  const linuxControls = (
    <span className="gtk-window-controls" aria-hidden="true">
      <X size={14} />
    </span>
  );
  const tabs = (
    <div
      className="preview-tabbar"
      role="tablist"
      aria-label="Terminal Sessions"
    >
      {[
        ["shell", "atlas — zsh"],
        ["editor", "config — nvim"],
      ].map(([id, title]) => (
        <button
          key={id}
          type="button"
          role="tab"
          id={`${panelId}-${id}`}
          aria-controls={panelId}
          aria-selected={activeTab === id}
          tabIndex={activeTab === id ? 0 : -1}
          onClick={() => setActiveTab(id)}
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
              return;
            event.preventDefault();
            const next =
              event.key === "Home"
                ? "shell"
                : event.key === "End"
                  ? "editor"
                  : activeTab === "shell"
                    ? "editor"
                    : "shell";
            setActiveTab(next);
            event.currentTarget.parentElement
              .querySelector(`[id="${panelId}-${next}"]`)
              ?.focus();
          }}
        >
          {title}
        </button>
      ))}
    </div>
  );
  return (
    <div
      className={`terminal ${compact ? "terminal--compact" : ""}`}
      style={variables}
      data-cursor={preview.cursor || "block"}
      data-blink={!compact && preview.blink}
      data-platform={platform}
      data-titlebar={linux ? undefined : preview.titlebar}
      data-toolbar-style={linux ? preview.toolbarStyle : undefined}
      data-wide-tabs={linux ? preview.wideTabs : undefined}
      data-window-appearance={getWindowAppearance(
        preview,
        platform,
        theme.bg,
        systemDark,
      )}
    >
      {!compact && (
        <div className="terminal-backdrop" aria-hidden="true">
          <div className="terminal-wallpaper">
            <div className="wallpaper-window">
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
          <div className="terminal-tint" />
        </div>
      )}
      {!compact && (
        <Popover.Root>
          <Popover.Trigger
            className="button preview-help"
            aria-label="About This Preview"
          >
            <CircleHelp size={16} />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner
              side="bottom"
              align="end"
              sideOffset={8}
              className="popup-positioner"
            >
              <Popover.Popup className="preview-help-popup">
                <Popover.Title>About This Preview</Popover.Title>
                <Popover.Description>
                  Fonts depend on browser availability. Blur, contrast, and
                  window chrome are approximations; font size and padding use a
                  1:1 logical-pixel scale. Box-drawing and block characters come
                  from the browser font, while Ghostty draws them itself, so
                  line joins and weights can differ. Bold, italic, dim,
                  underline, and inverse text use browser styles. Behavior
                  settings marked “Config Only” are saved to your config but
                  cannot run in this static sample. Reduced motion disables
                  cursor blinking. The Platform choice draws macOS or Linux
                  window chrome; the Linux chrome follows GNOME, and other
                  desktops can differ.
                  {fontNotice && (
                    <span className="field-preview-note">{fontNotice}</span>
                  )}
                </Popover.Description>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      )}
      {(linuxTitlebar ||
        (separateTabBar && preview.tabsLocation !== "bottom")) && (
        <div
          className="terminal-window-header"
          style={{ fontFamily: preview.titleFont }}
        >
          {linuxTitlebar &&
            (preview.gtkTitlebar ? (
              <div className="terminal-chrome">
                {tabsInTitlebar ? (
                  tabs
                ) : (
                  <span className="gtk-title">
                    <span>{title}</span>
                    {preview.subtitle && (
                      <span className="gtk-subtitle">~/atlas</span>
                    )}
                  </span>
                )}
                {linuxControls}
              </div>
            ) : (
              <div className="terminal-chrome terminal-chrome--plain">
                <span>{title}</span>
                {linuxControls}
              </div>
            ))}
          {separateTabBar && preview.tabsLocation !== "bottom" && tabs}
        </div>
      )}
      {!compact &&
        !linux &&
        preview.titlebar !== "hidden" &&
        !preview.hideDecoration && (
          <div
            className="terminal-window-header"
            style={{ fontFamily: preview.titleFont }}
          >
            <div className="terminal-chrome">
              {!preview.hideButtons && (
                <span className="window-lights" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              )}
              {preview.titlebar === "tabs" ? (
                tabs
              ) : (
                <>
                  {preview.titlebar === "native" && !preview.hideProxy && (
                    <Folder size={12} aria-hidden="true" />
                  )}
                  <span>{title}</span>
                </>
              )}
            </div>
            {preview.titlebar !== "tabs" && tabs}
          </div>
        )}
      <div
        className="terminal-scroll"
        ref={(element) => {
          viewportRef.current = element;
          if (scrollRef) scrollRef.current = element;
        }}
        tabIndex={compact ? undefined : 0}
        id={compact ? undefined : panelId}
        role={compact ? undefined : "tabpanel"}
        aria-label={compact ? undefined : label}
      >
        <pre
          ref={textRef}
          style={
            compact
              ? undefined
              : {
                  fontSize: preview.fontSize
                    ? `${preview.fontSize}px`
                    : undefined,
                  fontFamily: preview.fontFamily,
                  padding: preview.padding,
                }
          }
        >
          <TerminalSample
            sample={!compact && activeTab === "editor" ? "code" : sample}
            compact={compact}
          />
        </pre>
        <div
          className="terminal-palette"
          aria-label={compact ? undefined : "ANSI Palette"}
          aria-hidden={compact || undefined}
        >
          {palette.map((color, index) => (
            <i key={index} style={{ background: color }} />
          ))}
        </div>
      </div>
      {separateTabBar && preview.tabsLocation === "bottom" && (
        <div
          className="terminal-window-header terminal-window-footer"
          style={{ fontFamily: preview.titleFont }}
        >
          {tabs}
        </div>
      )}
    </div>
  );
};
