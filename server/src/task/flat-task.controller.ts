import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Param,
  Body,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger'
import { TaskService } from './task.service'
import { ZodValidationPipe } from '../common/validation.pipe'
import {
  updateBatchSchema,
  createItemsSchema,
  updateItemSchema,
} from './dto/task.dto'

/**
 * 扁平路由控制器 — 用于按批次/条目 ID 直接操作，无需 projectId。
 * 资源嵌套的请求仍走 TaskController（projects/:projectId/...）。
 */
@ApiTags('测试任务（扁平）')
@Controller()
export class FlatTaskController {
  constructor(private readonly service: TaskService) {}

  @Patch('batches/:id')
  @ApiOperation({ summary: '更新测试批次' })
  @ApiParam({ name: 'id', description: '批次 ID' })
  @ApiBody({ description: '要更新的字段' })
  updateBatch(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBatchSchema)) body: any,
  ) {
    return this.service.updateBatch(id, body)
  }

  @Delete('batches/:id')
  @ApiOperation({ summary: '删除测试批次（级联删除 items）' })
  @ApiParam({ name: 'id', description: '批次 ID' })
  removeBatch(@Param('id') id: string) {
    return this.service.removeBatch(id)
  }

  @Post('batches/:id/copy')
  @ApiOperation({ summary: '复制测试批次（含 items，状态重置为 pending）' })
  @ApiParam({ name: 'id', description: '原批次 ID' })
  copyBatch(@Param('id') id: string) {
    return this.service.copyBatch(id)
  }

  // ── 测试条目 ──

  @Get('batches/:batchId/items')
  @ApiOperation({ summary: '获取批次下所有测试条目' })
  @ApiParam({ name: 'batchId', description: '批次 ID' })
  findItems(@Param('batchId') batchId: string) {
    return this.service.findItems(batchId)
  }

  @Post('batches/:batchId/items')
  @ApiOperation({ summary: '批量添加测试条目' })
  @ApiParam({ name: 'batchId', description: '批次 ID' })
  @ApiBody({ description: '问题 ID 和文本数组' })
  addItems(
    @Param('batchId') batchId: string,
    @Body(new ZodValidationPipe(createItemsSchema)) body: any,
  ) {
    return this.service.addItems(batchId, body)
  }

  @Patch('items/:id')
  @ApiOperation({ summary: '更新测试条目（状态/答案）' })
  @ApiParam({ name: 'id', description: '条目 ID' })
  @ApiBody({ description: '要更新的字段' })
  updateItem(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateItemSchema)) body: any,
  ) {
    return this.service.updateItem(id, body)
  }

  @Delete('items/:id')
  @ApiOperation({ summary: '删除测试条目' })
  @ApiParam({ name: 'id', description: '条目 ID' })
  removeItem(@Param('id') id: string) {
    return this.service.removeItem(id)
  }
}
