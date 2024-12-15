import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { AuthService } from '@/auth/auth.service';

import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let tastsService: TasksService;
  let authService: DeepMockProxy<AuthService>;
  let logger: DeepMockProxy<Logger>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: AuthService, useValue: mockDeep<AuthService>() },
        { provide: Logger, useValue: mockDeep<Logger>() }
      ]
    }).compile();

    tastsService = module.get(TasksService);
    authService = module.get(AuthService);
    logger = module.get(Logger);
  });

  it('should be defined', () => {
    expect(tastsService).toBeDefined();
  });

  it('should call removeExpiredAuthRecords on authService', async () => {
    await tastsService.removeExpiredAuthRecords();
    expect(authService.removeExpiredAuthRecords).toHaveBeenCalled();
  });

  it('should log an error if an exception is thrown', async () => {
    const error = new Error('test');

    authService.removeExpiredAuthRecords.mockRejectedValue(error);
    await tastsService.removeExpiredAuthRecords();
    expect(logger.error).toHaveBeenCalledWith(error);
  });
});
