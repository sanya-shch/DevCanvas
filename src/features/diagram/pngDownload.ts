interface PngExportOptions {
  scale?: number;
}

export async function downloadPng(
  svg: string,
  filename = "diagram.png",
  options: PngExportOptions = {},
): Promise<void> {
  const scale = options.scale ?? 2;

  const svgBlob = new Blob([svg], {
    type: "image/svg+xml;charset=utf-8",
  });

  const url = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();

    image.decoding = "async";
    image.src = url;

    await image.decode();

    const canvas = document.createElement("canvas");

    canvas.width = image.naturalWidth * scale;

    canvas.height = image.naturalHeight * scale;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to create canvas context");
    }

    context.scale(scale, scale);

    context.drawImage(image, 0, 0);

    const pngBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });

    if (!pngBlob) {
      throw new Error("Unable to create PNG blob");
    }

    const downloadUrl = URL.createObjectURL(pngBlob);

    const anchor = document.createElement("a");

    anchor.href = downloadUrl;
    anchor.download = filename;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(downloadUrl);
  } finally {
    URL.revokeObjectURL(url);
  }
}
