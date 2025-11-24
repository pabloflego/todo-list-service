import { TypeOrmModule } from "@nestjs/typeorm";


export const SqliteDatasource = TypeOrmModule.forRoot({
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  autoLoadEntities: true,
});