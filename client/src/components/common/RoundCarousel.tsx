import React, { useEffect, useRef, useState } from "react";

export interface RoundCarouselImage {
  src: string;
  alt?: string;
}

export interface RoundCarouselProps {
  images?: RoundCarouselImage[];
  imageWidth?: number;
  imageHeight?: number;
  spacing?: number;
  speed?: number;
  direction?: "right" | "left";
  drag?: boolean;
  sensitivity?: number;
  tilt?: number;
  perspective?: number;
  cornerRadius?: number;
  innerDim?: number;
  background?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const WATCHTOGETHER_CAROUSEL_IMAGES: RoundCarouselImage[] = [
  {
    src: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80",
    alt: "Movie Theater Cinema Screen and Seating",
  },
  {
    src: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
    alt: "Cinema Popcorn and Movie Tickets",
  },
  {
    src: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=600&q=80",
    alt: "Streaming Watch Party on Screen",
  },
  {
    src: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
    alt: "Classic Cinematic Theater Hall",
  },
  {
    src: "https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?auto=format&fit=crop&w=600&q=80",
    alt: "Friends Watching Movies and Laughing Together",
  },
  {
    src: "https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&w=600&q=80",
    alt: "Fresh Popcorn Bucket for Movie Night",
  },
  {
    src: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=600&q=80",
    alt: "Cozy Home Projector Cinema Night",
  },
  {
    src: "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=600&q=80",
    alt: "Friends Together Enjoying Live Stream Party",
  },
];

export default function RoundCarousel({
  images = WATCHTOGETHER_CAROUSEL_IMAGES,
  imageWidth = 250,
  imageHeight = 310,
  spacing = 3,
  speed = 2.5,
  direction = "right",
  drag = true,
  sensitivity = 4,
  tilt = -6,
  perspective = 2200,
  cornerRadius = 22,
  innerDim = 3,
  background = "transparent",
  style = {},
  className = "",
}: RoundCarouselProps) {
  const items = images && images.length > 0 ? images : WATCHTOGETHER_CAROUSEL_IMAGES;
  const count = items.length;

  const [isDragging, setIsDragging] = useState(false);
  const [dimensions, setDimensions] = useState({ width: imageWidth, height: imageHeight });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const ringRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const rotYRef = useRef(0);
  const velRef = useRef(0);
  const lastRef = useRef(0);
  const dragRef = useRef({ active: false, x: 0, y: 0, isHorizontal: false });
  const isHoveredRef = useRef(false);

  // Responsive dimension scaling
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 480) {
        setDimensions({
          width: Math.round(imageWidth * 0.65),
          height: Math.round(imageHeight * 0.65),
        });
      } else if (w < 768) {
        setDimensions({
          width: Math.round(imageWidth * 0.8),
          height: Math.round(imageHeight * 0.8),
        });
      } else if (w < 1024) {
        setDimensions({
          width: Math.round(imageWidth * 0.9),
          height: Math.round(imageHeight * 0.9),
        });
      } else {
        setDimensions({ width: imageWidth, height: imageHeight });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [imageWidth, imageHeight]);

  // Respect user preference for reduced motion
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const currentWidth = dimensions.width;
  const currentHeight = dimensions.height;

  const angle = 360 / count;
  const factor = 1 + spacing * 0.15;
  const radius = (currentWidth * factor) / (2 * Math.tan(Math.PI / count));
  const radiusPx = cornerRadius;
  const degPerSec = speed * 6 * (direction === "left" ? -1 : 1);

  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;

    const apply = () => {
      ring.style.transform = `translateZ(${-radius}px) rotateY(${rotYRef.current}deg)`;
    };
    apply();

    const draw = (now: number) => {
      const dt = lastRef.current ? (now - lastRef.current) / 1000 : 0;
      lastRef.current = now;
      const f = Math.min(dt, 0.1);
      const d = dragRef.current;

      if (!d.active) {
        if (Math.abs(velRef.current) > 0.01) {
          rotYRef.current += velRef.current * f;
          velRef.current *= 0.94;
        } else if (!isHoveredRef.current && !prefersReducedMotion) {
          rotYRef.current += degPerSec * f;
        }
      }

      apply();
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [radius, degPerSec, count, prefersReducedMotion]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!drag) return;
    dragRef.current = {
      active: true,
      x: e.clientX,
      y: e.clientY,
      isHorizontal: false,
    };
    velRef.current = 0;
    setIsDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.active) return;

    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;

    // Determine gesture direction on touch
    if (!d.isHorizontal) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5) {
        d.isHorizontal = true;
        try {
          e.currentTarget.setPointerCapture?.(e.pointerId);
        } catch {
          // ignore
        }
      } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 5) {
        // Vertical scroll intent detected, allow native page scroll
        d.active = false;
        setIsDragging(false);
        return;
      }
    }

    d.x = e.clientX;
    d.y = e.clientY;
    const k = 0.3 * sensitivity;
    rotYRef.current += dx * k;
    velRef.current = dx * k * 60;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
    dragRef.current.active = false;
    dragRef.current.isHorizontal = false;
    setIsDragging(false);
  };

  const faceBase: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: radiusPx,
    overflow: "hidden",
    backfaceVisibility: "hidden",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div
      className={`round-carousel-container select-none ${className}`}
      style={{
        ...style,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background,
        perspective: `${perspective}px`,
        cursor: drag ? (isDragging ? "grabbing" : "grab") : "default",
        touchAction: "pan-y", // Fix mobile drag so natural vertical page scroll works
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onMouseEnter={() => {
        isHoveredRef.current = true;
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
      }}
      role="region"
      aria-label="Interactive 3D Round Carousel showing watch party scenes"
    >
      <div
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${tilt}deg)`,
        }}
      >
        <div
          ref={ringRef}
          style={{
            position: "relative",
            width: currentWidth,
            height: currentHeight,
            transformStyle: "preserve-3d",
          }}
        >
          {items.map((img, i) => {
            const src = img?.src;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: `rotateY(${i * angle}deg) translateZ(${radius}px)`,
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Front Face */}
                <div
                  style={{
                    ...faceBase,
                    backgroundColor: src ? "transparent" : "#1e1b4b",
                    backgroundImage: src ? `url(${src})` : undefined,
                    boxShadow: "0 12px 35px -8px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.12)",
                  }}
                >
                  {/* Subtle cinema vignette gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />
                </div>

                {/* Back Face */}
                <div
                  style={{
                    ...faceBase,
                    transform: "rotateY(180deg)",
                    backgroundColor: src ? "transparent" : "#0f172a",
                    backgroundImage: src ? `url(${src})` : undefined,
                    filter: `brightness(${innerDim / 10})`,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
