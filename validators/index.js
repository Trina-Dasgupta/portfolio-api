import { z } from "zod";
import { requiredString, stringArray } from "./utils.js";
import fs from "fs";

export const aboutCreateSchema = z.object({
  profilePic: requiredString(),
  name: requiredString(),
  role: requiredString(),
  miniDescription: requiredString(),
  description: requiredString(),
  currentFocus: requiredString(),
  skills: stringArray(),
  tweetIds: stringArray(),
  aboutReadme: requiredString(),
});

export const aboutUpdateSchema = aboutCreateSchema.partial();

export const tweetIdsSchema = z.object({
  tweetIds: stringArray(),
});

export const createBlogSchema = z.object({
  title: requiredString(),
  excerpt: requiredString(),
  date: requiredString(),
  readTime: requiredString(),
  category: requiredString(),
  mediumLink: requiredString(),
});

export const updateBlogSchema = createBlogSchema.partial();

export const createExperienceSchema = z.object({
  companyLogo: requiredString(),
  title: requiredString(),
  location: requiredString(),
  timeLine: requiredString(),
  isCurrent: z.boolean({
    error: (issue) => {
      const path = issue.path.join(".");
      if (issue.input === undefined) return `${path} is required`;
      return `${path} must be a boolean`;
    },
  }),
  keyAchievements: stringArray(),
  technologiesUsed: stringArray(),
});

export const updateExperienceSchema = createExperienceSchema.partial();

export const createAchievementSchema = z.object({
  companyLogo: requiredString(),
  title: requiredString(),
  timeLine: requiredString(),
  descriptionTitle: requiredString(),
  descriptionPoints: stringArray(),
  images: stringArray().max(2, "Maximum 2 images per achievement"),
});

export const updateAchievementSchema = createAchievementSchema.partial();

export const createSignedURLSchema = z.object({
  fileName: requiredString(),
  contentType: requiredString(),
});

export const createContactSchema = z.object({
  name: requiredString(),
  email: requiredString().email("Invalid email address"),
  message: requiredString(),
});

const isFileExists = (filePath) => fs.existsSync(path.resolve(filePath));

export const projectCreateSchema = z.object({
  name: requiredString(),
  navLink: requiredString(),
  description: requiredString(),
  readmeContent: requiredString(),
  gitHubLink: requiredString().url("gitHubLink must be a valid URL"),
  liveLink: requiredString().url("liveLink must be a valid URL"),
   images: z
    .array(requiredString())
    .max(12, "Maximum 12 images per project")
    .nonempty("images cannot be empty"),
  tags: z
    .array(
      z.object({
        topic: requiredString(),
      }),
      {
        error: (issue) => {
          if (issue.input === undefined) return "tags array is required";
          return "tags must be an array of objects containing a topic";
        },
      }
    )
    .nonempty("tags cannot be empty"),
  developmentSummary: z
    .array(
      z.object({
        title: requiredString(),
        value: requiredString(),
      }),
      {
        error: (issue) => {
          if (issue.input === undefined)
            return "developmentSummary array is required";
          return "developmentSummary must be an array of objects containing title and value";
        },
      }
    )
    .nonempty("developmentSummary cannot be empty"),
  languagesUsed: z
    .array(
      z.object({
        name: requiredString(),
        percent: z
          .number({
            error: (issue) => {
              const path = issue.path.join(".");
              if (issue.input === undefined) return `${path} is required`;
              return `${path} must be a valid number`;
            },
          })
          .min(0, {
            error: (issue) => {
              const path = issue.path.join(".");
              if (issue.input === undefined) return `${path} is required`;
              return `${path} must be at least 0`;
            },
          })
          .max(100, {
            error: (issue) => {
              const path = issue.path.join(".");
              if (issue.input === undefined) return `${path} is required`;
              return `${path} cannot exceed 100`;
            },
          }),
        color: requiredString(),
      }),
      {
        error: (issue) => {
          if (issue.input === undefined)
            return `languagesUsed array is required`;
          return "languagesUsed must be an array of object containing name, percentage and color";
        },
      }
    )
    .nonempty("languagesUsed cannot be empty"),
  stack: requiredString(),
});

export const projectUpdateSchema = projectCreateSchema.partial();
