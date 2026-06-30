import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const isR2 = process.env.STORAGE_PROVIDER === "r2";

const s3 = new S3Client(
  isR2
    ? {
        region: "auto",
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
        },
      }
    : {
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
        },
      }
);

const BUCKET = isR2
  ? process.env.R2_BUCKET_NAME || ""
  : process.env.AWS_S3_BUCKET || "";

const PUBLIC_URL = isR2
  ? process.env.R2_PUBLIC_URL || ""
  : `https://${BUCKET}.s3.amazonaws.com`;

export async function uploadFile(
  buffer: Buffer,
  mimeType: string,
  folder: string = "uploads"
): Promise<string> {
  const ext = mimeType.split("/")[1] || "bin";
  const key = `${folder}/${crypto.randomUUID()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return `${PUBLIC_URL}/${key}`;
}

export async function deleteFile(url: string): Promise<void> {
  const key = url.replace(`${PUBLIC_URL}/`, "");
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function getPresignedUploadUrl(
  filename: string,
  mimeType: string,
  folder: string = "uploads"
): Promise<{ url: string; key: string; publicUrl: string }> {
  const ext = filename.split(".").pop() || "bin";
  const key = `${folder}/${crypto.randomUUID()}.${ext}`;

  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: mimeType,
    }),
    { expiresIn: 300 }
  );

  return { url, key, publicUrl: `${PUBLIC_URL}/${key}` };
}
