import { Schema, model } from "mongoose";

const ownerSchema = new Schema(
  {
    profilePic: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    miniDescription: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    currentFocus: {
      type: String,
      required: true,
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    tweetIds: {
      type: [String],
      default: [],
    },
    aboutReadme: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Owner = model("Owner", ownerSchema);

export default Owner;
