import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { platformUpdateSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const json = await req.json();
  const parsed = platformUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const platform = await prisma.platform
    .update({ where: { id }, data: parsed.data })
    .catch(() => null);

  if (!platform) {
    return NextResponse.json({ error: "Platform not found" }, { status: 404 });
  }

  return NextResponse.json(platform);
}
