import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: RouteParams) {
  const { id: projectId } = await params;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const platformId = searchParams.get("platformId");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get("pageSize") ?? "50")));

  const where = {
    projectId,
    ...(status ? { status } : {}),
    ...(platformId ? { platformId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.testTask.findMany({
      where,
      include: { question: true, platform: true, targetBrand: true },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.testTask.count({ where }),
  ]);

  return NextResponse.json({ items, total });
}
