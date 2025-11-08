import mongoose from 'mongoose';

const IssueSchema = new mongoose.Schema({
  repositoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repository',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  issueNumber: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
  },
  url: {
    type: String,
    required: true,
  },
  repository: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open',
  },
  labels: [String],
  assignedTo: {
    type: String, // GitHub username
  },
  isAssignedToMe: {
    type: Boolean,
    default: false,
  },
  
  // AI Analysis
  requiredSkills: [{
    skill: String,
    importance: Number, // 1-10
  }],
  expertise: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
  },
  estimatedHours: {
    type: Number,
  },
  matchScore: {
    type: Number, // 0-100
  },
  
  // Auto-comment tracking
  commentedAt: {
    type: Date,
  },
  commentBody: {
    type: String,
  },
  roadmap: {
    type: String,
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

IssueSchema.index({ repositoryId: 1, issueNumber: 1 }, { unique: true });
IssueSchema.index({ userId: 1, isAssignedToMe: 1 });

export default mongoose.models.Issue || mongoose.model('Issue', IssueSchema);
