import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class BrandService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string) {
    return this.prisma.brand.findMany({ where: { projectId }, include: { competitors: true } })
  }

  async create(projectId: string, data: any) {
    return this.prisma.brand.create({ data: { ...data, projectId } })
  }

  async update(id: string, data: any) {
    return this.prisma.brand.update({ where: { id }, data })
  }

  async remove(id: string) {
    return this.prisma.brand.delete({ where: { id } })
  }

  async getCompetitors(brandId: string) {
    return this.prisma.competitor.findMany({ where: { brandId } })
  }

  async addCompetitor(projectId: string, brandId: string, data: any) {
    return this.prisma.competitor.create({ data: { ...data, projectId, brandId } })
  }

  async removeCompetitor(id: string) {
    return this.prisma.competitor.delete({ where: { id } })
  }
}
