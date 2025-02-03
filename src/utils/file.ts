import { MimeType } from '@/types/file.type';

const checkFileMimeType = (file: Express.Multer.File, allowedMimeTypes: MimeType[]) => {
  return !!allowedMimeTypes.find(allowedMimeType => allowedMimeType === file.mimetype);
};

const isValidJpegContent = (file: Express.Multer.File): boolean => {
  const { buffer } = file;
  const jpegHeader = buffer.toString('hex', 0, 2);
  return jpegHeader === 'ffd8';
};

const isValidPngContent = (file: Express.Multer.File): boolean => {
  const { buffer } = file;
  const pngHeader = buffer.toString('hex', 0, 8); // 시작 8바이트
  return pngHeader === '89504e470d0a1a0a';
};

const isValidFileContent = (file: Express.Multer.File) => {
  const { mimetype } = file;

  switch (mimetype) {
    case 'image/jpeg':
      return isValidJpegContent(file);
    case 'image/png':
      return isValidPngContent(file);
    default:
      return false;
  }
};

export { checkFileMimeType, isValidFileContent };
