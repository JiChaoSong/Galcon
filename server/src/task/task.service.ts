import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ProjectService } from '../project/project.service'

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private projectService: ProjectService,
  ) {}

  // ── Batch ──

  async findAllBatches(projectId: string) {
    return this.prisma.taskBatch.findMany({
      where: { projectId },
      include: { items: { select: { id: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createBatch(projectId: string, data: any) {
    const { items, ...batch } = data
    const created = await this.prisma.taskBatch.create({
      data: {
        ...batch,
        projectId,
        items: items ? { create: items } : undefined,
      },
      include: { items: true },
    })
    // 同步项目计数
    await this.projectService.syncCounts(projectId)
    return created
  }

  async updateBatch(id: string, data: any) {
    const batch = await this.prisma.taskBatch.update({ where: { id }, data })
    await this.projectService.syncCounts(batch.projectId)
    return batch
  }

  async removeBatch(id: string) {
    const batch = await this.prisma.taskBatch.findUniqueOrThrow({
      where: { id },
    })
    const deleted = await this.prisma.taskBatch.delete({ where: { id } })
    await this.projectService.syncCounts(batch.projectId)
    return deleted
  }

  async copyBatch(id: string) {
    const src = await this.prisma.taskBatch.findUniqueOrThrow({
      where: { id },
      include: { items: true },
    })
    const created = await this.prisma.taskBatch.create({
      data: {
        projectId: src.projectId,
        name: src.name + ' (副本)',
        platformId: src.platformId,
        platformName: src.platformName,
        brandId: src.brandId,
        brandName: src.brandName,
        assignedTo: src.assignedTo,
        items: {
          create: src.items.map((item) => ({
            questionId: item.questionId,
            questionText: item.questionText,
            status: 'pending',
          })),
        },
      },
      include: { items: true },
    })
    await this.projectService.syncCounts(src.projectId)
    return created
  }

  // ── Item ──

  async findItems(batchId: string) {
    return this.prisma.taskItem.findMany({
      where: { batchId },
      orderBy: { createdAt: 'asc' },
    })
  }

  async addItems(batchId: string, data: any) {
    const items = Array.isArray(data) ? data : [data]
    const batch = await this.prisma.taskBatch.findUniqueOrThrow({
      where: { id: batchId },
    })
    const created: any[] = []
    for (const item of items) {
      created.push(
        await this.prisma.taskItem.create({
          data: { ...item, batchId },
        }),
      )
    }
    await this.projectService.syncCounts(batch.projectId)
    return created
  }

  async updateItem(id: string, data: any) {
    const item = await this.prisma.taskItem.update({ where: { id }, data })
    const batch = await this.prisma.taskBatch.findUniqueOrThrow({
      where: { id: item.batchId },
    })
    await this.projectService.syncCounts(batch.projectId)
    return item
  }

  async removeItem(id: string) {
    const item = await this.prisma.taskItem.findUniqueOrThrow({
      where: { id },
    })
    const deleted = await this.prisma.taskItem.delete({ where: { id } })
    const batch = await this.prisma.taskBatch.findUniqueOrThrow({
      where: { id: item.batchId },
    })
    await this.projectService.syncCounts(batch.projectId)
    return deleted
  }
}
