export const downloadSvgFile = (svgString: string, filename: string) => {
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const downloadPngFromSvg = (svgString: string, filename: string, width = 1080, height = 1350) =>
  new Promise<void>((resolve, reject) => {
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Canvas is not available.");
        }

        canvas.width = width;
        canvas.height = height;
        context.drawImage(image, 0, 0, width, height);

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);

          if (!blob) {
            reject(new Error("PNG export failed."));
            return;
          }

          const pngUrl = URL.createObjectURL(blob);
          const anchor = document.createElement("a");

          anchor.href = pngUrl;
          anchor.download = filename;
          document.body.append(anchor);
          anchor.click();
          anchor.remove();
          URL.revokeObjectURL(pngUrl);
          resolve();
        }, "image/png");
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to load SVG for PNG export."));
    };

    image.src = url;
  });

export const copyTextToClipboard = async (value: string) => {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard API is not available.");
  }

  await navigator.clipboard.writeText(value);
};
