import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { TaskStatus } from './task-status.enum';

export type TaskDocument = HydratedDocument<Task>;

@Schema()
export class Task {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  status: TaskStatus;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
