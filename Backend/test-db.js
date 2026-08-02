import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log("Connected to MongoDB.");
        const db = mongoose.connection.db;
        const count = await db.collection('questions').countDocuments();
        console.log('Total questions:', count);
        const sample = await db.collection('questions').findOne({});
        console.log('Sample question:', sample ? JSON.stringify(sample, null, 2) : "No questions found.");
        
        // Also log how many unique subjects and topics exist
        const subjects = await db.collection('questions').distinct('subject');
        console.log('Subjects:', subjects);
        
        const topics = await db.collection('questions').distinct('topic');
        console.log('Topics:', topics);
        
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
