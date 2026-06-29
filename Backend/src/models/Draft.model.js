import mongoose from 'mongoose';

const DraftSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    default: 'Untitled Draft'
  },
  extractedText: {
    type: String,
    default: ''
  },
  generatedQuestions: {
    type: Array,
    default: []
  },
  options: {
    type: Object,
    default: {}
  }
}, { timestamps: true });

export default mongoose.model('Draft', DraftSchema);
