interface BarcodeDecorationProps {
  label?: string;
}

export function BarcodeDecoration({ label = "STAGELOG JP" }: BarcodeDecorationProps) {
  return (
    <div className="barcode-decoration" aria-hidden="true">
      <span />
      <small>{label}</small>
    </div>
  );
}
