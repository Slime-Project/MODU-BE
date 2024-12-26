import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';

import { fileMock } from '@/utils/unit-test';

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
    const fileName = 'reviews/1/1.jpg';
    const ext = 'jpg';
    const result = await service.uploadImgToS3(fileName, fileMock, ext);
    expect(result).toMatch(/^https:\/\/s3\..+\.amazonaws\.com\/.+\/reviews\/1\/1\.jpg$/);
  });

  it('should delete an image to S3', async () => {
    service.s3Client.send = jest.fn();
    await service.deleteImgFromS3('reviews/1/1.jpg');
    expect(service.s3Client.send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
  });
});
