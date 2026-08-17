chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "convertImage") {
    processImage(message.srcUrl, message.format);
  }
});

async function processImage(srcUrl, format) {
  try {
    const response = await fetch(srcUrl);
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();

    const img = await loadImageFromBlob(blob);

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width || 300;
    canvas.height = img.naturalHeight || img.height || 150;

    const ctx = canvas.getContext("2d");

    if (format === "jpeg" || format === "pdf") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

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
    console.error("Image conversion error:", error.name, "-", error.message);
  }
}

function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image from blob"));
    };
    img.src = url;
  });
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