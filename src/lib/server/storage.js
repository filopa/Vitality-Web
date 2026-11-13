import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/*
 Env vars (server only):
   B2_S3_ENDPOINT      e.g. https://s3.us-west-004.backblazeb2.com
   B2_REGION           e.g. us-west-004
   B2_KEY_ID / B2_APP_KEY
   B2_BUCKET           e.g. Video-Dolphin
   B2_PUBLIC_BASE_URL  e.g. https://f003.backblazeb2.com/file/Video-Dolphin   (no trailing slash)
*/

export const UPLOAD_URL_TTL_SECONDS = 300;

let client;
function getClient() {
  client ??= new S3Client({
    endpoint: process.env.B2_S3_ENDPOINT,
    region: process.env.B2_REGION,
    credentials: { accessKeyId: process.env.B2_KEY_ID, secretAccessKey: process.env.B2_APP_KEY },
    // Newer AWS SDK versions add checksum parameters that Backblaze B2 rejects.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return client;
}

const publicBase = () => (process.env.B2_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");

/**
 * Presigned PUT URL: the browser uploads straight to B2.
 * Content-Type and Content-Length are part of the signature, so the browser can only
 * upload a file of exactly the declared type and size.
 */
export async function createPresignedPut({ key, contentType, size, expiresIn = UPLOAD_URL_TTL_SECONDS }) {
  const command = new PutObjectCommand({
    Bucket: process.env.B2_BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  });

  const uploadUrl = await getSignedUrl(getClient(), command, {
    expiresIn,
    signableHeaders: new Set(["content-type", "content-length"]),
  });

  return {
    uploadUrl,
    headers: { "Content-Type": contentType },
    publicUrl: `${publicBase()}/${key}`,
    expiresIn,
  };
}

/** Server-side upload (kept for routes that upload through the backend). Browser uploads should use createPresignedPut. */
export async function putPublicObject(key, body, contentType) {
  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.B2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return `${publicBase()}/${key}`;
}

/** Returns the storage key for URLs that live in OUR bucket, otherwise null (e.g. Google photos). */
export function keyFromPublicUrl(url) {
  const base = `${publicBase()}/`;
  return typeof url === "string" && base.length > 1 && url.startsWith(base) ? url.slice(base.length) : null;
}

export async function deleteObject(key) {
  await getClient().send(new DeleteObjectCommand({ Bucket: process.env.B2_BUCKET, Key: key }));
}
