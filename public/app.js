/**
 * CaptchaShield - Frontend Application Controller
 * Handles interactive CAPTCHA generation, audio speech, SVG downloads,
 * live validation, countdown timer, and integration demo.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Application State
    const state = {
        captchaId: null,
        captchaSvg: null,
        debugText: null,
        type: 'alphanumeric',
        size: 5,
        noise: 3,
        color: true,
        background: '#f8fafc',
        caseSensitive: false,
        customText: '',
        expiresAt: null,
        timerInterval: null,
        totalDuration: 300,
        // Form demo state
        formDemoCaptchaId: null
    };

    // DOM Elements - Playground
    const captchaContainer = document.getElementById('captchaContainer');
    const captchaTypeBadge = document.getElementById('captchaTypeBadge');
    const timerText = document.getElementById('timerText');
    const timerProgressBar = document.getElementById('timerProgressBar');
    const verifyForm = document.getElementById('verifyForm');
    const captchaInput = document.getElementById('captchaInput');
    const btnClearInput = document.getElementById('btnClearInput');
    const btnVerify = document.getElementById('btnVerify');
    const feedbackBanner = document.getElementById('feedbackBanner');
    const feedbackTitle = document.getElementById('feedbackTitle');
    const feedbackMsg = document.getElementById('feedbackMsg');
    const feedbackIcon = document.getElementById('feedbackIcon');
    const caseHint = document.getElementById('caseHint');

    // Tooling buttons
    const btnReload = document.getElementById('btnReload');
    const reloadIcon = document.getElementById('reloadIcon');
    const btnQuickRegen = document.getElementById('btnQuickRegen');
    const btnAudioHint = document.getElementById('btnAudioHint');
    const btnCopySvg = document.getElementById('btnCopySvg');
    const btnDownloadSvg = document.getElementById('btnDownloadSvg');

    // Controls
    const typePills = document.querySelectorAll('.type-pill');
    const customTextGroup = document.getElementById('customTextGroup');
    const customTextInput = document.getElementById('customTextInput');
    const sliderSize = document.getElementById('sliderSize');
    const valSize = document.getElementById('valSize');
    const sliderNoise = document.getElementById('sliderNoise');
    const valNoise = document.getElementById('valNoise');
    const lengthGroup = document.getElementById('lengthGroup');
    const bgSwatches = document.querySelectorAll('.bg-swatch');
    const checkColor = document.getElementById('checkColor');
    const checkCaseSensitive = document.getElementById('checkCaseSensitive');
    const btnApplySettings = document.getElementById('btnApplySettings');
    const btnResetSettings = document.getElementById('btnResetSettings');

    // Dev Inspector
    const btnToggleDev = document.getElementById('btnToggleDev');
    const devInspectorBody = document.getElementById('devInspectorBody');
    const inspectorChevron = document.getElementById('inspectorChevron');
    const debugSessionId = document.getElementById('debugSessionId');
    const debugSolution = document.getElementById('debugSolution');
    const debugExpires = document.getElementById('debugExpires');

    // Form Demo
    const formDemoCaptchaContainer = document.getElementById('formDemoCaptchaContainer');
    const formDemoCaptchaInput = document.getElementById('formDemoCaptchaInput');
    const btnReloadFormCaptcha = document.getElementById('btnReloadFormCaptcha');
    const contactDemoForm = document.getElementById('contactDemoForm');
    const demoFormFeedback = document.getElementById('demoFormFeedback');

    // Toast Container
    const toastContainer = document.getElementById('toastContainer');

    // ====================================================
    // Initialization
    // ====================================================
    initViewSwitcher();
    initApiDocsDrawer();
    initControls();
    initCodeSnippets();
    checkServerHealth();
    fetchNewCaptcha();
    fetchFormDemoCaptcha();

    // ====================================================
    // Primary Home View Switcher (Playground vs Form Demo)
    // ====================================================
    function initViewSwitcher() {
        const switchBtns = document.querySelectorAll('.view-switch-btn');
        const playgroundView = document.getElementById('view-playground');
        const formDemoView = document.getElementById('view-form-demo');

        switchBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.getAttribute('data-view');
                switchBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                if (view === 'playground') {
                    playgroundView.classList.remove('hidden');
                    formDemoView.classList.add('hidden');
                } else {
                    playgroundView.classList.add('hidden');
                    formDemoView.classList.remove('hidden');
                }
            });
        });
    }

    // ====================================================
    // API Docs Slide-Over Drawer (Tucked in the corner)
    // ====================================================
    function initApiDocsDrawer() {
        const btnOpenApiDocs = document.getElementById('btnOpenApiDocs');
        const btnFooterApiDocs = document.getElementById('btnFooterApiDocs');
        const btnCloseApiDocs = document.getElementById('btnCloseApiDocs');
        const apiDocsDrawer = document.getElementById('apiDocsDrawer');
        const apiDocsBackdrop = document.getElementById('apiDocsBackdrop');

        function openDrawer() {
            apiDocsDrawer.classList.add('open');
            apiDocsBackdrop.classList.remove('hidden');
            apiDocsDrawer.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }

        function closeDrawer() {
            apiDocsDrawer.classList.remove('open');
            apiDocsBackdrop.classList.add('hidden');
            apiDocsDrawer.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }

        if (btnOpenApiDocs) btnOpenApiDocs.addEventListener('click', openDrawer);
        if (btnFooterApiDocs) btnFooterApiDocs.addEventListener('click', openDrawer);
        if (btnCloseApiDocs) btnCloseApiDocs.addEventListener('click', closeDrawer);
        if (apiDocsBackdrop) apiDocsBackdrop.addEventListener('click', closeDrawer);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && apiDocsDrawer.classList.contains('open')) {
                closeDrawer();
            }
        });
    }

    // ====================================================
    // CAPTCHA Generation (Playground)
    // ====================================================
    async function fetchNewCaptcha() {
        showLoadingState();
        hideFeedback();
        captchaInput.value = '';

        try {
            const payload = {
                type: state.type,
                size: state.size,
                noise: state.noise,
                color: state.color,
                background: state.background,
                ttl: state.totalDuration,
                debug: true // Enables solution preview for dev playground inspector
            };

            if (state.type === 'custom' && state.customText) {
                payload.text = state.customText;
            }

            const response = await fetch('/api/captcha/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                state.captchaId = data.id;
                state.captchaSvg = data.svg;
                state.debugText = data.debugText || '';
                state.expiresAt = new Date(data.expiresAt).getTime();

                // Render SVG
                captchaContainer.innerHTML = data.svg;
                captchaContainer.style.background = state.background;

                // Update Badges & Inspector
                captchaTypeBadge.textContent = state.type.toUpperCase();
                debugSessionId.textContent = data.id;
                debugSolution.textContent = data.debugText || 'Protected (Server Side)';
                debugExpires.textContent = new Date(data.expiresAt).toLocaleTimeString();

                // Start Timer
                startCountdown(data.expiresIn);
            } else {
                throw new Error(data.error || 'Server returned an error');
            }
        } catch (err) {
            console.error('Failed to load CAPTCHA:', err);
            captchaContainer.innerHTML = `<div class="captcha-skeleton text-danger">⚠️ Failed to connect to CAPTCHA API</div>`;
            showToast('Failed to generate CAPTCHA. Please check API server.', 'error');
        }
    }

    function showLoadingState() {
        if (reloadIcon) reloadIcon.classList.add('rotating');
        captchaContainer.innerHTML = `
            <div class="captcha-skeleton">
                <div class="spinner"></div>
                <span>Generating secure vector...</span>
            </div>
        `;
        setTimeout(() => {
            if (reloadIcon) reloadIcon.classList.remove('rotating');
        }, 600);
    }

    // ====================================================
    // Countdown Timer
    // ====================================================
    function startCountdown(durationSeconds) {
        if (state.timerInterval) clearInterval(state.timerInterval);

        let remaining = durationSeconds;
        updateTimerDisplay(remaining, durationSeconds);

        state.timerInterval = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
                clearInterval(state.timerInterval);
                updateTimerDisplay(0, durationSeconds);
                showFeedback('error', 'CAPTCHA Expired', 'This verification challenge has expired. Click Refresh to generate a new one.');
            } else {
                updateTimerDisplay(remaining, durationSeconds);
            }
        }, 1000);
    }

    function updateTimerDisplay(remaining, total) {
        const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
        const secs = String(remaining % 60).padStart(2, '0');
        timerText.textContent = `${mins}:${secs}`;

        const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
        timerProgressBar.style.width = `${pct}%`;

        if (pct < 20) {
            timerProgressBar.className = 'timer-bar danger';
        } else if (pct < 45) {
            timerProgressBar.className = 'timer-bar warning';
        } else {
            timerProgressBar.className = 'timer-bar';
        }
    }

    // ====================================================
    // CAPTCHA Verification (Playground)
    // ====================================================
    verifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const answer = captchaInput.value.trim();
        if (!answer) {
            captchaInput.focus();
            return;
        }

        if (!state.captchaId) {
            showToast('No active CAPTCHA session. Please refresh.', 'warning');
            return;
        }

        btnVerify.disabled = true;
        btnVerify.innerHTML = `<div class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></div> Verifying...`;

        try {
            const response = await fetch('/api/captcha/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: state.captchaId,
                    answer: answer,
                    caseSensitive: state.caseSensitive
                })
            });

            const data = await response.json();

            if (data.success) {
                // Success!
                clearInterval(state.timerInterval);
                showFeedback('success', 'Verified Successfully! 🎉', data.message);
                captchaContainer.classList.add('pop-success');
                setTimeout(() => captchaContainer.classList.remove('pop-success'), 500);
                showToast('Verification passed!', 'success');

                // After success, reload new captcha after 3 seconds
                setTimeout(() => {
                    fetchNewCaptcha();
                }, 3000);
            } else {
                // Failure
                captchaInput.classList.add('shake');
                setTimeout(() => captchaInput.classList.remove('shake'), 500);

                const title = data.code === 'EXPIRED' ? 'Session Expired' : 'Incorrect Answer';
                showFeedback('error', title, data.message);

                if (data.code === 'EXPIRED' || data.code === 'MAX_ATTEMPTS_EXCEEDED' || data.code === 'NOT_FOUND_OR_EXPIRED') {
                    setTimeout(() => fetchNewCaptcha(), 2000);
                } else {
                    captchaInput.select();
                }
            }
        } catch (err) {
            console.error('Verification error:', err);
            showFeedback('error', 'Network Error', 'Unable to reach the verification server. Please retry.');
        } finally {
            btnVerify.disabled = false;
            btnVerify.innerHTML = `<span>Verify</span> <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
        }
    });

    function showFeedback(type, title, msg) {
        feedbackBanner.className = `feedback-banner ${type}`;
        feedbackTitle.textContent = title;
        feedbackMsg.textContent = msg;

        if (type === 'success') {
            feedbackIcon.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
        } else if (type === 'error') {
            feedbackIcon.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
        } else {
            feedbackIcon.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
        }

        feedbackBanner.classList.remove('hidden');
    }

    function hideFeedback() {
        feedbackBanner.classList.add('hidden');
    }

    // Clear input button
    btnClearInput.addEventListener('click', () => {
        captchaInput.value = '';
        captchaInput.focus();
    });

    // ====================================================
    // Audio Read-Aloud (Accessibility via Web Speech API)
    // ====================================================
    btnAudioHint.addEventListener('click', () => {
        if (!('speechSynthesis' in window)) {
            showToast('Speech synthesis not supported in this browser.', 'warning');
            return;
        }

        window.speechSynthesis.cancel(); // Stop any pending speech

        let messageToSpeak = '';
        if (state.type === 'math') {
            messageToSpeak = 'Math challenge. Please solve the arithmetic question displayed in the image and enter the numeric result.';
        } else if (state.debugText) {
            // Spell out each character clearly with pause
            const chars = state.debugText.split('').map(c => {
                if (c >= 'A' && c <= 'Z') return `Capital ${c}`;
                if (c >= 'a' && c <= 'z') return `Lower ${c}`;
                return `Digit ${c}`;
            });
            messageToSpeak = `The CAPTCHA characters are: ${chars.join(', ')}`;
        } else {
            messageToSpeak = 'Please enter the characters visible in the distorted image.';
        }

        const utterance = new SpeechSynthesisUtterance(messageToSpeak);
        utterance.rate = 0.85;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
        showToast('🔊 Reading CAPTCHA aloud...', 'info');
    });

    // ====================================================
    // Copy SVG & Download Actions
    // ====================================================
    btnCopySvg.addEventListener('click', async () => {
        if (!state.captchaSvg) return;
        try {
            await navigator.clipboard.writeText(state.captchaSvg);
            showToast('SVG source code copied to clipboard!', 'success');
        } catch {
            showToast('Failed to copy to clipboard.', 'error');
        }
    });

    btnDownloadSvg.addEventListener('click', () => {
        if (!state.captchaSvg) return;
        const blob = new Blob([state.captchaSvg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `captcha-${Date.now()}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('SVG downloaded successfully!', 'success');
    });

    // ====================================================
    // Controls Studio Logic
    // ====================================================
    function initControls() {
        // Type pills
        typePills.forEach(pill => {
            pill.addEventListener('click', () => {
                typePills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                state.type = pill.getAttribute('data-type');

                if (state.type === 'custom') {
                    customTextGroup.classList.remove('hidden');
                    lengthGroup.classList.add('hidden');
                } else if (state.type === 'math') {
                    customTextGroup.classList.add('hidden');
                    lengthGroup.classList.add('hidden');
                } else {
                    customTextGroup.classList.add('hidden');
                    lengthGroup.classList.remove('hidden');
                }
            });
        });

        // Sliders
        sliderSize.addEventListener('input', (e) => {
            state.size = parseInt(e.target.value, 10);
            valSize.textContent = `${state.size} chars`;
        });

        sliderNoise.addEventListener('input', (e) => {
            state.noise = parseInt(e.target.value, 10);
            valNoise.textContent = `${state.noise} lines`;
        });

        // Background Swatches
        bgSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                bgSwatches.forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                state.background = swatch.getAttribute('data-bg');
            });
        });

        // Toggles
        checkColor.addEventListener('change', (e) => {
            state.color = e.target.checked;
        });

        checkCaseSensitive.addEventListener('change', (e) => {
            state.caseSensitive = e.target.checked;
            caseHint.textContent = state.caseSensitive ? 'Case-sensitive' : 'Case-insensitive';
            caseHint.style.color = state.caseSensitive ? '#818cf8' : 'var(--text-muted)';
        });

        // Custom text
        customTextInput.addEventListener('input', (e) => {
            state.customText = e.target.value.trim();
        });

        // Apply settings button
        btnApplySettings.addEventListener('click', () => {
            fetchNewCaptcha();
            showToast('New CAPTCHA generated with custom parameters!', 'success');
        });

        // Reset settings
        btnResetSettings.addEventListener('click', () => {
            state.type = 'alphanumeric';
            state.size = 5;
            state.noise = 3;
            state.color = true;
            state.background = '#f8fafc';
            state.caseSensitive = false;
            state.customText = '';

            sliderSize.value = 5;
            valSize.textContent = '5 chars';
            sliderNoise.value = 3;
            valNoise.textContent = '3 lines';
            checkColor.checked = true;
            checkCaseSensitive.checked = false;
            caseHint.textContent = 'Case-insensitive';
            customTextInput.value = '';

            typePills.forEach(p => {
                p.classList.toggle('active', p.getAttribute('data-type') === 'alphanumeric');
            });
            bgSwatches.forEach(s => {
                s.classList.toggle('active', s.getAttribute('data-bg') === '#f8fafc');
            });
            customTextGroup.classList.add('hidden');
            lengthGroup.classList.remove('hidden');

            fetchNewCaptcha();
            showToast('Reset to default configurations', 'info');
        });

        // Reload buttons
        btnReload.addEventListener('click', () => fetchNewCaptcha());
        btnQuickRegen.addEventListener('click', () => fetchNewCaptcha());

        // Developer Inspector Toggle
        btnToggleDev.addEventListener('click', () => {
            const isHidden = devInspectorBody.classList.contains('hidden');
            devInspectorBody.classList.toggle('hidden');
            inspectorChevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        });
    }

    // ====================================================
    // Form Demo Implementation
    // ====================================================
    async function fetchFormDemoCaptcha() {
        formDemoCaptchaContainer.innerHTML = `<div class="spinner"></div>`;
        try {
            const res = await fetch('/api/captcha/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'alphanumeric', size: 4, noise: 2 })
            });
            const data = await res.json();
            if (data.success) {
                state.formDemoCaptchaId = data.id;
                formDemoCaptchaContainer.innerHTML = data.svg;
                formDemoCaptchaInput.value = '';
            }
        } catch {
            formDemoCaptchaContainer.innerHTML = `<span class="text-danger">Failed to load</span>`;
        }
    }

    btnReloadFormCaptcha.addEventListener('click', () => fetchFormDemoCaptcha());

    contactDemoForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('demoName').value.trim();
        const email = document.getElementById('demoEmail').value.trim();
        const subject = document.getElementById('demoSubject').value.trim();
        const message = document.getElementById('demoMessage').value.trim();
        const captchaAnswer = formDemoCaptchaInput.value.trim();

        if (!captchaAnswer) {
            formDemoCaptchaInput.focus();
            return;
        }

        const submitBtn = document.getElementById('btnSubmitDemoForm');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<div class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></div> Verifying and sending...`;

        try {
            const res = await fetch('/api/demo/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    subject,
                    message,
                    captchaId: state.formDemoCaptchaId,
                    captchaAnswer
                })
            });

            const data = await res.json();

            if (data.success) {
                demoFormFeedback.className = 'feedback-banner success';
                demoFormFeedback.innerHTML = `
                    <div class="feedback-icon">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div>
                        <div class="feedback-title">Form Submitted & Verified!</div>
                        <div class="feedback-msg">${data.message}</div>
                    </div>
                `;
                demoFormFeedback.classList.remove('hidden');
                contactDemoForm.reset();
                showToast('Protected form submitted successfully!', 'success');
                setTimeout(() => fetchFormDemoCaptcha(), 1500);
            } else {
                demoFormFeedback.className = 'feedback-banner error';
                demoFormFeedback.innerHTML = `
                    <div class="feedback-icon">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    </div>
                    <div>
                        <div class="feedback-title">Submission Blocked</div>
                        <div class="feedback-msg">${data.error || 'Verification failed'}</div>
                    </div>
                `;
                demoFormFeedback.classList.remove('hidden');
                fetchFormDemoCaptcha();
            }
        } catch {
            demoFormFeedback.className = 'feedback-banner error';
            demoFormFeedback.innerHTML = `<div class="feedback-title">Connection Error</div><div class="feedback-msg">Could not reach the submission endpoint.</div>`;
            demoFormFeedback.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                <span>Send Verified Message</span>
            `;
        }
    });

    // ====================================================
    // Code Snippets Tabs & Copy (Inside API Drawer)
    // ====================================================
    function initCodeSnippets() {
        const langTabs = document.querySelectorAll('.lang-tab');
        const snippets = document.querySelectorAll('.snippet-content');

        langTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetLang = tab.getAttribute('data-lang');
                langTabs.forEach(t => t.classList.remove('active'));
                snippets.forEach(s => s.classList.remove('active'));

                tab.classList.add('active');
                const targetSnippet = document.getElementById(`snippet-${targetLang}`);
                if (targetSnippet) targetSnippet.classList.add('active');
            });
        });

        // Copy buttons
        document.querySelectorAll('.btn-copy-code').forEach(btn => {
            btn.addEventListener('click', async () => {
                const targetId = btn.getAttribute('data-target');
                const codeEl = document.getElementById(targetId);
                if (codeEl) {
                    try {
                        await navigator.clipboard.writeText(codeEl.innerText);
                        const prev = btn.textContent;
                        btn.textContent = 'Copied!';
                        setTimeout(() => btn.textContent = prev, 1500);
                        showToast('Snippet copied to clipboard!', 'info');
                    } catch {
                        showToast('Failed to copy snippet', 'error');
                    }
                }
            });
        });
    }

    // ====================================================
    // Server Health Check
    // ====================================================
    async function checkServerHealth() {
        const badge = document.getElementById('serverStatusBadge');
        try {
            const res = await fetch('/api/health');
            const data = await res.json();
            if (data.status === 'ok') {
                badge.style.display = 'flex';
            }
        } catch {
            badge.innerHTML = `<span class="status-dot" style="background:#ef4444"></span><span>Offline</span>`;
        }
    }

    // ====================================================
    // Toast Notification System
    // ====================================================
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast';

        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';
        if (type === 'warning') icon = '⚠️';

        toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.transition = 'all 0.3s';
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }
});
