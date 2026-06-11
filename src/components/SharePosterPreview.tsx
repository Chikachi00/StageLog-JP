import { useTranslation } from "react-i18next";

interface SharePosterPreviewProps {
  svgString: string;
  isEmpty: boolean;
  emptyMessage: string;
}

export function SharePosterPreview({ svgString, isEmpty, emptyMessage }: SharePosterPreviewProps) {
  const { t } = useTranslation();

  return (
    <section className="share-poster-modal__preview" aria-label={t("sharePoster.preview")}>
      <div className="poster-preview-frame">
        {isEmpty ? (
          <div className="poster-preview-empty">
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <div className="poster-preview-svg" dangerouslySetInnerHTML={{ __html: svgString }} />
        )}
      </div>
    </section>
  );
}
