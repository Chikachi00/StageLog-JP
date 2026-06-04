import { MapPin, X } from "lucide-react";
import type { MouseEvent } from "react";
import type { SeatInfo, Venue } from "../types/event";

interface SeatPickerProps {
  venue: Venue;
  seat: SeatInfo;
  onChange: (seat: SeatInfo) => void;
}

const clampPercentage = (value: number) => Math.max(0, Math.min(100, value));

export function SeatPicker({ venue, seat, onChange }: SeatPickerProps) {
  if (!venue.supportedSeatMap || !venue.mapSvg) {
    return null;
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clampPercentage(((event.clientX - rect.left) / rect.width) * 100);
    const y = clampPercentage(((event.clientY - rect.top) / rect.height) * 100);

    onChange({
      ...seat,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
    });
  };

  const hasMarker = typeof seat.x === "number" && typeof seat.y === "number";

  return (
    <div className="seat-picker">
      <div className="seat-picker__heading">
        <div>
          <span className="eyebrow">Seat map</span>
          <strong>{venue.name}</strong>
        </div>
        {hasMarker ? (
          <button
            className="ghost-button"
            type="button"
            onClick={() => onChange({ ...seat, x: undefined, y: undefined })}
          >
            <X size={16} aria-hidden="true" />
            Clear seat marker
          </button>
        ) : null}
      </div>
      <button className="seat-map-click-target" type="button" onClick={handleClick}>
        <img src={venue.mapSvg} alt={`${venue.name} simplified seat map`} />
        {hasMarker ? (
          <span className="seat-marker" style={{ left: `${seat.x}%`, top: `${seat.y}%` }}>
            <MapPin size={18} aria-hidden="true" />
          </span>
        ) : null}
      </button>
      <p className="seat-picker__hint">
        Tap the simplified map to save a percentage-based seat position.
      </p>
    </div>
  );
}
