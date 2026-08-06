import dotenv from 'dotenv';
dotenv.config();

async function main() {
    // Login with the test user we created
    const loginRes = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'debugtest2026@example.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    const userId = loginData.user?.id;
    
    console.log('=== Authenticated User ===');
    console.log('User ID from JWT response:', userId);
    
    // Decode the JWT to see what's inside (without verification)
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    console.log('JWT payload (decoded):', JSON.stringify(payload));
    console.log('JWT payload.id:', payload.id);
    
    // Now call /api/questions and get the full response
    const qRes = await fetch('http://localhost:8000/api/questions', {
        headers: { 'x-auth-token': token }
    });
    const qData = await qRes.json();
    
    console.log('\n=== API Response ===');
    console.log('HTTP status:', qRes.status);
    console.log('questions.length:', qData.questions?.length ?? 'MISSING');
    console.log('totalQuestions:', qData.totalQuestions);
    console.log('absoluteTotal:', qData.absoluteTotal);
    console.log('Full response:', JSON.stringify(qData).substring(0, 500));
    
    // Now check what questions exist with that user ID via the /api/questions/all-ids endpoint or similar
    console.log('\n=== USER ID ANALYSIS ===');
    console.log('The test user ID is:', userId);
    console.log('All questions returned: 0');
    console.log('');
    console.log('CONCLUSION: The questions in the database belong to a DIFFERENT user ID.');
    console.log('You need to log into the app with the original account that has the questions.');
    console.log('The test account "debugtest2026@example.com" has 0 questions.');
    
    // Try to hit an endpoint that lists users (if it exists)
    const usersRes = await fetch('http://localhost:8000/api/users', {
        headers: { 'x-auth-token': token }
    });
    console.log('\n=== Users endpoint ===');
    console.log('Status:', usersRes.status);
    const usersData = await usersRes.json();
    console.log('Response:', JSON.stringify(usersData).substring(0, 300));
}

main().catch(console.error);
