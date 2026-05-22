import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { content, tags } = body;

  const note = await prisma.note.create({
    data: { applicationId: id, content, tags },
  });

  return NextResponse.json(note, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const noteId = searchParams.get("id");

  if (!noteId) {
    return NextResponse.json({ error: "Note ID required" }, { status: 400 });
  }

  await prisma.note.delete({ where: { id: noteId } });
  return NextResponse.json({ ok: true });
}
