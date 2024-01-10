import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Task } from './task.schema';
import { Model } from 'mongoose';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStatus } from './task-status.enum';
import { TasksFilterDto } from './dto/get-task-filter.dto';

@Injectable()
export class TasksService {
  constructor(@InjectModel(Task.name) private taskModel: Model<Task>) {}

  async getTaskById(id: string): Promise<Task> {
    const found = await this.taskModel.findById(id);
    if (!found) {
      throw new NotFoundException(`Task with id ${id} not found!`);
    }
    return found;
  }

  async getTasks(filter: TasksFilterDto, user: any): Promise<Task[]> {
    const { search, status } = filter;
    if (Object.keys(filter).length) {
      return this.taskModel.find({
        userId: user._id,
        ...(status && { status: status }),
        ...(search && {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ],
        }),
      });
    }

    return this.taskModel.find({
      userId: user._id,
    });
  }

  async createTask(createTaskDto: CreateTaskDto, user: any): Promise<Task> {
    const createdTask = new this.taskModel({
      ...createTaskDto,
      userId: user._id,
      status: TaskStatus.OPEN,
    });
    return createdTask.save();
  }

  async deleteTask(id: string): Promise<void> {
    const found = await this.getTaskById(id);
    if (found) {
      await this.taskModel.findOneAndDelete({ _id: id });
    }
  }

  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    await this.getTaskById(id);
    return this.taskModel.findByIdAndUpdate(id, {
      status,
    });
  }
}
