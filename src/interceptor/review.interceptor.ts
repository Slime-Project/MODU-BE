import { UnsupportedMediaTypeException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

import { REVIEW_ALLOWED_MIME_TYPE, REVIEW_IMG_SIZE_LIMIT } from '@/constants/review';
import { checkFileMimeType } from '@/utils/file';

const reviewImgInterceptor = FilesInterceptor('imgs', 9, {
  limits: {
    fileSize: REVIEW_IMG_SIZE_LIMIT
  },
  fileFilter: (_, file: Express.Multer.File, callback) => {
    if (checkFileMimeType(file, REVIEW_ALLOWED_MIME_TYPE)) {
      callback(null, true);
    } else {
      callback(new UnsupportedMediaTypeException('Only JPEG or PNG files are allowed'), false);
    }
  }
});

export { reviewImgInterceptor };
