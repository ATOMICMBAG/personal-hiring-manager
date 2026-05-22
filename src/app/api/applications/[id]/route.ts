import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      company: true,
      timelineEvents: { orderBy: { date: "asc" } },
      documents: { orderBy: { uploadedAt: "desc" } },
      notes: { orderBy: { updatedAt: "desc" } },
    },
  });
  if (!app) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  return NextResponse.json(app);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const updated = await prisma.application.update({
    where: { id },
    data: body,
    include: {
      company: true,
      timelineEvents: { orderBy: { date: "asc" } },
      documents: { orderBy: { uploadedAt: "desc" } },
      notes: { orderBy: { updatedAt: "desc" } },
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.application.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
