// This script uses the SAME MongoDB connection as the running server.
// It will connect, find the first question's user field, 
// and compare with our test user's ID.

import dotenv from 'dotenv';
dotenv.config();

// Override connection timeout to be shorter for quick probe
const DB_URL = process.env.DB_URL;
console.log('Connecting to:', DB_URL ? DB_URL.replace(/:[^:]*@/, ':***@') : 'UNDEFINED');

const { MongoClient, ObjectId } = await import('mongodb');

const client = new MongoClient(DB_URL, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 5000
});

try {
    await client.connect();
    console.log('Connected!');
    
    const db = client.db(); // Use default DB from connection string
    const questions = db.collection('questions');
    const users = db.collection('users');
    
    // Count total
    const total = await questions.countDocuments();
    console.log('\n=== MongoDB Stats ===');
    console.log('Total questions (ALL users):', total);
    
    // Get first question
    const firstQ = await questions.findOne({});
    if (firstQ) {
        console.log('\n=== First Question Doc ===');
        console.log('_id:', firstQ._id.toString());
        console.log('user field value:', firstQ.user);
        console.log('user field type:', typeof firstQ.user);
        console.log('user is ObjectId?', firstQ.user instanceof ObjectId);
        console.log('user.toString():', firstQ.user?.toString?.());
        console.log('subject:', firstQ.subject);
    }
    
    // Group by user
    const byUser = await questions.aggregate([
        { $group: { _id: '$user', count: { $sum: 1 } } }
    ]).toArray();
    console.log('\n=== Questions Per User ===');
    byUser.forEach(u => console.log('  user:', u._id?.toString(), '-> count:', u.count));
    
    // List all users
    const allUsers = await users.find({}).toArray();
    console.log('\n=== All Users in DB ===');
    allUsers.forEach(u => console.log('  id:', u._id.toString(), '| email:', u.email));
    
    // Check if our test user's questions exist
    const testUserId = '6a746b1ca2fcabb301940f3a';
    const testUserQ = await questions.countDocuments({ user: new ObjectId(testUserId) });
    console.log('\n=== Test User Check ===');
    console.log('Test user ID:', testUserId);
    console.log('Questions owned by test user:', testUserQ);
    
} catch (err) {
    console.error('Connection error:', err.message);
} finally {
    await client.close();
}
