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

// Detect if running in serverless environment (Vercel, AWS Lambda, etc.)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Use /tmp for serverless, uploads folder for traditional hosting
const rootDir = isServerless ? '/tmp' : path.resolve(__dirname, "./..");
const localStoragePath = isServerless 
  ? path.join('/tmp', 'uploads')
  : path.join(rootDir, "uploads");

console.log("Environment:", isServerless ? "Serverless" : "Traditional");
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

const baseURL = process.env.BASE_URL || process.env.VERCEL_URL || "http://localhost:5000";

// Log which mode we're using
console.log("Storage mode:", s3Client ? "S3" : "Local");
if (!s3Client) {
  console.log("⚠️ S3 credentials not found, using local storage");
  if (isServerless) {
    console.warn("⚠️ WARNING: Local storage in serverless is temporary and will be cleared!");
    console.warn("⚠️ Please configure S3 for production use.");
  }
  console.log("Missing:", {
    accessKey: !process.env.AWS_ACCESS_KEY_ID,
    secretKey: !process.env.AWS_SECRET_ACCESS_KEY,
    bucket: !bucket
  });
}

export const generatePreSignedUploadURL = async ({ Key, ContentType }) => {
  // Force S3 usage in serverless environments if configured
  if (isServerless && !s3Client) {
    throw new Error("S3 configuration required for serverless deployment");
  }

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
      
      // In serverless, don't fallback to local
      if (isServerless) {
        throw new Error("S3 upload failed in serverless environment");
      }
      
      // Fallback to local storage only in traditional hosting
      console.log("Falling back to local storage due to S3 error");
      return {
        url: `${baseURL}/api/admin/local-upload`,
        useLocal: true,
        key: Key,
      };
    }
  } else {
    // Block local storage in serverless
    if (isServerless) {
      throw new Error("S3 configuration required for serverless deployment. Local storage is not persistent.");
    }
    
    // Use local storage (only in traditional hosting)
    return {
      url: `${baseURL}/api/admin/local-upload`,
      useLocal: true,
      key: Key,
    };
  }
};

// Save file locally from base64
export const saveLocalFile = async ({ Key, fileBase64, ContentType }) => {
  // Block local storage in serverless
  if (isServerless && !s3Client) {
    throw new Error("S3 configuration required for serverless deployment. Local storage is not persistent.");
  }

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
    // Block local deletion in serverless without S3
    if (isServerless && !s3Client) {
      throw new Error("S3 configuration required for serverless deployment");
    }
    
    // Delete from local storage (only in traditional hosting)
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
export const isServerlessEnvironment = () => isServerless;