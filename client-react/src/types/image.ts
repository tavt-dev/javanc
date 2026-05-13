export interface ImageDTO {
  id: number;
  url: string;
  publicId?: string;
  secureUrl?: string;
  format?: string;
  resourceType?: string;
  bytes?: number;
  width?: number;
  height?: number;
  createdAt?: string;
}
