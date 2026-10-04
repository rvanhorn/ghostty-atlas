import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ThemeCard } from "../../components/theme-card.jsx";
import { Button } from "../../components/ui/button.jsx";

export const ThemeStrip = ({
  themes,
  sample,
  selectedThemeName,
  savedThemes,
  onSelect,
  onToggleSaved,
  onClearFilters,
  resetKey,
}) => {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const [scrollBounds, setScrollBounds] = useState({
    atStart: true,
    atEnd: false,
  });

  useEffect(() => {
    const viewport = viewportRef.current;
    const updateScrollBounds = () =>
      setScrollBounds({
        atStart: viewport.scrollLeft <= 1,
        atEnd:
          viewport.scrollLeft + viewport.clientWidth >=
          viewport.scrollWidth - 1,
      });
    const observer = new ResizeObserver(updateScrollBounds);
    observer.observe(viewport);
    observer.observe(trackRef.current);
    viewport.addEventListener("scroll", updateScrollBounds, { passive: true });
    return () => {
      observer.disconnect();
      viewport.removeEventListener("scroll", updateScrollBounds);
    };
  }, []);

  useLayoutEffect(() => {
    viewportRef.current.scrollLeft = 0;
  }, [resetKey]);
  useLayoutEffect(() => {
    viewportRef.current
      .querySelector(".theme-card--selected")
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [selectedThemeName]);

  const scrollThemes = (direction) => {
    const viewport = viewportRef.current;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    viewport.scrollBy({
      left: direction * viewport.clientWidth * 0.85,
      behavior: reduceMotion ? "instant" : "smooth",
    });
  };
  const navigateThemes = (event) => {
    const cardButton = event.target.closest(".theme-card-pick");
    if (
      !cardButton ||
      !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
    )
      return;
    const buttons = [
      ...viewportRef.current.querySelectorAll(".theme-card-pick"),
    ];
    const currentIndex = buttons.indexOf(cardButton);
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : Math.max(
              0,
              Math.min(
                buttons.length - 1,
                currentIndex + (event.key === "ArrowRight" ? 1 : -1),
              ),
            );
    event.preventDefault();
    if (themes[nextIndex]) onSelect(themes[nextIndex]);
    buttons[nextIndex]?.focus({ preventScroll: true });
    buttons[nextIndex]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  return (
    <section className="theme-strip" aria-label="Theme Catalog">
      <Button
        variant="quiet"
        className="theme-strip-arrow"
        aria-label="Scroll Themes Left"
        disabled={scrollBounds.atStart}
        onClick={() => scrollThemes(-1)}
      >
        <ChevronLeft size={18} />
      </Button>
      <div
        className="theme-strip-viewport"
        data-fade-left={!scrollBounds.atStart}
        data-fade-right={!scrollBounds.atEnd}
        ref={viewportRef}
        onKeyDown={navigateThemes}
      >
        <div className="theme-strip-track" ref={trackRef}>
          {themes.map((theme) => (
            <ThemeCard
              key={theme.name}
              theme={theme}
              sample={sample}
              selected={theme.name === selectedThemeName}
              saved={savedThemes.includes(theme.name)}
              onSelect={onSelect}
              onToggleSaved={onToggleSaved}
            />
          ))}
        </div>
        {!themes.length && (
          <div className="empty-state">
            <h2>No Matching Themes</h2>
            <p>Try another search or clear your filters.</p>
            <Button onClick={onClearFilters}>Clear Search and Filters</Button>
          </div>
        )}
      </div>
      <Button
        variant="quiet"
        className="theme-strip-arrow"
        aria-label="Scroll Themes Right"
        disabled={scrollBounds.atEnd}
        onClick={() => scrollThemes(1)}
      >
        <ChevronRight size={18} />
      </Button>
    </section>
  );
};
