import { PutObjectCommand, S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  s3Client: S3Client;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_S3_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get('AWS_S3_SECRET_ACCESS_KEY')
      }
    });
  }

  async uploadImgToS3(filePath: string, file: Express.Multer.File, ext: string) {
    const command = new PutObjectCommand({
      Bucket: this.configService.get('AWS_S3_BUCKET_NAME'),
      Key: filePath,
      Body: file.buffer,
      ACL: 'public-read',
      ContentType: `image/${ext}`
    });

    await this.s3Client.send(command);
    const AWS_S3_REGION = this.configService.get('AWS_S3_REGION');
    const AWS_S3_BUCKET_NAME = this.configService.get('AWS_S3_BUCKET_NAME');

    return `https://s3.${AWS_S3_REGION}.amazonaws.com/${AWS_S3_BUCKET_NAME}/${filePath}`;
  }

  async deleteImgFromS3(filePath: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.configService.get('AWS_S3_BUCKET_NAME'),
      Key: filePath
    });
    await this.s3Client.send(command);
  }
}
