import mongoose from 'mongoose';

const InstitutionSettingsSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true
    },
    institutionType: { 
        type: String, 
        default: 'College' 
    },
    institutionName: { 
        type: String, 
        default: '' 
    },
    department: { 
        type: String, 
        default: '' 
    },
    defaultExamTitle: { 
        type: String, 
        default: '' 
    },
    academicSession: { 
        type: String, 
        default: '' 
    },
    logoUrl: { 
        type: String, 
        default: '' 
    },
    instructions: { 
        type: String, 
        default: '' 
    }
}, { timestamps: true });

export default mongoose.model('InstitutionSettings', InstitutionSettingsSchema);
