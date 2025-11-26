import { Module } from '@nestjs/common';
import { TodoModule } from './todo/todo.module';
import { SqliteDatasource } from './sqlite.datasource';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    SqliteDatasource,
    TodoModule,
    HealthModule,
  ],
})
export class AppModule {}
