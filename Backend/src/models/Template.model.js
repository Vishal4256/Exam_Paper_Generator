import mongoose from 'mongoose';

const TemplateSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    marksDistribution: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    blueprint: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    duration: {
        type: Number,
        default: 180
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Template', TemplateSchema);
