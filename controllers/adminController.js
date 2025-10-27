import mongoose from "mongoose";
import path from "path";
import crypto from "crypto";
import Achievement from "../models/AchievementModel.js";
import Blog from "../models/BlogModel.js";
import Experience from "../models/ExperienceModel.js";
import Owner from "../models/ownerModel.js";
import Project from "../models/ProjectModel.js";
import { sendEmail } from "../services/resend.js";
import {
  deleteS3Object,
  generatePreSignedUploadURL,
} from "../services/s3Services.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { StatusCodes } from "http-status-codes";

const _id = process.env.ADMIN_ID;

// About Controllers
export const createAboutController = async (req, res) => {
  try {
    const owner = await Owner.create(req.body || {});
    return ApiResponse.success(res, {
      message: "Owner details added",
      data: owner,
      status: StatusCodes.CREATED,
    });
  } catch (error) {
    return ApiResponse.error(res, error, {
      message: "Error while creating owner",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export const getAboutController = async (req, res) => {
  const user = req.user;
  try {
    const ownerData = await Owner.findById(_id).lean();
    if (!ownerData) {
      return ApiResponse.error(res, null, {
        message: "Owner data not found",
        status: StatusCodes.NOT_FOUND,
        log: false,
      });
    }

    return ApiResponse.success(res, {
      message: "Owner data retrieved successfully",
      data: {
        name: ownerData.name,
        role: ownerData.role,
        miniDescription: ownerData.miniDescription,
        description: ownerData.description,
        currentFocus: ownerData.currentFocus,
        skills: ownerData.skills,
        profilePic: ownerData.profilePic,
        aboutReadme: ownerData.aboutReadme,
      },
      status: StatusCodes.OK,
    });
  } catch (error) {
    return ApiResponse.error(res, error, {
      message: "Error fetching owner data",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export const updateAboutController = async (req, res) => {
  try {
    if (Object.entries(req.body).length === 0) {
      return ApiResponse.error(res, null, {
        message: "No valid fields provided to update",
        status: StatusCodes.BAD_REQUEST,
        log: false,
      });
    }
    const ownerData = await Owner.findById(_id).lean();
    if (!ownerData) {
      return ApiResponse.error(res, null, {
        message: "Owner data not found",
        status: StatusCodes.NOT_FOUND,
        log: false,
      });
    }

    if (req.body.profilePic) {
      if (ownerData.profilePic) {
        const key = ownerData.profilePic.split("/").pop();
        await deleteS3Object({ Key: key });
      }
    }

    const updatedOwner = await Owner.findByIdAndUpdate(_id, req.body, {
      new: true,
    }).lean();

    return ApiResponse.success(res, {
      message: "Owner details updated successfully",
      data: updatedOwner,
      status: StatusCodes.OK,
    });
  } catch (error) {
    return ApiResponse.error(res, error, {
      message: "Error updating owner data",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// Twitter Controller
export const updateTweetIds = async (req, res) => {
  try {
    const ownerData = await Owner.findByIdAndUpdate(_id, req.body, {
      new: true,
    });

    return ApiResponse.success(res, {
      message: "Tweets Updated",
      data: ownerData.tweetIds,
      status: StatusCodes.OK,
    });
  } catch (error) {
    return ApiResponse.error(res, error, {
      message: "Error updating tweet data",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export const getTweetIds = async (req, res) => {
  try {
    const tweetIds = await Owner.findById(_id).select("tweetIds").lean();

    if (!tweetIds) {
      return ApiResponse.error(res, null, {
        message: "No tweetIds found",
        status: StatusCodes.BAD_REQUEST,
        log: false,
      });
    }

    return ApiResponse.success(res, {
      data: tweetIds,
      status: StatusCodes.OK,
    });
  } catch (error) {
    return ApiResponse.error(res, error, {
      message: "Error getting tweet data",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// Blog Controller
export const createBlogController = async (req, res) => {
  try {
    const blog = await Blog.create(req.body);

    return ApiResponse.success(res, {
      message: "New blog added successfully",
      data: blog,
      status: StatusCodes.CREATED,
    });
  } catch (error) {
    return ApiResponse.error(res, error, {
      message: "Error creating blog",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export const getBlogsController = async (_, res) => {
  try {
    const blogs = await Blog.find({}).lean();

    return ApiResponse.success(res, {
      message:
        blogs.length > 0 ? "Blogs fetched successfully" : "No blogs found",
      data: blogs,
      status: StatusCodes.OK,
    });
  } catch (error) {
    return ApiResponse.error(res, error, {
      message: "Error getting blogs data",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export const updateBlogByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiResponse.error(res, null, {
        message: "Invalid blog ID",
        status: StatusCodes.BAD_REQUEST,
        log: false,
      });
    }

    if (Object.keys(req.body).length === 0) {
      return ApiResponse.error(res, null, {
        message: "No valid fields provided to update",
        status: StatusCodes.BAD_REQUEST,
        log: false,
      });
    }

    const updatedBlog = await Blog.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedBlog) {
      return ApiResponse.error(res, null, {
        message: "Blog data not found",
        status: StatusCodes.NOT_FOUND,
        log: false,
      });
    }

    return ApiResponse.success(res, {
      message: "Blog data updated successfully",
      data: updatedBlog,
      status: StatusCodes.OK,
    });
  } catch (error) {
    return ApiResponse.error(res, error, {
      message: "Error updating blog data",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// Experience Controller
export const createExperienceController = async (req, res) => {
  try {
    const experience = await Experience.create(req.body);
    return ApiResponse.success(res, {
      message: "New experience added successfully",
      data: experience,
      status: StatusCodes.CREATED,
    });
  } catch (error) {
    return ApiResponse.error(res, error, {
      message: "Error creating experience",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export const getExperienceController = async (req, res) => {
  try {
    const experiences = await Experience.find({}).lean();

    return ApiResponse.success(res, {
      message:
        experiences.length > 0
          ? "Experience data fetched successfully"
          : "No experience data found",
      data: experiences,
      status: StatusCodes.OK,
    });
  } catch (error) {
    return ApiResponse.error(res, error, {
      message: "Error getting experience data",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export const updateExperienceController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiResponse.error(res, null, {
        message: "Invalid experience ID",
        status: StatusCodes.BAD_REQUEST,
        log: false,
      });
    }

    const experience = await Experience.findById(id);
    if (!experience) {
      return ApiResponse.error(res, null, {
        message: "Experience not found",
        status: StatusCodes.NOT_FOUND,
        log: false,
      });
    }

    if (Object.keys(req.body).length === 0) {
      return ApiResponse.error(res, null, {
        message: "No valid fields provided to update",
        status: StatusCodes.BAD_REQUEST,
        log: false,
      });
    }

    if (req.body.companyLogo) {
      if (experience.companyLogo) {
        const key = experience.companyLogo.split("/").pop();
        await deleteS3Object({ Key: key });
      }
    }

    const updatedExperience = await Experience.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    return ApiResponse.success(res, {
      message: "Experience updated successfully",
      data: updatedExperience,
      status: StatusCodes.OK,
    });
  } catch (error) {
    return ApiResponse.error(res, error, {
      message: "Error updating experience",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// Achievement Controller
export const createAchievementController = async (req, res) => {
  try {
    const achievement = await Achievement.create(req.body);
    return ApiResponse.success(res, {
      message: "New achievement added successfully",
      data: achievement,
      status: StatusCodes.CREATED,
    });
  } catch (error) {
    return ApiResponse.error(res, error, {
      message: "Error creating achievement",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export const getAchievementController = async (_, res) => {
  try {
    const achievements = await Achievement.find({}).lean();

    return ApiResponse.success(res, {
      message:
        achievements.length > 0
          ? "Achievement data fetched successfully"
          : "No achievement data found",
      data: achievements,
      status: StatusCodes.OK,
    });
  } catch (error) {
    return ApiResponse.error(res, error, {
      message: "Error getting achievement data",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export const updateAchievementController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiResponse.error(res, null, {
        message: "Invalid achievement ID",
        status: StatusCodes.BAD_REQUEST,
        log: false,
      });
    }

    if (Object.keys(req.body).length === 0) {
      return ApiResponse.error(res, null, {
        message: "No valid fields provided to update",
        status: StatusCodes.BAD_REQUEST,
        log: false,
      });
    }

    const achievement = await Achievement.findById(id);
    if (!achievement) {
      return ApiResponse.error(res, null, {
        message: "Achievement not found",
        status: StatusCodes.NOT_FOUND,
        log: false,
      });
    }

    if (req.body.companyLogo) {
      if (achievement.companyLogo) {
        const key = achievement.companyLogo.split("/").pop();
        await deleteS3Object({ Key: key });
      }
    }

    if (req.body.images) {
      const oldImages = achievement.images || [];
      const imagesToDelete = oldImages.filter(
        (img) => !req.body.images.includes(img)
      );
      for (const imgUrl of imagesToDelete) {
        const key = imgUrl.split("/").pop();
        await deleteS3Object({ Key: key });
      }
    }

    const updatedAchievement = await Achievement.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    return ApiResponse.success(res, {
      message: "Achievement updated successfully",
      data: updatedAchievement,
      status: StatusCodes.OK,
    });
  } catch (error) {
    return ApiResponse.error(res, error, {
      message: "Error updating achievement",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export const createSignedURLController = async (req, res) => {
  try {
    const { fileName, contentType, fileData } = req.body || {};
    console.log("Received upload request:", { fileName, contentType, hasFileData: !!fileData });
    
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(contentType)) {
      return ApiResponse.error(res, null, {
        message: "Invalid file type",
        status: StatusCodes.BAD_REQUEST,
        log: false,
      });
    }
    
    const s3ObjectKey = `${crypto.randomUUID()}${path.extname(fileName)}`;
    console.log("Generated key:", s3ObjectKey);
    
    const result = await generatePreSignedUploadURL({
      ContentType: contentType,
      Key: s3ObjectKey,
    });
    
    console.log("Upload URL result:", result);
    
    // Handle Vercel Blob upload
    if (result.useVercelBlob && fileData) {
      console.log("Saving to Vercel Blob...");
      const saveResult = await saveToVercelBlob({
        Key: s3ObjectKey,
        fileBase64: fileData,
        ContentType: contentType,
      });
      
      return ApiResponse.success(res, {
        data: {
          url: saveResult.url,
          s3ObjectKey: saveResult.key,
          useVercelBlob: true,
        },
        status: StatusCodes.OK,
      });
    }
    
    // Handle local upload
    if (result.useLocal && fileData) {
      console.log("Saving file locally...");
      const saveResult = await saveLocalFile({
        Key: s3ObjectKey,
        fileBase64: fileData,
        ContentType: contentType,
      });
      
      return ApiResponse.success(res, {
        data: {
          url: saveResult.url,
          s3ObjectKey: saveResult.key,
          useLocal: true,
        },
        status: StatusCodes.OK,
      });
    }
    
    return ApiResponse.success(res, {
      data: {
        url: result.url,
        s3ObjectKey,
        useLocal: result.useLocal || false,
        useVercelBlob: result.useVercelBlob || false,
      },
      status: StatusCodes.OK,
    });
  } catch (error) {
    console.error("Error in createSignedURLController:", error);
    return ApiResponse.error(res, error, {
      message: error.message || "Error creating upload URL",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};
// Project Controller
export const createProjectController = async (req, res) => {
  try {
    const project = await Project.create(req.body);
    return ApiResponse.success(res, {
      message: "New project added successfully",
      data: project,
      status: StatusCodes.CREATED,
    });
  } catch (error) {
    return ApiResponse.error(res, error, {
      message: "Internal server error",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export const getProjectController = async (_, res) => {
  try {
    const projects = await Project.find({}).lean();

    return ApiResponse.success(res, {
      message:
        projects.length > 0
          ? "Project data fetched successfully"
          : "No project data found",
      data: projects,
      status: StatusCodes.OK,
    });
  } catch (error) {
    return ApiResponse.error(res, error, {
      message: "Error getting project data",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export const getProjectByNavLinkController = async (req, res) => {
  const { navLink } = req.params || {};
  try {
    const project = await Project.findOne({ navLink }).lean();

    if (!project) {
      return ApiResponse.error(res, null, {
        message: "Project not found",
        status: StatusCodes.BAD_REQUEST,
        log: false,
      });
    }

    return ApiResponse.success(res, {
      message: "Project data fetched successfully",
      data: project,
      status: StatusCodes.OK,
    });
  } catch (error) {
    return ApiResponse.error(res, error, {
      message: "Error getting project data",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export const updateProjectController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiResponse.error(res, null, {
        message: "Invalid project ID",
        status: StatusCodes.BAD_REQUEST,
        log: false,
      });
    }

    if (Object.entries(req.body).length === 0) {
      return ApiResponse.error(res, null, {
        message: "No valid fields provided to update",
        status: StatusCodes.BAD_REQUEST,
        log: false,
      });
    }

    const oldProject = await Project.findById(id);
    if (!oldProject) {
      return ApiResponse.error(res, null, {
        message: "Project not found",
        status: StatusCodes.NOT_FOUND,
        log: false,
      });
    }

    // Handle Image Deletion only if `images` is included in body
    if (req.body.images) {
      const oldImages = oldProject.images || [];
      const newImages = req.body.images || [];

      const imagesToDelete = oldImages.filter(
        (img) => !newImages.includes(img)
      );

      await Promise.all(
        imagesToDelete.map((imgUrl) => {
          const key = imgUrl.split("/").pop();
          return deleteS3Object({ Key: key });
        })
      );
    }

    const updatedProject = await Project.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    return ApiResponse.success(res, {
      message: "Project updated successfully",
      data: updatedProject,
      status: StatusCodes.OK,
    });
  } catch (error) {
    return ApiResponse.error(res, error, {
      message: "Error updating project",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export const getProjectsListController = async (_, res) => {
  try {
    const projects = await Project.find({}).lean();
    return ApiResponse.success(res, {
      data: projects.map((proj) => ({
        title: proj.name,
        navLink: proj.navLink,
        description: proj.description,
        stack: proj.stack,
        liveLink: proj.liveLink,
        gitHubLink: proj.gitHubLink,
        image: proj.images[0],
        languages: proj.languagesUsed.map((lang) => lang.name),
      })),
      status: StatusCodes.OK,
    });
  } catch (error) {
    return ApiResponse.error(res, error, {
      message: "Error fetching projects list",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export const getProjectLanguagesController = async (req, res) => {
  try {
    const languages = await Project.distinct("languagesUsed.name");

    const formatted = [
      { value: "All" },
      ...languages.map((name) => ({ value: name })),
    ];

    return ApiResponse.success(res, {
      data: formatted,
      status: StatusCodes.OK,
    });
  } catch (err) {
    return ApiResponse.error(res, err, {
      message: "Error fetching project languages",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// Overview Controllers
export const getOverviewController = async (req, res) => {
  try {
    const ownerData = await Owner.findById(_id).select("aboutReadme").lean();

    if (!ownerData) {
      return ApiResponse.error(res, null, {
        message: "Owner data not found",
        status: StatusCodes.NOT_FOUND,
        log: false,
      });
    }

    const overviewReadmeContent = ownerData.aboutReadme;
    const projects = await Project.find({})

      .select("name navLink description stack createdAt")
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    const blogs = await Blog.find({}).sort({ createdAt: -1 }).limit(3).lean();

    return ApiResponse.success(res, {
      message: "Overview data fetched",
      data: {
        readmeContent: overviewReadmeContent,
        pinnedContent: [
          ...projects?.map((proj) => ({
            type: "repo",
            title: proj.name,
            description: proj.description,
            stack: proj.stack,
            readTime: null,
            link: `/projects/${proj.navLink}`,
          })),
          ...blogs?.map((blog) => ({
            type: "blog",
            title: blog.title,
            description: blog.excerpt,
            stack: null,
            readTime: blog.readTime,
            link: blog.mediumLink,
          })),
        ],
      },
      status: StatusCodes.OK,
    });
  } catch (error) {
    return ApiResponse.error(res, error, {
      message: "Error getting overview data",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// Search Controller
export const getSearchListController = async (req, res) => {
  try {
    const projects = await Project.find({}).lean();
    const blogs = await Blog.find({}).lean();

    return ApiResponse.success(res, {
      data: [
        {
          key: "Projects",
          value: projects.map((proj) => ({
            id: proj._id,
            name: proj.name,
            navLink: `/projects/${proj.navLink}`,
          })),
        },
        {
          key: "Blogs",
          value: blogs.map((blog) => ({
            id: blog._id,
            name: blog.title,
            navLink: blog.mediumLink,
          })),
        },
        {
          key: "Pages",
          value: [
            { id: 1, name: "Overview", navLink: "/" },
            { id: 2, name: "Projects", navLink: "/projects" },
            { id: 3, name: "Achievements", navLink: "/achievements" },
            { id: 4, name: "Experience", navLink: "/experience" },
            { id: 5, name: "Blogs", navLink: "/blogs" },
            { id: 6, name: "Consistency", navLink: "/consistency" },
            { id: 7, name: "Get in touch", navLink: "/contact" },
          ],
        },
      ],
      status: StatusCodes.OK,
    });
  } catch (error) {
    return ApiResponse.error(res, error, {
      message: "Error getting search list",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// Contact Form Controller
export const createContactFormController = async (req, res) => {
  try {
    const { name, email, message } = req.body || {};

    // Send email
    const result = await sendEmail({ name, email, message });

    if (!result || result?.error) {
      return ApiResponse.error(res, null, {
        message: "Failed to send message, please try again later",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        log: false,
      });
    }

    return ApiResponse.success(res, {
      message: "Message sent successfully!",
      status: StatusCodes.OK,
    });
  } catch (error) {
    return ApiResponse.error(res, error, {
      message: "Error sending email",
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};
