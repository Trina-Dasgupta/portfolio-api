// import {
//   DeleteObjectCommand,
//   PutObjectCommand,
//   S3Client,
// } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// const s3Client = new S3Client({
//   region: process.env.AWS_S3_REGION_CUSTOM || process.env.AWS_REGION,
//   credentials: {
//     accessKeyId:
//       process.env.AWS_ACCESS_KEY_ID_CUSTOM ||
//       process.env.AWS_ACCESS_KEY,
//     secretAccessKey:
//       process.env.AWS_SECRET_ACCESS_KEY_CUSTOM ||
//       process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// const bucket = process.env.AWS_S3_BUCKET_CUSTOM || process.env.AWS_BUCKET_NAME;

// export const generatePreSignedUploadURL = async ({ Key, ContentType }) => {
//   const command = new PutObjectCommand({
//     Bucket: bucket,
//     Key,
//     ContentType,
//   });

//   const preSignedUploadURL = await getSignedUrl(s3Client, command, {
//     expiresIn: 300,
//     signableHeaders: new Set(["content-type"]),
//   });
//   return preSignedUploadURL;
// };

// export const deleteS3Object = async ({ Key }) => {
//   const command = new DeleteObjectCommand({
//     Bucket: bucket,
//     Key,
//   });

//   const res = await s3Client.send(command);
//   return res;
// };






import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Deriving __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = path.resolve(__dirname, "./..");
const localStoragePath = path.join(rootDir, "uploads");

console.log("Uploads folder path:", localStoragePath);

// Create uploads folder if it doesn't exist
if (!fs.existsSync(localStoragePath)) {
  fs.mkdirSync(localStoragePath, { recursive: true });
  console.log("Created uploads folder at:", localStoragePath);
}

// Check if S3 is properly configured
const bucket = process.env.AWS_S3_BUCKET_CUSTOM || process.env.AWS_BUCKET_NAME;
const hasS3Credentials = !!(
  process.env.AWS_ACCESS_KEY_ID && 
  process.env.AWS_SECRET_ACCESS_KEY && 
  bucket
);

// Initialize S3 Client only if all credentials are available
const s3Client = hasS3Credentials
  ? new S3Client({
      region: process.env.AWS_S3_REGION_CUSTOM || process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID_CUSTOM || process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_CUSTOM || process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  : null;

const baseURL = process.env.BASE_URL || "http://localhost:5000";

// Log which mode we're using
console.log("Storage mode:", s3Client ? "S3" : "Local");
if (!s3Client) {
  console.log("S3 credentials not found, using local storage");
  console.log("Missing:", {
    accessKey: !process.env.AWS_ACCESS_KEY_ID,
    secretKey: !process.env.AWS_SECRET_ACCESS_KEY,
    bucket: !bucket
  });
}

export const generatePreSignedUploadURL = async ({ Key, ContentType }) => {
  // Check if S3 is available
  if (s3Client && bucket) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key,
        ContentType,
      });

      const preSignedUploadURL = await getSignedUrl(s3Client, command, {
        expiresIn: 300,
        signableHeaders: new Set(["content-type"]),
      });
      
      return {
        url: preSignedUploadURL,
        useLocal: false,
      };
    } catch (error) {
      console.error("Error generating S3 signed URL:", error);
      // Fallback to local storage if S3 fails
      console.log("Falling back to local storage due to S3 error");
      return {
        url: `${baseURL}/api/admin/local-upload`,
        useLocal: true,
        key: Key,
      };
    }
  } else {
    // Use local storage
    return {
      url: `${baseURL}/api/admin/local-upload`,
      useLocal: true,
      key: Key,
    };
  }
};

// Save file locally from base64
export const saveLocalFile = async ({ Key, fileBase64, ContentType }) => {
  try {
    const localFilePath = path.join(localStoragePath, Key);
    const dir = path.dirname(localFilePath);

    console.log("Saving file to:", localFilePath);

    // Create directory if needed
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log("Created directory:", dir);
    }

    // Remove data URL prefix if present
    const base64Data = fileBase64.replace(/^data:.*;base64,/, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');

    console.log("File buffer size:", fileBuffer.length, "bytes");

    // Save file
    fs.writeFileSync(localFilePath, fileBuffer);

    console.log("File saved successfully at:", localFilePath);

    // Verify file exists
    if (fs.existsSync(localFilePath)) {
      const stats = fs.statSync(localFilePath);
      console.log("File size on disk:", stats.size, "bytes");
    }

    return {
      success: true,
      url: `${baseURL}/uploads/${Key}`,
      key: Key,
    };
  } catch (error) {
    console.error("Error saving local file:", error);
    throw error;
  }
};

export const deleteS3Object = async ({ Key }) => {
  if (s3Client && bucket) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key,
      });

      const res = await s3Client.send(command);
      return res;
    } catch (error) {
      console.error("Error deleting from S3:", error);
      throw error;
    }
  } else {
    // Delete from local storage
    const localFilePath = path.join(localStoragePath, Key);
    try {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
        console.log("File deleted:", localFilePath);
      }
      return { message: "File deleted locally", success: true };
    } catch (error) {
      console.error("Error deleting local file:", error);
      throw error;
    }
  }
};

export const isUsingS3 = () => !!s3Client && !!bucket;
export const getLocalStoragePath = () => localStoragePath;