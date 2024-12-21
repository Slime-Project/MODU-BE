import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';

import { S3Service } from './s3.service';

describe('S3Service', () => {
  let service: S3Service;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [S3Service, { provide: ConfigService, useValue: mockDeep<ConfigService>() }]
    }).compile();

    service = module.get(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upload an image to S3 and return a URL', async () => {
    service.s3Client.send = jest.fn();
    const file = { buffer: Buffer.from('file content') } as Express.Multer.File;
    const fileName = 'reviews/1/1.jpg';
    const ext = 'jpg';
    const result = await service.uploadImgToS3(fileName, file, ext);
    expect(result).toMatch(/^https:\/\/s3\..+\.amazonaws\.com\/.+\/reviews\/1\/1\.jpg$/);
  });
});
