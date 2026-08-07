import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const userSchema = new mongoose.Schema({
    email: String,
    password: String
}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

async function test() {
    try {
        console.log('Connecting to DB...', process.env.DB_URL);
        await mongoose.connect(process.env.DB_URL);
        console.log('Connected');
        const user = await User.findOne({ email: "vk1447534@gmail.com" });
        if (user) {
            console.log('User found:', user.email);
            console.log('Password field:', user.password);
            
            console.log('Is password hashed?', user.password.startsWith('$2'));
            
            if (!user.password.startsWith('$2')) {
                console.log('Password appears to be plain text!');
            }
        } else {
            console.log('User vk1447534@gmail.com NOT FOUND in this DB.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
test();
