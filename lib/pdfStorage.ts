import * as Print from "expo-print";
import * as FileSystem from "expo-file-system/legacy";

const GENERATED_PDF_DIR = `${FileSystem.documentDirectory}generated-pdfs/`;
const RETENTION_DAYS = 30;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;
const A4_WIDTH_POINTS = 595;
const A4_HEIGHT_POINTS = 842;

const sanitizeFilePart = (value: string) =>
  String(value || "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

const ensureGeneratedPdfDir = async () => {
  const info = await FileSystem.getInfoAsync(GENERATED_PDF_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(GENERATED_PDF_DIR, { intermediates: true });
  }
};

export const printHtmlToA4Pdf = async (html: string) => {
  return Print.printToFileAsync({
    html,
    width: A4_WIDTH_POINTS,
    height: A4_HEIGHT_POINTS,
  });
};

export const cleanupExpiredGeneratedPdfs = async () => {
  try {
    await ensureGeneratedPdfDir();
    const files = await FileSystem.readDirectoryAsync(GENERATED_PDF_DIR);
    if (!files.length) return;

    const now = Date.now();
    await Promise.all(
      files.map(async (fileName) => {
        if (!fileName.toLowerCase().endsWith(".pdf")) return;
        const fileUri = `${GENERATED_PDF_DIR}${fileName}`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) return;

        const modifiedAtMs = fileInfo.modificationTime ? fileInfo.modificationTime * 1000 : 0;
        if (!modifiedAtMs) return;

        if (now - modifiedAtMs >= RETENTION_MS) {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
        }
      })
    );
  } catch {
    // Best-effort cleanup; do not block user flow.
  }
};

export const persistGeneratedPdf = async (
  sourceUri: string,
  options: {
    type: "invoice" | "bilty";
    identifier?: string;
    createdAt?: string | Date;
  }
) => {
  await ensureGeneratedPdfDir();
  await cleanupExpiredGeneratedPdfs();

  const safeId = sanitizeFilePart(options.identifier || "");
  const createdDate = options.createdAt ? new Date(options.createdAt) : new Date();
  const timestamp = Number.isNaN(createdDate.getTime()) ? Date.now() : createdDate.getTime();

  const fileName = `${options.type}-${safeId || "doc"}-${timestamp}.pdf`;
  const destinationUri = `${GENERATED_PDF_DIR}${fileName}`;

  await FileSystem.copyAsync({ from: sourceUri, to: destinationUri });
  return destinationUri;
};

export const createAndPersistPdfFromHtml = async (
  html: string,
  options: {
    type: "invoice" | "bilty";
    identifier?: string;
    createdAt?: string | Date;
  }
) => {
  const printed = await printHtmlToA4Pdf(html);
  const persistedUri = await persistGeneratedPdf(printed.uri, options);
  return { tempUri: printed.uri, persistedUri };
};
