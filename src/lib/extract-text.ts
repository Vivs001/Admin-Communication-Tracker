import mammoth from "mammoth";

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const lower = fileName.toLowerCase();

  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text?.trim() ?? "";
  }

  if (
    mimeType.includes("wordprocessingml") ||
    lower.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value?.trim() ?? "";
  }

  if (mimeType.startsWith("text/") || lower.endsWith(".txt")) {
    return buffer.toString("utf-8").trim();
  }

  return "";
}
