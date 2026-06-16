import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { questionCreateSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const q = searchParams.get("q");
  const industry = searchParams.get("industry");

  const questions = await prisma.question.findMany({
    where: {
      ...(projectId ? { projectQuestions: { some: { projectId } } } : {}),
      ...(q ? { questionText: { contains: q, mode: "insensitive" } } : {}),
      ...(industry ? { industry } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(questions);
}

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = questionCreateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { projectId, ...data } = parsed.data;
  const question = await prisma.question.create({ data });

  if (projectId) {
    await prisma.projectQuestion.create({ data: { projectId, questionId: question.id } });
  }

  return NextResponse.json(question, { status: 201 });
}
