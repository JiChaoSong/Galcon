import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { questionBatchImportSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = questionBatchImportSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { projectId, questions } = parsed.data;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const seen = new Set<string>();
  const uniqueInputs = questions.filter((q) => {
    const key = q.questionText.trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const resultQuestions = [];
  for (const input of uniqueInputs) {
    const text = input.questionText.trim();
    const existing = await prisma.question.findFirst({
      where: { questionText: { equals: text, mode: "insensitive" } },
    });
    const question = existing ?? (await prisma.question.create({ data: { ...input, questionText: text } }));

    await prisma.projectQuestion.upsert({
      where: { projectId_questionId: { projectId, questionId: question.id } },
      update: {},
      create: { projectId, questionId: question.id },
    });

    resultQuestions.push(question);
  }

  return NextResponse.json(resultQuestions, { status: 201 });
}
