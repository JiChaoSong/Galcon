import { Controller, Get, Param } from '@nestjs/common'
import { MetricService } from './metric.service'

@Controller('projects/:projectId/metrics')
export class MetricController {
  constructor(private readonly service: MetricService) {}

  @Get()
  overview(@Param('projectId') projectId: string) {
    return this.service.getOverview(projectId)
  }

  @Get('brands')
  byBrand(@Param('projectId') projectId: string) {
    return this.service.getByBrand(projectId)
  }

  @Get('task-stats')
  taskStats(@Param('projectId') projectId: string) {
    return this.service.getTaskStats(projectId)
  }
}
