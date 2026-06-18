import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class QuestionService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string) {
    return this.prisma.question.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' } })
  }

  async create(projectId: string, data: any) {
    return this.prisma.question.create({ data: { ...data, projectId } })
  }

  async update(id: string, data: any) {
    return this.prisma.question.update({ where: { id }, data })
  }

  async remove(id: string) {
    return this.prisma.question.delete({ where: { id } })
  }
}
