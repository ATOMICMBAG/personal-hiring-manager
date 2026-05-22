import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    title,
    companyName,
    companyId,
    contactName,
    contactEmail,
    jobLink,
    status,
  } = body;

  let cId = companyId;

  // Find or create company
  if (!cId && companyName) {
    const existing = await prisma.company.findFirst({
      where: { name: companyName },
    });
    if (existing) {
      cId = existing.id;
    } else {
      const created = await prisma.company.create({
        data: { name: companyName },
      });
      cId = created.id;
    }
  }

  if (!cId) {
    return NextResponse.json({ error: "Firma erforderlich" }, { status: 400 });
  }

  const application = await prisma.application.create({
    data: {
      title,
      companyId: cId,
      contactName,
      contactEmail,
      jobLink,
      status: status || "Bewerbung gesendet",
    },
    include: {
      company: true,
      timelineEvents: true,
      documents: true,
      notes: true,
    },
  });

  // Auto-create first timeline event
  await prisma.timelineEvent.create({
    data: {
      applicationId: application.id,
      status: "Bewerbung gesendet",
    },
  });

  return NextResponse.json(application, { status: 201 });
}
