import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { status, description, date } = body;

  const event = await prisma.timelineEvent.create({
    data: {
      applicationId: id,
      status,
      description,
      date: date ? new Date(date) : new Date(),
    },
  });

  // Update application status
  await prisma.application.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(event, { status: 201 });
}
