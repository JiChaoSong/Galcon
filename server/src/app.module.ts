import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { ProjectModule } from './project/project.module'
import { BrandModule } from './brand/brand.module'
import { QuestionModule } from './question/question.module'
import { TaskModule } from './task/task.module'
import { MetricModule } from './metric/metric.module'
import { ReportModule } from './report/report.module'
import { AnalysisModule } from './analysis/analysis.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ProjectModule,
    BrandModule,
    QuestionModule,
    TaskModule,
    MetricModule,
    ReportModule,
    AnalysisModule,
  ],
})
export class AppModule {}
