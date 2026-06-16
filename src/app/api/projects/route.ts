import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { projectCreateSchema } from "@/lib/validation";

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { projectBrands: true, questions: true, testTasks: true } },
    },
  });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = projectCreateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project.create({ data: parsed.data });
  return NextResponse.json(project, { status: 201 });
}
