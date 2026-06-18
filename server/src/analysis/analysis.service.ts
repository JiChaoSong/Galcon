import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

// ── Mock 品牌库 ──
const BRAND_POOL = [
  'Salesforce', 'HubSpot', 'Zoho CRM', 'Microsoft Dynamics',
  'SAP', 'Oracle CRM', 'Pipedrive', 'Freshsales', 'SugarCRM',
]

const COMPETITOR_POOL = [
  'Salesforce', 'HubSpot', 'Zoho CRM', 'Pipedrive', 'Monday CRM',
]

const SOURCE_POOL = [
  'Gartner 2024 CRM 魔力象限报告',
  'Forrester Wave CRM 评估',
  'G2 用户评价汇总',
  'TrustRadius 企业用户反馈',
  '行业白皮书：中小企业 CRM 选型指南',
  '知乎/脉脉行业讨论',
]

const RISK_POOL = [
  '品牌信息过时',
  '竞品对比不完整',
  '缺乏权威引用来源',
  '行业术语使用不准确',
]

function randomPick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

@Injectable()
export class AnalysisService {
  constructor(private prisma: PrismaService) {}

  async findByTaskItem(taskItemId: string) {
    return this.prisma.answerAnalysis.findUnique({
      where: { taskItemId },
    })
  }

  async create(taskItemId: string) {
    // 先查 TaskItem，确认存在
    const item = await this.prisma.taskItem.findUniqueOrThrow({
      where: { id: taskItemId },
      include: { batch: true },
    })

    // 如果已有分析，先删除再重建（覆盖）
    await this.prisma.answerAnalysis.deleteMany({
      where: { taskItemId },
    })

    const targetBrand = item.batch.brandName
    const mentionedCount = randomInt(2, 5)
    const mentionedBrands = randomPick(
      BRAND_POOL.filter((b) => b !== targetBrand),
      mentionedCount - 1,
    )
    // 50% 概率包含目标品牌
    const targetMentioned = Math.random() > 0.5
    if (targetMentioned) {
      mentionedBrands.unshift(targetBrand)
    }

    const brandRank = targetMentioned ? randomInt(1, 5) : 0
    const competitorCount = randomInt(0, 3)
    const competitors = randomPick(COMPETITOR_POOL, competitorCount)

    const sourceCount = randomInt(1, 3)
    const sources = randomPick(SOURCE_POOL, sourceCount)

    const riskCount = Math.random() > 0.6 ? randomInt(0, 2) : 0
    const risks = riskCount > 0 ? randomPick(RISK_POOL, riskCount) : []

    const accuracyRoll = Math.random()
    const accuracyStatus =
      accuracyRoll > 0.85 ? 'accurate' :
      accuracyRoll > 0.55 ? 'partial' :
      accuracyRoll > 0.25 ? 'wrong' : 'unknown'

    const sentimentRoll = Math.random()
    const sentiment =
      sentimentRoll > 0.7 ? 'positive' :
      sentimentRoll > 0.4 ? 'neutral' :
      sentimentRoll > 0.15 ? 'mixed' : 'negative'

    const analysis = await this.prisma.answerAnalysis.create({
      data: {
        taskItemId,
        mentionedBrands: mentionedBrands,
        targetBrandMentioned: targetMentioned,
        targetBrandRank: brandRank,
        targetBrandRecommended: targetMentioned && brandRank <= 3,
        competitorsMentioned: competitors,
        citationSources: sources,
        answerSummary: [
          `## 分析摘要`,
          ``,
          `该回答共提及 **${mentionedBrands.length}** 个品牌。`,
          ``,
          targetMentioned
            ? `- ✅ 目标品牌 **${targetBrand}** 排名第 **${brandRank}** 位`
            : `- ❌ 未提及目标品牌 **${targetBrand}**`,
          `- 推荐状态：${targetMentioned && brandRank <= 3 ? '已推荐' : '未进入推荐'}`,
          `- 竞品提及：${competitors.length > 0 ? competitors.join('、') : '无'}`,
        ].join('\n'),
        accuracyStatus,
        sentiment,
        riskTypes: risks,
        optimizationSuggestions:
          risks.length > 0
            ? [
                `## 优化建议`,
                ``,
                `建议补充以下内容以提升回答质量：`,
                ``,
                ...risks.map((r) => `- **${r}**：需补充相关数据和案例`),
              ].join('\n')
            : [
                `## 优化建议`,
                ``,
                `当前回答质量较好，可进一步丰富：`,
                ``,
                `- 补充具体行业案例和数据支撑`,
                `- 增加竞品对比维度`,
                `- 引用权威来源增强可信度`,
              ].join('\n'),
        manualChecked: false,
      },
    })

    // 同步项目计数
    await this.prisma.project.update({
      where: { id: item.batch.projectId },
      data: {
        taskDone: {
          increment: 0, // 分析不影响 done 计数，但触发 updatedAt
        },
      },
    })

    return analysis
  }
}
