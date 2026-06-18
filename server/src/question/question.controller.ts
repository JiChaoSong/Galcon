import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger'
import { QuestionService } from './question.service'
import { ZodValidationPipe } from '../common/validation.pipe'
import { createQuestionSchema, updateQuestionSchema } from './dto/question.dto'

@ApiTags('问题库')
@Controller('projects/:projectId/questions')
export class QuestionController {
  constructor(private readonly service: QuestionService) {}

  @Get()
  @ApiOperation({ summary: '获取项目下所有问题' })
  @ApiParam({ name: 'projectId', description: '项目 ID' })
  findAll(@Param('projectId') projectId: string) {
    return this.service.findAll(projectId)
  }

  @Post()
  @ApiOperation({ summary: '创建问题' })
  @ApiParam({ name: 'projectId', description: '项目 ID' })
  @ApiBody({ description: '问题信息' })
  create(
    @Param('projectId') projectId: string,
    @Body(new ZodValidationPipe(createQuestionSchema)) body: any,
  ) {
    return this.service.create(projectId, body)
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新问题' })
  @ApiParam({ name: 'id', description: '问题 ID' })
  @ApiBody({ description: '要更新的字段' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateQuestionSchema)) body: any,
  ) {
    return this.service.update(id, body)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除问题' })
  @ApiParam({ name: 'id', description: '问题 ID' })
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
