export interface InitiateUploadInput {
  fileName: string;
  contentType: string;
  sizeBytes: number;
  sensitivityLevel?: string;
}

export interface InitiateUploadResponse {
  fileId: string;
  s3Key: string;
  uploadUrl: string;
  expiresInSeconds: number;
}

export interface CompleteUploadInput {
  fileId: string;
}

export interface CompleteUploadResponse {
  fileId: string;
  uploadStatus: string;
  sizeBytes?: number;
  contentType?: string;
}
export interface DownloadFileInput {
  fileId: string;
  justification?: string;
}

export interface DownloadFileResponse {
  fileId: string;
  fileName: string;
  downloadUrl: string;
  expiresInSeconds: number;
}