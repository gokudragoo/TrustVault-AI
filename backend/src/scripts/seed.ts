import { store } from "../lib/store.js";
import { categorizeDocument, detectSensitiveFields, summarizeDocument, textPreview } from "../services/privacy.js";

const sampleText = `
Income Certificate
Name: Rahul Sharma
PAN: ABCDE1234F
Aadhaar Number: 1234 5678 9012
Address: 42 MG Road, Bengaluru, Karnataka 560001
Annual Income: INR 9 lakh per annum
Email: rahul@example.com
Phone: 9876543210
`;

await store.init();
const state = await store.getState();

if (!state.documents.some((document) => document.fileName === "sample-income-certificate.txt")) {
  const fields = detectSensitiveFields(sampleText);
  const document = await store.addDocument(
    {
      title: "Rahul Income Certificate",
      fileName: "sample-income-certificate.txt",
      mimeType: "text/plain",
      size: Buffer.byteLength(sampleText),
      category: categorizeDocument("sample-income-certificate.txt", sampleText),
      extractedText: sampleText,
      textPreview: textPreview(sampleText, fields),
      summary: summarizeDocument(sampleText, fields),
      fields
    },
    Buffer.from(sampleText)
  );
  await store.addAudit({
    actor: "seed",
    action: "Created demo encrypted document",
    resource: document.title,
    status: "allowed",
    metadata: { documentId: document.id }
  });
}

console.log("Seed complete");
