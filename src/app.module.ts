import { Module } from '@nestjs/common';
import { TodoModule } from './todo/todo.module';
import { SqliteDatasource } from './sqlite.datasource';

@Module({
  imports: [
    SqliteDatasource,
    TodoModule,
  ],
})
export class AppModule {}
