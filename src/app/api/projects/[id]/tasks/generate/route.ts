import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildTaskCombinations } from "@/lib/task-generation";
import { taskGenerateSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteParams) {
  const { id: projectId } = await params;
  const json = await req.json();
  const parsed = taskGenerateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { questionIds, platformIds, brandIds } = parsed.data;

  const [questions, existingTasks] = await Promise.all([
    prisma.question.findMany({ where: { id: { in: questionIds } } }),
    prisma.testTask.findMany({
      where: { projectId, questionId: { in: questionIds } },
      select: { questionId: true, platformId: true, targetBrandId: true },
    }),
  ]);
  const questionTextById = new Map(questions.map((q) => [q.id, q.questionText]));

  const combinations = buildTaskCombinations(
    questionIds,
    platformIds,
    brandIds,
    existingTasks.map((t) => ({
      questionId: t.questionId,
      platformId: t.platformId,
      brandId: t.targetBrandId,
    })),
  );

  if (combinations.length > 0) {
    await prisma.testTask.createMany({
      data: combinations.map((c) => ({
        projectId,
        questionId: c.questionId,
        platformId: c.platformId,
        targetBrandId: c.brandId,
        promptText: questionTextById.get(c.questionId) ?? "",
      })),
    });
  }

  return NextResponse.json({ createdCount: combinations.length }, { status: 201 });
}
