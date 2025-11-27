import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async check(): Promise<{ status: 'ok'; db: 'up' | 'down' }> {
    try {
      await this.dataSource.query('SELECT 1');
      this.logger.debug('Health check: DB up');
      return { status: 'ok', db: 'up' };
    } catch (err) {
      this.logger.error('Health check: DB down', err instanceof Error ? err.stack : undefined);
      return { status: 'ok', db: 'down' };
    }
  }
}
