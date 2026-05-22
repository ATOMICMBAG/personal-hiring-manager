import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/applications/[id]/timeline/[eventId]
 * Entfernt ein einzelnes Timeline-Event.
 * Aktualisiert den Application-Status auf das jüngste verbleibende Event
 * (oder behält den aktuellen Status, falls keines mehr da ist).
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  const { id, eventId } = await params;

  const event = await prisma.timelineEvent.findFirst({
    where: { id: eventId, applicationId: id },
  });
  if (!event) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  await prisma.timelineEvent.delete({ where: { id: eventId } });

  // Application-Status auf das jüngste verbleibende Event setzen
  const latest = await prisma.timelineEvent.findFirst({
    where: { applicationId: id },
    orderBy: { date: "desc" },
  });

  if (latest) {
    await prisma.application.update({
      where: { id },
      data: { status: latest.status },
    });
  }

  return NextResponse.json({ ok: true });
}
