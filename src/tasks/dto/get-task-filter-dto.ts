import { TaskStatus } from '../task.model';

export class TasksFilterDto {
  status: TaskStatus;
  search: string;
}
