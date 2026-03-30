type ResizeGuideOverlayProps = {
  topPx: number;
  label: string;
};

/** Linea orizzontale + etichetta orario (coordinate = griglia giorno). */
export function ResizeGuideOverlay({ topPx, label }: ResizeGuideOverlayProps) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: topPx,
        transform: "translateY(-50%)",
        pointerEvents: "none",
        zIndex: 6,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div style={{ flex: 1, height: 2, background: "rgba(125, 211, 252, 0.95)", boxShadow: "0 0 6px rgba(56, 189, 248, 0.6)" }} />
      <span
        style={{
          flexShrink: 0,
          fontSize: 11,
          fontWeight: 700,
          padding: "2px 8px",
          borderRadius: 6,
          background: "rgba(15, 23, 42, 0.92)",
          color: "#e0f2fe",
          border: "1px solid rgba(56, 189, 248, 0.5)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
