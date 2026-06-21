import mongoose from 'mongoose';

const ExamSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    examMode: {
        type: String,
        enum: ['Single Subject', 'Multi Subject'],
        default: 'Single Subject'
    },
    examTitle: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    collegeName: {
        type: String,
        default: ''
    },
    institutionType: {
        type: String,
        default: 'College'
    },
    department: {
        type: String,
        default: ''
    },
    academicSession: {
        type: String,
        default: ''
    },
    courseCode: {
        type: String,
        default: ''
    },
    logo: {
        type: String,
        default: ''
    },
    examHeaderStyle: {
        type: String,
        default: 'Style 3'
    },
    subject: {
        type: String,
        default: ''
    },
    topic: {
        type: String,
        default: ''
    },
    examDate: {
        type: Date
    },
    duration: {
        type: Number, // In minutes
        default: 60
    },
    instructions: {
        type: String,
        default: ''
    },
    marksDistribution: {
        type: mongoose.Schema.Types.Mixed, // Legacy mapping
        default: {}
    },
    blueprint: {
        type: [mongoose.Schema.Types.Mixed], // Array of section objects
        default: []
    },
    // Flat array of IDs for backward compatibility
    questions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        }
    ],
    // Grouped questions by section
    sectionedQuestions: [
        {
            sectionName: String,
            questions: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Question'
            }]
        }
    ],
    totalMarks: {
        type: Number,
        default: 0
    },
    generatedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Exam', ExamSchema);