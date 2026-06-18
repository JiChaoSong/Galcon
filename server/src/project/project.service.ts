import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { PaginatedResult } from '../common/dto/pagination.dto'

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    search?: string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<PaginatedResult<any>> {
    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { industry: { contains: search } },
            { owner: { contains: search } },
          ],
        }
      : {}

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.project.count({ where }),
    ])

    return { items, total, page, pageSize }
  }

  async findOne(id: string) {
    return this.prisma.project.findUniqueOrThrow({
      where: { id },
      include: {
        brands: true,
        questions: { select: { id: true } },
        batches: { select: { id: true } },
      },
    })
  }

  async create(data: any) {
    const { brandName, brandWebsite, brandIntro, ...projectData } = data
    const project = await this.prisma.project.create({ data: projectData })
    if (brandName) {
      await this.prisma.brand.create({
        data: {
          projectId: project.id,
          name: brandName,
          website: brandWebsite ?? null,
          intro: brandIntro ?? null,
          industry: data.industry,
        },
      })
    }
    return this.findOne(project.id)
  }

  async update(id: string, data: any) {
    return this.prisma.project.update({ where: { id }, data })
  }

  async remove(id: string) {
    return this.prisma.project.delete({ where: { id } })
  }

  // ── 同步项目计数 ──
  async syncCounts(projectId: string) {
    const batches = await this.prisma.taskBatch.findMany({
      where: { projectId },
      include: { items: { select: { status: true } } },
    })
    const taskTotal = batches.reduce((sum, b) => sum + b.items.length, 0)
    const taskDone = batches.reduce(
      (sum, b) =>
        sum +
        b.items.filter((i) => i.status === 'done' || i.status === 'review')
          .length,
      0,
    )
    return this.prisma.project.update({
      where: { id: projectId },
      data: { taskTotal, taskDone },
    })
  }
}
