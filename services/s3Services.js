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
import { put, del } from '@vercel/blob';
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';

// Deriving __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isVercel = !!process.env.VERCEL;
const rootDir = path.resolve(__dirname, "./..");
const localStoragePath = path.join(rootDir, "uploads");

console.log("Environment:", isVercel ? "Vercel" : "Local/VPS");
console.log("Uploads folder path:", localStoragePath);

// Create uploads folder if it doesn't exist (only works outside Vercel)
if (!isVercel && !fs.existsSync(localStoragePath)) {
  fs.mkdirSync(localStoragePath, { recursive: true });
  console.log("Created uploads folder at:", localStoragePath);
}

// Check S3 configuration
const bucket = process.env.AWS_S3_BUCKET_CUSTOM || process.env.AWS_BUCKET_NAME;
const hasS3Credentials = !!(
  process.env.AWS_ACCESS_KEY_ID && 
  process.env.AWS_SECRET_ACCESS_KEY && 
  bucket
);

// Initialize S3 Client only if credentials are available
const s3Client = hasS3Credentials
  ? new S3Client({
      region: process.env.AWS_S3_REGION_CUSTOM || process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID_CUSTOM || process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_CUSTOM || process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  : null;

const baseURL = process.env.BASE_URL || 
                (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:5000");

// Log which mode we're using
if (s3Client) {
  console.log("✅ Storage mode: AWS S3");
} else if (isVercel) {
  console.log("✅ Storage mode: Vercel Blob (S3 not configured)");
} else {
  console.log("✅ Storage mode: Local File System");
}

export const generatePreSignedUploadURL = async ({ Key, ContentType }) => {
  // Priority: S3 > Vercel Blob > Local
  
  if (s3Client && bucket) {
    // Use S3
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
        useVercelBlob: false,
      };
    } catch (error) {
      console.error("S3 Error:", error);
      // Fall through to next option
    }
  }
  
  if (isVercel) {
    // Use Vercel Blob for Vercel deployments
    return {
      url: `${baseURL}/api/admin/vercel-blob-upload`,
      useLocal: false,
      useVercelBlob: true,
      key: Key,
    };
  }
  
  // Use local file system for traditional hosting
  return {
    url: `${baseURL}/api/admin/local-upload`,
    useLocal: true,
    useVercelBlob: false,
    key: Key,
  };
};

// Save file to Vercel Blob
export const saveToVercelBlob = async ({ Key, fileBase64, ContentType }) => {
  try {
    console.log("Uploading to Vercel Blob...");
    
    // Remove data URL prefix if present
    const base64Data = fileBase64.replace(/^data:.*;base64,/, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');
    
    console.log("File buffer size:", fileBuffer.length, "bytes");
    
    const blob = await put(Key, fileBuffer, {
      access: 'public',
      contentType: ContentType,
    });

    console.log("File uploaded to Vercel Blob:", blob.url);

    return {
      success: true,
      url: blob.url,
      key: Key,
    };
  } catch (error) {
    console.error("Error uploading to Vercel Blob:", error);
    throw error;
  }
};

// Save file locally from base64
export const saveLocalFile = async ({ Key, fileBase64, ContentType }) => {
  if (isVercel) {
    // Redirect to Vercel Blob on Vercel
    return saveToVercelBlob({ Key, fileBase64, ContentType });
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

export const deleteS3Object = async ({ Key, url }) => {
  if (s3Client && bucket) {
    // Delete from S3
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
  } else if (isVercel && url) {
    // Delete from Vercel Blob
    try {
      await del(url);
      console.log("File deleted from Vercel Blob");
      return { message: "File deleted from Vercel Blob", success: true };
    } catch (error) {
      console.error("Error deleting from Vercel Blob:", error);
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
export const isUsingVercelBlob = () => isVercel && !s3Client;
export const getLocalStoragePath = () => localStoragePath;