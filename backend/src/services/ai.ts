import OpenAI from "openai";
import { config } from "../config.js";
import { redactTextWithFields } from "./privacy.js";
import type { TrustDocument } from "../types.js";

export function retrieveDocuments(question: string, documents: TrustDocument[]) {
  const terms = question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2);

  return documents
    .map((document) => {
      const haystack = `${document.title} ${document.summary} ${document.extractedText}`.toLowerCase();
      const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
      return { document, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.document);
}

export async function answerWithVaultContext(question: string, documents: TrustDocument[]) {
  const matches = retrieveDocuments(question, documents);
  const context = matches
    .map((document) => {
      const redactedText = redactTextWithFields(document.extractedText, document.fields);
      return [
        `Title: ${document.title}`,
        `Category: ${document.category}`,
        `Summary: ${document.summary}`,
        `Protected fields: ${document.fields.map((field) => field.label).join(", ") || "none"}`,
        `Redacted excerpt: ${redactedText.slice(0, 1800)}`
      ].join("\n");
    })
    .join("\n\n---\n\n");

  if (!config.openaiApiKey) {
    return {
      answer: localAnswer(question, matches),
      sources: matches.map(sourceForDocument),
      model: "local-privacy-agent",
      usedOpenAI: false
    };
  }

  try {
    const client = new OpenAI({ apiKey: config.openaiApiKey });
    const response = await client.responses.create({
      model: config.openaiModel,
      reasoning: { effort: "low" },
      text: { verbosity: "low" },
      input: [
        {
          role: "system",
          content:
            "You are TrustVault AI, a privacy-first document assistant. Answer only from the provided vault context. Do not reveal full sensitive identifiers. Use redacted values and cite document titles."
        },
        {
          role: "user",
          content: `Question: ${question}\n\nVault context:\n${context || "No matching documents."}`
        }
      ]
    } as never);

    return {
      answer: response.output_text || localAnswer(question, matches),
      sources: matches.map(sourceForDocument),
      model: config.openaiModel,
      usedOpenAI: true
    };
  } catch (error) {
    console.warn(`OpenAI fallback: ${error instanceof Error ? error.message.slice(0, 180) : String(error).slice(0, 180)}`);
    return {
      answer: `${localAnswer(question, matches)}\n\nAI provider fallback: The private local answer path was used because the hosted model was unavailable.`,
      sources: matches.map(sourceForDocument),
      model: "local-fallback",
      usedOpenAI: false
    };
  }
}

function localAnswer(question: string, matches: TrustDocument[]) {
  if (matches.length === 0) {
    return `I could not find a matching document for "${question}". Upload or index the document first, then ask again.`;
  }

  const first = matches[0];
  const protectedLabels = [...new Set(first.fields.map((field) => field.label))];
  return [
    `I found the strongest match in "${first.title}".`,
    first.summary,
    protectedLabels.length
      ? `Sensitive data is protected: ${protectedLabels.join(", ")}. I will use redacted values unless you create a selective disclosure grant.`
      : "No high-confidence sensitive fields were detected in this document."
  ].join(" ");
}

function sourceForDocument(document: TrustDocument) {
  return {
    id: document.id,
    title: document.title,
    category: document.category,
    fields: document.fields.length
  };
}
