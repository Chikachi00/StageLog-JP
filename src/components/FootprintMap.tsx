import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { useTranslation } from "react-i18next";
import type { FootprintPoint } from "../utils/footprintMapUtils";
import { formatFootprintPopupTime } from "../utils/footprintMapUtils";
import { formatDate } from "../utils/dateUtils";
import { weatherCodeToKey } from "../utils/weatherUtils";

interface FootprintMapProps {
  points: FootprintPoint[];
}

const DEFAULT_CENTER: [number, number] = [35, 125];
const DEFAULT_ZOOM = 4;

function FitFootprintBounds({ points }: { points: FootprintPoint[] }) {
  const map = useMap();

  useEffect(() => {
    window.setTimeout(() => map.invalidateSize(), 0);

    if (points.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    const bounds = L.latLngBounds(points.map((point) => [point.latitude, point.longitude]));
    map.fitBounds(bounds, {
      maxZoom: points.length === 1 ? 10 : 8,
      padding: [40, 40],
    });
  }, [map, points]);

  return null;
}

const createMarkerIcon = (point: FootprintPoint) =>
  L.divIcon({
    className: "",
    html: `<span class="footprint-marker footprint-marker--${point.isUpcoming ? "upcoming" : "completed"}"></span>`,
    iconAnchor: [9, 9],
    iconSize: [18, 18],
    popupAnchor: [0, -10],
  });

export function FootprintMap({ points }: FootprintMapProps) {
  const { t } = useTranslation();
  const markerIcons = useMemo(
    () =>
      points.reduce<Record<string, L.DivIcon>>((result, point) => {
        result[point.eventId] = createMarkerIcon(point);
        return result;
      }, {}),
    [points],
  );

  return (
    <div className="footprint-map-container">
      <MapContainer
        attributionControl
        center={DEFAULT_CENTER}
        className="footprint-map"
        scrollWheelZoom
        zoom={DEFAULT_ZOOM}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitFootprintBounds points={points} />
        {points.map((point) => {
          const time = formatFootprintPopupTime(point.doorsOpenTime, point.startTime, {
            doors: t("footprint.doors"),
            start: t("footprint.start"),
          });
          const weather = point.weatherCode !== undefined ? t(weatherCodeToKey(point.weatherCode)) : "";

          return (
            <Marker
              icon={markerIcons[point.eventId]}
              key={point.eventId}
              position={[point.latitude, point.longitude]}
            >
              <Popup className="footprint-popup">
                <div>
                  <strong>{point.title}</strong>
                  <p>
                    {[point.artist, point.venueName].filter(Boolean).join(" · ")}
                  </p>
                  <dl>
                    <dt>{t("footprint.date")}</dt>
                    <dd>{formatDate(point.date)}</dd>
                    <dt>{t("footprint.location")}</dt>
                    <dd>{[point.city, point.country].filter(Boolean).join(", ")}</dd>
                    {time.doors ? (
                      <>
                        <dt>{t("footprint.doors")}</dt>
                        <dd>{time.doors.replace(`${t("footprint.doors")}: `, "")}</dd>
                      </>
                    ) : null}
                    {time.start ? (
                      <>
                        <dt>{t("footprint.start")}</dt>
                        <dd>{time.start.replace(`${t("footprint.start")}: `, "")}</dd>
                      </>
                    ) : null}
                    {weather || typeof point.temperature === "number" ? (
                      <>
                        <dt>{t("footprint.weather")}</dt>
                        <dd>
                          {[weather, typeof point.temperature === "number" ? `${point.temperature.toFixed(1)}°C` : ""]
                            .filter(Boolean)
                            .join(" / ")}
                        </dd>
                      </>
                    ) : null}
                  </dl>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
