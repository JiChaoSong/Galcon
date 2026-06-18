import { Controller, Get, Post, Param, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger'
import { TaskService } from './task.service'
import { ZodValidationPipe } from '../common/validation.pipe'
import { createBatchSchema } from './dto/task.dto'

/**
 * 项目嵌套路由 — 按项目列出/创建批次。
 * 按批次/条目 ID 直接操作的接口见 FlatTaskController。
 */
@ApiTags('测试任务')
@Controller('projects/:projectId')
export class TaskController {
  constructor(private readonly service: TaskService) {}

  @Get('batches')
  @ApiOperation({ summary: '获取项目下所有测试批次' })
  @ApiParam({ name: 'projectId', description: '项目 ID' })
  findAllBatches(@Param('projectId') projectId: string) {
    return this.service.findAllBatches(projectId)
  }

  @Post('batches')
  @ApiOperation({ summary: '创建测试批次' })
  @ApiParam({ name: 'projectId', description: '项目 ID' })
  @ApiBody({ description: '批次信息，可含 items 数组' })
  createBatch(
    @Param('projectId') projectId: string,
    @Body(new ZodValidationPipe(createBatchSchema)) body: any,
  ) {
    return this.service.createBatch(projectId, body)
  }
}
