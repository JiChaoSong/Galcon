import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { projectUpdateSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      _count: { select: { projectBrands: true, questions: true, testTasks: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const json = await req.json();
  const parsed = projectUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(project);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  await prisma.project.update({
    where: { id },
    data: { status: "archived" },
  });

  return NextResponse.json({ ok: true });
}
