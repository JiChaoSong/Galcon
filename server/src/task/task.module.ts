import { Module } from '@nestjs/common'
import { TaskController } from './task.controller'
import { FlatTaskController } from './flat-task.controller'
import { TaskService } from './task.service'
import { ProjectModule } from '../project/project.module'

@Module({
  imports: [ProjectModule],
  controllers: [TaskController, FlatTaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
