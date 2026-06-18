import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger'
import { BrandService } from './brand.service'
import { ZodValidationPipe } from '../common/validation.pipe'
import { createBrandSchema, updateBrandSchema, createCompetitorSchema } from './dto/brand.dto'

@ApiTags('品牌与竞品')
@Controller('projects/:projectId/brands')
export class BrandController {
  constructor(private readonly service: BrandService) {}

  @Get()
  @ApiOperation({ summary: '获取项目下所有品牌（含竞品）' })
  @ApiParam({ name: 'projectId', description: '项目 ID' })
  findAll(@Param('projectId') projectId: string) {
    return this.service.findAll(projectId)
  }

  @Post()
  @ApiOperation({ summary: '创建品牌' })
  @ApiParam({ name: 'projectId', description: '项目 ID' })
  @ApiBody({ description: '品牌信息' })
  create(
    @Param('projectId') projectId: string,
    @Body(new ZodValidationPipe(createBrandSchema)) body: any,
  ) {
    return this.service.create(projectId, body)
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新品牌' })
  @ApiParam({ name: 'id', description: '品牌 ID' })
  @ApiBody({ description: '要更新的字段' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBrandSchema)) body: any,
  ) {
    return this.service.update(id, body)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除品牌' })
  @ApiParam({ name: 'id', description: '品牌 ID' })
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }

  // ── 竞品 ──

  @Get(':brandId/competitors')
  @ApiOperation({ summary: '获取品牌的竞品列表' })
  @ApiParam({ name: 'brandId', description: '品牌 ID' })
  competitors(@Param('brandId') brandId: string) {
    return this.service.getCompetitors(brandId)
  }

  @Post(':brandId/competitors')
  @ApiOperation({ summary: '添加竞品' })
  @ApiParam({ name: 'projectId', description: '项目 ID' })
  @ApiParam({ name: 'brandId', description: '品牌 ID' })
  @ApiBody({ description: '竞品信息' })
  addCompetitor(
    @Param('projectId') projectId: string,
    @Param('brandId') brandId: string,
    @Body(new ZodValidationPipe(createCompetitorSchema)) body: any,
  ) {
    return this.service.addCompetitor(projectId, brandId, body)
  }

  @Delete(':brandId/competitors/:compId')
  @ApiOperation({ summary: '删除竞品' })
  @ApiParam({ name: 'compId', description: '竞品 ID' })
  removeCompetitor(@Param('compId') compId: string) {
    return this.service.removeCompetitor(compId)
  }
}
