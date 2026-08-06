import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['MCQ', 'Short Answer', 'Long Answer', 'True/False', 'Coding'],
        default: 'MCQ',
        required: true
    },
    questionText: {
        content: { type: mongoose.Schema.Types.Mixed, default: {} },
        plainText: { type: String, required: true },
        htmlCache: { type: String, default: '' }
    },
    options: [
        {
            content: { type: mongoose.Schema.Types.Mixed, default: {} },
            plainText: { type: String, default: '' },
            htmlCache: { type: String, default: '' }
        }
    ], // Only used for MCQ
    correctAnswer: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    image: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    topic: {
        type: String,
        default: ''
    },
    marks: {
        type: Number,
        default: 1
    },
    explanation: {
        content: { type: mongoose.Schema.Types.Mixed, default: {} },
        plainText: { type: String, default: '' },
        htmlCache: { type: String, default: '' }
    },
    tags: [
        { type: String }
    ],
    keywords: [
        { type: String }
    ],
    chapter: {
        type: String,
        default: ''
    },
    subTopic: {
        type: String,
        default: ''
    },
    estimatedTime: {
        type: Number, // in minutes
        default: 1
    },
    usageCount: {
        type: Number,
        default: 0
    },
    lastUsedDate: {
        type: Date,
        default: null
    },
    source: {
        type: String,
        default: 'manual'
    },
    // Phase 3.2: Analytics fields
    qualityScore: { type: Number, default: null },
    predictedDifficulty: { type: String, default: null },
    readabilityScore: { type: Number, default: null },
    duplicateProbability: { type: Number, default: null },
    lastAnalyzed: { type: Date, default: null },
    required: {
        type: Boolean,
        default: true
    },
    shuffleOptions: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'draft', 'archived'],
        default: 'active'
    },
    bloomLevel: {
        type: String,
        enum: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'],
        default: 'Remember'
    }
});

// Text index for global search
QuestionSchema.index({ 
    'questionText.plainText': 'text', 
    subject: 'text', 
    topic: 'text', 
    subTopic: 'text', 
    tags: 'text', 
    'explanation.plainText': 'text', 
    keywords: 'text' 
});

// Compound indexes for common advanced filters
QuestionSchema.index({ user: 1, subject: 1, difficulty: 1, type: 1, status: 1 });
QuestionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Question', QuestionSchema);