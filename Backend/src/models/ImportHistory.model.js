import mongoose from 'mongoose';

const ImportHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String
  },
  subject: {
    type: String,
    default: 'Uncategorized'
  },
  documentType: {
    type: String,
    default: 'Document'
  },
  extractedText: {
    type: String,
    default: ''
  },
  generatedQuestions: {
    type: Array,
    default: []
  },
  questionsSaved: {
    type: Number,
    default: 0
  },
  exportCount: {
    type: Number,
    default: 0
  },
  duplicatesDetected: {
    type: Number,
    default: 0
  },
  duplicatesRemoved: {
    type: Number,
    default: 0
  },
  processingStatus: {
    type: String,
    enum: ['Completed', 'Failed', 'Partial'],
    default: 'Completed'
  }
}, { timestamps: true });

export default mongoose.model('ImportHistory', ImportHistorySchema);
