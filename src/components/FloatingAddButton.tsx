import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AppView } from "./Header";

interface FloatingAddButtonProps {
  onNavigate: (view: AppView) => void;
}

export function FloatingAddButton({ onNavigate }: FloatingAddButtonProps) {
  const { t } = useTranslation();

  return (
    <button className="floating-add-button" type="button" onClick={() => onNavigate("add")}>
      <Plus size={20} aria-hidden="true" />
      <span>{t("mobile.add")}</span>
    </button>
  );
}
