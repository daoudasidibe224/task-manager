import { Module } from '@nestjs/common';
import { TaskListService } from './task-list.service.js';
import { TaskListController } from './task-list.controller.js';

@Module({
  controllers: [TaskListController],
  providers: [TaskListService],
  exports: [TaskListService],
})
export class TaskListsModule {}
