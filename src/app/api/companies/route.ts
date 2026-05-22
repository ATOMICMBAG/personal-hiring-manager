import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const companies = await prisma.company.findMany({
    include: {
      _count: { select: { applications: true } },
      applications: {
        select: {
          id: true,
          title: true,
          status: true,
          motivation: true,
          createdAt: true,
          timelineEvents: {
            select: { date: true, status: true },
            orderBy: { date: "asc" },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(companies);
}
