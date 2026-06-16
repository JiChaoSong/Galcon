import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { taskAnswerSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const json = await req.json();
  const parsed = taskAnswerSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const task = await prisma.testTask.update({
    where: { id },
    data: {
      answerText: parsed.data.answerText,
      status: "completed",
    },
  });

  return NextResponse.json(task);
}
