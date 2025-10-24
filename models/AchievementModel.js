import { Schema, model } from "mongoose";

const AchievementSchema = new Schema(
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
    timeLine: {
      type: String,
      required: true,
      trim: true,
    },
    descriptionTitle: {
      type: String,
      required: true,
      trim: true,
    },
    descriptionPoints: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Achievement = model("Achievement", AchievementSchema);

export default Achievement;
