import mongoose from "mongoose";

const { Schema } = mongoose;

// Skill sub-schema
const SkillSchema = new Schema({
  name: { type: String, required: true },
  score: { type: Number, required: true },
  category: { type: String },
  description: { type: String },
});

// Tech stack sub-schema
const TechStackSchema = new Schema({
  languages: [{ type: String }],
  frameworks: [{ type: String }],
  tools: [{ type: String }],
  libraries: [{ type: String }],
  databases: [{ type: String }],
  cloudPlatforms: [{ type: String }],
});

// Main user schema
const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // For custom auth (not shown in responses)
    githubUsername: { type: String, required: true },
    githubUrl: { type: String },
    resumeUrl: { type: String },

    // Auth0 user ID for linking (kept for compatibility)
    auth0Id: { type: String, unique: true, sparse: true },

    // Subscription details
    plan: {
      type: String,
      enum: ["FREE", "PREMIUM"],
      default: "FREE",
    },

    // Resume AI analysis results
    summary: { type: String },
    totalExperience: { type: Number }, // in years
    confidenceLevel: { type: String, enum: ["low", "medium", "high"] },
    rawTextLength: { type: Number },
    skills: [SkillSchema],
    techStack: TechStackSchema,

    // Developer activity
    lastYearCommits: { type: Number, default: 0 },
    isActive: { type: Boolean, default: false },
    workloadScore: { type: Number, default: 0 }, // workload index (0–100)

    // Preferences
    preferredIssues: [{ type: String }],

    // Relationships (issues assigned to this user)
    assignedIssues: [{ type: Schema.Types.ObjectId, ref: "Issue" }],

    // Onboarding status
    onboardingCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Additional indexes (not duplicating the unique indexes already defined above)
UserSchema.index({ githubUsername: 1 });

export default mongoose.models.User || mongoose.model("User", UserSchema);
