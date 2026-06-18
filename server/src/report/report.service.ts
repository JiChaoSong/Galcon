import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async generate(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } })
    return { projectId, status: 'draft', message: '报告生成功能开发中', project }
  }

  async exportReport(projectId: string, format: string) {
    return { projectId, format, status: 'pending', message: `导出 ${format} 功能开发中` }
  }
}
