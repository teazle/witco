const mongoose = require("mongoose");

const DispatchPlanSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["draft", "applied", "undone"],
      default: "draft",
    },
    assignments: [
      {
        driver_id: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
          required: true,
        },
        driver_email: String,
        jobs: [
          {
            job_id: {
              type: mongoose.Schema.ObjectId,
              ref: "Job",
              required: true,
            },
            sequence: Number,
          },
        ],
      },
    ],
    appliedAt: Date,
    undoneAt: Date,
  },
  { timestamps: true }
);

module.exports = new mongoose.model("DispatchPlan", DispatchPlanSchema);
