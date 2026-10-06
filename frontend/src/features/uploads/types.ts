import type { InternalUploadsUploadResponse } from '@/api/schema'

export type UploadedFile = InternalUploadsUploadResponse

/** Mirrors the backend defaults in `internal/uploads` (`DefaultUploadConfig`). */
export const UPLOAD_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf', '.doc', '.docx', '.txt',
  '.mp4', '.avi', '.mov',
  '.mp3', '.wav', '.ogg',
] as const
export const UPLOAD_MAX_SIZE_MB = 50
