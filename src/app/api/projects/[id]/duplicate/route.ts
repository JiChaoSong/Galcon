import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: RouteParams) {
  const { id } = await params;

  const source = await prisma.project.findUnique({
    where: { id },
    include: { questions: true },
  });

  if (!source) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const duplicate = await prisma.project.create({
    data: {
      name: `${source.name} - 副本`,
      type: source.type,
      industry: source.industry,
      subIndustry: source.subIndustry,
      targetMarket: source.targetMarket,
      description: source.description,
      status: "draft",
    },
  });

  if (source.questions.length > 0) {
    await prisma.projectQuestion.createMany({
      data: source.questions.map((pq) => ({
        projectId: duplicate.id,
        questionId: pq.questionId,
      })),
    });
  }

  return NextResponse.json(duplicate, { status: 201 });
}
