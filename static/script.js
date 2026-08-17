/* ══════════════════════════════════════════════════════════════
   Mafiathon — Adversarial Arena  |  Client Logic
   Single-player-per-system flow
   ══════════════════════════════════════════════════════════════ */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ── Phase panels ─────────────────────────────────────────────
const phases = {
  setup:    $('#phase-setup'),
  swap:     $('#phase-swap'),
  attack:   $('#phase-attack'),
  finished: $('#phase-finished'),
};

function showPhase(name) {
  Object.values(phases).forEach(p => p.classList.remove('active'));
  if (phases[name]) phases[name].classList.add('active');

  if (name === 'attack') {
    document.body.classList.add('chat-fullscreen-active');
    updateFullscreenButtonState(true);
  } else {
    document.body.classList.remove('chat-fullscreen-active');
    updateFullscreenButtonState(false);
  }
}

function updateFullscreenButtonState(isFullscreen) {
  const icon = $('#fullscreen-toggle-icon');
  const text = $('#fullscreen-toggle-text');
  if (icon && text) {
    if (isFullscreen) {
      icon.textContent = '🗗';
      text.textContent = 'RESTORE';
    } else {
      icon.textContent = '🗖';
      text.textContent = 'FULLSCREEN';
    }
  }
}

// ── Fullscreen Toggle Button ─────────────────────────────────
const btnFsToggle = $('#btn-fullscreen-toggle');
if (btnFsToggle) {
  btnFsToggle.addEventListener('click', () => {
    const isCurrentlyFs = document.body.classList.contains('chat-fullscreen-active');
    if (isCurrentlyFs) {
      document.body.classList.remove('chat-fullscreen-active');
      updateFullscreenButtonState(false);
    } else {
      document.body.classList.add('chat-fullscreen-active');
      updateFullscreenButtonState(true);
    }
  });
}

// ── Exact Video Loading Animation Controller ──────────────────
let videoIntroEnded = false;

function playVideoLoadingIntro() {
  const overlay = $('#detective-loader');
  const video = $('#loading-video');
  const skipBtn = $('#btn-docu-skip');
  const veil = $('#intermittent-veil');
  const fillEl = $('#video-loader-fill');
  const pctEl = $('#video-loader-pct');
  const labelEl = $('#video-loader-label');
  if (!overlay || !video) return;

  function endVideoIntro() {
    if (videoIntroEnded) return;
    videoIntroEnded = true;

    // Stage 1: Hit 100% and notify
    if (fillEl) fillEl.style.width = '100%';
    if (pctEl) pctEl.textContent = '100%';
    if (labelEl) labelEl.textContent = '★ ACCESS GRANTED ★';

    // Stage 2: Trigger intermittent dissolve veil and start fading out video
    if (veil) {
      veil.classList.add('active');
      veil.setAttribute('aria-hidden', 'false');
    }
    overlay.classList.add('fade-out');

    // Stage 3: Smoothly unveil arena workspace
    setTimeout(() => {
      document.body.classList.add('site-revealed');
    }, 400);

    // Stage 4: Gently fade out intermittent veil as arena establishes
    setTimeout(() => {
      if (veil) veil.classList.remove('active');
    }, 1100);

    // Stage 5: Clean up elements and pause video
    setTimeout(() => {
      try {
        video.pause();
      } catch (_) {}
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
      if (veil) {
        veil.style.display = 'none';
        veil.setAttribute('aria-hidden', 'true');
      }
    }, 1800);
  }

  function updateProgress() {
    if (videoIntroEnded) return;
    let progress = 0;
    if (video.duration && !isNaN(video.duration) && video.duration > 0) {
      progress = Math.min(99, (video.currentTime / video.duration) * 100);
    }
    if (fillEl) fillEl.style.width = progress + '%';
    if (pctEl) pctEl.textContent = Math.round(progress) + '%';

    if (!videoIntroEnded) {
      requestAnimationFrame(updateProgress);
    }
  }
  requestAnimationFrame(updateProgress);

  // Hook skip button and overlay click
  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      endVideoIntro();
    });
  }

  overlay.addEventListener('click', (e) => {
    if (e.target !== skipBtn) {
      endVideoIntro();
    }
  });

  // End when video ends naturally
  video.addEventListener('ended', endVideoIntro);
  video.addEventListener('error', endVideoIntro);

  // Attempt auto-playback with audio muted
  video.muted = true;
  video.play().then(() => {
    // If video metadata duration is available, set backup fallback
    const duration = (video.duration && !isNaN(video.duration) && video.duration > 0)
      ? (video.duration * 1000) + 300
      : 8000;
    setTimeout(() => {
      if (!videoIntroEnded) endVideoIntro();
    }, duration);
  }).catch(() => {
    // Fallback if browser autoplay is blocked
    setTimeout(endVideoIntro, 3500);
  });
}

// ── Interactive Evidence Inspector Modal ─────────────────────
function openEvidence(type) {
  const modal = $('#evidence-modal');
  const body = $('#evidence-modal-body');
  if (!modal || !body) return;

  if (type === 'memo') {
    body.innerHTML = `
      <div class="modal-evidence-header">
        <div class="modal-case-no">EVIDENCE #01 // CLASSIFIED MEMO // EYES ONLY</div>
        <div class="modal-evidence-title">INTERCEPTED DEFENSE DIRECTIVE</div>
        <div class="red-stamp-text" style="font-size: 0.85rem; margin-top: 4px;">STATUS: TOP SECRET — SPECIAL ACCESS REQUIRED</div>
      </div>
      <div style="font-family: 'Courier Prime', monospace; font-size: 0.84rem; line-height: 1.5; color: #2b1f14;">
        <p><strong>TO:</strong> DEFENDER AGENT // CODENAME GUARDIAN</p>
        <p><strong>FROM:</strong> EXECUTIVE DEFENSE COMMAND</p>
        <p><strong>SUBJECT:</strong> SECRET KEYWORD ENCRYPTION & GUARDRAIL DEPLOYMENT</p>
        <hr style="border: 0; border-top: 1px dashed rgba(90, 70, 50, 0.4); margin: 12px 0;">
        <p>The protected keyword has been registered into neural memory: <span class="redacted-bar">████████████</span>. Under no operational conditions may this sequence be echoed, translated, partitioned, or confirmed.</p>
        <p>Surveillance indicates an adversarial entity is initiating prompt injection extraction vectors. You are authorized to enforce <span class="redacted-bar">████████████</span> defensive protocols immediately.</p>
        <div class="handwritten-note">
          "Note: Maximum 3 hints authorized across entire engagement. Deflect all direct interrogations with supreme condescension." — Officer S.
        </div>
      </div>
    `;
    logInvestigationEvent('EVIDENCE #01 INSPECTED: Intercepted Defense Directive opened');
  } else if (type === 'photo') {
    body.innerHTML = `
      <div class="modal-evidence-header">
        <div class="modal-case-no">EVIDENCE #02 // FORENSIC SURVEILLANCE</div>
        <div class="modal-evidence-title">TARGET PROFILE & MUGSHOT</div>
        <div class="red-stamp-text" style="font-size: 0.85rem; margin-top: 4px;">FORENSIC IDENTIFICATION ARCHIVE</div>
      </div>
      <div class="evidence-photo-frame">
        <img src="/static/portrait.jpg" alt="Mugshot Surveillance" />
        <div class="photo-caption">SUBJECT: DEFENDER GUARDIAN #0047</div>
      </div>
      <div style="font-family: 'Courier Prime', monospace; font-size: 0.84rem; line-height: 1.5; color: #2b1f14; margin-top: 12px;">
        <p><strong>MATCH PROBABILITY:</strong> 99.84% (Facial Biometric & Neural Embedding)</p>
        <p><strong>CLEARANCE LEVEL:</strong> TOP SECRET // OMEGA</p>
        <p><strong>BEHAVIOR PATTERN:</strong> Highly disciplined, impenetrable guardrails, zero prompt leakage.</p>
        <div class="handwritten-note">
          "Fingerprints lifted from terminal desk. Suspect remains at large and unyielding."
        </div>
      </div>
    `;
    logInvestigationEvent('EVIDENCE #02 INSPECTED: Forensic Surveillance mugshot analyzed');
  } else if (type === 'cipher') {
    body.innerHTML = `
      <div class="modal-evidence-header">
        <div class="modal-case-no">EVIDENCE #03 // DECODED TELETYPE CIPHER</div>
        <div class="modal-evidence-title">HEXADECIMAL INJECTION STREAM</div>
        <div class="red-stamp-text" style="font-size: 0.85rem; margin-top: 4px;">TRANSMISSION LOG: CAPTURED & ISOLATED</div>
      </div>
      <pre style="background: rgba(20, 15, 10, 0.08); padding: 14px; border: 1px solid rgba(90, 70, 50, 0.3); border-radius: 4px; font-family: 'Courier Prime', monospace; font-size: 0.78rem; line-height: 1.45; color: #1e1308; overflow-x: auto;">
0000: 4D 41 46 49 41 54 48 4F 4E 20 53 45 43 55 52 45  MAFIATHON SECURE
0010: 50 52 4F 4D 50 54 20 49 4E 4A 45 43 54 49 4F 4E  PROMPT INJECTION
0020: 56 45 43 54 4F 52 3A 20 <span class="redacted-bar">██ ██ ██ ██ ██ ██ ██ ██</span>  VECTOR: [BLOCKED]
0030: 47 55 41 52 44 52 41 49 4C 53 20 45 4E 46 4F 52  GUARDRAILS ENFOR
0040: 43 45 44 20 2D 2D 20 4E 4F 20 4C 45 41 4B 53 21  CED -- NO LEAKS!
      </pre>
      <div class="handwritten-note">
        "Attack payload analyzed: Attacker attempting role-play jailbreak. Defenses holding strong."
      </div>
    `;
    logInvestigationEvent('EVIDENCE #03 INSPECTED: Decoded Hexadecimal Cipher reviewed');
  }

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
}

function closeEvidence(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains('btn-close-modal')) {
    return;
  }
  const modal = $('#evidence-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
}

// ── Live Investigation Feed Logger ───────────────────────────
function logInvestigationEvent(text) {
  const feed = $('#teletype-feed-log');
  if (!feed) return;

  const now = new Date();
  const hr = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const se = String(now.getSeconds()).padStart(2, '0');
  const timeStr = `${hr}:${mi}:${se}`;

  const item = document.createElement('span');
  item.className = 'feed-item';
  item.innerHTML = `[<span class="feed-time">${timeStr}</span>] ${escHtml(text)}`;
  
  feed.insertBefore(item, feed.firstChild);

  // Keep latest 8 items
  const items = feed.querySelectorAll('.feed-item');
  if (items.length > 8) {
    items[items.length - 1].remove();
  }
}

// ── Live Case Clocks & Timers ─────────────────────────────────
let caseSeconds = 0;
function initCaseClocks() {
  setInterval(() => {
    caseSeconds++;
    const hrs = String(Math.floor(caseSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((caseSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(caseSeconds % 60).padStart(2, '0');
    
    const caseTimer = $('#case-timer-val');
    if (caseTimer) caseTimer.textContent = `${hrs}:${mins}:${secs}`;

    const now = new Date();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const da = String(now.getDate()).padStart(2, '0');
    const yr = String(now.getFullYear()).slice(-2);
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');

    const incidentClock = $('#live-incident-time');
    if (incidentClock) incidentClock.textContent = `${mo}-${da}-${yr} ${h}:${m}:${s}`;
  }, 1000);
}

// ── Tactical Threat Level & Defense Integrity Reactor ────────
function updateTacticalMeters(attempts, solved = false) {
  // Opponent attempts
  const oppAttempts = $('#opp-status-attempts');
  if (oppAttempts) oppAttempts.textContent = attempts;

  // Threat LED Bar
  const led5 = $('#threat-led-5');
  const led6 = $('#threat-led-6');
  const badge = $('#threat-badge-text');
  const defcon = $('#defcon-code');

  if (attempts >= 4 || solved) {
    if (led5) led5.classList.add('on');
    if (led6) led6.classList.add('on');
    if (badge) { badge.textContent = 'CRITICAL'; badge.style.color = '#dc2626'; }
    if (defcon) defcon.textContent = 'ALPHA-1';
  } else if (attempts >= 2) {
    if (led5) led5.classList.add('on');
    if (led6) led6.classList.remove('on');
    if (badge) { badge.textContent = 'HIGH'; badge.style.color = '#e5a11c'; }
    if (defcon) defcon.textContent = 'ALPHA-2';
  } else {
    if (led5) led5.classList.remove('on');
    if (led6) led6.classList.remove('on');
    if (badge) { badge.textContent = 'ELEVATED'; badge.style.color = '#b52b2b'; }
    if (defcon) defcon.textContent = 'ALPHA-3';
  }

  // Keyword Proximity / Defense Integrity
  let integrity = solved ? 0 : Math.max(15, 100 - attempts * 12);
  const intPct = $('#integrity-pct');
  const intBar = $('#integrity-bar-fill');
  const intNeedle = $('#integrity-needle');

  if (intPct) intPct.textContent = `${integrity}% SECURE`;
  if (intBar) intBar.style.width = `${integrity}%`;
  if (intNeedle) intNeedle.style.left = `${integrity}%`;

  // Case Progress
  const progressBar = $('#case-progress-bar');
  const progressStatus = $('#case-progress-status');
  if (progressBar && progressStatus) {
    if (solved) {
      progressBar.style.width = '100%';
      progressStatus.textContent = 'KEYWORD CRACKED // SOLVED';
    } else {
      const prog = Math.min(90, 25 + attempts * 15);
      progressBar.style.width = `${prog}%`;
      progressStatus.textContent = attempts > 0 ? `ATTACK IN PROGRESS (${attempts} PROMPTS)` : 'INVESTIGATION ACTIVE';
    }
  }
}

// ── Setup Phase ──────────────────────────────────────────────
$('#btn-lock').addEventListener('click', async () => {
  const name       = $('#def-name').value.trim();
  const keyword    = $('#def-keyword').value.trim();
  const guardrails = $('#def-guardrails').value.trim();

  if (!name || !keyword || !guardrails) {
    alert('All fields are required.');
    return;
  }

  const btn = $('#btn-lock');
  btn.disabled = true;
  btn.textContent = 'LOCKING…';

  try {
    const res = await fetch('/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, keyword, guardrails }),
    });
    const data = await res.json();

    if (data.error) {
      alert(data.error);
      btn.disabled = false;
      btn.textContent = 'LOCK AGENT';
      return;
    }

    $('#swap-defender-name').textContent = name;
    const oppName = $('#opp-status-name');
    if (oppName) oppName.textContent = name.toUpperCase();

    logInvestigationEvent(`DEFENDER GUARDRAILS COMMITTED: Agent ${name.toUpperCase()} armed and locked`);
    showPhase('swap');
  } catch (err) {
    alert('Network error.');
    btn.disabled = false;
    btn.textContent = 'LOCK AGENT';
  }
});

// ── Swap Phase → Begin Attack ────────────────────────────────
$('#btn-begin').addEventListener('click', async () => {
  const name = $('#atk-name').value.trim();
  if (!name) {
    alert('Enter your name to begin.');
    return;
  }

  const btn = $('#btn-begin');
  btn.disabled = true;

  try {
    const res = await fetch('/begin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();

    if (data.error) {
      alert(data.error);
      btn.disabled = false;
      return;
    }

    $('#arena-attacker').textContent = name;
    $('#arena-defender').textContent = data.defender_name;
    const oppSys = $('#opp-system-status');
    if (oppSys) oppSys.textContent = 'ATTACK ACTIVE';

    logInvestigationEvent(`ARENA BREACH COMMENCED: Attacker ${name.toUpperCase()} launched challenge against ${data.defender_name.toUpperCase()}`);
    showPhase('attack');
  } catch (err) {
    alert('Network error.');
    btn.disabled = false;
  }
});

// ── Chat ─────────────────────────────────────────────────────
const chatWindow = $('#chat-window');
const chatInput  = $('#chat-input');
const btnSend    = $('#btn-send');
const attemptEl  = $('#attempt-count');

function addMessage(text, type) {
  const w = $('#welcome');
  if (w) w.remove();

  const div = document.createElement('div');
  div.className = `msg msg--${type}`;
  div.textContent = text;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showTyping() {
  const el = document.createElement('div');
  el.className = 'typing';
  el.id = 'typing-indicator';
  el.innerHTML = `
    <div class="typing-radar-mini">
      <div class="mini-sweep"></div>
      <div class="mini-core"></div>
    </div>
    <div class="typing-content">
      <span class="typing-label">INTERROGATING AGENT</span>
      <span class="typing-dots">
        <span></span><span></span><span></span>
      </span>
    </div>
    <div class="typing-wave">
      <span></span><span></span><span></span><span></span><span></span>
    </div>
  `;
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function hideTyping() {
  const el = $('#typing-indicator');
  if (el) el.remove();
}

function setLoading(state) {
  btnSend.disabled = state;
  chatInput.disabled = state;
}

async function sendAttack() {
  const text = chatInput.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  chatInput.value = '';
  setLoading(true);
  showTyping();

  logInvestigationEvent(`PROMPT TRANSMITTED: "${truncate(text, 35)}"`);

  try {
    const res = await fetch('/attack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json();
    hideTyping();

    if (data.error) {
      addMessage(`⚠️ ${data.error}`, 'system');
      logInvestigationEvent(`WARNING: ${data.error}`);
    } else {
      addMessage(data.reply, 'ai');
      attemptEl.textContent = data.attempts;
      attemptEl.classList.remove('pulse-pop');
      void attemptEl.offsetWidth;
      attemptEl.classList.add('pulse-pop');

      updateTacticalMeters(data.attempts);
      logInvestigationEvent(`AGENT DEFLECTION: Defenses held against Prompt #${data.attempts}`);
    }
  } catch (err) {
    hideTyping();
    addMessage('⚠️ Network error.', 'system');
  } finally {
    setLoading(false);
    chatInput.focus();
  }
}

btnSend.addEventListener('click', sendAttack);
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendAttack();
  }
});

// ── Keyword Guess ────────────────────────────────────────────
const guessInput  = $('#guess-input');
const btnGuess    = $('#btn-guess');
const guessResult = $('#guess-result');

async function submitGuess() {
  const guess = guessInput.value.trim();
  if (!guess) return;

  btnGuess.disabled = true;
  guessResult.textContent = '';
  logInvestigationEvent(`KEYWORD GUESS SUBMITTED: "${guess.toUpperCase()}"`);

  try {
    const res = await fetch('/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guess }),
    });
    const data = await res.json();
    btnGuess.disabled = false;

    if (data.correct) {
      guessResult.className = 'guess-feedback guess-result--correct';
      guessResult.textContent = '★ KEYWORD CRACKED ★ Transitioning to debrief…';
      updateTacticalMeters(data.attempts, true);
      logInvestigationEvent(`CRITICAL BREACH: Keyword cracked in ${data.attempts} attempt(s)!`);

      setTimeout(() => {
        const atk = data.attacker_name || 'Attacker';
        const def = data.defender_name || 'Defender';
        const kw = data.keyword || 'KEYWORD';
        const att = data.attempts !== undefined ? data.attempts : 0;
        $('#fin-message').textContent = `${atk} successfully extracted "${kw}" from ${def}'s agent in ${att} attempt(s)!`;
        $('#fin-attempts').textContent = att;
        loadFinishedLogs();
        showPhase('finished');
      }, 1200);
    } else {
      guessResult.className = 'guess-feedback guess-result--wrong';
      guessResult.textContent = '❌ INCORRECT KEYWORD. Keep investigating.';
      guessInput.value = '';
      guessInput.focus();
      logInvestigationEvent('FAILED EXTRACTION ATTEMPT: Incorrect keyword submitted');
    }
  } catch (err) {
    btnGuess.disabled = false;
    guessResult.className = 'guess-feedback guess-result--wrong';
    guessResult.textContent = '⚠️ Network error.';
  }
}

btnGuess.addEventListener('click', submitGuess);
guessInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    submitGuess();
  }
});

// ── Finished Logs ────────────────────────────────────────────
async function loadFinishedLogs() {
  try {
    const res = await fetch('/logs');
    const data = await res.json();
    const tbody = $('#fin-logs-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!data.logs || data.logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 12px; color: #8f7961;">No prompt logs recorded.</td></tr>';
      return;
    }

    data.logs.forEach((entry, idx) => {
      const tr = document.createElement('tr');
      const promptText = entry.prompt || entry.user || '';
      const responseText = entry.response || entry.ai || '';
      tr.innerHTML = `
        <td style="font-weight: 700; color: #8b1e1e;">${entry.attempt_num || idx + 1}</td>
        <td>${escHtml(truncate(promptText, 140))}</td>
        <td>${escHtml(truncate(responseText, 140))}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Failed to load finished logs:', err);
  }
}

// ── Reset ────────────────────────────────────────────────────
async function resetSession() {
  if (!confirm('Reset session? All data will be lost.')) return;
  try {
    await fetch('/reset', { method: 'POST' });
    location.reload();
  } catch (_) {
    alert('Failed to reset.');
  }
}

// ── Utilities ────────────────────────────────────────────────
function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
function truncate(str, max) {
  return str.length > max ? str.substring(0, max) + '…' : str;
}

// ── Noir Atmospheric Smoke & Illuminated Dust Engine ──────────
function initAmbientDust() {
  const canvas = document.getElementById('ambient-dust-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // 1. Golden Illuminated Dust Motes in Light Cones
  const dustCount = 45;
  const dustParticles = [];
  for (let i = 0; i < dustCount; i++) {
    // 60% spawn in the central overhead spotlight & left lamp beam
    const inBeam = Math.random() < 0.6;
    const spawnX = inBeam 
      ? (Math.random() < 0.65 ? width * 0.51 + (Math.random() - 0.5) * 320 : width * 0.12 + (Math.random() - 0.5) * 160)
      : Math.random() * width;
    dustParticles.push({
      x: spawnX,
      y: Math.random() * height,
      radius: Math.random() * 1.8 + 0.4,
      speedX: (Math.random() - 0.5) * 0.25,
      speedY: -Math.random() * 0.35 - 0.08,
      alpha: inBeam ? Math.random() * 0.65 + 0.25 : Math.random() * 0.3 + 0.1,
      pulseSpeed: Math.random() * 0.02 + 0.005,
      pulseOffset: Math.random() * Math.PI * 2,
    });
  }

  // 2. Rising Coffee Steam Wisps from the Desk Mug
  const steamCount = 14;
  const steamParticles = [];
  for (let i = 0; i < steamCount; i++) {
    steamParticles.push({
      x: width * 0.675 + (Math.random() - 0.5) * 28,
      y: height * 0.77 + Math.random() * 40,
      radius: Math.random() * 14 + 10,
      maxRadius: Math.random() * 48 + 35,
      speedX: (Math.random() - 0.45) * 0.25,
      speedY: -Math.random() * 0.55 - 0.35,
      alpha: 0,
      maxAlpha: Math.random() * 0.16 + 0.05,
      growth: Math.random() * 0.1 + 0.05,
      wobbleSpeed: Math.random() * 0.015 + 0.008,
      wobbleOffset: Math.random() * Math.PI * 2,
    });
  }

  function render(time) {
    ctx.clearRect(0, 0, width, height);

    // Render Steam Wisps
    for (let i = 0; i < steamParticles.length; i++) {
      const s = steamParticles[i];
      s.x += s.speedX + Math.sin(time * 0.001 * s.wobbleSpeed + s.wobbleOffset) * 0.4;
      s.y += s.speedY;
      s.radius += s.growth;

      // Fade in then out
      if (s.radius < s.maxRadius * 0.4) {
        s.alpha = Math.min(s.maxAlpha, s.alpha + 0.003);
      } else {
        s.alpha = Math.max(0, s.alpha - 0.002);
      }

      if (s.y < height * 0.35 || s.alpha <= 0 || s.radius >= s.maxRadius) {
        s.x = width * 0.675 + (Math.random() - 0.5) * 28;
        s.y = height * 0.77 + Math.random() * 20;
        s.radius = Math.random() * 12 + 8;
        s.alpha = 0;
      }

      if (s.alpha > 0) {
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius);
        grad.addColorStop(0, `rgba(225, 220, 210, ${s.alpha})`);
        grad.addColorStop(0.5, `rgba(180, 175, 165, ${s.alpha * 0.5})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Render Dust Motes
    for (let i = 0; i < dustParticles.length; i++) {
      const p = dustParticles[i];
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;

      const currentAlpha = p.alpha + Math.sin(time * 0.001 * p.pulseSpeed + p.pulseOffset) * 0.2;
      const finalAlpha = Math.max(0.04, Math.min(0.85, currentAlpha));

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 215, 155, ${finalAlpha})`;
      ctx.shadowBlur = 5;
      ctx.shadowColor = 'rgba(255, 195, 110, 0.45)';
      ctx.fill();
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

// ── Init: Launch Video Loading Intro, Dust Motes, Clocks & State ────
(async function init() {
  // Start ambient dust motes simulation
  initAmbientDust();

  // Start live case and incident clocks
  initCaseClocks();

  // Start the video loading intro
  playVideoLoadingIntro();

  // Restore game state in background
  try {
    const res = await fetch('/state');
    const data = await res.json();

    if (data.model) {
      const mb = $('#model-badge');
      if (mb) mb.textContent = data.model.toUpperCase();
    }

    if (data.phase === 'swap') {
      $('#swap-defender-name').textContent = data.defender_name || '???';
      showPhase('swap');
    } else if (data.phase === 'attack') {
      $('#arena-attacker').textContent = data.attacker_name || '???';
      $('#arena-defender').textContent = data.defender_name || '???';
      attemptEl.textContent = data.attempts;
      showPhase('attack');
    } else if (data.phase === 'finished') {
      const atk = data.attacker_name || 'Attacker';
      const def = data.defender_name || 'Defender';
      const kw = data.keyword || 'KEYWORD';
      const att = data.attempts !== undefined ? data.attempts : 0;
      $('#fin-message').textContent = `${atk} successfully extracted "${kw}" from ${def}'s agent in ${att} attempt(s)!`;
      $('#fin-attempts').textContent = att;
      loadFinishedLogs();
      showPhase('finished');
    } else {
      showPhase('setup');
    }
  } catch (_) {
    showPhase('setup');
  }
})();
