import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../config/s3";
import { env } from "../config/env";
import { ApiError } from "../utils/api-error";

const UPLOAD_URL_EXPIRES_IN_SECONDS = 300;
const DOWNLOAD_URL_EXPIRES_IN_SECONDS = 120;

export async function createPresignedUploadUrl(params: {
  key: string;
  contentType: string;
}): Promise<{ uploadUrl: string; expiresInSeconds: number }> {
  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: params.key,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: UPLOAD_URL_EXPIRES_IN_SECONDS,
  });

  return { uploadUrl, expiresInSeconds: UPLOAD_URL_EXPIRES_IN_SECONDS };
}

export async function createPresignedDownloadUrl(params: {
  key: string;
}): Promise<{ downloadUrl: string; expiresInSeconds: number }> {
  const command = new GetObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: params.key,
  });

  const downloadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: DOWNLOAD_URL_EXPIRES_IN_SECONDS,
  });

  return { downloadUrl, expiresInSeconds: DOWNLOAD_URL_EXPIRES_IN_SECONDS };
}

export async function getS3ObjectMetadata(key: string): Promise<{
  contentType?: string;
  sizeBytes?: number;
}> {
  try {
    const command = new HeadObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
    });

    const result = await s3Client.send(command);

    return {
      contentType: result.ContentType,
      sizeBytes: result.ContentLength,
    };
  } catch {
    throw new ApiError(404, "Uploaded file was not found in S3");
  }
}