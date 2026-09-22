"use client";

import { useEffect, useRef, useState } from "react";

export interface PhotoPosition {
  x: number;
  y: number;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

interface PositionableImageProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  position?: PhotoPosition | null;
  /** When provided, the image becomes drag-to-reposition; called once per drag, on release. */
  onPositionChange?: (position: PhotoPosition) => void;
}

/**
 * Renders a cover-fit image whose crop focal point can be dragged when
 * `onPositionChange` is provided. Percentages are stored (not pixels) so the
 * same position works at any render scale — the preview canvas, PDF export,
 * and print page all read the same value.
 */
export function PositionableImage({ src, alt, style, position, onPositionChange }: PositionableImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startY: number; fromX: number; fromY: number } | null>(null);
  const [localPos, setLocalPos] = useState<PhotoPosition>(position || { x: 50, y: 50 });
  const [dragging, setDragging] = useState(false);
  const editable = !!onPositionChange;

  useEffect(() => {
    if (!dragState.current) setLocalPos(position || { x: 50, y: 50 });
  }, [position?.x, position?.y]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!editable || !containerRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, fromX: localPos.x, fromY: localPos.y };
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const deltaXPct = ((e.clientX - dragState.current.startX) / rect.width) * 100;
    const deltaYPct = ((e.clientY - dragState.current.startY) / rect.height) * 100;
    setLocalPos({
      x: clamp(dragState.current.fromX - deltaXPct, 0, 100),
      y: clamp(dragState.current.fromY - deltaYPct, 0, 100),
    });
  };

  const endDrag = () => {
    if (!dragState.current) return;
    dragState.current = null;
    setDragging(false);
    onPositionChange?.(localPos);
  };

  return (
    <div
      ref={containerRef}
      style={{
        ...style,
        position: "relative",
        overflow: "hidden",
        cursor: editable ? (dragging ? "grabbing" : "grab") : undefined,
        touchAction: editable ? "none" : undefined,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${localPos.x}% ${localPos.y}%`,
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
      {editable && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            boxShadow: "inset 0 0 0 2px rgba(102,51,204,0.7)",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
