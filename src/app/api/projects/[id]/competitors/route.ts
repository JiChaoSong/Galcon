import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { competitorCreateSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const competitors = await prisma.competitor.findMany({
    where: { projectId: id },
    include: { targetBrand: true, competitorBrand: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(competitors);
}

export async function POST(req: Request, { params }: RouteParams) {
  const { id: projectId } = await params;
  const json = await req.json();
  const parsed = competitorCreateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const competitor = await prisma.competitor.create({
      data: { projectId, ...parsed.data },
      include: { targetBrand: true, competitorBrand: true },
    });
    return NextResponse.json(competitor, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "This competitor relationship already exists for the project" },
        { status: 409 },
      );
    }
    throw err;
  }
}
