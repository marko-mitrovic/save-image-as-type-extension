chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "parent_convert",
    title: "Save Image As Type...",
    contexts: ["image"]
  });

const formats = [
  { id: "convert_jpg", title: "JPG Image (.jpg)" },
  { id: "convert_png", title: "PNG Image (.png)" },
  { id: "convert_webp", title: "WebP Image (.webp)" },
  { id: "convert_pdf", title: "PDF Document (.pdf)" }
];

  formats.forEach(format => {
    chrome.contextMenus.create({
      id: format.id,
      parentId: "parent_convert",
      title: format.title,
      contexts: ["image"]
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const srcUrl = info.srcUrl;
  let targetFormat = "png";

  if (info.menuItemId === "convert_jpg") targetFormat = "jpeg";
  if (info.menuItemId === "convert_webp") targetFormat = "webp";
  if (info.menuItemId === "convert_pdf") targetFormat = "pdf";

  await ensureOffscreenDocument();

  chrome.runtime.sendMessage({
    action: "convertImage",
    srcUrl: srcUrl,
    format: targetFormat
  });
});

async function ensureOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });

  if (existingContexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['BLOBS'],
      justification: 'Konvertovanje slike preko Offscreen Canvas API-ja'
    });
  }
}

// Preuzimanje konvertovane slike
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "downloadImage") {
    chrome.downloads.download({
      url: message.dataUrl,
      filename: message.filename,
      saveAs: true
    });
  }
});