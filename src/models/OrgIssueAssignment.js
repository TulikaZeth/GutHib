import mongoose from 'mongoose';

const OrgIssueAssignmentSchema = new mongoose.Schema({
  orgAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrgAccount',
    required: true,
  },
  repoFullName: {
    type: String,
    required: true,
  },
  issueNumber: {
    type: Number,
    required: true,
  },
  issueTitle: {
    type: String,
    required: true,
  },
  issueUrl: {
    type: String,
    required: true,
  },
  issueBody: String,
  labels: [String],
  
  // AI Analysis
  requiredSkills: [{
    skill: String,
    importance: Number, // 1-10
  }],
  expertise: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
  },
  estimatedHours: Number,
  
  // Assignment details
  assignedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  assignedUserGithub: String,
  matchScore: Number, // 0-100
  activityScore: Number, // 0-100
  workloadScore: Number, // 0-100
  finalScore: Number, // Weighted combination
  
  // Roadmap
  aiRoadmap: String,
  commentedAt: Date,
  githubCommentUrl: String,
  
  status: {
    type: String,
    enum: ['pending', 'assigned', 'recommended', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

OrgIssueAssignmentSchema.index({ orgAccountId: 1, repoFullName: 1, issueNumber: 1 }, { unique: true });
OrgIssueAssignmentSchema.index({ assignedUserId: 1, status: 1 });

export default mongoose.models.OrgIssueAssignment || mongoose.model('OrgIssueAssignment', OrgIssueAssignmentSchema);
