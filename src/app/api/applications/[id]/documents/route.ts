import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Keine Datei" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Store in prisma/uploads/
  const uploadDir = path.join(process.cwd(), "prisma", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const safeName = `${uuid()}-${file.name}`;
  const filepath = path.join(uploadDir, safeName);
  await writeFile(filepath, buffer);

  const doc = await prisma.document.create({
    data: {
      applicationId: id,
      filename: file.name,
      filepath: `/uploads/${safeName}`,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: buffer.length,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
