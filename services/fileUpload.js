import multer from 'multer';
import { getLocalStoragePath } from './s3Services.js';

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getLocalStoragePath());
  },
  filename: (req, file, cb) => {
    // Get key from request body/query or use original filename
    const key = req.body.key || req.query.key || file.originalname;
    cb(null, key);
  }
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Export both single and multiple upload middleware
export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', 12); // Max 12 files