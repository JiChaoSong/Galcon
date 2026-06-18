import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger'
import { ProjectService } from './project.service'
import { ZodValidationPipe } from '../common/validation.pipe'
import { createProjectSchema, updateProjectSchema } from './dto/project.dto'

@ApiTags('项目')
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @ApiOperation({ summary: '获取项目列表' })
  @ApiQuery({ name: 'search', required: false, description: '按名称/行业/负责人搜索' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认 1' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页条数，默认 10' })
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.projectService.findAll(
      search,
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
    )
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个项目' })
  @ApiParam({ name: 'id', description: '项目 ID' })
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id)
  }

  @Post()
  @ApiOperation({ summary: '创建项目' })
  @ApiBody({ description: '项目信息' })
  create(@Body(new ZodValidationPipe(createProjectSchema)) body: any) {
    return this.projectService.create(body)
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新项目' })
  @ApiParam({ name: 'id', description: '项目 ID' })
  @ApiBody({ description: '要更新的字段' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProjectSchema)) body: any,
  ) {
    return this.projectService.update(id, body)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除项目' })
  @ApiParam({ name: 'id', description: '项目 ID' })
  remove(@Param('id') id: string) {
    return this.projectService.remove(id)
  }
}
