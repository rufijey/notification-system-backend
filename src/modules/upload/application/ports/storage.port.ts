export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

export interface IStorageService {
  generatePresignedUrl(fileName: string, contentType: string): Promise<{ uploadUrl: string; fileUrl: string }>;
}
