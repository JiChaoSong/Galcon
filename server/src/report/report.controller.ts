import { Controller, Get, Post, Param, Body } from '@nestjs/common'
import { ReportService } from './report.service'

@Controller('projects/:projectId/report')
export class ReportController {
  constructor(private readonly service: ReportService) {}

  @Get()
  generate(@Param('projectId') projectId: string) {
    return this.service.generate(projectId)
  }

  @Post('export')
  exportReport(@Param('projectId') projectId: string, @Body() body: any) {
    return this.service.exportReport(projectId, body.format || 'markdown')
  }
}
