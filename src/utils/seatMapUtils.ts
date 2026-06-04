import { seatMaps } from "../data/seatMaps";
import type { EventRecord, SeatInfo } from "../types/event";
import type { SeatMapDefinition, SeatMapMarker, SeatMapSection } from "../types/seatMap";
import { formatDate } from "./dateUtils";

const normalize = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, "")
    .replace(/[ー－-]/g, "");

const sectionSearchValues = (section: SeatMapSection) => [
  section.id,
  section.label,
  section.labelJa,
  section.labelZh,
  section.level,
  ...(section.aliases ?? []),
];

const sectionMatches = (section: SeatMapSection, rawValue: string) => {
  const value = normalize(rawValue);

  if (!value) {
    return false;
  }

  return sectionSearchValues(section)
    .filter((item): item is string => Boolean(item))
    .some((item) => {
      const normalizedItem = normalize(item);
      return normalizedItem.includes(value) || value.includes(normalizedItem);
    });
};

export const getSeatMapByVenueId = (venueId: string): SeatMapDefinition | undefined =>
  seatMaps.find((seatMap) => seatMap.venueId === venueId);

export const getSelectableSections = (seatMap: SeatMapDefinition) =>
  seatMap.sections.filter((section) => section.type !== "stage");

export const findMatchingSection = (
  seatMap: SeatMapDefinition,
  seatInfo: Pick<SeatInfo, "gate" | "level" | "block" | "row" | "number">,
): SeatMapSection | undefined => {
  const sections = getSelectableSections(seatMap);
  const fields = [seatInfo.block, seatInfo.level, seatInfo.gate, seatInfo.row, seatInfo.number];

  for (const field of fields) {
    if (!field?.trim()) {
      continue;
    }

    const exactMatch = sections.find((section) =>
      sectionSearchValues(section)
        .filter((item): item is string => Boolean(item))
        .some((item) => normalize(item) === normalize(field)),
    );

    if (exactMatch) {
      return exactMatch;
    }

    const fuzzyMatch = sections.find((section) => sectionMatches(section, field));

    if (fuzzyMatch) {
      return fuzzyMatch;
    }
  }

  return undefined;
};

export const getSectionCenter = (section: SeatMapSection) => {
  if (section.shape === "ellipse") {
    return { x: section.x, y: section.y };
  }

  if (section.shape === "polygon" && section.points) {
    const points = section.points
      .trim()
      .split(/\s+/)
      .map((point) => point.split(",").map(Number))
      .filter((point): point is [number, number] => point.length === 2 && point.every(Number.isFinite));

    if (points.length > 0) {
      const total = points.reduce(
        (sum, [x, y]) => ({ x: sum.x + x, y: sum.y + y }),
        { x: 0, y: 0 },
      );

      return { x: total.x / points.length, y: total.y / points.length };
    }
  }

  return {
    x: section.x + (section.width ?? 0) / 2,
    y: section.y + (section.height ?? 0) / 2,
  };
};

export const getEventSeatMapMarker = (
  event: EventRecord,
  seatMap?: SeatMapDefinition,
  index = 0,
): SeatMapMarker | undefined => {
  if (typeof event.seat?.x === "number" && typeof event.seat?.y === "number") {
    return {
      id: event.id,
      eventId: event.id,
      x: event.seat.x,
      y: event.seat.y,
      label: String(index + 1),
    };
  }

  if (event.seat?.sectionId && seatMap) {
    const section = seatMap.sections.find((item) => item.id === event.seat.sectionId);

    if (section) {
      const center = getSectionCenter(section);
      return {
        id: event.id,
        eventId: event.id,
        x: center.x,
        y: center.y,
        label: String(index + 1),
      };
    }
  }

  return undefined;
};

export const formatSeatText = (seat: SeatInfo) =>
  [seat.gate ? `Gate ${seat.gate}` : "", seat.level, seat.block, seat.row ? `Row ${seat.row}` : "", seat.number ? `Seat ${seat.number}` : ""]
    .filter(Boolean)
    .join(" / ");

export const formatMarkerLegend = (event: EventRecord, index: number) =>
  `#${index + 1} ${event.title} / ${formatDate(event.date)}`;
