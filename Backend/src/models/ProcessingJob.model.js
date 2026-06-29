import mongoose from 'mongoose';

const ProcessingJobSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Queued', 'Uploading', 'Extracting Text', 'Running OCR', 'Generating Questions', 'Saving', 'Completed', 'Failed'],
    default: 'Queued'
  },
  progress: {
    type: Number,
    default: 0
  },
  currentStage: {
    type: String,
    default: 'Waiting in queue...'
  },
  result: {
    extractedText: String,
    generatedQuestions: Array,
    analysis: Object
  },
  errorMessage: {
    type: String
  }
}, { timestamps: true });

export default mongoose.model('ProcessingJob', ProcessingJobSchema);
