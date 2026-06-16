import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { brandCreateSchema, projectBrandCreateSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const projectBrands = await prisma.projectBrand.findMany({
    where: { projectId: id },
    include: { brand: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(projectBrands);
}

export async function POST(req: Request, { params }: RouteParams) {
  const { id: projectId } = await params;
  const json = await req.json();

  // Support both brandId (reuse existing) and name (create new)
  if (json.brandId) {
    const parsed = projectBrandCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const pb = await prisma.projectBrand.create({
      data: { projectId, brandId: json.brandId, role: json.role ?? "target" },
      include: { brand: true },
    });
    return NextResponse.json(pb, { status: 201 });
  }

  if (json.name) {
    const parsed = brandCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const brand = await prisma.brand.create({ data: parsed.data });
    const pb = await prisma.projectBrand.create({
      data: { projectId, brandId: brand.id, role: json.role ?? "target" },
      include: { brand: true },
    });
    return NextResponse.json(pb, { status: 201 });
  }

  return NextResponse.json({ error: "Must provide brandId or name" }, { status: 400 });
}
