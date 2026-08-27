
import { generateAim } from "./index";

/**
 * Builds the text body for an AIM file from QCM answers.
 * Links the answers back to the source document via source_doc_id.
 */
export function buildAnswersBody(sourceDocId: string, answers: Record<string, string | string[]>): string {
  const lines = [`source_doc_id: ${sourceDocId}`];
  for (const [qId, value] of Object.entries(answers)) {
    const flatValue = Array.isArray(value) ? value.join(',') : value;
    lines.push(`${qId}: ${flatValue}`);
  }
  return lines.join('\n');
}

/**
 * Generates a valid AIM NFF file (bytes) from QCM answers.
 * Reuses the existing generateAim mechanical engine.
 */
export async function exportAnswersAsAim(sourceDocId: string, answers: Record<string, string | string[]>) {
  const body = buildAnswersBody(sourceDocId, answers);
  const { bytes } = await generateAim(body);
  return { bytes, body };
}
