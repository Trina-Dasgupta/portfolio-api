import { Schema, model } from "mongoose";

const ProjectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    navLink: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    readmeContent: {
      type: String,
      required: true,
      trim: true,
    },
    gitHubLink: {
      type: String,
      required: true,
      trim: true,
    },
    liveLink: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    tags: [
      {
        topic: { type: String, required: true },
      },
    ],
    developmentSummary: [
      {
        title: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    languagesUsed: [
      {
        name: { type: String, required: true },
        percent: { type: Number, required: true },
        color: { type: String, required: true },
      },
    ],
    stack: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Project = model("Project", ProjectSchema);

export default Project;
