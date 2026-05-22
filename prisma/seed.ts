import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.note.deleteMany();
  await prisma.document.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.application.deleteMany();
  await prisma.company.deleteMany();

  // --- Companies ---
  const siemens = await prisma.company.create({
    data: {
      name: "Siemens AG",
      industry: "Industrie / Automatisierung",
      website: "https://www.siemens.com",
    },
  });

  const rohdeSchwarz = await prisma.company.create({
    data: {
      name: "Rohde & Schwarz",
      industry: "Messtechnik / Kommunikation",
      website: "https://www.rohde-schwarz.com",
    },
  });

  const agileRobots = await prisma.company.create({
    data: {
      name: "Agile Robots",
      industry: "Robotik / KI",
      website: "https://www.agile-robots.com",
    },
  });

  const tkms = await prisma.company.create({
    data: {
      name: "TKMS Group",
      industry: "Marine / Verteidigung",
    },
  });

  // --- Applications ---
  const app1 = await prisma.application.create({
    data: {
      title: "Software Engineer",
      companyId: siemens.id,
      contactName: "Julia Weber",
      contactEmail: "julia.weber@siemens.com",
      status: "Antwort erwartet",
      motivation: 78,
      etaDays: 5,
    },
  });

  const app2 = await prisma.application.create({
    data: {
      title: "RF Technician",
      companyId: rohdeSchwarz.id,
      contactName: "Markus Bauer",
      contactEmail: "m.bauer@rohde-schwarz.com",
      status: "Interview geplant",
      motivation: 65,
      etaDays: 3,
    },
  });

  const app3 = await prisma.application.create({
    data: {
      title: "Vision Engineer",
      companyId: agileRobots.id,
      status: "Bewerbung gesendet",
      motivation: 85,
      etaDays: 10,
    },
  });

  const app4 = await prisma.application.create({
    data: {
      title: "Systems Engineer",
      companyId: agileRobots.id,
      contactName: "Dr. Sabine Koch",
      contactEmail: "s.koch@agile-robots.com",
      status: "Bewerbung gesendet",
      motivation: 72,
      etaDays: 7,
    },
  });

  const app5 = await prisma.application.create({
    data: {
      title: "Hardware Developer",
      companyId: tkms.id,
      status: "Absage",
      motivation: 40,
    },
  });

  // --- Timeline Events ---
  await prisma.timelineEvent.createMany({
    data: [
      {
        applicationId: app1.id,
        date: new Date("2026-05-05"),
        status: "Bewerbung gesendet",
      },
      {
        applicationId: app1.id,
        date: new Date("2026-05-07"),
        status: "Empfangsbestätigung",
      },
      {
        applicationId: app1.id,
        date: new Date("2026-05-12"),
        status: "In Bearbeitung",
      },
      {
        applicationId: app2.id,
        date: new Date("2026-05-03"),
        status: "Bewerbung gesendet",
      },
      {
        applicationId: app2.id,
        date: new Date("2026-05-06"),
        status: "Empfangsbestätigung",
        description: "Rückmeldung in KW 21 erwartet",
      },
      {
        applicationId: app3.id,
        date: new Date("2026-05-10"),
        status: "Bewerbung gesendet",
      },
      {
        applicationId: app4.id,
        date: new Date("2026-05-08"),
        status: "Bewerbung gesendet",
      },
      {
        applicationId: app5.id,
        date: new Date("2026-04-15"),
        status: "Bewerbung gesendet",
      },
      {
        applicationId: app5.id,
        date: new Date("2026-05-02"),
        status: "Absage",
        description: "Position bereits besetzt",
      },
    ],
  });

  // --- Documents ---
  await prisma.document.createMany({
    data: [
      {
        applicationId: app1.id,
        filename: "Bewerbung.pdf",
        filepath: "/uploads/bewerbung-siemens.pdf",
        mimeType: "application/pdf",
        sizeBytes: 245000,
      },
      {
        applicationId: app1.id,
        filename: "Anschreiben.pdf",
        filepath: "/uploads/anschreiben-siemens.pdf",
        mimeType: "application/pdf",
        sizeBytes: 120000,
      },
      {
        applicationId: app1.id,
        filename: "Lebenslauf.pdf",
        filepath: "/uploads/lebenslauf.pdf",
        mimeType: "application/pdf",
        sizeBytes: 180000,
      },
    ],
  });

  // --- Notes ---
  await prisma.note.create({
    data: {
      applicationId: app1.id,
      content: `## Gesprächsnotizen

- Erstkontakt mit Julia Weber am 07.05.
- Sehr freundlich, technisches Team sucht jemanden mit C++-Erfahrung
- Gehaltsspanne: 65k–80k €

## Nächste Schritte

- [ ] Auf Rückmeldung warten (KW 21)
- [ ] Unternehmenspräsentation durchgehen`,
      tags: '["gespräch","wichtig","follow-up"]',
    },
  });

  console.log("✅ Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
