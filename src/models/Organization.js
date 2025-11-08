import mongoose from 'mongoose';

const OrganizationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orgName: {
    type: String,
    required: true,
  },
  orgUrl: {
    type: String,
    required: true,
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

OrganizationSchema.index({ userId: 1, orgName: 1 }, { unique: true });

export default mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);
