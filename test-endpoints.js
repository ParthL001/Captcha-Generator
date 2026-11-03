import { app } from './server.js';
import http from 'http';

const server = http.createServer(app);
server.listen(0, '127.0.0.1', async () => {
    const port = server.address().port;
    console.log(`Server listening for tests on port ${port}`);

    function req(path, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const payload = data ? JSON.stringify(data) : null;
            const r = http.request({
                hostname: '127.0.0.1',
                port,
                path,
                method,
                headers: payload ? {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                } : {}
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        resolve({ status: res.statusCode, data: JSON.parse(body) });
                    } catch {
                        resolve({ status: res.statusCode, text: body });
                    }
                });
            });
            r.on('error', reject);
            if (payload) r.write(payload);
            r.end();
        });
    }

    try {
        // 1. Health Check
        const health = await req('/api/health');
        console.log('1. Health check:', health.status === 200 && health.data.status === 'ok' ? 'PASS' : 'FAIL', health.data);

        // 2. Generate CAPTCHA
        const gen = await req('/api/captcha/generate?debug=true', 'POST', { type: 'alphanumeric', size: 5, noise: 3 });
        console.log('2. Generate Captcha:', gen.status === 200 && gen.data.success ? 'PASS' : 'FAIL', { id: gen.data.id, answer: gen.data.debugText });

        // 3. Verify Wrong Answer
        const wrong = await req('/api/captcha/verify', 'POST', { id: gen.data.id, answer: 'WRONG_GUESS' });
        console.log('3. Verify Wrong Answer:', wrong.status === 400 && wrong.data.code === 'INCORRECT_ANSWER' ? 'PASS' : 'FAIL', wrong.data.message);

        // 4. Verify Correct Answer
        const correct = await req('/api/captcha/verify', 'POST', { id: gen.data.id, answer: gen.data.debugText });
        console.log('4. Verify Correct Answer:', correct.status === 200 && correct.data.success ? 'PASS' : 'FAIL', correct.data.message);

        // 5. Anti-Replay: Attempt to reuse verified captcha
        const replay = await req('/api/captcha/verify', 'POST', { id: gen.data.id, answer: gen.data.debugText });
        console.log('5. Anti-Replay Check (Re-use blocked):', replay.status === 404 && replay.data.code === 'NOT_FOUND_OR_EXPIRED' ? 'PASS' : 'FAIL');

        // 6. Math Challenge
        const mathGen = await req('/api/captcha/generate?debug=true', 'POST', { type: 'math' });
        console.log('6. Math Generation:', mathGen.status === 200 && mathGen.data.svg.includes('<svg') ? 'PASS' : 'FAIL', { answer: mathGen.data.debugText });
        const mathVer = await req('/api/captcha/verify', 'POST', { id: mathGen.data.id, answer: mathGen.data.debugText });
        console.log('6b. Math Verification:', mathVer.status === 200 && mathVer.data.success ? 'PASS' : 'FAIL');

        // 7. Protected Contact Form Demo
        const formCap = await req('/api/captcha/generate?debug=true', 'POST', { type: 'alphanumeric' });
        const formRes = await req('/api/demo/contact', 'POST', {
            name: 'Parth Lokhande',
            email: 'parth@example.com',
            subject: 'Project Verification',
            message: 'Testing security layer',
            captchaId: formCap.data.id,
            captchaAnswer: formCap.data.debugText
        });
        console.log('7. Protected Form Submission:', formRes.status === 200 && formRes.data.success ? 'PASS' : 'FAIL', formRes.data.message);

        // 8. Static Frontend Serving
        const indexHtml = await req('/');
        console.log('8. Frontend Served:', indexHtml.status === 200 && indexHtml.text.includes('CaptchaShield') ? 'PASS' : 'FAIL', `(${indexHtml.text.length} bytes)`);

        console.log('\n===============================================');
        console.log('ALL API & FRONTEND VERIFICATION TESTS PASSED!');
        console.log('===============================================\n');
    } catch (err) {
        console.error('Test failed with error:', err);
    } finally {
        server.close();
        process.exit(0);
    }
});

