import mongoose from 'mongoose';

const RepositorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  repoOwner: {
    type: String,
    required: true,
  },
  repoName: {
    type: String,
    required: true,
  },
  repoUrl: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true, // e.g., "facebook/react"
  },
  lastPolled: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  totalIssues: {
    type: Number,
    default: 0,
  },
  trackedIssues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

RepositorySchema.index({ userId: 1, fullName: 1 }, { unique: true });

export default mongoose.models.Repository || mongoose.model('Repository', RepositorySchema);
