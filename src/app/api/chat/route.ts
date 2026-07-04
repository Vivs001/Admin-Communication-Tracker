import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  await requireSession();
  const { messages, communicationId } = await request.json();

  if (!messages || !communicationId) {
    return new Response("Missing messages or communicationId", { status: 400 });
  }

  const communication = await prisma.communication.findUnique({
    where: { id: communicationId },
    include: { referenceFiles: true },
  });

  if (!communication) {
    return new Response("Communication not found", { status: 404 });
  }

  const referenceContext = communication.referenceFiles
    .filter((f) => f.extractedText)
    .map(
      (f) =>
        `--- Reference: ${f.fileName} ---\n${f.extractedText?.slice(0, 12000)}`
    )
    .join("\n\n");

  const letterContext = `
Current communication record:
- Subject: ${communication.subject}
- To: ${communication.recipient}
- Commo Type: ${communication.commoType}
- Drafted By: ${communication.draftedBy}
- Status: ${communication.status}
- Remarks: ${communication.remarks ?? "None"}
`.trim();

  const systemPrompt = `You are an assistant for NBRRMD (Naval Base Regional Referral Medical Dispensary) staff drafting official communication letters including Naval Letters (NavLet), Civilian Letters, Orders, and other correspondence.

Help the user draft, reply to, or refine letters based on the reference materials and current record context provided. Be professional, concise, and appropriate for military/medical administrative correspondence. Use proper letter format when drafting full letters.

${letterContext}

${referenceContext ? `\nReference letter content:\n${referenceContext}` : "\nNo reference letter text available yet. Ask the user to upload a reference file or describe the incoming letter."}`;

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages,
  });

  return result.toDataStreamResponse();
}
