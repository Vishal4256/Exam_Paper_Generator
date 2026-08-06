import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    await mongoose.connect(process.env.DB_URL);
    const db = mongoose.connection.db;
    
    // Count ALL questions regardless of user
    const total = await db.collection('questions').countDocuments();
    console.log('Total questions in DB (all users): ' + total);
    
    // Find the user field of questions
    const sample = await db.collection('questions').find({}).limit(3).toArray();
    console.log('\nSample user IDs from questions:');
    sample.forEach((q, i) => console.log((i+1) + '. user=' + q.user + ' subject=' + q.subject));
    
    // Group by user to see distribution
    const byUser = await db.collection('questions').aggregate([
        { $group: { _id: '$user', count: { $sum: 1 } } }
    ]).toArray();
    console.log('\nQuestion count per user:');
    byUser.forEach(u => console.log('  user ' + u._id + ' -> ' + u.count + ' questions'));

    // Check users collection
    const users = await db.collection('users').find({}).limit(10).toArray();
    console.log('\nRegistered users:');
    users.forEach(u => console.log('  ' + u._id + ' | ' + u.email));

    await mongoose.disconnect();
}
main().catch(console.error);
