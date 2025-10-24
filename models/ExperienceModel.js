import { Schema, model } from "mongoose";

const ExperienceSchema = new Schema(
  {
    companyLogo: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    timeLine: {
      type: String,
      required: true,
      trim: true,
    },
    isCurrent: {
      type: Boolean,
      required: true,
    },
    keyAchievements: {
      type: [String],
      default: [],
    },
    technologiesUsed: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Experience = model("Experience", ExperienceSchema);

export default Experience;
