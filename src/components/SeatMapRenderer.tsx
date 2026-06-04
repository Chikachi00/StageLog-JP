import type { CSSProperties, MouseEvent } from "react";
import type { SeatMapDefinition, SeatMapMarker, SeatMapSection } from "../types/seatMap";
import { getSectionCenter } from "../utils/seatMapUtils";

interface SeatMapRendererProps {
  seatMap: SeatMapDefinition;
  selectedSectionId?: string;
  markers?: SeatMapMarker[];
  editable?: boolean;
  onSectionSelect?: (section: SeatMapSection) => void;
  onMarkerChange?: (x: number, y: number, sectionId?: string) => void;
}

const fallbackColorByType: Record<SeatMapSection["type"], string> = {
  arena: "#d9e9f6",
  stand: "#e8f1df",
  stage: "#25313b",
  level: "#f4ead8",
  block: "#d9e9f6",
  gate: "#efe4f4",
  other: "#edf1f5",
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function SeatMapRenderer({
  seatMap,
  selectedSectionId,
  markers = [],
  editable = false,
  onSectionSelect,
  onMarkerChange,
}: SeatMapRendererProps) {
  const handleMapClick = (event: MouseEvent<SVGSVGElement>) => {
    if (!editable || !onMarkerChange) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100);
    onMarkerChange(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
  };

  const handleSectionClick = (event: MouseEvent<SVGElement>, section: SeatMapSection) => {
    event.stopPropagation();

    if (section.type === "stage") {
      return;
    }

    onSectionSelect?.(section);

    if (editable && onMarkerChange) {
      const center = getSectionCenter(section);
      onMarkerChange(Math.round(center.x * 10) / 10, Math.round(center.y * 10) / 10, section.id);
    }
  };

  const renderSection = (section: SeatMapSection) => {
    const isSelected = selectedSectionId === section.id;
    const className = [
      "seat-map-section",
      `seat-map-section--${section.type}`,
      isSelected ? "is-selected" : "",
      editable && section.type !== "stage" ? "is-clickable" : "",
    ]
      .filter(Boolean)
      .join(" ");
    const commonProps = {
      className,
      fill: section.color ?? fallbackColorByType[section.type],
      onClick: (event: MouseEvent<SVGElement>) => handleSectionClick(event, section),
    };
    const center = getSectionCenter(section);

    return (
      <g key={section.id}>
        <title>{section.label}</title>
        {section.shape === "ellipse" ? (
          <ellipse
            {...commonProps}
            cx={section.x}
            cy={section.y}
            rx={(section.width ?? 10) / 2}
            ry={(section.height ?? 10) / 2}
          />
        ) : section.shape === "polygon" && section.points ? (
          <polygon {...commonProps} points={section.points} />
        ) : (
          <rect
            {...commonProps}
            height={section.height ?? 8}
            rx={section.type === "stage" ? 1.8 : 1.2}
            width={section.width ?? 12}
            x={section.x}
            y={section.y}
          />
        )}
        <text
          className={`seat-map-label ${section.type === "stage" ? "seat-map-label--stage" : ""}`}
          x={center.x}
          y={center.y}
        >
          {section.label}
        </text>
      </g>
    );
  };

  return (
    <div className="seat-map-renderer">
      <svg
        aria-label={seatMap.name}
        className="seat-map-svg"
        onClick={handleMapClick}
        role="img"
        viewBox={seatMap.viewBox}
      >
        <rect className="seat-map-backdrop" height="100" rx="4" width="100" x="0" y="0" />
        {seatMap.sections.map(renderSection)}
        {markers.map((marker, index) => (
          <g className="seat-map-marker" key={marker.id} style={{ "--marker-color": marker.color } as CSSProperties}>
            <title>{marker.label ?? `#${index + 1}`}</title>
            <circle cx={marker.x} cy={marker.y} r="2.25" />
            <text x={marker.x} y={marker.y}>
              {marker.label ?? index + 1}
            </text>
          </g>
        ))}
      </svg>
      {seatMap.description ? <p className="seat-map-description">{seatMap.description}</p> : null}
    </div>
  );
}
