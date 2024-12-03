import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { AuthService } from '@/auth/auth.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly autuService: AuthService,
    private readonly logger: Logger
  ) {}

  @Cron('0 0 * * *', { name: 'removeExpiredAuthRecords' })
  async removeExpiredAuthRecords() {
    try {
      await this.autuService.removeExpiredAuthRecords();
    } catch (error) {
      this.logger.error(error);
    }
  }
}
