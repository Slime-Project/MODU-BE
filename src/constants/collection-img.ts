import { MimeType } from '@/types/file.type';

const COLLECTION_IMG_SIZE_LIMIT = 1 * 1024 * 1024; // 1MB
const COLLECTION_ALLOWED_MIME_TYPE: MimeType[] = ['image/jpeg', 'image/png'];

export { COLLECTION_IMG_SIZE_LIMIT, COLLECTION_ALLOWED_MIME_TYPE };
