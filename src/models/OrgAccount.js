import mongoose from 'mongoose';

const OrgAccountSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  orgName: {
    type: String,
    required: true,
  },
  githubOrgName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  repositories: [{
    repoName: String,
    repoUrl: String,
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.OrgAccount || mongoose.model('OrgAccount', OrgAccountSchema);
