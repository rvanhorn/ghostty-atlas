import { useEffect, useRef, useState } from "react";
import { Tabs } from "@base-ui/react/tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button.jsx";

export const SegmentedControl = ({
  label,
  value,
  options,
  onValueChange,
  scrollable = false,
}) => {
  const trackRef = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  useEffect(() => {
    if (!scrollable) return;
    const track = trackRef.current;
    const update = () =>
      setEdges({
        left: track.scrollLeft > 1,
        right: track.scrollLeft + track.clientWidth < track.scrollWidth - 1,
      });
    const observer = new ResizeObserver(update);
    observer.observe(track);
    observer.observe(track.firstElementChild);
    track.addEventListener("scroll", update);
    update();
    return () => {
      observer.disconnect();
      track.removeEventListener("scroll", update);
    };
  }, [scrollable]);
  const scroll = (direction) =>
    trackRef.current?.scrollBy({
      left: direction * trackRef.current.clientWidth * 0.7,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  const tabs = (
    <Tabs.Root
      className="segmented-control"
      value={value}
      onValueChange={onValueChange}
    >
      <Tabs.List className="segments" aria-label={label}>
        {options.map(([optionValue, optionLabel]) => (
          <Tabs.Tab
            className="segment"
            value={optionValue}
            key={optionValue}
            onFocus={
              scrollable
                ? (event) =>
                    event.currentTarget.scrollIntoView({
                      block: "nearest",
                      inline: "nearest",
                    })
                : undefined
            }
          >
            {optionLabel}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
  if (!scrollable) return tabs;
  return (
    <div className="segments-carousel">
      <Button
        variant="quiet"
        className="icon-button"
        aria-label="Scroll Configuration Categories Left"
        disabled={!edges.left}
        onClick={() => scroll(-1)}
      >
        <ChevronLeft size={16} />
      </Button>
      <div
        className="segments-track"
        ref={trackRef}
        data-fade-left={edges.left}
        data-fade-right={edges.right}
      >
        {tabs}
      </div>
      <Button
        variant="quiet"
        className="icon-button"
        aria-label="Scroll Configuration Categories Right"
        disabled={!edges.right}
        onClick={() => scroll(1)}
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  );
};
