import { CloudSun, Image, MapPinned, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { EventRecord } from "../types/event";
import { formatDateTime } from "../utils/dateUtils";
import { weatherCodeToKey } from "../utils/weatherUtils";
import { BarcodeDecoration } from "./BarcodeDecoration";

interface TicketCardProps {
  event: EventRecord;
  isFetchingWeather: boolean;
  weatherError?: string;
  hasSeatMap?: boolean;
  onEdit: (event: EventRecord) => void;
  onDelete: (id: string) => void;
  onFetchWeather: (event: EventRecord) => void;
  onViewVenueMap?: (venueId: string) => void;
}

const compactSeat = (event: EventRecord) => {
  // Kept for fallback in places where translation is not available.
  const seat = event.seat ?? {};
  const parts = [
    seat.gate ? `Gate ${seat.gate}` : "",
    seat.level,
    seat.block ? `Block ${seat.block}` : "",
    seat.row ? `Row ${seat.row}` : "",
    seat.number ? `Seat ${seat.number}` : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : "Seat not recorded";
};

export function TicketCard({
  event,
  isFetchingWeather,
  weatherError,
  hasSeatMap,
  onEdit,
  onDelete,
  onFetchWeather,
  onViewVenueMap,
}: TicketCardProps) {
  const { t } = useTranslation();
  const seat = event.seat ?? {};
  const notesPreview =
    event.notes.length > 110 ? `${event.notes.slice(0, 110).trim()}...` : event.notes;
  const seatParts = [
    seat.gate ? t("seat.gatePrefix", { value: seat.gate }) : "",
    seat.level,
    seat.block ? t("seat.blockPrefix", { value: seat.block }) : "",
    seat.row ? t("seat.rowPrefix", { value: seat.row }) : "",
    seat.number ? t("seat.seatPrefix", { value: seat.number }) : "",
  ].filter(Boolean);
  const seatLabel = seatParts.length > 0 ? seatParts.join(" / ") : t("seat.notRecorded");
  const weatherSummary = event.weather
    ? `${event.weather.temperature.toFixed(1)}°C · ${t(weatherCodeToKey(event.weather.weatherCode))} ${event.weather.precipitation.toFixed(1)}mm · ${t("weather.wind")} ${event.weather.windSpeed.toFixed(1)}km/h`
    : "";

  return (
    <article className="ticket-card">
      <div className="ticket-card__accent" aria-hidden="true" />
      <div className="ticket-card__main">
        <div className="ticket-card__topline">
          <span className="ticket-card__category">{event.ticketType || t("ticketCard.liveArchive")}</span>
          <span>{formatDateTime(event.date, event.startTime)}</span>
        </div>
        {event.imageUrl ? (
          <img className="ticket-card__cover" src={event.imageUrl} alt={t("ticketCard.coverAlt", { title: event.title })} />
        ) : (
          <div className="ticket-card__cover ticket-card__cover--empty" aria-hidden="true">
            <Image size={22} />
          </div>
        )}
        <h3>{event.title}</h3>
        <p className="ticket-card__artist">{event.artist}</p>

        <div className="ticket-card__details">
          <div>
            <span>{t("ticketCard.venue")}</span>
            <strong>{event.venueName}</strong>
            <small>
              {event.city}, {event.country}
            </small>
          </div>
          <div>
            <span>{t("ticketCard.seat")}</span>
            <strong>{seatLabel || compactSeat(event)}</strong>
            {seat.sectionLabel ? (
              <small>
                {t("seatMap.section")}: {seat.sectionLabel}
              </small>
            ) : null}
          </div>
        </div>

        {event.weather ? (
          <p className="weather-pill">{weatherSummary}</p>
        ) : (
          <p className="weather-pill weather-pill--empty">{t("ticketCard.noWeather")}</p>
        )}

        {notesPreview ? <p className="ticket-card__notes">{notesPreview}</p> : null}
        {hasSeatMap && typeof seat.x === "number" && typeof seat.y === "number" ? (
          <div className="seat-saved-pill">
            <MapPinned size={16} aria-hidden="true" />
            <span>{t("seatMap.positionSaved")}</span>
            {onViewVenueMap ? (
              <button type="button" onClick={() => onViewVenueMap(event.venueId)}>
                {t("seatMap.viewOnMap")}
              </button>
            ) : null}
          </div>
        ) : null}
        {weatherError ? <p className="ticket-card__error">{weatherError}</p> : null}
      </div>

      <div className="ticket-card__stub">
        <BarcodeDecoration label={event.id.slice(0, 8).toUpperCase()} />
        <div className="ticket-card__actions">
          <button className="icon-button" type="button" onClick={() => onEdit(event)}>
            <Pencil size={16} aria-hidden="true" />
            {t("common.edit")}
          </button>
          <button className="icon-button" type="button" onClick={() => onDelete(event.id)}>
            <Trash2 size={16} aria-hidden="true" />
            {t("common.delete")}
          </button>
          <button
            className="icon-button icon-button--weather"
            type="button"
            disabled={isFetchingWeather}
            onClick={() => onFetchWeather(event)}
          >
            <CloudSun size={16} aria-hidden="true" />
            {isFetchingWeather ? t("ticketCard.fetching") : t("ticketCard.fetchWeather")}
          </button>
        </div>
      </div>
    </article>
  );
}
