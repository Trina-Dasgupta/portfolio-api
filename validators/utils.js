import z from "zod";

// Reusable helper for required trimmed string
export const requiredString = () =>
  z
    .string({
      error: (issue) => {
        const path = issue.path.join(".");
        if (issue.input === undefined) return `${path} is required`;
        return `${path} must be a string`;
      },
    })
    .trim()
    .min(1, {
      error: (issue) => {
        const path = issue.path.join(".");
        return `${path} cannot be empty`;
      },
    });

// Reusable helper for array of non-empty strings
export const stringArray = () =>
  z
    .array(requiredString(), {
      error: (issue) => {
        const path = issue.path.join(".");
        if (issue.input === undefined) return `${path} is required`;
        return `${path} must be an array`;
      },
    })
    .nonempty({
      error: (issue) => {
        const path = issue.path.join(".");
        return `${path} cannot be empty`;
      },
    });
