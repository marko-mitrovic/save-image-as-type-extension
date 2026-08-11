chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "convertImage") {
    processImage(message.srcUrl, message.format);
  }
});

async function processImage(srcUrl, format) {
  try {
    const response = await fetch(srcUrl);
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);

    const canvas = document.createElement("canvas");
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;

    const ctx = canvas.getContext("2d");

    if (format === "jpeg" || format === "pdf") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(imageBitmap, 0, 0);

    if (format === "pdf") {
      convertToPdf(canvas);
      return;
    }

    const mimeType = `image/${format}`;
    const dataUrl = canvas.toDataURL(mimeType, 0.92);

    const extension = format === "jpeg" ? "jpg" : format;
    const filename = `image_${Date.now()}.${extension}`;

    chrome.runtime.sendMessage({
      action: "downloadImage",
      dataUrl: dataUrl,
      filename: filename
    });
  } catch (error) {
    console.error("Image conversion error:", error);
  }
}

function convertToPdf(canvas) {
  const { jsPDF } = window.jspdf;

  // JPEG at high quality keeps the PDF file size sane
  const imgData = canvas.toDataURL("image/jpeg", 0.95);

  const orientation = canvas.width > canvas.height ? "landscape" : "portrait";

  const pdf = new jsPDF({
    orientation: orientation,
    unit: "px",
    format: [canvas.width, canvas.height]
  });

  pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);

  const dataUrl = pdf.output("datauristring");
  const filename = `image_${Date.now()}.pdf`;

  chrome.runtime.sendMessage({
    action: "downloadImage",
    dataUrl: dataUrl,
    filename: filename
  });
}