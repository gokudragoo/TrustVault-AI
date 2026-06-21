export async function extractDocumentText(buffer: Buffer, mimeType: string, fileName: string) {
  if (mimeType.startsWith("text/")) {
    return buffer.toString("utf8");
  }

  if (mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
    try {
      const pdfModule = (await import("pdf-parse")) as unknown as {
        default?: (input: Buffer) => Promise<{ text: string }>;
        PDFParse?: new (options: { data: Buffer }) => {
          getText: () => Promise<{ text: string }>;
          destroy: () => Promise<void>;
        };
      };
      if (pdfModule.PDFParse) {
        const parser = new pdfModule.PDFParse({ data: buffer });
        const parsed = await parser.getText();
        await parser.destroy();
        return parsed.text;
      }
      if (!pdfModule.default) throw new Error("Unsupported pdf-parse export");
      const parsed = await pdfModule.default(buffer);
      return parsed.text;
    } catch (error) {
      return fallbackText(buffer, `PDF extraction failed: ${formatError(error)}`);
    }
  }

  if (mimeType.startsWith("image/")) {
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const result = await worker.recognize(buffer);
      await worker.terminate();
      return result.data.text;
    } catch (error) {
      return fallbackText(buffer, `OCR failed: ${formatError(error)}`);
    }
  }

  return fallbackText(buffer, "Unsupported file type; stored securely with limited text indexing.");
}

function fallbackText(buffer: Buffer, reason: string) {
  const ascii = buffer
    .toString("utf8")
    .replace(/[^\x20-\x7E\n\r\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2000);
  return `${reason}\n${ascii}`;
}

function formatError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
