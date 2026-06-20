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
        type: String,
        required: true
    },
    options: [
        {
            type: String
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
        type: String,
        default: ''
    },
    tags: [
        { type: String }
    ],
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
        enum: ['manual', 'ai'],
        default: 'manual'
    },
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
        enum: ['active', 'draft'],
        default: 'active'
    }
});

export default mongoose.model('Question', QuestionSchema);