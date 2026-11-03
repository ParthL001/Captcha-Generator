import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import svgCaptcha from 'svg-captcha';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory CAPTCHA storage with TTL
// Key: captchaId -> Value: { text, type, createdAt, expiresAt, attempts, maxAttempts }
const captchaStore = new Map();

// Periodic cleanup of expired CAPTCHAs (runs every 60 seconds)
const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [id, item] of captchaStore.entries()) {
        if (now > item.expiresAt) {
            captchaStore.delete(id);
        }
    }
}, 60 * 1000);
cleanupInterval.unref();

// Helper: Sanitize & validate options
function buildCaptchaOptions(params = {}) {
    const size = Math.max(3, Math.min(8, parseInt(params.size, 10) || 5));
    const noise = Math.max(0, Math.min(10, parseInt(params.noise, 10) !== undefined ? parseInt(params.noise, 10) : 3));
    const width = Math.max(120, Math.min(400, parseInt(params.width, 10) || 240));
    const height = Math.max(40, Math.min(160, parseInt(params.height, 10) || 75));
    const fontSize = Math.max(28, Math.min(72, parseInt(params.fontSize, 10) || 52));
    const color = params.color === undefined ? true : params.color === true || params.color === 'true';
    const background = params.background && params.background !== 'none' ? String(params.background) : '#f8fafc';

    return {
        size,
        noise,
        width,
        height,
        fontSize,
        color,
        background
    };
}

// ----------------------------------------------------
// Health check endpoint
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Captcha-Generator API',
        uptimeSeconds: Math.floor(process.uptime()),
        activeCaptchas: captchaStore.size,
        timestamp: new Date().toISOString()
    });
});

// ----------------------------------------------------
// Generate CAPTCHA endpoint (supports GET & POST)
// ----------------------------------------------------
function handleGenerate(req, res) {
    try {
        const params = { ...(req.query || {}), ...(req.body || {}) };
        const type = (params.type || 'alphanumeric').toLowerCase();
        const ttlSeconds = Math.max(30, Math.min(900, parseInt(params.ttl, 10) || 300)); // Default 5 min
        const options = buildCaptchaOptions(params);

        let captchaResult;

        if (type === 'math') {
            captchaResult = svgCaptcha.createMathExpr({
                mathMin: 1,
                mathMax: 20,
                mathOperator: '+-',
                noise: options.noise,
                color: options.color,
                background: options.background,
                width: options.width,
                height: options.height,
                fontSize: options.fontSize
            });
        } else if (type === 'numeric') {
            captchaResult = svgCaptcha.create({
                ...options,
                charPreset: '0123456789'
            });
        } else if (type === 'alphabet') {
            captchaResult = svgCaptcha.create({
                ...options,
                charPreset: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
            });
        } else if (type === 'custom' && params.text) {
            const safeText = String(params.text).trim().slice(0, 10);
            const svgData = svgCaptcha(safeText, options);
            captchaResult = { text: safeText, data: svgData };
        } else {
            // Default: alphanumeric
            captchaResult = svgCaptcha.create({
                ...options,
                charPreset: '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ' // Excluded ambiguous chars 0, O, 1, I, l
            });
        }

        const id = crypto.randomUUID();
        const now = Date.now();
        const expiresAt = now + ttlSeconds * 1000;

        captchaStore.set(id, {
            text: String(captchaResult.text),
            type,
            createdAt: now,
            expiresAt,
            attempts: 0,
            maxAttempts: 3
        });

        res.json({
            success: true,
            id,
            svg: captchaResult.data,
            type,
            expiresIn: ttlSeconds,
            expiresAt: new Date(expiresAt).toISOString(),
            debugText: process.env.NODE_ENV === 'development' || params.debug ? captchaResult.text : undefined
        });
    } catch (err) {
        console.error('CAPTCHA generation error:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to generate CAPTCHA: ' + err.message
        });
    }
}

app.get('/api/captcha/generate', handleGenerate);
app.post('/api/captcha/generate', handleGenerate);

// ----------------------------------------------------
// Verify CAPTCHA endpoint
// ----------------------------------------------------
app.post('/api/captcha/verify', (req, res) => {
    const { id, answer, caseSensitive = false } = req.body || {};

    if (!id || answer === undefined || answer === null) {
        return res.status(400).json({
            success: false,
            code: 'MISSING_FIELDS',
            message: 'Both "id" and "answer" are required.'
        });
    }

    const item = captchaStore.get(id);

    if (!item) {
        return res.status(404).json({
            success: false,
            code: 'NOT_FOUND_OR_EXPIRED',
            message: 'CAPTCHA session not found, expired, or already verified. Please generate a new CAPTCHA.'
        });
    }

    const now = Date.now();
    if (now > item.expiresAt) {
        captchaStore.delete(id);
        return res.status(410).json({
            success: false,
            code: 'EXPIRED',
            message: 'CAPTCHA has expired. Please refresh to get a new one.'
        });
    }

    item.attempts += 1;

    const expected = item.text.trim();
    const provided = String(answer).trim();

    const isMatch = item.type === 'math' || !caseSensitive
        ? expected.toLowerCase() === provided.toLowerCase()
        : expected === provided;

    if (isMatch) {
        // Successful verification consumes the CAPTCHA immediately (prevents replay attacks)
        captchaStore.delete(id);
        return res.json({
            success: true,
            message: 'CAPTCHA verified successfully!',
            verifiedAt: new Date().toISOString()
        });
    }

    // Handle failure
    if (item.attempts >= item.maxAttempts) {
        captchaStore.delete(id);
        return res.status(400).json({
            success: false,
            code: 'MAX_ATTEMPTS_EXCEEDED',
            message: 'Maximum verification attempts exceeded. Please generate a new CAPTCHA.',
            remainingAttempts: 0
        });
    }

    const remainingAttempts = item.maxAttempts - item.attempts;
    return res.status(400).json({
        success: false,
        code: 'INCORRECT_ANSWER',
        message: `Incorrect CAPTCHA. Please try again. (${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} left)`,
        remainingAttempts
    });
});

// ----------------------------------------------------
// Demo contact / protected action submission endpoint
// ----------------------------------------------------
app.post('/api/demo/contact', (req, res) => {
    const { name, email, subject, message, captchaId, captchaAnswer } = req.body || {};

    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            error: 'Name, email, and message are required.'
        });
    }

    if (!captchaId || !captchaAnswer) {
        return res.status(400).json({
            success: false,
            error: 'CAPTCHA verification is required to submit this form.'
        });
    }

    // Verify CAPTCHA internally
    const item = captchaStore.get(captchaId);
    if (!item) {
        return res.status(400).json({
            success: false,
            error: 'Invalid or expired CAPTCHA. Please reload the CAPTCHA and try again.'
        });
    }

    if (Date.now() > item.expiresAt) {
        captchaStore.delete(captchaId);
        return res.status(400).json({
            success: false,
            error: 'CAPTCHA expired. Please try again with a fresh CAPTCHA.'
        });
    }

    const expected = item.text.trim().toLowerCase();
    const provided = String(captchaAnswer).trim().toLowerCase();

    if (expected !== provided) {
        item.attempts += 1;
        if (item.attempts >= item.maxAttempts) {
            captchaStore.delete(captchaId);
        }
        return res.status(400).json({
            success: false,
            error: 'Incorrect CAPTCHA answer. Please try again.'
        });
    }

    // Verified! Consume CAPTCHA
    captchaStore.delete(captchaId);

    // Simulate successful processing
    res.json({
        success: true,
        message: `Thank you, ${name}! Your inquiry has been securely submitted and verified against automated bots.`,
        data: {
            name,
            email,
            subject: subject || 'General Inquiry',
            timestamp: new Date().toISOString()
        }
    });
});

// Fallback for SPA routing - serve index.html for unmatched GET requests
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
    next();
});

// Export app for testing or serverless deployment
export { app };
export default app;

// Start Server if run directly
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    app.listen(PORT, () => {
        console.log(`===============================================`);
        console.log(`🛡️  CAPTCHA Verification Server is running!`);
        console.log(`🌐 Local URL: http://localhost:${PORT}`);
        console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
        console.log(`===============================================`);
    });
}
