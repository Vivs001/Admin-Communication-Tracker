import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractTextFromFile } from "@/lib/extract-text";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await requireSession();
  const { id } = await context.params;

  const communication = await prisma.communication.findUnique({ where: { id } });
  if (!communication) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (communication.isLocked && session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Record is locked. Request admin approval to upload." },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  let fileUrl: string;
  if (blobToken) {
    const blob = await put(`references/${id}/${file.name}`, buffer, {
      access: "public",
      token: blobToken,
      contentType: file.type || undefined,
    });
    fileUrl = blob.url;
  } else {
    // Local dev fallback: store as data URL metadata only
    fileUrl = `local://${file.name}`;
  }

  const extractedText = await extractTextFromFile(
    buffer,
    file.type,
    file.name
  );

  const referenceFile = await prisma.referenceFile.create({
    data: {
      communicationId: id,
      fileName: file.name,
      fileUrl,
      mimeType: file.type || null,
      extractedText: extractedText || null,
    },
  });

  return NextResponse.json(referenceFile, { status: 201 });
}
