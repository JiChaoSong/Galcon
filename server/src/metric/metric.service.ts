import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class MetricService {
  constructor(private prisma: PrismaService) {}

  async getOverview(projectId: string) {
    const batches = await this.prisma.taskBatch.findMany({
      where: { projectId },
      include: {
        items: {
          include: { analysis: true },
        },
      },
    })
    const allItems = batches.flatMap((b) => b.items)
    const total = allItems.length || 1
    const analyses = allItems.filter((i) => i.analysis)
    const mentioned = analyses.filter((i) => i.analysis!.targetBrandMentioned).length
    const recommended = analyses.filter((i) => i.analysis!.targetBrandRecommended).length
    const accurate = analyses.filter((i) => i.analysis!.accuracyStatus === 'accurate').length
    const withRisk = analyses.filter((i) => (i.analysis!.riskTypes as any[]).length > 0).length

    return {
      mentionRate: Math.round((mentioned / total) * 100),
      recommendRate: Math.round((recommended / total) * 100),
      accuracyRate: Math.round((accurate / (mentioned || 1)) * 100),
      riskRate: Math.round((withRisk / total) * 100),
      total,
    }
  }

  async getByBrand(projectId: string) {
    const batches = await this.prisma.taskBatch.findMany({
      where: { projectId },
      include: {
        items: { include: { analysis: true } },
      },
    })

    const brandMap = new Map<string, any[]>()
    for (const batch of batches) {
      const brand = batch.brandName
      if (!brandMap.has(brand)) brandMap.set(brand, [])
      brandMap.get(brand)!.push(...batch.items)
    }

    return Array.from(brandMap.entries()).map(([brand, items]) => {
      const total = items.length
      const analyses = items.filter((i: any) => i.analysis)
      const mentioned = analyses.filter((i: any) => i.analysis.targetBrandMentioned).length
      const recommended = analyses.filter((i: any) => i.analysis.targetBrandRecommended).length
      return { brand, mentionRate: Math.round((mentioned / (total || 1)) * 100), recommendRate: Math.round((recommended / (total || 1)) * 100), total }
    })
  }

  async getTaskStats(projectId: string) {
    const batches = await this.prisma.taskBatch.findMany({
      where: { projectId },
      include: {
        items: { include: { analysis: true } },
      },
    })
    const allItems = batches.flatMap((b) => b.items)
    const total = allItems.length
    const completed = allItems.filter(
      (i) => i.status === 'done' || i.status === 'review',
    ).length
    const pending = allItems.filter((i) => i.status === 'pending').length
    const failed = allItems.filter(
      (i) =>
        i.status === 'error' ||
        (i.analysis && i.analysis.accuracyStatus === 'wrong'),
    ).length
    const pass = allItems.filter(
      (i) => i.analysis && i.analysis.accuracyStatus === 'accurate',
    ).length
    const partial = allItems.filter(
      (i) => i.analysis && i.analysis.accuracyStatus === 'partial',
    ).length

    return {
      total,
      completed,
      pending,
      failed,
      pass,
      partial,
      percent: Math.round((completed / (total || 1)) * 100),
    }
  }
}
