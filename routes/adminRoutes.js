import { Router } from "express";
import {
  createAboutController,
  createAchievementController,
  createBlogController,
  createContactFormController,
  createExperienceController,
  createProjectController,
  createSignedURLController,
  getAboutController,
  getAchievementController,
  getBlogsController,
  getExperienceController,
  getOverviewController,
  getProjectByNavLinkController,
  getProjectController,
  getProjectLanguagesController,
  getProjectsListController,
  getSearchListController,
  getTweetIds,
  updateAboutController,
  updateAchievementController,
  updateBlogByIdController,
  updateExperienceController,
  updateProjectController,
  updateTweetIds,
} from "../controllers/adminController.js";
import { verifyAdmin } from "../middlewares/checkAuth.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  aboutCreateSchema,
  aboutUpdateSchema,
  createAchievementSchema,
  createBlogSchema,
  createContactSchema,
  createExperienceSchema,
  createSignedURLSchema,
  projectCreateSchema,
  projectUpdateSchema,
  tweetIdsSchema,
  updateAchievementSchema,
  updateBlogSchema,
  updateExperienceSchema,
} from "../validators/index.js";
import { upload, uploadMultiple, uploadSingle } from "../services/fileUpload.js";
import { saveToVercelBlob } from "../services/s3Services.js";

const adminRouter = Router();


// Add this route for Vercel Blob uploads
adminRouter.post(
  '/vercel-blob-upload',
  verifyAdmin,
  async (req, res) => {
    try {
      const { key, fileData, contentType } = req.body;
      
      if (!fileData || !key) {
        return res.status(400).json({
          success: false,
          message: 'Missing file data or key'
        });
      }

      const result = await saveToVercelBlob({
        Key: key,
        fileBase64: fileData,
        ContentType: contentType
      });

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Vercel Blob upload error:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

adminRouter.post(
  '/local-upload',
  verifyAdmin,
  upload.single('file'),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const baseURL = process.env.BASE_URL || 'http://localhost:5000';
      
      const uploadedFile = {
        url: `${baseURL}/uploads/${req.file.filename}`,
        key: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      };

      console.log('File uploaded locally:', req.file.filename);

      return res.status(200).json({
        success: true,
        data: uploadedFile
      });
    } catch (error) {
      console.error('Local upload error:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Multiple files upload (new)
adminRouter.post(
  '/local-upload-multiple',
  verifyAdmin,
  uploadMultiple,
  (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      const baseURL = process.env.BASE_URL || 'http://localhost:5000';
      
      const uploadedFiles = req.files.map(file => ({
        url: `${baseURL}/uploads/${file.filename}`,
        key: file.filename,
        originalName: file.originalname,
        size: file.size
      }));

      console.log(`${req.files.length} files uploaded locally`);

      return res.status(200).json({
        success: true,
        data: {
          files: uploadedFiles,
          count: req.files.length
        }
      });
    } catch (error) {
      console.error('Local upload error:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// About Routes
adminRouter.get("/about", getAboutController);

adminRouter.post(
  "/about",
  verifyAdmin,
  validateRequest(aboutCreateSchema),
  createAboutController
);

adminRouter.patch(
  "/about",
  verifyAdmin,
  validateRequest(aboutUpdateSchema),
  updateAboutController
);

// Twitter Routes
adminRouter.patch(
  "/tweetIds",
  verifyAdmin,
  validateRequest(tweetIdsSchema),
  updateTweetIds
);

adminRouter.get("/tweetIds", getTweetIds);

// Blog Route
adminRouter.post(
  "/blog",
  verifyAdmin,
  validateRequest(createBlogSchema),
  createBlogController
);

adminRouter.patch(
  "/blog/:id",
  verifyAdmin,
  validateRequest(updateBlogSchema),
  updateBlogByIdController
);

adminRouter.get("/blog", getBlogsController);

// Experience Route
adminRouter.post(
  "/experience",
  verifyAdmin,
  validateRequest(createExperienceSchema),
  createExperienceController
);

adminRouter.patch(
  "/experience/:id",
  verifyAdmin,
  validateRequest(updateExperienceSchema),
  updateExperienceController
);

adminRouter.get("/experience", getExperienceController);

// Achievements Route
adminRouter.post(
  "/achievement",
  verifyAdmin,
  validateRequest(createAchievementSchema),
  createAchievementController
);

adminRouter.patch(
  "/achievement/:id",
  verifyAdmin,
  validateRequest(updateAchievementSchema),
  updateAchievementController
);

adminRouter.get("/achievement", getAchievementController);

// S3 Routes
adminRouter.post(
  "/getS3UploadURL",
  verifyAdmin,
  validateRequest(createSignedURLSchema),
  createSignedURLController
);

// Projects Route
adminRouter.post(
  "/project",
  verifyAdmin,
  validateRequest(projectCreateSchema),
  createProjectController
);

adminRouter.get("/project", getProjectController);

adminRouter.get("/project/:navLink", getProjectByNavLinkController);

adminRouter.patch(
  "/project/:id",
  verifyAdmin,
  validateRequest(projectUpdateSchema),
  updateProjectController
);

adminRouter.get("/projectsList", getProjectsListController);

adminRouter.get("/languages", getProjectLanguagesController);

// Overview Content
adminRouter.get("/overview", getOverviewController);

// Search
adminRouter.get("/search", getSearchListController);

// Contact form
adminRouter.post(
  "/contact-form",
  validateRequest(createContactSchema),
  createContactFormController
);

export default adminRouter;
