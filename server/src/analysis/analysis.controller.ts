import {
  Controller,
  Get,
  Post,
  Param,
  Body,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger'
import { AnalysisService } from './analysis.service'
import { ZodValidationPipe } from '../common/validation.pipe'
import { createAnalysisSchema } from './dto/analysis.dto'

@ApiTags('AI 分析')
@Controller()
export class AnalysisController {
  constructor(private readonly service: AnalysisService) {}

  @Get('analyses/:taskItemId')
  @ApiOperation({ summary: '获取任务条目的 AI 分析结果' })
  @ApiParam({ name: 'taskItemId', description: '任务条目 ID' })
  findByTaskItem(@Param('taskItemId') taskItemId: string) {
    return this.service.findByTaskItem(taskItemId)
  }

  @Post('analyses')
  @ApiOperation({ summary: '创建/重新生成 AI 分析结果' })
  @ApiBody({ description: '任务条目 ID', schema: { type: 'object', properties: { taskItemId: { type: 'string' } } } })
  create(
    @Body(new ZodValidationPipe(createAnalysisSchema)) body: { taskItemId: string },
  ) {
    return this.service.create(body.taskItemId)
  }
}
