import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readFile, unlink } from "fs/promises";
import path from "path";

/**
 * GET /api/applications/[id]/documents/[docId]
 *   ?download=1  → erzwingt Download (Content-Disposition: attachment)
 *   sonst        → versucht Inline-Anzeige (z. B. PDF-Viewer im Browser)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  const { id, docId } = await params;

  const doc = await prisma.document.findFirst({
    where: { id: docId, applicationId: id },
  });
  if (!doc) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  // doc.filepath ist z. B. "/uploads/<uuid>-<filename>"
  const safeRelative = doc.filepath.replace(/^\/uploads\//, "");
  const absolute = path.join(process.cwd(), "prisma", "uploads", safeRelative);

  // Pfad-Traversierung verhindern
  const uploadsDir = path.join(process.cwd(), "prisma", "uploads");
  if (!absolute.startsWith(uploadsDir)) {
    return NextResponse.json({ error: "Ungültiger Pfad" }, { status: 400 });
  }

  let buffer: Buffer;
  try {
    buffer = await readFile(absolute);
  } catch {
    return NextResponse.json(
      { error: "Datei nicht auf Datenträger gefunden" },
      { status: 404 },
    );
  }

  const url = new URL(req.url);
  const forceDownload = url.searchParams.get("download") === "1";
  const dispositionType = forceDownload ? "attachment" : "inline";

  // RFC 5987 — kompatibler Dateiname (UTF-8) plus ASCII-Fallback
  const asciiFallback = doc.filename.replace(/[^\x20-\x7E]+/g, "_");
  const utf8Encoded = encodeURIComponent(doc.filename);
  const disposition = `${dispositionType}; filename="${asciiFallback}"; filename*=UTF-8''${utf8Encoded}`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": doc.mimeType || "application/octet-stream",
      "Content-Length": String(buffer.length),
      "Content-Disposition": disposition,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}

/**
 * DELETE /api/applications/[id]/documents/[docId]
 * Entfernt den DB-Eintrag und löscht die Datei vom Datenträger.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  const { id, docId } = await params;

  const doc = await prisma.document.findFirst({
    where: { id: docId, applicationId: id },
  });
  if (!doc) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const safeRelative = doc.filepath.replace(/^\/uploads\//, "");
  const absolute = path.join(process.cwd(), "prisma", "uploads", safeRelative);
  const uploadsDir = path.join(process.cwd(), "prisma", "uploads");

  if (absolute.startsWith(uploadsDir)) {
    try {
      await unlink(absolute);
    } catch {
      // Datei evtl. schon manuell entfernt – wir ignorieren das
    }
  }

  await prisma.document.delete({ where: { id: docId } });

  return NextResponse.json({ ok: true });
}
