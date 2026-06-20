import axios from 'axios';

async function testRegister() {
  try {
    const res = await axios.post('https://exam-paper-generator-1-q509.onrender.com/api/auth/register', {
      name: 'Vishal Test',
      email: 'test_new_user_' + Date.now() + '@gmail.com',
      password: 'password123'
    });
    console.log('Register Success:', res.data);
  } catch (err) {
    console.log('Register Failed:', err.response?.status, err.response?.data);
  }
}

async function testForgotPassword() {
  try {
    const res = await axios.post('https://exam-paper-generator-1-q509.onrender.com/api/auth/forgot-password', {
      email: 'vishal42564256@gmail.com'
    });
    console.log('Forgot Password Success:', res.data);
  } catch (err) {
    console.log('Forgot Password Failed:', err.response?.status, err.response?.data);
  }
}

testRegister();
testForgotPassword();
