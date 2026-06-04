import { Image } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Venue } from "../types/event";

interface VenueThumbnailProps {
  venue: Venue;
  className?: string;
}

export function VenueThumbnail({ venue, className = "" }: VenueThumbnailProps) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);

  if (!venue.thumbnailSvg || failed) {
    return (
      <div className={`venue-thumbnail venue-thumbnail--fallback ${className}`}>
        <Image size={22} aria-hidden="true" />
        <span>{venue.name}</span>
        <small>{t("venues.thumbnailFallback")}</small>
      </div>
    );
  }

  return (
    <div className={`venue-thumbnail ${className}`}>
      <img
        loading="lazy"
        src={venue.thumbnailSvg}
        alt={t("venues.thumbnailAlt", { name: venue.name })}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
