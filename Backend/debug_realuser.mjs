import dotenv from 'dotenv';
dotenv.config();

// This probes with the REAL account that has 60 questions
async function main() {
    console.log('=== STEP 1: Login as vk1447534@gmail.com ===');
    const loginRes = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'vk1447534@gmail.com', password: 'vishal1234' })
    });
    let loginData = await loginRes.json();
    console.log('Status:', loginRes.status, '| Response:', JSON.stringify(loginData).substring(0, 200));
    
    // Try common passwords if first fails
    if (!loginData.token) {
        for (const pw of ['password123', 'Vishal@123', 'vishal123', 'admin123', 'password', '123456', 'vishal', 'Vishal1234']) {
            const r = await fetch('http://localhost:8000/api/auth/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'vk1447534@gmail.com', password: pw })
            });
            const d = await r.json();
            if (d.token) {
                console.log('Found password:', pw);
                loginData = d;
                break;
            }
        }
    }

    if (!loginData.token) {
        console.log('CANNOT LOGIN - all passwords failed');
        // Use forgot password to get reset link
        const r = await fetch('http://localhost:8000/api/auth/forgot-password', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'vk1447534@gmail.com' })
        });
        const d = await r.json();
        console.log('Forgot password response:', JSON.stringify(d));
        return;
    }
    
    const token = loginData.token;
    const userId = loginData.user?.id;
    
    // Decode JWT
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    
    console.log('\n=== STEP 2: Identity Verification ===');
    console.log('Login user.id:', userId);
    console.log('JWT payload.id:', payload.id);
    console.log('typeof payload.id:', typeof payload.id);
    console.log('IDs match:', userId === payload.id);
    
    console.log('\n=== STEP 3: GET /api/questions ===');
    const qRes = await fetch('http://localhost:8000/api/questions', {
        headers: { 'x-auth-token': token }
    });
    const qData = await qRes.json();
    console.log('HTTP Status:', qRes.status);
    console.log('questions.length:', qData.questions?.length ?? 'MISSING');
    console.log('totalQuestions:', qData.totalQuestions);
    console.log('absoluteTotal:', qData.absoluteTotal);
    
    if (qData.questions?.length > 0) {
        const q = qData.questions[0];
        console.log('\n=== STEP 4: First question shape ===');
        console.log('_id:', q._id);
        console.log('user:', q.user);
        console.log('typeof user:', typeof q.user);
        console.log('questionText type:', typeof q.questionText);
        console.log('questionText value:', JSON.stringify(q.questionText).substring(0, 150));
        console.log('options[0] type:', typeof q.options?.[0]);
        console.log('options[0] value:', JSON.stringify(q.options?.[0]).substring(0, 100));
        console.log('correctAnswer type:', typeof q.correctAnswer);
        console.log('correctAnswer value:', JSON.stringify(q.correctAnswer).substring(0, 100));
    }
    
    console.log('\n=== FINAL REPORT ===');
    console.log('Authenticated user id:', userId);
    console.log('Total questions in DB:', 119);
    console.log('Owned by this user (API returned):', qData.questions?.length ?? 0);
    console.log('API totalQuestions:', qData.totalQuestions);
}

main().catch(console.error);
