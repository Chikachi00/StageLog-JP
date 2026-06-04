import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SeatInfo, Venue } from "../types/event";
import type { SeatMapSection } from "../types/seatMap";
import {
  findMatchingSection,
  getSeatMapByVenueId,
  getSectionCenter,
} from "../utils/seatMapUtils";
import { SeatMapRenderer } from "./SeatMapRenderer";
import { VenueThumbnail } from "./VenueThumbnail";

interface SeatPickerProps {
  venue: Venue;
  seat: SeatInfo;
  onChange: (seat: SeatInfo) => void;
}

const roundCoordinate = (value: number) => Math.round(value * 10) / 10;

export function SeatPicker({ venue, seat, onChange }: SeatPickerProps) {
  const { t } = useTranslation();
  const [suppressedAutoSectionId, setSuppressedAutoSectionId] = useState<string | undefined>();
  const seatMap = useMemo(() => getSeatMapByVenueId(venue.id), [venue.id]);
  const matchedSection = useMemo(
    () => (seatMap ? findMatchingSection(seatMap, seat) : undefined),
    [seat.gate, seat.level, seat.block, seat.row, seat.number, seatMap],
  );
  const selectedSectionId = seat.sectionId ?? matchedSection?.id;
  const hasMarker = typeof seat.x === "number" && typeof seat.y === "number";

  useEffect(() => {
    setSuppressedAutoSectionId(undefined);
  }, [seat.gate, seat.level, seat.block, seat.row, seat.number]);

  useEffect(() => {
    if (
      !seatMap ||
      !matchedSection ||
      hasMarker ||
      seat.sectionId === matchedSection.id ||
      suppressedAutoSectionId === matchedSection.id
    ) {
      return;
    }

    const center = getSectionCenter(matchedSection);
    onChange({
      ...seat,
      sectionId: matchedSection.id,
      sectionLabel: matchedSection.label,
      x: roundCoordinate(center.x),
      y: roundCoordinate(center.y),
    });
  }, [hasMarker, matchedSection, onChange, seat, seatMap, suppressedAutoSectionId]);

  if (!seatMap) {
    return (
      <div className="seat-picker seat-picker--empty">
        <div className="seat-picker__heading">
          <div>
            <span className="eyebrow">{t("seatMap.title")}</span>
            <strong>{venue.name}</strong>
          </div>
        </div>
        <VenueThumbnail venue={venue} />
        <p>{t("venues.detailedSeatMapNotAvailable")}</p>
      </div>
    );
  }

  const marker = hasMarker
    ? [
        {
          id: "current-seat",
          x: seat.x ?? 0,
          y: seat.y ?? 0,
          label: "1",
        },
      ]
    : [];

  const updateSection = (section: SeatMapSection) => {
    onChange({
      ...seat,
      sectionId: section.id,
      sectionLabel: section.label,
    });
  };

  const updateMarker = (x: number, y: number, sectionId?: string) => {
    const section = sectionId ? seatMap.sections.find((item) => item.id === sectionId) : undefined;

    onChange({
      ...seat,
      sectionId: section?.id,
      sectionLabel: section?.label,
      x,
      y,
    });
  };

  const clearMarker = () => {
    setSuppressedAutoSectionId(matchedSection?.id);
    onChange({
      ...seat,
      sectionId: undefined,
      sectionLabel: undefined,
      x: undefined,
      y: undefined,
    });
  };

  return (
    <div className="seat-picker">
      <div className="seat-picker__heading">
        <div>
          <span className="eyebrow">{t("seatMap.title")}</span>
          <strong>{venue.name}</strong>
        </div>
        {hasMarker || seat.sectionId ? (
          <button className="ghost-button" type="button" onClick={clearMarker}>
            <X size={16} aria-hidden="true" />
            {t("seatMap.clearMarker")}
          </button>
        ) : null}
      </div>

      <p className="seat-picker__hint">{t("seatMap.enterBlockHint")}</p>

      {matchedSection ? (
        <p className="seat-picker__match">
          {t("seatMap.matchedSection")}: <strong>{matchedSection.label}</strong>
        </p>
      ) : null}

      <SeatMapRenderer
        editable
        markers={marker}
        seatMap={seatMap}
        selectedSectionId={selectedSectionId}
        onMarkerChange={updateMarker}
        onSectionSelect={updateSection}
      />

      <p className="seat-picker__hint">
        {hasMarker ? t("seatMap.markerSaved") : t("seatMap.clickToSave")}
      </p>
    </div>
  );
}
