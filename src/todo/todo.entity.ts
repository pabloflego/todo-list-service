import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { TodoStatus } from './todo-status.enum';

@Index('idx_todo_status', ['status'])
@Index('idx_todo_due_datetime', ['dueDatetime'])
@Entity({ name: 'todos' })
export class Todo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 16, default: TodoStatus.NOT_DONE })
  status: TodoStatus;

  @CreateDateColumn({ name: 'creation_datetime' })
  creationDatetime: Date;

  @Column({ name: 'due_datetime', type: 'datetime' })
  dueDatetime: Date;

  @Column({ name: 'done_datetime', type: 'datetime', nullable: true })
  doneDatetime: Date | null;
}
