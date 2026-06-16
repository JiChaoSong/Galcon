import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { brandCreateSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  const brands = await prisma.brand.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : {},
    orderBy: { name: "asc" },
    take: 20,
  });

  return NextResponse.json(brands);
}

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = brandCreateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const brand = await prisma.brand.create({ data: parsed.data });
  return NextResponse.json(brand, { status: 201 });
}
