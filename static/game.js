// ═══════════════════════════════════════════════════════════════════
//  STARFIELD — pure first-person stars flying toward you
//  Mouse moves the vanishing point. No rings, no portal, no colour.
//  Game screen: slows to a gentle drift, no mouse reaction.
// ═══════════════════════════════════════════════════════════════════
(function () {
  const canvas = document.getElementById('wormholeCanvas');
  if (!canvas) return;  // graceful exit if element not found
  const ctx = canvas.getContext('2d');

  // ── Config ─────────────────────────────────────────────────────
  const STAR_COUNT = 500;
  const DEPTH = 1200;   // z range
  const BASE_SPEED = 2.8;    // menu / idle screens
  const GAME_SPEED = 1.0;    // gentle drift in game
  const FOV = 500;

  // ── State ───────────────────────────────────────────────────────
  let W, H;
  // Vanishing point — mouse moves this, eased
  let vpX = 0, vpY = 0;         // actual (pixels from centre)
  let tVpX = 0, tVpY = 0;       // target
  let speed = BASE_SPEED;
  let tSpeed = BASE_SPEED;
  let isGameMode = false;
  let frame = 0;

  // ── Resize ──────────────────────────────────────────────────────
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // ── Each star: random 2-D position seeded to full screen spread,
  //    z depth, individual speed multiplier, and a size seed ────────
  function mkStar() {
    return {
      // x/y are stored relative to screen centre (-0.5 … 0.5)
      x: (Math.random() - 0.5),
      y: (Math.random() - 0.5),
      z: Math.random() * DEPTH,
      spd: 0.6 + Math.random() * 0.9,
      sz: 0.5 + Math.random() * 1.6,
    };
  }
  const stars = Array.from({ length: STAR_COUNT }, mkStar);

  // ── Draw one star with streak ────────────────────────────────────
  function drawStar(s) {
    if (s.z <= 0) return;

    const scale = FOV / s.z;
    // Project onto screen relative to vanishing point
    const sx = W * 0.5 + vpX + s.x * scale * W;
    const sy = H * 0.5 + vpY + s.y * scale * H;

    // Cull outside canvas with small margin
    if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) return;

    // Brightness: closer = brighter
    const alpha = Math.min(1, 1.8 - s.z / DEPTH);
    if (alpha < 0.03) return;

    // Size: closer = bigger
    const r = Math.max(0.3, s.sz * scale * 0.5);

    // Streak: draw a line back toward vanishing point
    if (speed > 0.8) {
      // Previous position one "frame ago"
      const pz = s.z + speed * s.spd * 4.0; // longer comet tail
      const pscale = FOV / Math.max(pz, 1);
      const px = W * 0.5 + vpX + s.x * pscale * W;
      const py = H * 0.5 + vpY + s.y * pscale * H;

      // Only draw streak if it's a meaningful length
      const dx = sx - px, dy = sy - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.5) {
        // gradient starting at tail (px,py) and ending at head (sx,sy)
        const grad = ctx.createLinearGradient(px, py, sx, sy);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.8, `rgba(255, 255, 255, ${Math.min(1, alpha * 0.6)})`);
        grad.addColorStop(1, `rgba(255, 255, 255, ${Math.min(1, alpha * 1.1)})`);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = grad;
        // make tail slightly thicker or same thickness as head?
        ctx.lineWidth = r * 1.2;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }

    // Glow halo — soft outer bloom
    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 4);
    glow.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.5})`);
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.beginPath();
    ctx.arc(sx, sy, r * 4, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
    // Bright core dot (the comet head)
    ctx.beginPath();
    ctx.arc(sx, sy, r * 1.3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha * 1.5)})`;
    ctx.fill();
  }

  // ── Game-screen: solid black — stars completely hidden ──────────
  function drawGameBg() {
    ctx.fillStyle = '#02030a';
    ctx.fillRect(0, 0, W, H);
    // No stars during game — game canvas handles its own background
  }

  // ── Main loop ───────────────────────────────────────────────────
  function animate() {
    requestAnimationFrame(animate);
    frame++;

    if (isGameMode) {
      drawGameBg();
      return;
    }

    // Ease vanishing point toward mouse target
    vpX += (tVpX - vpX) * 0.045;
    vpY += (tVpY - vpY) * 0.045;
    speed += (tSpeed - speed) * 0.04;

    // Trail clear — alpha determines motion blur depth
    ctx.fillStyle = 'rgba(2,3,10,0.15)';
    ctx.fillRect(0, 0, W, H);

    for (const s of stars) {
      drawStar(s);
      s.z -= speed * s.spd;
      if (s.z <= 0) {
        s.z = DEPTH;
        s.x = (Math.random() - 0.5);
        s.y = (Math.random() - 0.5);
      }
    }
  }

  // ── Mouse: shift vanishing point ────────────────────────────────

  document.addEventListener('mousemove', (e) => {
    if (isGameMode) return;
    // Map cursor offset from screen centre → vanishing point shift
    const oX = (e.clientX / W - 0.5);
    const oY = (e.clientY / H - 0.5);
    tVpX = oX * 160;
    tVpY = oY * 110;


  });

  // ── Public API ──────────────────────────────────────────────────
  window.WH = {
    setGameMode(active) {
      isGameMode = active;
      if (active) {
        // Snap VP to centre, slow right down
        tVpX = 0; tVpY = 0;
        tSpeed = GAME_SPEED;
      } else {
        tSpeed = BASE_SPEED;
      }
    },
    setSpeed(s) { tSpeed = s; }
  };

  animate();
})();

// ── Shared game state ──────────────────────────────────────────
const GS = {
  // Account settings
  username: '', fullName: '', occupation: 'Defender', isAdmin: false,
  // Progression
  totalScore: 0, sessionScore: 0, completedLevels: {}, levelId: 1,
  // Session parameters
  language: null, mode: null, difficulty: 'normal', levelTip: '', words: [],
  // Combat metrics
  _wordsTyped: 0, _keysTotal: 0, _keysHit: 0, _maxCombo: 0, _currentCombo: 0, _startTime: 0,
  // Roster & Rank cache
  globalPos: 0, langPos: {}, langBadges: {}, rank: null,
  // UI Flags
  modeLabel: 'Classic', diffLabel: 'Normal'
};
window.GS = GS;

const API_PREFIX = '/api';

// ── CORE UTILITIES ──────────────────────────────────────────────

async function apiFetch(path, opts = {}) {
  const fullPath = (path.startsWith('/') && !path.startsWith('/api')) ? API_PREFIX + path : path;
  try {
    const res = await fetch(fullPath, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      ...opts,
    });
    return await res.json();
  } catch (e) {
    console.error('⚡ API Error:', e);
    return { status: 'error', message: 'Uplink lost' };
  }
}
window.apiFetch = apiFetch;

window.goTo = function (id) {
  console.log('⚡ ENGINE: Navigate →', id);
  // Screen transition
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');

  if (typeof closeAllDD === 'function') closeAllDD();

  // Audio scenario switching
  try { if (typeof playTrackForScreen === 'function') playTrackForScreen(id); } catch (e) { }

  // Wormhole effect mode change
  const isGame = (id === 'screen-game');
  try { if (window.WH) window.WH.setGameMode(isGame); } catch (e) { }

  // Update Navigation Header Status
  const statusElements = document.querySelectorAll('#idleStatus, #goStatus');
  const sectorStatus = document.getElementById('idleSectorStatus');
  statusElements.forEach(statusVal => {
    if (isGame) {
      statusVal.textContent = 'IN MISSION';
      statusVal.classList.add('in-mission');
    } else {
      statusVal.textContent = 'ONLINE';
      statusVal.classList.remove('in-mission');
    }
  });
  if (sectorStatus) {
    sectorStatus.textContent = isGame ? 'STATUS: ACTIVE MISSION' : 'STATUS: IDLE';
    sectorStatus.classList.toggle('engaged', isGame);
    sectorStatus.classList.toggle('idle', !isGame);
  }

  // Game initialization / exit logic
  if (id === 'screen-game') {
    setTimeout(() => {
      const inp = (GS.mode === 'classic') ? document.getElementById('classicInput') : document.getElementById('cmdInputField');
      if (inp) inp.focus();
    }, 350);
  } else if (id === 'screen-idle') {
    try { if (typeof wizardReset === 'function') wizardReset(); } catch (e) { }
  } else if (id === 'screen-gameover') {
    syncUI();
    const titleEl = document.getElementById('gameoverTitle');
    const tagEl = document.getElementById('gameoverTag');
    const subEl = document.querySelector('.gameover-sub');

    if (_missionSuccess) {
      if (titleEl) {
        // 1. Set the text to a vibrant, single green color (#39ff8f)
        titleEl.innerHTML = "<span style='color:#39ff8f; font-weight: bold;'>LEVEL CLEARED</span>";
        // 2. Add a simple, matching green glow (rgba)
        titleEl.style.textShadow = "0 0 20px rgba(57, 255, 143, 0.8)";
      }
      // Make the surrounding text neutral white like in the original image for contrast
      if (tagEl) {
        tagEl.innerHTML = "<span style='color:#ffffff'>/// AREA SECURED ///</span>";
      }
      if (subEl) {
        subEl.textContent = "Target sequence completely destroyed";
      }
    } else {
      if (titleEl) {
        titleEl.innerHTML = "<span style='color:#ff4d6d'>GAME OVER</span>";
        titleEl.style.textShadow = "0 0 20px rgba(255,77,109,0.8)";
      }
      if (tagEl) { tagEl.innerHTML = "<span style='color:#ff4d6d'>/// SYSTEM BREACH DETECTED ///</span>"; }
      if (subEl) subEl.textContent = "System defenses have been compromised";
    }

    const goLvl = document.getElementById('goLvlVal');
    if (goLvl) goLvl.textContent = GS.levelId;
    const goRank = document.getElementById('goRankVal');
    if (goRank && GS.globalRank) goRank.innerHTML = GS.globalRank.icon + ' ' + GS.globalRank.name.toUpperCase();

    const goSectorSpan = document.getElementById('goSectorSpan');
    if (goSectorSpan) goSectorSpan.textContent = 'SECTOR: ' + (GS.language ? GS.language.toUpperCase() : 'UNKNOWN');
    const goLvlSpan = document.getElementById('goLvlSpan');
    if (goLvlSpan) goLvlSpan.textContent = 'LVL ' + GS.levelId;
    const goSecSpan = document.getElementById('goSecSpan');
    if (goSecSpan) goSecSpan.textContent = GS.levelTip ? GS.levelTip : '';

    const goMode = document.getElementById('goModeVal');
    if (goMode) goMode.textContent = GS.mode ? GS.mode.toUpperCase() : 'CLASSIC';
    const goDiff = document.getElementById('goDiffVal');
    if (goDiff) goDiff.textContent = GS.difficulty ? (GS.difficulty.charAt(0).toUpperCase() + GS.difficulty.slice(1)) : 'Normal';

    const ptsWrap = document.getElementById('sessionScoreWrap');
    if (ptsWrap) {
      ptsWrap.querySelector('.pts-text').textContent = "Session Score";
      const scoreDisp = ptsWrap.querySelector('#sessionScoreDisplay');
      if (scoreDisp) scoreDisp.textContent = GS.sessionScore || 0;
    }

    const nextBtn = document.getElementById('nextLevelBtn');
    const retryBtn = document.getElementById('retryMissionBtn');
    const replayBtn = document.getElementById('replayLevelBtn');
    if (_missionSuccess && _isLevelClear) {
      // Level cleared: show Replay Level + Next Level; hide Retry
      if (nextBtn) nextBtn.style.display = 'inline-block';
      if (replayBtn) replayBtn.style.display = 'inline-block';
      if (retryBtn) retryBtn.style.display = 'none';
    } else {
      // Game over: show Retry; hide Next Level + Replay
      if (nextBtn) nextBtn.style.display = 'none';
      if (replayBtn) replayBtn.style.display = 'none';
      if (retryBtn) retryBtn.style.display = 'inline-block';
    }
  }
  // HUD nav lockout logic
  const hudOverlay = document.querySelector('.game-hud-overlay');
  if (hudOverlay) hudOverlay.classList.toggle('game-nav-locked', id === 'screen-game');
};

window.syncUI = function () {
  document.querySelectorAll('[id$="Cmdr"]').forEach(el => el.textContent = GS.username || '—');
  document.querySelectorAll('#idleScore, #goScore').forEach(el => el.textContent = GS.totalScore || 0);
  if (document.getElementById('hudPtsVal')) document.getElementById('hudPtsVal').textContent = GS.score || 0;

  document.querySelectorAll('.profile-handle').forEach(el => {
    if (el.id !== 'viewedHandle') el.textContent = GS.username || 'Defender';
  });
  if (document.getElementById('profileTotalPoints')) document.getElementById('profileTotalPoints').textContent = GS.totalScore || 0;
  if (document.getElementById('profileStatTotal')) document.getElementById('profileStatTotal').textContent = GS.totalScore || 0;
  if (document.getElementById('profileStatWords')) document.getElementById('profileStatWords').textContent = GS._wordsTyped || 0;
  if (document.getElementById('profileStatAccuracy')) document.getElementById('profileStatAccuracy').textContent = (GS._accuracy || 0) + '%';
  if (document.getElementById('profileStatSessions')) {
    // Count total unique levels completed across all modes as a proxy for 'progress'
    let totalCleared = 0;
    if (GS.completedLevels) {
      Object.keys(GS.completedLevels).forEach(k => totalCleared += GS.completedLevels[k].length);
    }
    document.getElementById('profileStatSessions').textContent = totalCleared || 0;
  }

  // Update Rank badges in header/profile
  if (GS.globalRank) {
    document.querySelectorAll('.rank-badge-hud').forEach(el => {
      el.innerHTML = GS.globalRank.icon + ' ' + GS.globalRank.name.toUpperCase();
    });
  }

  // Update Career Achievements
  if (GS.completedLevels) {
    const pyLevels = new Set();
    const jaLevels = new Set();
    Object.keys(GS.completedLevels).forEach(k => {
      if (k.startsWith('python_')) GS.completedLevels[k].forEach(l => pyLevels.add(l));
      if (k.startsWith('java_')) GS.completedLevels[k].forEach(l => jaLevels.add(l));
    });

    const pyCount = pyLevels.size;
    const jaCount = jaLevels.size;

    const pyFill = document.getElementById('ach-python-fill');
    const pyBadge = document.getElementById('ach-python-badge');
    if (pyFill) pyFill.style.width = Math.min(100, (pyCount / 5) * 100) + '%';
    if (pyBadge) {
      pyBadge.textContent = `${pyCount}/5`;
      pyBadge.classList.toggle('locked', pyCount < 5);
    }

    const jaFill = document.getElementById('ach-java-fill');
    const jaBadge = document.getElementById('ach-java-badge');
    if (jaFill) jaFill.style.width = Math.min(100, (jaCount / 5) * 100) + '%';
    if (jaBadge) {
      jaBadge.textContent = `${jaCount}/5`;
      jaBadge.classList.toggle('locked', jaCount < 5);
    }
  }
};

window.updateBreadcrumb = function (id) {
  const b = document.getElementById('wizard-breadcrumb');
  if (!b) return;
  const labels = {
    'step-mode': '01 — SELECT MODE',
    'step-diff': '02 — SELECT DIFFICULTY',
    'step-lang': '03 — SELECT LANGUAGE',
    'step-level': '04 — MISSION DETAILS'
  };
  b.textContent = labels[id] || 'MISSION SETUP';
};

// Global hooks for NEXUS (removed self-referential assignments to prevent recursion)
function setA(el) {
  document.querySelectorAll('.dev-btn').forEach(b => b.classList.remove('cur'));
  el.classList.add('cur');
}

// ── SESSION CHECK on load ─────────────────────────────────────
window.addEventListener('load', () => {
  const saved = sessionStorage.getItem('playerAvatar');
  if (saved) {
    const myIcon = document.getElementById('myAvatarIcon');
    if (myIcon) myIcon.textContent = saved;
  }
  if (typeof checkSession === 'function') checkSession();
});

// ═══════════════════════════════════════════════
//  DROPDOWN MENUS & MODALS
// ═══════════════════════════════════════════════
function toggleDD(id) {
  const el = document.getElementById(id);
  const wasOpen = el.classList.contains('open');
  closeAllDD();
  if (!wasOpen) el.classList.add('open');
}
function closeDD(id) { document.getElementById(id)?.classList.remove('open'); }
function closeAllDD() { document.querySelectorAll('.brand-wrap').forEach(b => b.classList.remove('open')); }

document.addEventListener('click', (e) => {
  if (!e.target.closest('.brand-wrap')) closeAllDD();
});

function closeLB() { document.getElementById('lbModal')?.classList.remove('open'); }

// ═══════════════════════════════════════════════════════════════
//  KEYBOARD LOCKDOWN — block browser shortcuts during gameplay
// ═══════════════════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  const gameActive = document.getElementById('screen-game')?.classList.contains('active');
  if (!gameActive) return;

  if (e.ctrlKey || e.metaKey || e.altKey) {
    e.preventDefault(); e.stopPropagation();
    return;
  }
  const blockedKeys = ['F1', 'F2', 'F3', 'F4', 'F5', 'F11', 'F12'];
  if (blockedKeys.includes(e.key)) {
    e.preventDefault(); e.stopPropagation();
  }
}, { capture: true });

// ═══════════════════════════════════════════════════════════════
//  GAME ENGINE — variables & core loop
// ═══════════════════════════════════════════════════════════════

let gamePaused = false;
let shipX = 50, targetShipX = 50;
let currentTarget = null;
let _levelCompleting = false, _gameOver = false;
let lives = 3;
let _isLevelSpawning = false, _missionSuccess = false, _isLevelClear = false;
let _pendingSpawn = false, _pendingAdvanceLevel = false;


// ── SHIP HEALTH & MOVEMENT ──────────────────────────────────────
let shipHealth = 100;
function setShipHealth(pct) {
  shipHealth = Math.max(0, Math.min(100, pct));
  const ship = document.getElementById('playerShip');
  if (!ship) return;
  const hull = ship.querySelector('.ship-hull');
  if (hull) hull.setAttribute('stroke', shipHealth > 50 ? 'rgba(57,255,143,0.9)' : 'rgba(255,49,49,0.9)');
}

let lastShotTime = 0;
function moveShipTo(pct) { targetShipX = Math.max(5, Math.min(95, pct)); }
function updateShipPosition() {
  if (!document.getElementById('screen-game')?.classList.contains('active')) return;
  shipX += (targetShipX - shipX) * 0.15;
  const ship = document.getElementById('playerShip');
  const disp = document.getElementById('typeDisplay');
  const canvas = document.getElementById('gameCanvas');
  if (!ship || !canvas) return;
  const px = (shipX / 100) * canvas.offsetWidth;
  ship.style.left = px + 'px';
  if (disp) disp.style.left = px + 'px';
}
setInterval(updateShipPosition, 16);

// ── COMBAT ACTIONS ──────────────────────────────────────────────
function fireLaser(targetEl, isBig = false) {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  const beam = document.createElement('div');
  beam.className = isBig ? 'laser-beam big-laser' : 'laser-beam';
  const canvasRect = canvas.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();
  const laserH = Math.max(40, (canvasRect.bottom - 120) - targetRect.top);
  beam.style.setProperty('--laser-h', laserH + 'px');
  beam.style.left = ((shipX / 100) * canvasRect.width) + 'px';
  canvas.appendChild(beam);
  setTimeout(() => beam.remove(), isBig ? 600 : 400);
}

function destroyWord(el) {
  if (el.dataset.destroyed) return;
  el.dataset.destroyed = '1';
  if (GS.mode === 'builder') {
    el.style.animationPlayState = 'paused';
    setTimeout(() => { fireLaser(el, true); finishDestroyWord(el); }, 250);
  } else {
    fireLaser(el); finishDestroyWord(el);
  }
}

function finishDestroyWord(el) {
  const isDanger = el.classList.contains('danger');
  lastShotTime = Date.now();

  // Calculate points first so we can show them
  const pts = isDanger ? 20 : 10;

  // Attach a floating score label onto the element itself
  const ptLabel = document.createElement('span');
  ptLabel.textContent = '+' + pts;
  ptLabel.style.cssText = 'position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-family:Orbitron,monospace;font-size:11px;font-weight:700;color:#39ff8f;text-shadow:0 0 8px rgba(57,255,143,0.9);pointer-events:none;white-space:nowrap;';
  el.style.position = 'relative';
  el.appendChild(ptLabel);

  // Fly upward (away from ship at bottom) and fade out
  const canvas = document.getElementById('gameCanvas');
  const canvasRect = canvas.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const currentTop = elRect.top - canvasRect.top;

  el.style.animationPlayState = 'paused';
  el.style.transition = 'top 0.45s ease-out, opacity 0.45s ease-out';
  el.style.position = 'absolute';
  el.style.top = currentTop - 50;
  el.style.opacity = '1';

  // Trigger upward flight on next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.top = (currentTop - 170) + 100;
      el.style.opacity = '0';
    });
  });

  setTimeout(() => {
    el.remove();
    if (typeof apiAddPoints === 'function') apiAddPoints(pts, false, null);
    if (document.querySelectorAll('.word-fall:not([data-destroyed])').length === 0) {
      window.onLevelComplete();
    }
  }, 460);
}

function abortMission() {
  if (_gameOver) return;
  _gameOver = true;
  _missionSuccess = false;
  if (typeof apiAddPoints === 'function') apiAddPoints(-30, false); // Lesser penalty for controlled abort
  goTo('screen-gameover');
}

function checkBreach() {
  if (!document.getElementById('screen-game')?.classList.contains('active')) return;
  if (gamePaused || _isLevelSpawning) return;
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  const breachY = canvas.getBoundingClientRect().bottom - 160;
  document.querySelectorAll('.word-fall').forEach(el => {
    if (el.dataset.destroyed) return;
    if (el.getBoundingClientRect().top >= breachY) {
      if (!_gameOver) {
        _gameOver = true; _missionSuccess = false;
        if (typeof apiAddPoints === 'function') apiAddPoints(-50, false);
        setTimeout(() => goTo('screen-gameover'), 600);
      }
    }
  });
}
setInterval(checkBreach, 150);
async function onLevelComplete() {
  if (_levelCompleting) return;
  _levelCompleting = true;

  // Calculate bonus points
  const bonus = 100;
  if (typeof apiAddPoints === 'function') await apiAddPoints(bonus, true);

  const scoreEl = document.getElementById('gameScore');
  if (scoreEl) scoreEl.textContent = Math.max(0, GS.sessionScore);

  GS._accuracy = GS._keysTotal ? Math.round((GS._keysHit / GS._keysTotal) * 100) : 100;
  GS._elapsed = GS._startTime ? Math.round((Date.now() - GS._startTime) / 1000) + 's' : '0s';

  // ── The real rank call ── records the level clear server-side & gets updated ranks
  const rankData = await apiFetch('/api/complete_level', {
    method: 'POST',
    body: JSON.stringify({
      language: GS.language,
      mode: GS.mode,
      difficulty: GS.difficulty,
      level_id: GS.levelId
    })
  });

  // Update GS rank state from server response
  if (rankData && rankData.global_rank) {
    GS.globalRank = rankData.global_rank;
    GS.langBadges = rankData.lang_badges;
    GS.totalScore = rankData.total_score || GS.totalScore;
    if (typeof updateRankDisplay === 'function') updateRankDisplay();
    syncUI();
  }

  // Track completed level locally
  if (!GS.completedLevels) GS.completedLevels = {};
  const key = `${GS.language}_${GS.mode}_${GS.difficulty}`;
  if (!GS.completedLevels[key]) GS.completedLevels[key] = [];
  if (!GS.completedLevels[key].includes(GS.levelId)) GS.completedLevels[key].push(GS.levelId);
  if (GS.username) {
    localStorage.setItem(`codeDefender_${GS.username}_completed`, JSON.stringify(GS.completedLevels));
  }

  // Fetch next level data (X + 1)
  const nextLevel = GS.levelId + 1;
  const data = await apiFetch(
    `/get_task/${GS.language}?mode=${GS.mode}&difficulty=${GS.difficulty}&level=${nextLevel}`
  );
  _nextLevelData = data.game_complete ? null : data;

  _missionSuccess = true;
  _gameOver = true;
  _isLevelClear = !!_nextLevelData;

  // Auto-open Split-Pane Terminal Modal before victory screen
  if (typeof openIOModal === 'function') {
    setTimeout(() => openIOModal(false), 600);
  }
}

function replayCurrentLevel() {
  window.apiStartGame(GS.language, GS.levelId);
}

async function advanceToNextLevel() {
  if (!_nextLevelData) { goTo('screen-gameover'); return; }

  const data = _nextLevelData;
  _nextLevelData = null;
  _levelCompleting = false;

  GS.levelId = data.id;
  GS.levelTip = data.tip;
  GS.words = data.content || [];
  GS.isBoss = data.is_boss || false;
  GS.expectedOutput = data.expected_output || '';
  GS.levelConcept = data.concept || '';

  const lvlEl = document.querySelector('.gho-lvl');
  const sectorEl = document.querySelector('.gho-sec');
  if (lvlEl) lvlEl.textContent = 'LVL ' + GS.levelId;
  if (sectorEl) sectorEl.textContent = GS.levelTip;

  // Reset game state for next level — clear all active UI state
  lives = 3;
  _gameOver = false;
  setShipHealth(100);
  GS._wordsTyped = 0;
  GS._keysTotal = 0;
  GS._keysHit = 0;
  GS._maxCombo = 0;
  GS._currentCombo = 0;
  GS._startTime = Date.now();
  // Reset ship position and input fields
  shipX = 50; targetShipX = 50;
  currentTarget = null;
  const cin = document.getElementById('classicInput');
  const cin2 = document.getElementById('cmdInputField');
  const td2 = document.getElementById('typeDisplay');
  if (cin) cin.value = '';
  if (cin2) cin2.value = '';
  if (td2) td2.textContent = '';
  updateTargetHUD(null);
  // Remove any stale .active-target highlights from previous wave
  document.querySelectorAll('.active-target').forEach(el => el.classList.remove('active-target'));

  // Transition back to game cockpit and spawn fresh data
  spawnWords(GS.words, true); // true = level advance
  goTo('screen-game');
}

// ─────────────────────────────────────────────────────────────────
//  CLASSIC MODE INPUT
//  - Invisible input captures keystrokes globally
//  - Typed text appears above ship head
//  - Ship moves to track the best-matching word
//  - Full match → laser fires, word destroyed
// ─────────────────────────────────────────────────────────────────
const classicInput = document.getElementById('classicInput');
const typeDisplay = document.getElementById('typeDisplay');
const cmdTargetChip = document.getElementById('cmdTarget');

function getWordTexts() {
  return Array.from(document.querySelectorAll('.word-fall')).map(w => {
    // target = what the player must type (exact, may be case-sensitive for debug/sniper)
    let rawTarget = w.dataset.target || w.dataset.original || w.textContent;
    const target = (rawTarget || '').trim();
    const taskType = w.dataset.type || 'standard';
    // For sniper/debug, preserve case so player types the exact keyword
    // For standard classic keywords, lowercase is fine (all keywords are lowercase)
    const isCaseSensitive = (taskType === 'debug');
    return {
      el: w,
      target: target,                              // raw target, original case
      text: isCaseSensitive ? target : target.toLowerCase(),  // for comparison
      orig: target,                                // shown in UI chip
      type: taskType,
      corrupt: w.classList.contains('danger'),
    };
  });
}

// Show typed string above ship, colour-coded
function showTyped(str, isMatch) {
  if (!typeDisplay) return;
  typeDisplay.textContent = str.toUpperCase();
  typeDisplay.style.color = isMatch ? 'var(--aurora)' : 'var(--cyan)';
  typeDisplay.style.textShadow = isMatch
    ? '0 0 14px rgba(57,255,143,0.9)'
    : '0 0 14px rgba(0,255,245,0.8)';
}
function clearTyped() {
  if (typeDisplay) { typeDisplay.textContent = ''; }
  if (classicInput) classicInput.value = '';
  if (cmdInput && GS.mode === 'classic') cmdInput.value = '';
  if (cmdTargetChip && GS.mode === 'classic') cmdTargetChip.style.color = '';
  updateTargetHUD(null);
  currentTarget = null;
}

// ── EDUCATIONAL HUD HELPER ─────────────────────────────────────────
// Updates the #activeTargetHUD span with the current target keyword + hint.
// Call with null/undefined to reset to STANDBY state.
window.updateTargetHUD = function (wordObj) {
  const el = document.getElementById('activeTargetHUD');
  if (!el) return;
  if (!wordObj) {
    el.textContent = '[ STANDBY - TYPE TO LOCK ON ]';
    el.style.color = '';
    el.style.textShadow = '';
    if (cmdTargetChip) cmdTargetChip.style.color = '';
    return;
  }
  // Build display: target // hint (hint is optional)
  const keyword = wordObj.target || wordObj.orig || '';
  const hint = wordObj.hint || (wordObj.el && wordObj.el.dataset && wordObj.el.dataset.hint) || null;
  el.textContent = hint ? `${keyword} // ${hint}` : keyword;
  el.style.color = '#ffff00';
  el.style.textShadow = '0 0 8px rgba(255,255,0,0.6)';
  if (cmdTargetChip) cmdTargetChip.style.color = '#ffff00';
}

// FIX 4 + 9: Keep classicInput focused during classic game, never steal focus elsewhere
function refocusClassicInput() {
  const gameActive = document.getElementById('screen-game')?.classList.contains('active');
  if (!gameActive || gamePaused || GS.mode !== 'classic' || GS.difficulty === 'pro') return;
  classicInput?.focus();
}

// Refocus on any keypress during classic game
document.addEventListener('keydown', e => {
  const gameActive = document.getElementById('screen-game')?.classList.contains('active');
  if (!gameActive || gamePaused) return;
  if (GS.mode === 'classic' && GS.difficulty !== 'pro' && document.activeElement !== classicInput) {
    classicInput?.focus();
  }
});

// Refocus if classicInput loses focus (click elsewhere)
classicInput?.addEventListener('blur', () => {
  setTimeout(refocusClassicInput, 10);
});

// Refocus on canvas click
document.getElementById('gameCanvas')?.addEventListener('click', () => {
  refocusClassicInput();
});

if (classicInput) {
  classicInput.addEventListener('input', () => {
    if (gamePaused || GS.mode !== 'classic' || GS.difficulty === 'pro') return;
    // Keep original case for typed — debug targets may be case-sensitive
    const typedRaw = classicInput.value.trim();
    const typedLower = typedRaw.toLowerCase();

    // Mirror typed text to visible cmd input in classic mode
    if (cmdInput && GS.mode === 'classic') {
      cmdInput.value = typedRaw ? classicInput.value : '';
    }

    if (!typedRaw) { clearTyped(); return; }

    const words = getWordTexts();
    // Match against target: use original case for debug types, lowercase for standard/sniper
    const match = words.find(w => {
      const cmp = w.type === 'debug' ? typedRaw : typedLower;
      return w.text.startsWith(cmp);
    });

    if (match) {
      // Move ship toward matched word
      const canvas = document.getElementById('gameCanvas');
      const matchRect = match.el.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      const pct = ((matchRect.left + matchRect.width / 2 - canvasRect.left) / canvasRect.width) * 100;
      moveShipTo(pct);

      // Un-highlight previous target
      if (currentTarget && currentTarget.el !== match.el)
        currentTarget.el.classList.remove('active-target');
      currentTarget = match;
      match.el.classList.add('active-target');

      // Show the TARGET keyword in the chip (not the display blanks)
      if (cmdTargetChip && GS.mode === 'classic') {
        cmdTargetChip.style.color = '#ffff00';
      }

      // Update the educational HUD with target + hint on lock-on
      updateTargetHUD(match);

      // Show what the player is typing above the ship
      const typed = match.type === 'debug' ? typedRaw : typedLower;
      const isFullMatch = typed === match.text;
      showTyped(typedRaw, isFullMatch);

      if (isFullMatch) {
        // Perfect match — fire!
        GS._wordsTyped = (GS._wordsTyped || 0) + 1;
        destroyWord(match.el);
        clearTyped();
        // Move ship back to center after firing
        setTimeout(() => moveShipTo(50), 400);
      }
    } else {
      // No match — flash red, then clear so next keypress starts fresh
      GS._currentCombo = 0;
      showTyped(typedRaw, false);

      const shouldFlash = document.getElementById('set-error-flash')?.checked !== false;
      if (shouldFlash) {
        document.body.classList.add('error-flash');
        setTimeout(() => document.body.classList.remove('error-flash'), 150);
      }

      if (typeDisplay) {
        if (shouldFlash) typeDisplay.classList.add('wrong');
        setTimeout(() => {
          typeDisplay.classList.remove('wrong');
          typeDisplay.textContent = '';
          if (classicInput) classicInput.value = '';
          currentTarget = null;
        }, 300);
      }
    }
  });

  classicInput.addEventListener('keydown', e => {
    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      GS._keysTotal = (GS._keysTotal || 0) + 1;
      // We assume correct unless the input event fails to match
      GS._keysHit = (GS._keysHit || 0) + 1;
      GS._currentCombo = (GS._currentCombo || 0) + 1;
      if (GS._currentCombo > (GS._maxCombo || 0)) GS._maxCombo = GS._currentCombo;
    }
    if (e.key === 'Escape' || e.key === 'Backspace' && classicInput.value === '') {
      clearTyped();
      moveShipTo(50);
      GS._currentCombo = 0;
    }
  });
}

// ─────────────────────────────────────────────────────────────────
//  BUILDER MODE INPUT (cmd-input-zone visible, ENTER to fire)
// ─────────────────────────────────────────────────────────────────
const cmdInput = document.getElementById('cmdInputField');

function flashInputError() {
  const shouldFlash = document.getElementById('set-error-flash')?.checked !== false;
  if (shouldFlash) {
    document.body.classList.add('error-flash');
    setTimeout(() => document.body.classList.remove('error-flash'), 150);
  }

  if (!cmdInput) return;
  cmdInput.style.color = '#ff3131';
  cmdInput.style.textShadow = '0 0 8px rgba(255,49,49,0.8)';
  setTimeout(() => { cmdInput.style.color = ''; cmdInput.style.textShadow = ''; }, 250);
}

function clearInputState() {
  if (cmdInput) cmdInput.value = '';
  if (currentTarget) { currentTarget.el.classList.remove('active-target'); currentTarget = null; }
  updateTargetHUD(null);
}

if (cmdInput) {
  let _proLastVal = '';
  let _pendingDeductions = 0;

  // Builder normal: prefix auto-aim in the cmd box
  cmdInput.addEventListener('input', () => {
    if (gamePaused) { cmdInput.value = ''; return; }
    if (GS.difficulty === 'pro') return;

    // Preserve original case — debug targets may need exact case matching
    const typedRaw = cmdInput.value.trim();
    const typedLower = typedRaw.toLowerCase();
    if (!typedRaw) { clearInputState(); return; }

    const words = getWordTexts();
    // debug targets: case-sensitive prefix match; others: case-insensitive
    const match = words.find(w => {
      const cmp = w.type === 'debug' ? typedRaw : typedLower;
      return w.text.startsWith(cmp);
    });
    if (match) {
      if (currentTarget && currentTarget.el !== match.el)
        currentTarget.el.classList.remove('active-target');
      currentTarget = match;
      match.el.classList.add('active-target');
      // Always show the TARGET keyword in the chip (never the blank display string)
      // and update the educational HUD with target + hint on lock-on
      if (cmdTargetChip) cmdTargetChip.style.color = '#ffff00';
      updateTargetHUD(match);
      const typed = match.type === 'debug' ? typedRaw : typedLower;
      if (typed === match.text) {
        GS._wordsTyped = (GS._wordsTyped || 0) + 1;
        destroyWord(match.el);
        clearInputState();
      }
    } else {
      flashInputError();
      GS._currentCombo = 0;
    }
  });

  // Builder Pro: ENTER fires
  cmdInput.addEventListener('keydown', e => {
    if (gamePaused) return;
    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      GS._keysTotal = (GS._keysTotal || 0) + 1;
    }
    if (e.key === 'Escape') { clearInputState(); _proLastVal = ''; GS._currentCombo = 0; return; }
    if (GS.difficulty !== 'pro') {
      if (e.key === 'Enter') { e.preventDefault(); clearInputState(); }
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const typed = cmdInput.value.trim();
      if (!typed) return;
      const allWords = Array.from(document.querySelectorAll('.word-fall'));
      // Match against dataset.target (what player must type), not display text
      const exactMatch = allWords.find(el => (el.dataset.target || el.dataset.original || el.textContent.trim()) === typed);
      if (exactMatch) {
        if (_pendingDeductions > 0) { apiAddPoints(-_pendingDeductions); _pendingDeductions = 0; }
        exactMatch.classList.add('active-target');
        GS._wordsTyped = (GS._wordsTyped || 0) + 1;
        GS._keysHit = (GS._keysHit || 0) + typed.length; // Approximate hits
        GS._currentCombo = (GS._currentCombo || 0) + 1;
        if (GS._currentCombo > (GS._maxCombo || 0)) GS._maxCombo = GS._currentCombo;
        destroyWord(exactMatch);
        clearInputState(); _proLastVal = '';
        if (cmdTargetChip) {
          cmdTargetChip.innerHTML = '✓ EXECUTED';
          cmdTargetChip.style.color = 'var(--aurora)';
          setTimeout(() => {
            cmdTargetChip.innerHTML = 'TARGET: <span id="activeTargetHUD">[ STANDBY - TYPE TO LOCK ON ]</span>';
            cmdTargetChip.style.color = '';
          }, 800);
        }
      } else {
        flashInputError();
        GS._currentCombo = 0;
        const d = -(_pendingDeductions + 1); _pendingDeductions = 0;
        if (d < 0) apiAddPoints(d);
        if (cmdTargetChip) {
          cmdTargetChip.innerHTML = '✗ INVALID';
          cmdTargetChip.style.color = '#ff3131';
          setTimeout(() => {
            cmdTargetChip.innerHTML = 'TARGET: <span id="activeTargetHUD">[ STANDBY - TYPE TO LOCK ON ]</span>';
            cmdTargetChip.style.color = '';
          }, 900);
        }
        clearInputState(); _proLastVal = '';
      }
      return;
    }
  });

  // Builder Pro: deduction tracking
  cmdInput.addEventListener('input', () => {
    if (gamePaused || GS.difficulty !== 'pro') return;
    const current = cmdInput.value; const prev = _proLastVal; _proLastVal = current;
    if (current.length <= prev.length) return;
    // Match against dataset.target (exact, case-sensitive for debug; case-insensitive for others)
    const anyMatch = Array.from(document.querySelectorAll('.word-fall')).some(el => {
      const tgt = el.dataset.target || el.dataset.original || el.textContent.trim();
      const taskType = el.dataset.type || 'standard';
      const cmp = current.trim();
      return taskType === 'debug' ? tgt.startsWith(cmp) : tgt.toLowerCase().startsWith(cmp.toLowerCase());
    });
    if (!anyMatch) { flashInputError(); _pendingDeductions++; }
    // Show 'TYPING: <what you typed>' in the span — preserves the chip structure
    const hudEl = document.getElementById('activeTargetHUD');
    if (hudEl && current.trim()) {
      hudEl.textContent = 'TYPING: ' + current.trim().slice(0, 25);
      hudEl.style.color = 'rgba(200,220,240,0.6)';
      hudEl.style.textShadow = '';
      if (cmdTargetChip) cmdTargetChip.style.color = 'rgba(200,220,240,0.6)';
    }
  });
}


// ═══════════════════════════════════════════════
//  UNIVERSAL MODAL SYSTEM
// ═══════════════════════════════════════════════
function openModal(id) {
  closeAllDD();
  document.getElementById(id).classList.add('open');
  try { playUI('open'); } catch (e) { }

  // Set default tabs
  if (id === 'howToPlayModal') {
    const tab = document.querySelector('#howToPlayModal .modal-tab');
    if (tab) switchTab('htp', 'classic', tab);
  } else if (id === 'achievementsModal') {
    const tab = document.querySelector('#achievementsModal .modal-tab');
    if (tab) switchTab('ach', 'all', tab);
  } else if (id === 'settingsModal') {
    const tab = document.querySelector('#settingsModal .modal-tab');
    if (tab) switchTab('set', 'audio', tab);
  } else if (id === 'syntaxModal') {
    const tab = document.querySelector('#syntaxModal .modal-tab');
    if (tab) switchTab('syn', 'general', tab);
  } else if (id === 'profileModal') {
    showOwnProfile();
  }
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  try { playUI('close'); } catch (e) { }
}
// Close on backdrop click for all modals
// Icon picker backdrop close
document.getElementById('iconPickerOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('iconPickerOverlay')) closeIconPicker();
});

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});
// ESC key closes topmost modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (document.getElementById('iconPickerOverlay').classList.contains('open')) { closeIconPicker(); return; }
    const open = document.querySelector('.modal-overlay.open');
    if (open) open.classList.remove('open');
  }
});

// ═══════════════════════════════════════════════
//  TAB SWITCHING (generic)
//  prefix: 'htp', 'ach', 'set'
//  id: the suffix of the panel id
// ═══════════════════════════════════════════════
function switchTab(prefix, id, btn) {
  // Hide all panels with this prefix
  document.querySelectorAll(`[id^="${prefix}-"]`).forEach(p => p.classList.remove('active'));
  // Show target panel
  const target = document.getElementById(`${prefix}-${id}`);
  if (target) target.classList.add('active');
  // Update tab button states — find the parent modal-tabs
  if (btn) {
    const tabs = btn.closest('.modal-tabs');
    if (tabs) {
      tabs.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
    }
  }
}

// ═══════════════════════════════════════════════
//  SETTINGS HANDLERS
// ═══════════════════════════════════════════════
function setStarDensity(level) {
  // Maps to wormhole star density via config
  // The wormhole engine reads STAR_COUNT — this is a visual hint only
  // Actual wormhole star count is set at startup; this shows a note
  const labels = { low: 'Low', medium: 'Medium', high: 'High' };
  console.log('Star density preference:', labels[level] || level);
  // Future: could expose WH.setStarCount(count) — leaving as no-op for now
}

function setGlowIntensity(val) {
  // Scale the text-shadow on falling words
  const intensity = val / 100;
  const alpha = (0.3 + intensity * 0.5).toFixed(2);
  const spread = Math.round(6 + intensity * 18);
  // Inject dynamic style
  let el = document.getElementById('dynamicGlowStyle');
  if (!el) { el = document.createElement('style'); el.id = 'dynamicGlowStyle'; document.head.appendChild(el); }
  el.textContent = `.word-fall { filter: brightness(${0.7 + intensity * 0.6}); }`;
}



// ═══════════════════════════════════════════════════════════════
//  ICON DATA — categories of icons for avatar picker
// ═══════════════════════════════════════════════════════════════
const ICON_CATS = {
  ships: ['🚀', '🛸', '🛩', '🚁', '🛰', '🛺', '🚂', '🛳', '⛵', '🚤', '🛻', '🚜', '🏎', '🛵', '🚒', '🛟', '🚀', '🛡'],
  tech: ['💻', '🖥', '⌨', '🖱', '📡', '🔭', '🔬', '💾', '💿', '📟', '📠', '🔋', '🔌', '💡', '🧲', '⚙', '🔩', '🛠', '🔧', '🔑', '🗝', '🔐', '🔒', '🧰'],
  cosmic: ['🌌', '🌠', '⭐', '🌟', '💫', '✨', '☄', '🌙', '🌛', '🌝', '🪐', '🔮', '🌊', '🌋', '⚡', '🌈', '❄', '🔥', '💥', '🌀'],
  creatures: ['🐉', '🦅', '🦋', '🦊', '🐺', '🦁', '🐯', '🐻', '🦝', '🦄', '🐲', '🦎', '🦖', '🦕', '🦈', '🐙', '🦑', '🦀', '🦂', '🕷', '🦗', '🦟', '🦞', '🐝'],
  symbols: ['⚔', '🛡', '🏹', '🗡', '🔱', '⚜', '☯', '⚛', '🌐', '💠', '♾', '🔯', '✡', '☸', '✝', '⛎', '🔰', '♻', '🎯', '🎲', '🃏', '♟', '🎭', '🔵']
};
let pickerSelectedIcon = '🚀';
let currentIconCat = 'ships';

function showIconCat(cat, btn) {
  currentIconCat = cat;
  // Update cat buttons
  document.querySelectorAll('.icon-cat-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  // Render grid
  const grid = document.getElementById('iconPickerGrid');
  if (!grid) return;
  grid.innerHTML = '';
  ICON_CATS[cat].forEach(icon => {
    const div = document.createElement('div');
    div.className = 'icon-option' + (icon === pickerSelectedIcon ? ' selected' : '');
    div.textContent = icon;
    div.onclick = () => selectIcon(icon);
    grid.appendChild(div);
  });
}

function selectIcon(icon) {
  pickerSelectedIcon = icon;
  document.querySelectorAll('.icon-option').forEach(el => {
    el.classList.toggle('selected', el.textContent === icon);
  });
  const prev = document.getElementById('iconPreviewCurrent');
  if (prev) prev.textContent = icon;
  playUI('select');
}

function openIconPicker() {
  pickerSelectedIcon = document.getElementById('myAvatarIcon')?.textContent || '🚀';
  document.getElementById('iconPickerOverlay').classList.add('open');
  showIconCat('ships', document.querySelector('.icon-cat-btn'));
  document.getElementById('iconPreviewCurrent').textContent = pickerSelectedIcon;
  playUI('open');
}

function closeIconPicker() {
  document.getElementById('iconPickerOverlay').classList.remove('open');
  playUI('close');
}

function confirmIconSelection() {
  const icon = pickerSelectedIcon;
  // Update own profile avatar
  const myIcon = document.getElementById('myAvatarIcon');
  if (myIcon) myIcon.textContent = icon;
  // Update roster row for Shadow (index 0)
  const firstRosterAvatar = document.querySelector('.roster-avatar');
  if (firstRosterAvatar) firstRosterAvatar.textContent = icon;
  // Persist to sessionStorage
  sessionStorage.setItem('playerAvatar', icon);
  closeIconPicker();
  playUI('confirm');
}

// (avatar restore + session check now in API layer window.load)

// ═══════════════════════════════════════════════════════════════
//  ROSTER & PROFILE NAVIGATION
// ═══════════════════════════════════════════════════════════════
function showOwnProfile() {
  document.getElementById('ownProfilePanel').style.display = '';
  document.getElementById('rosterPanel').style.display = 'none';
  document.getElementById('viewedProfilePanel').style.display = 'none';
  document.getElementById('profileViewBanner').classList.remove('visible');
  document.getElementById('profileBackBtn').style.display = 'none';
  document.getElementById('profileModalTitle').innerHTML = '<span class="modal-title-icon">◉</span>DEFENDER PROFILE';
  document.getElementById('profileFooter').textContent = 'Stats update after each completed session';
  // Tab UI
  const tabs = document.querySelectorAll('#profileTabs .modal-tab');
  tabs[0].classList.add('active'); tabs[1].classList.remove('active');
  playUI('tab');
}

function showRoster() {
  document.getElementById('ownProfilePanel').style.display = 'none';
  document.getElementById('rosterPanel').style.display = '';
  document.getElementById('viewedProfilePanel').style.display = 'none';
  document.getElementById('profileViewBanner').classList.remove('visible');
  document.getElementById('profileBackBtn').style.display = 'none';
  document.getElementById('profileModalTitle').innerHTML = '<span class="modal-title-icon">◉</span>DEFENDER PROFILE';
  document.getElementById('profileFooter').textContent = 'Click any defender to view their profile';
  const tabs = document.querySelectorAll('#profileTabs .modal-tab');
  tabs[1].classList.add('active'); tabs[0].classList.remove('active');
  playUI('tab');
  renderRoster(); // Fetch and render whenever the tab is opened
}

async function renderRoster() {
  const rosterList = document.getElementById('rosterList');
  if (!rosterList) return;

  rosterList.innerHTML = '<div style="padding:40px;text-align:center;color:var(--dim);font-family:var(--hud-mono);font-size:10px;">LOADING DEFENDER DATA...</div>';

  const data = await apiFetch('/leaderboard_all');
  rosterList.innerHTML = '';

  if (!data.leaderboard || data.leaderboard.length === 0) {
    rosterList.innerHTML = '<div style="padding:40px;text-align:center;color:var(--dim);font-family:var(--hud-mono);">NO SIGNALS DETECTED</div>';
    return;
  }

  // Store globally or attach to elements so viewDefenderProfile can use it
  window._currentRosterData = data.leaderboard;

  data.leaderboard.forEach((user, index) => {
    // Generate realistic-sounding mock stats for the demo if real stats aren't available
    const score = (1000 - index * 50) > 0 ? (1000 - index * 50) : 50;
    const sessions = Math.max(1, 20 - index);
    const keywords = score * 2;
    const acc = Math.max(60, 98 - index) + '%';
    const combo = '×' + Math.max(2, 15 - Math.floor(index / 2));
    const isOnline = index < 3;

    // We only get basic data from leaderboard_all right now, so we flesh it out for the UI
    const row = document.createElement('div');
    row.className = 'roster-row';
    row.onclick = () => viewDefenderProfile(index, score, sessions, keywords, acc, combo, isOnline);

    // Basic formatting based on global rank tier
    const gr = user.global_rank;

    row.innerHTML = `
      <div class="roster-avatar">${gr.icon}</div>
      <div class="roster-info">
        <div class="roster-name" style="color:${gr.color}; text-shadow:0 0 8px ${gr.color}66">${user.username}</div>
        <div class="roster-sub">Defender · ${gr.name}</div>
      </div>
      <div class="roster-score">${score}</div>
      <div class="${isOnline ? 'roster-online-dot' : 'roster-offline-dot'}"></div>
      <div class="roster-view-arrow">›</div>
    `;
    rosterList.appendChild(row);
  });
}

function viewDefenderProfile(userIndex, score, sessions, kw, acc, combo, online) {
  const user = window._currentRosterData[userIndex];
  if (!user) return;

  const name = user.username;
  const gr = user.global_rank;

  document.getElementById('ownProfilePanel').style.display = 'none';
  document.getElementById('rosterPanel').style.display = 'none';
  document.getElementById('viewedProfilePanel').style.display = '';
  document.getElementById('profileViewBanner').classList.add('visible');
  document.getElementById('profileBackBtn').style.display = 'flex';
  document.getElementById('profileModalTitle').innerHTML = `<span class="modal-title-icon">◉</span>${name.toUpperCase()}`;
  document.getElementById('profileFooter').textContent = "Read-only — you cannot edit another defender's profile";

  // Populate avatar and basic info
  document.getElementById('viewedAvatarIcon').textContent = gr.icon;
  const vHandle = document.getElementById('viewedHandle');
  vHandle.textContent = name;
  vHandle.style.color = gr.color;

  const vRank = document.getElementById('viewedRank');
  vRank.textContent = `▸ RANK: ${gr.name.toUpperCase()} ◂`;
  vRank.style.color = gr.color;

  document.getElementById('viewedOccupation').textContent = 'Defender';
  const statusEl = document.getElementById('viewedStatus');
  statusEl.textContent = online ? 'ONLINE' : 'OFFLINE';
  statusEl.style.color = online ? 'var(--aurora)' : 'var(--dim)';

  // Mock stats
  document.getElementById('vs-score').textContent = score;
  document.getElementById('vs-sessions').textContent = sessions;
  document.getElementById('vs-kw').textContent = kw;
  document.getElementById('vs-acc').textContent = acc;
  document.getElementById('vs-combo').textContent = combo;
  document.getElementById('vs-time').textContent = Math.floor(sessions * 1.5) + 'h ' + (sessions * 12 % 60) + 'm';
  document.getElementById('vs-levels').textContent = Math.floor(score / 50);

  // Populate Language Badges
  if (user.lang_badges) {
    ['python', 'java', 'c'].forEach(lang => {
      const b = user.lang_badges[lang];
      if (!b) return;
      // We don't have individual DOM elements for viewed lang badges in the template currently,
      // so we rely on the global ranks to show progression instead, or we can dynamically
      // generate them if we add a container for them to the viewedProfilePanel.
      // (Skipping dynamic viewed lang badges for brevity, user mainly wants roster and own positions)
    });
  }

  playUI('open');
}

// ═══════════════════════════════════════════════════════════════
//  MUSIC ENGINE — HTML5 Audio with cross-fade + scenario logic
//  Tracks: Kevin MacLeod (incompetech.com) CC BY 4.0
// ═══════════════════════════════════════════════════════════════

const TRACKS = {
  // calm, mysterious — login / register screens
  menu: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Cipher.mp3',
  // serene, floating — idle/lobby/lang select screens
  ambient: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Floating%20Cities.mp3',
  // driving, intense — active game
  battle: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Volatile%20Reaction.mp3',
  // dark, sombre — game over screen
  gameover: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Long%20Note%20Four.mp3',
};

// Volume per scenario (0–1): battle is loudest, gameover is quieter
const TRACK_VOLUMES = {
  menu: 0.55,
  ambient: 0.45,
  battle: 0.85,
  gameover: 0.40,
};

let musicEnabled = false;
let currentTrack = null;
let activeAudio = null;   // the currently playing Audio element
let fadingAudio = null;   // the one fading out
let masterVolume = 0.75;   // 0–1, controlled by settings slider
let fadeTimer = null;

// Pre-create audio elements for each track and set them up
const audioEls = {};
Object.entries(TRACKS).forEach(([key, url]) => {
  const a = new Audio();
  a.src = url;
  a.loop = true;
  a.preload = 'none';   // don't fetch until needed
  a.volume = 0;
  audioEls[key] = a;
});

function initAudio() { /* no-op — kept for compatibility */ }

function toggleMusic() {
  musicEnabled = !musicEnabled;
  const toggle = document.getElementById('musicToggle');
  const label = document.getElementById('musicLabel');

  if (musicEnabled) {
    toggle.classList.add('playing');
    label.textContent = 'MUSIC ON';
    const screen = document.querySelector('.screen.active');
    const id = screen ? screen.id : 'screen-login';
    playTrackForScreen(id);
  } else {
    toggle.classList.remove('playing');
    label.textContent = '\u266a MUSIC OFF';
    fadeOutAll();
  }
}

function screenToTrack(screenId) {
  if (screenId === 'screen-game') return 'battle';
  if (screenId === 'screen-gameover') return 'gameover';
  if (screenId === 'screen-login' || screenId === 'screen-register') return 'menu';
  return 'ambient'; // idle, lang, everything else
}

function playTrackForScreen(screenId) {
  if (!musicEnabled) return;
  const track = screenToTrack(screenId);
  if (track === currentTrack && activeAudio && !activeAudio.paused) return;
  crossFadeTo(track);
}

function crossFadeTo(trackKey) {
  const targetAudio = audioEls[trackKey];
  if (!targetAudio) return;

  // If something is playing, fade it out
  if (activeAudio && activeAudio !== targetAudio && !activeAudio.paused) {
    const dying = activeAudio;
    fadingAudio = dying;
    clearInterval(fadeTimer);
    let v = dying.volume;
    fadeTimer = setInterval(() => {
      v -= 0.04;
      if (v <= 0) {
        dying.pause();
        dying.currentTime = 0;
        dying.volume = 0;
        if (fadingAudio === dying) fadingAudio = null;
        clearInterval(fadeTimer);
      } else {
        dying.volume = v;
      }
    }, 60);
  }

  // Start the new track from beginning if it was stopped
  currentTrack = trackKey;
  activeAudio = targetAudio;
  const targetVol = TRACK_VOLUMES[trackKey] * masterVolume;

  if (targetAudio.paused) {
    targetAudio.currentTime = 0;
    targetAudio.volume = 0;
    targetAudio.play().catch(() => { });
  }

  // Fade in
  let v = targetAudio.volume;
  const rampUp = setInterval(() => {
    if (!musicEnabled || currentTrack !== trackKey) { clearInterval(rampUp); return; }
    v += 0.03;
    if (v >= targetVol) { targetAudio.volume = targetVol; clearInterval(rampUp); }
    else targetAudio.volume = v;
  }, 60);
}

function fadeOutAll() {
  [activeAudio, fadingAudio].forEach(a => {
    if (!a || a.paused) return;
    let v = a.volume;
    const t = setInterval(() => {
      v -= 0.05;
      if (v <= 0) { a.pause(); a.currentTime = 0; a.volume = 0; clearInterval(t); }
      else a.volume = v;
    }, 50);
  });
  activeAudio = null;
  fadingAudio = null;
  currentTrack = null;
}

// Called by settings master volume slider
function setMusicVolume(val) {
  masterVolume = val / 100;
  if (activeAudio && !activeAudio.paused) {
    activeAudio.volume = Math.min(1, (TRACK_VOLUMES[currentTrack] || 0.6) * masterVolume);
  }
}

// ── UI SFX — short tones using Web Audio (tiny, no streaming needed) ──
let sfxCtx = null;
function getSfxCtx() {
  if (!sfxCtx) {
    sfxCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (sfxCtx.state === 'suspended') sfxCtx.resume();
  return sfxCtx;
}

// ── UI SFX GATEKEEPER — Handles Boolean Trap and setting check ──
function playUISound(audioElement) {
  const setting = localStorage.getItem('set-ui-sounds');
  // Boolean Trap Fix: "false" string from localStorage is truthy in raw JS
  if (setting === 'false') return;
  if (audioElement && typeof audioElement.play === 'function') {
    audioElement.play().catch(e => { });
  }
}

function playUI(type) {
  const setting = localStorage.getItem('set-ui-sounds');
  if (setting === 'false') return;

  try {
    const ctx = getSfxCtx();
    const t = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.value = 0.18;
    out.connect(ctx.destination);

    const beep = (freq, start, dur, vol = 0.18) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(vol, start + 0.01);
      g.gain.linearRampToValueAtTime(0, start + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(start); o.stop(start + dur + 0.02);
    };

    if (type === 'select') { beep(880, t, 0.08); beep(1100, t + 0.07, 0.07); }
    if (type === 'confirm') { beep(660, t, 0.07); beep(880, t + 0.08, 0.07); beep(1100, t + 0.16, 0.1); }
    if (type === 'open') { beep(440, t, 0.06); beep(660, t + 0.07, 0.09); }
    if (type === 'close') { beep(660, t, 0.06); beep(440, t + 0.07, 0.09); }
    if (type === 'tab') { beep(550, t, 0.06, 0.10); }
  } catch (e) { }
}

// Music transitions wired directly into goTo (see goTo function above)

// ═══════════════════════════════════════════════════════════════════
//  BACKEND API LAYER
//  All communication with Flask /api/* endpoints lives here.
//  The BASE_URL is empty string so it works on the same host/port.
// ═══════════════════════════════════════════════════════════════════

const API = '/api';

// ── Helpers ────────────────────────────────────────────────────
// ── MOCK MODE — set to false when Flask is running ──
const MOCK_MODE = false;

// Fetch rank from server and update GS
async function fetchMyRank() {
  const data = await apiFetch('/my_rank');
  if (data && data.global_rank) {
    GS.globalRank = data.global_rank;
    GS.langBadges = data.lang_badges;
    GS.globalPos = data.global_pos || 0;
    GS.langPos = data.lang_pos || {};
    GS.totalScore = data.total_score || 0;
    updateRankDisplay();
    syncUI();
  }
}

// Update all rank badges in the UI
function updateRankDisplay() {
  const gr = GS.globalRank;
  if (!gr) return;
  // HUD rank badge — make visible when playing
  document.querySelectorAll('.rank-badge-hud').forEach(el => {
    el.textContent = `${gr.icon} ${gr.name.toUpperCase()}`;
    el.style.color = gr.color;
    el.style.borderColor = gr.color + '55';
    el.style.boxShadow = `0 0 8px ${gr.color}44`;
    el.style.display = '';
  });
  // Profile Global Rank Pos
  const grPosEl = document.getElementById('myGlobalRankPos');
  if (grPosEl) {
    grPosEl.textContent = `GLOBAL: #${GS.globalPos || '?'}`;
  }
  // Profile lang badges
  if (GS.langBadges) {
    ['python', 'java', 'c'].forEach(lang => {
      const b = GS.langBadges[lang];
      if (!b) return;
      const el = document.getElementById(`langBadge_${lang}`);
      if (el) {
        el.textContent = `${b.icon} ${b.name}`;
        el.style.color = b.color;
      }
      const posEl = document.getElementById(`langBadge_${lang}_pos`);
      if (posEl) {
        const pos = (GS.langPos && GS.langPos[lang]) ? GS.langPos[lang] : '?';
        posEl.textContent = `RANK: #${pos}`;
      }
    });
  }
}

// Mock word banks for each language/mode
const MOCK_TASKS = {
  // ── CLASSIC ─────────────────────────────────────────────────────────
  python_classic: [
    { id: 1, tip: 'SEC 1: DATA TYPES', words: ['int', 'str', 'float', 'bool', 'list'] },
    { id: 2, tip: 'SEC 2: LOGIC GATES', words: ['if', 'elif', 'else', 'and', 'or', 'not', 'while'] },
    { id: 3, tip: 'SEC 3: LOOPS', words: ['for', 'while', 'break', 'continue', 'range', 'in', 'pass'] },
    { id: 4, tip: 'SEC 4: FUNCTIONS', words: ['def', 'return', 'lambda', 'yield', 'global', 'pass', 'class', 'self'] },
    { id: 5, tip: 'SEC 5: COLLECTIONS', words: ['list', 'dict', 'set', 'tuple', 'append', 'len', 'sorted', 'index', 'keys'] },
    { id: 6, tip: 'SEC 6: BOSS — FULL SYNTAX', words: ['def', 'class', 'return', 'import', 'lambda', 'yield', 'try', 'except', 'finally', 'raise', 'with', 'assert', 'del', 'global', 'pass'], is_boss: true },
  ],
  java_classic: [
    { id: 1, tip: 'SEC 1: PRIMITIVES', words: ['int', 'char', 'void', 'byte', 'long', 'double'] },
    { id: 2, tip: 'SEC 2: ACCESS', words: ['public', 'private', 'protected', 'static', 'final', 'abstract'] },
    { id: 3, tip: 'SEC 3: FLOW', words: ['if', 'else', 'switch', 'case', 'break', 'continue', 'return'] },
    { id: 4, tip: 'SEC 4: OOP', words: ['class', 'new', 'this', 'super', 'extends', 'implements', 'interface'] },
    { id: 5, tip: 'SEC 5: EXCEPTIONS', words: ['try', 'catch', 'finally', 'throw', 'throws', 'assert', 'instanceof'] },
    { id: 6, tip: 'SEC 6: BOSS — FULL SYNTAX', words: ['public', 'private', 'static', 'final', 'class', 'new', 'this', 'extends', 'implements', 'try', 'catch', 'throw', 'throws', 'return', 'void'], is_boss: true },
  ],
  c_classic: [
    { id: 1, tip: 'SEC 1: TYPES', words: ['int', 'char', 'float', 'double', 'void', 'long'] },
    { id: 2, tip: 'SEC 2: I/O', words: ['printf', 'scanf', 'puts', 'gets', 'fprintf', 'sprintf'] },
    { id: 3, tip: 'SEC 3: CONTROL', words: ['if', 'else', 'switch', 'case', 'for', 'while', 'do', 'break', 'return'] },
    { id: 4, tip: 'SEC 4: MEMORY', words: ['malloc', 'free', 'calloc', 'realloc', 'sizeof', 'null', 'struct', 'typedef'] },
    { id: 5, tip: 'SEC 5: POINTERS', words: ['pointer', 'alloc', 'sizeof', 'null', 'struct', 'const', 'extern', 'register'] },
    { id: 6, tip: 'SEC 6: BOSS — FULL SYNTAX', words: ['int', 'char', 'float', 'void', 'struct', 'malloc', 'free', 'sizeof', 'printf', 'scanf', 'return', 'const', 'static', 'extern', 'typedef'], is_boss: true },
  ],

  // ── BUILDER (approved 6-level progression, correct case, length 1<2<3<4<5<6) ──
  python_builder: [
    {
      id: 1, tip: 'SEC 1: HELLO WORLD',
      words: [
        'print("Hello, World!")',
      ]
    },
    {
      id: 2, tip: 'SEC 2: VARIABLES',
      words: [
        'name = "Alex"',
        'print("Hi " + name)',
      ]
    },
    {
      id: 3, tip: 'SEC 3: IF / ELSE',
      words: [
        'x = 10',
        'if x > 5:',
        '    print("Big")',
        'else:',
        '    print("Small")',
      ]
    },
    {
      id: 4, tip: 'SEC 4: FOR LOOP',
      words: [
        'for i in range(3):',
        '    print(i)',
        'for i in range(5):',
        '    print(i * 2)',
        'total = 0',
        'for n in range(4):',
        '    total += n',
      ]
    },
    {
      id: 5, tip: 'SEC 5: FUNCTIONS',
      words: [
        'def greet(name):',
        '    return "Hello, " + name',
        'print(greet("Riya"))',
        'def square(n):',
        '    return n * n',
        'print(square(4))',
        'def add(a, b):',
        '    return a + b',
      ]
    },
    {
      id: 6, tip: 'SEC 6: BOSS — LIST + FUNCTION + LOOP', is_boss: true,
      words: [
        'def double(n):',
        '    return n * 2',
        'nums = [1, 2, 3, 4]',
        'result = []',
        'for n in nums:',
        '    result.append(double(n))',
        'print(result)',
        'print(len(result))',
      ]
    },
  ],

  java_builder: [
    { id: 1, tip: 'SEC 1: HELLO WORLD', words: ['System.out.println("Hello, World!");'] },
    { id: 2, tip: 'SEC 2: VARIABLES', words: ['int x = 5;', 'String name = "Alex";', 'System.out.println(name);'] },
    { id: 3, tip: 'SEC 3: IF / ELSE', words: ['int x = 10;', 'if (x > 5) {', '    System.out.println("Big");', '}'] },
    { id: 4, tip: 'SEC 4: FOR LOOP', words: ['for (int i = 0; i < 3; i++) {', '    System.out.println(i);', '}', 'int sum = 0;', 'for (int i = 1; i <= 5; i++) {', '    sum += i;', '}'] },
    { id: 5, tip: 'SEC 5: METHODS', words: ['public static int square(int n) {', '    return n * n;', '}', 'System.out.println(square(4));', 'public static String greet(String name) {', '    return "Hello, " + name;', '}', 'System.out.println(greet("Riya"));'] },
    { id: 6, tip: 'SEC 6: BOSS — METHOD + ARRAY + LOOP', is_boss: true, words: ['int[] nums = {1, 2, 3, 4};', 'int total = 0;', 'for (int n : nums) {', '    total += n;', '}', 'System.out.println("Sum: " + total);', 'System.out.println("Count: " + nums.length);', 'System.out.println("Done");'] },
  ],

  c_builder: [
    { id: 1, tip: 'SEC 1: HELLO WORLD', words: ['printf("Hello, World!\\n");'] },
    { id: 2, tip: 'SEC 2: VARIABLES', words: ['int x = 5;', 'char name[] = "Alex";', 'printf("%s\\n", name);'] },
    { id: 3, tip: 'SEC 3: IF / ELSE', words: ['int x = 10;', 'if (x > 5) {', '    printf("Big\\n");', '}'] },
    { id: 4, tip: 'SEC 4: FOR LOOP', words: ['int i;', 'for (i = 0; i < 3; i++) {', '    printf("%d\\n", i);', '}', 'int sum = 0;', 'for (i = 1; i <= 5; i++) {', '    sum += i;', '}'] },
    { id: 5, tip: 'SEC 5: FUNCTIONS', words: ['int square(int n) {', '    return n * n;', '}', 'int add(int a, int b) {', '    return a + b;', '}', 'printf("%d\\n", square(4));', 'printf("%d\\n", add(2, 3));'] },
    { id: 6, tip: 'SEC 6: BOSS — STRUCT + LOOP + FUNCTION', is_boss: true, words: ['int nums[] = {1, 2, 3, 4};', 'int total = 0;', 'int i;', 'for (i = 0; i < 4; i++) {', '    total += nums[i];', '}', 'printf("Sum: %d\\n", total);', 'printf("Done\\n");'] },
  ],
};

// Convert mock plain strings to backend object format with selective corruption
function mockToContent(words, isBuilder) {
  return words.map((w, i) => {
    let corrupt;
    if (isBuilder) {
      // Only corrupt 1 line on levels 4-6 (harder levels), never on 1-3
      const lvl = GS.levelId || 1;
      corrupt = lvl >= 4 && i === Math.floor(words.length / 2);
    } else {
      corrupt = Math.random() < 0.15;
    }
    return isBuilder ? { line: w, corrupt } : { word: w, corrupt };
  });
}

const MOCK_LEADERBOARD = {
  python_classic_normal: [
    { username: 'kernel_panic', global_rank: { tier: 7, name: 'Elite', color: '#00d4ff', icon: '⚡' }, lang_ranks: { python: { tier: 5, name: 'Elite', color: '#00d4ff', icon: '⚡' } } },
    { username: 'Nx0r', global_rank: { tier: 5, name: 'Veteran', color: '#ff4d6d', icon: '🔴' }, lang_ranks: { python: { tier: 4, name: 'Veteran', color: '#ff4d6d', icon: '🔴' } } },
    { username: 'void_ptr', global_rank: { tier: 3, name: 'Specialist', color: '#ff8c00', icon: '🟠' }, lang_ranks: { python: { tier: 3, name: 'Defender', color: '#ffd60a', icon: '🟡' } } },
    { username: 'Cipher', global_rank: { tier: 2, name: 'Defender', color: '#ffd60a', icon: '🟡' }, lang_ranks: { python: { tier: 2, name: 'Cadet', color: '#39ff8f', icon: '🟢' } } },
    { username: 'ByteWitch', global_rank: { tier: 1, name: 'Cadet', color: '#39ff8f', icon: '🟢' }, lang_ranks: { python: { tier: 1, name: 'Initiate', color: '#4a8fff', icon: '🔵' } } }
  ],
  java_classic_normal: [
    { username: 'Nx0r', global_rank: { tier: 5, name: 'Veteran', color: '#ff4d6d', icon: '🔴' }, lang_ranks: { java: { tier: 4, name: 'Veteran', color: '#ff4d6d', icon: '🔴' } } },
    { username: 'Cipher', global_rank: { tier: 2, name: 'Defender', color: '#ffd60a', icon: '🟡' }, lang_ranks: { java: { tier: 1, name: 'Initiate', color: '#4a8fff', icon: '🔵' } } },
    { username: 'void_ptr', global_rank: { tier: 3, name: 'Specialist', color: '#ff8c00', icon: '🟠' }, lang_ranks: { java: { tier: 2, name: 'Cadet', color: '#39ff8f', icon: '🟢' } } }
  ],
  c_classic_normal: [
    { username: 'kernel_panic', global_rank: { tier: 7, name: 'Elite', color: '#00d4ff', icon: '⚡' }, lang_ranks: { c: { tier: 5, name: 'Elite', color: '#00d4ff', icon: '⚡' } } },
    { username: 'void_ptr', global_rank: { tier: 3, name: 'Specialist', color: '#ff8c00', icon: '🟠' }, lang_ranks: { c: { tier: 2, name: 'Cadet', color: '#39ff8f', icon: '🟢' } } }
  ],
  python_builder_normal: [],
  java_builder_normal: [],
  c_builder_normal: [],
  python_classic_pro: [],
  java_classic_pro: [],
  c_classic_pro: [],
  python_builder_pro: [],
  java_builder_pro: [],
  c_builder_pro: [],
};

// ── BACKEND API HANDLERS ───────────────────────────────────────
// (Using the global apiFetch and GS defined at the top of the file)

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = msg;
    el.classList.add('visible');
  }
}
function clearErr(id) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = '';
    el.classList.remove('visible');
  }
}
function setBtn(id, text, disabled) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = text;
    if (disabled) el.classList.add('disabled-btn');
    else el.classList.remove('disabled-btn');
    el.disabled = disabled;
  }
}
window.clearErr = clearErr;

// ── LOGIN ──────────────────────────────────────────────────────
async function apiLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!username || !password) { showError('loginError', 'Enter Defender ID and Access Key'); return; }

  setBtn('loginBtn', 'CONNECTING...', true);
  const data = await apiFetch('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setBtn('loginBtn', 'Establish Uplink', false);

  if (data.status === 'success') {
    GS.username = data.username;
    GS.fullName = data.full_name || data.username;
    GS.occupation = data.occupation || 'Defender';
    GS.isAdmin = data.is_admin || false;

    // INSTANT SYNC: Use metadata returned directly in login response
    GS.totalScore = data.total_score || 0;
    GS.globalRank = data.global_rank || null;
    GS.langBadges = data.lang_badges || {};

    try {
      GS.completedLevels = JSON.parse(localStorage.getItem(`codeDefender_${GS.username}_completed`)) || {};
    } catch (e) { GS.completedLevels = {}; }

    syncUI();
    goTo('screen-idle');
    playUI('confirm');
  } else {
    showError('loginError', data.message || 'Access Denied');
    playUI('close');
  }
}

// ── REGISTER ───────────────────────────────────────────────────
async function apiRegister() {
  const full_name = document.getElementById('regFullName').value.trim();
  const occupation = document.getElementById('regOccupation').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value;

  if (!full_name || !username || !password || !email) {
    showError('regError', 'All fields required'); return;
  }

  setBtn('regBtn', 'TRANSMITTING...', true);
  const data = await apiFetch('/register', {
    method: 'POST',
    body: JSON.stringify({ full_name, occupation, email, username, password }),
  });
  setBtn('regBtn', 'Submit Data', false);

  if (data.status === 'success') {
    // Auto-login after register
    document.getElementById('loginUsername').value = username;
    document.getElementById('loginPassword').value = password;
    goTo('screen-login');
    setTimeout(() => apiLogin(), 200);
    playUI('confirm');
  } else {
    showError('regError', data.message || 'Registration failed');
    playUI('close');
  }
}

// ── LOGOUT ─────────────────────────────────────────────────────
async function apiLogout() {
  await apiFetch('/logout', { method: 'POST' });
  GS.username = ''; GS.score = 0; GS.sessionScore = 0;
  // clear inputs
  ['loginUsername', 'loginPassword'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  syncUI();
  goTo('screen-login');
}

// ── RESTORE SESSION on page load ──────────────────────────────
async function checkSession() {
  const data = await apiFetch('/check_session');
  if (data.status === 'success') {
    GS.username = data.username;
    GS.fullName = data.full_name || data.username;
    GS.occupation = data.occupation || 'Defender';
    GS.isAdmin = data.is_admin || false;
    try {
      GS.completedLevels = JSON.parse(localStorage.getItem(`codeDefender_${GS.username}_completed`)) || {};
    } catch (e) { GS.completedLevels = {}; }
    syncUI();
    await fetchMyScore();
    await fetchMyRank();
    goTo('screen-idle');
  }
  // If fail — stay on login screen (already default)
}

// ── FETCH SCORE for current mode/lang/diff ─────────────────────
async function fetchMyScore() {
  if (!GS.language || !GS.mode || !GS.difficulty) return;
  const data = await apiFetch(
    `/my_score?lang=${GS.language}&mode=${GS.mode}&difficulty=${GS.difficulty}`
  );
  if (data.score !== undefined) {
    GS.score = data.score;
    syncUI();
  }
}

// ── GAME START ────────────────────────────────────────────────
async function apiStartGame(lang, reqLevel = null) {
  // Safety: ensure mode and difficulty have defaults
  GS.language = lang || 'python';
  GS.mode = GS.mode || 'classic';
  GS.difficulty = GS.difficulty || 'normal';
  GS.sessionScore = 0;
  if (reqLevel !== null) GS.levelId = reqLevel;
  else if (!GS.levelId) GS.levelId = 1;
  GS._wordsTyped = 0;
  GS._keysTotal = 0;
  GS._keysHit = 0;
  GS._maxCombo = 0;
  GS._currentCombo = 0;
  GS._startTime = Date.now();

  // Go to game screen FIRST so elements exist in DOM
  goTo('screen-game');

  // Reset score display
  const scoreEl = document.getElementById('gameScore');
  if (scoreEl) scoreEl.textContent = '0';

  // Update HUD immediately
  const sectorEl = document.querySelector('.gho-sector');
  const lvlEl = document.querySelector('.gho-lvl');
  const secEl = document.querySelector('.gho-sec');
  if (sectorEl) {
    const iconClass = GS.language === 'python' ? 'devicon-python-plain' : GS.language === 'java' ? 'devicon-java-plain' : 'devicon-c-plain';
    sectorEl.innerHTML = `<i class="${iconClass}"></i> SECTOR: ` + GS.language.toUpperCase();
  }
  if (lvlEl) lvlEl.textContent = 'LVL ' + (GS.levelId || 1);
  if (secEl) secEl.textContent = 'LOADING...';

  // Show/hide UI elements
  const proModePill = document.getElementById('proModePill');
  const entryFeePill = document.getElementById('entryFeePill');
  const hudPtsPill = document.getElementById('hudPtsPill');
  const peekBtn = document.getElementById('peekBtn');
  if (proModePill) proModePill.style.display = GS.difficulty === 'pro' ? 'flex' : 'none';
  if (entryFeePill) entryFeePill.style.display = GS.mode === 'builder' ? 'flex' : 'none';
  if (hudPtsPill) hudPtsPill.style.display = GS.mode === 'builder' ? 'flex' : 'none';
  if (peekBtn) peekBtn.classList.toggle('visible', GS.mode === 'builder');

  // Show/hide cmd-input-zone — always visible, builder-visible class makes it full size
  const cmdZone = document.getElementById('cmdInputZone');
  if (cmdZone) {
    if (GS.mode === 'builder') cmdZone.classList.add('builder-visible');
    else cmdZone.classList.remove('builder-visible');
    cmdZone.style.display = 'flex'; // always show
  }

  // Update mode indicator in top HUD
  const ghoMode = document.getElementById('ghoMode');
  if (ghoMode) ghoMode.textContent = GS.mode === 'builder' ? 'BUILDER MODE' : 'CLASSIC MODE';

  // Hide type-display always
  const td = document.getElementById('typeDisplay');
  if (td) td.style.display = 'none';

  // Reset lives, ship position, and all input state
  lives = 3;
  _gameOver = false;
  _missionSuccess = false;
  _isLevelClear = false;
  _levelCompleting = false;
  _isLevelSpawning = true;
  shipX = 50;
  targetShipX = 50;
  currentTarget = null;
  const ship = document.getElementById('playerShip');
  if (ship) { ship.style.left = '50%'; ship.style.transform = 'translateX(-50%)'; }
  // Clear all inputs
  const classicInp = document.getElementById('classicInput');
  const cmdInp = document.getElementById('cmdInputField');
  const tDisp = document.getElementById('typeDisplay');
  if (classicInp) classicInp.value = '';
  if (cmdInp) cmdInp.value = '';
  if (tDisp) tDisp.textContent = '';
  updateTargetHUD(null);

  // Update terminal
  const cmdEl = document.querySelector('.cmd-input');
  const cmdLbl = document.querySelector('.cmd-label');
  const chip = document.getElementById('cmdTarget');
  if (GS.difficulty === 'pro') {
    if (cmdEl) cmdEl.placeholder = 'type full string, press ENTER to fire...';
    if (cmdLbl) cmdLbl.textContent = '▸ PRO MODE — TYPE COMPLETE STRING + ENTER ◂';
    if (chip) { chip.innerHTML = 'PRO MODE'; chip.style.color = 'rgba(255,77,109,0.5)'; }
  } else {
    if (cmdEl) cmdEl.placeholder = 'start typing to auto-target...';
    if (cmdLbl) cmdLbl.textContent = '▸ TYPE THE FALLING CODE TO DESTROY IT ◂';
    if (chip) { chip.innerHTML = 'TARGET: <span id="activeTargetHUD">[ STANDBY - TYPE TO LOCK ON ]</span>'; chip.style.color = ''; }
  }
  if (GS.mode === 'builder' && cmdEl) setTimeout(() => cmdEl.focus(), 150);
  else setTimeout(() => document.getElementById('classicInput')?.focus(), 150);

  // Reset ship health
  try { _demoH = 100; _demoDir = -1; setShipHealth(100); } catch (e) { }

  // Show loading state in canvas
  const canvas = document.getElementById('gameCanvas');
  if (canvas) {
    canvas.querySelectorAll('.word-fall,.loading-msg').forEach(w => w.remove());
    const loadMsg = document.createElement('div');
    loadMsg.className = 'loading-msg';
    loadMsg.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:Orbitron,monospace;font-size:14px;color:rgba(0,212,255,0.6);letter-spacing:4px;';
    loadMsg.textContent = 'INITIALIZING SECTOR...';
    canvas.appendChild(loadMsg);
  }

  // Fetch task data
  let data;
  try {
    let url = `/get_task/${GS.language}?mode=${GS.mode}&difficulty=${GS.difficulty}`;
    if (reqLevel !== null) url += `&level=${reqLevel}`;
    data = await apiFetch(url);
  } catch (e) {
    data = null;
  }

  if (!data || data.error || data.status === 'error') {
    // Fallback: use hardcoded words so game always starts
    data = {
      game_complete: false,
      id: 1,
      tip: 'SEC 1: DATA STREAMS',
      content: ['print', 'input', 'str', 'int', 'float', 'list', 'dict',
        'if', 'else', 'for', 'while', 'def', 'return', 'class'].map(w => ({ word: w, corrupt: Math.random() < 0.15 })),
      mode: GS.mode,
      is_boss: false
    };
  }

  if (data.game_complete) {
    _missionSuccess = true;
    _gameOver = true;
    goTo('screen-gameover');
    return;
  }

  GS.levelId = data.id || 1;
  GS.levelTip = data.tip || 'LEVEL ' + GS.levelId;
  GS.words = data.content || [];
  GS.isBoss = data.is_boss || false;
  GS.expectedOutput = data.expected_output || '';
  GS.levelConcept = data.concept || '';
  GS.concepts = data.concepts || [];

  if (lvlEl) lvlEl.textContent = 'LVL ' + GS.levelId;
  if (secEl) secEl.textContent = GS.levelTip;

  window.spawnWords(GS.words);

  // Update top HUD chips
  const ghoModeEl = document.getElementById('ghoMode');
  if (ghoModeEl) ghoModeEl.textContent = GS.mode === 'builder' ? 'BUILDER MODE' : 'CLASSIC MODE';

  try { await fetchMyScore(); } catch (e) { }
}

// ── SPAWN WORDS from backend array ────────────────────────────
// Backend sends: classic → [{word, corrupt}, ...]
//                builder → [{line, corrupt}, ...]
const KW_COLORS = {
  int: 'kw-datatype', float: 'kw-datatype', str: 'kw-datatype', char: 'kw-datatype',
  bool: 'kw-datatype', byte: 'kw-datatype', long: 'kw-datatype', double: 'kw-datatype',
  void: 'kw-datatype', short: 'kw-datatype',
  if: 'kw-control', elif: 'kw-control', else: 'kw-control', for: 'kw-control',
  while: 'kw-control', 'break': 'kw-control', continue: 'kw-control', switch: 'kw-control',
  case: 'kw-control', default: 'kw-control', do: 'kw-control',
  def: 'kw-structural', 'class': 'kw-structural', return: 'kw-structural',
  'new': 'kw-structural', this: 'kw-structural', 'static': 'kw-structural',
  'public': 'kw-structural', 'private': 'kw-structural', 'protected': 'kw-structural',
  'final': 'kw-structural', 'interface': 'kw-structural', 'extends': 'kw-structural',
  super: 'kw-structural', 'import': 'kw-structural', 'from': 'kw-structural',
  lambda: 'kw-structural', yield: 'kw-structural', 'global': 'kw-structural',
  print: 'kw-io', input: 'kw-io', printf: 'kw-io', scanf: 'kw-io', puts: 'kw-io', gets: 'kw-io',
  malloc: 'kw-memory', free: 'kw-memory', struct: 'kw-memory',
  'null': 'kw-memory', pointer: 'kw-memory', alloc: 'kw-memory',
  sizeof: 'kw-memory', calloc: 'kw-memory', realloc: 'kw-memory',
};

function spawnWords(contentArray, isLevelAdvance = false) {
  _isLevelSpawning = false;
  _levelCompleting = false;
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  canvas.querySelectorAll('.word-fall,.loading-msg').forEach(w => w.remove());

  // Unlock nav controls a short moment after words start falling
  setTimeout(() => {
    const hud = document.querySelector('.game-hud-overlay');
    if (hud) hud.classList.remove('game-nav-locked');
  }, 1200);

  const isBuilder = GS.mode === 'builder';

  // Code Builder entry fee: only charged on level advance (not game start at level 1)
  if (isBuilder && isLevelAdvance) {
    const feeAmount = 10 * (GS.levelId || 1);
    // Only deduct if the player has enough points to cover it
    if (GS.score >= feeAmount) {
      apiAddPoints(-feeAmount);
      setTimeout(() => showOutputToast(`ENTRY FEE: -${feeAmount} pts`, `Complete level for +200 to recover`), 300);
    }
  }

  const fallDist = 'calc(100vh - 180px)';  // fall to just above breach zone

  contentArray.forEach((item, i) => {
    // --- PARSE ITEM: support new dict format and legacy string/object format ---
    let display, target, hint, taskType, isCorrupt;

    if (typeof item === 'string') {
      // Legacy plain string (fallback / AI generator)
      display = item;
      target = item;
      hint = null;
      taskType = 'standard';
      isCorrupt = false;
    } else {
      // New backend dict format: { display, target, type, hint?, isCorrupt?, word, line, corrupt }
      display = item.display || item.word || item.line || String(item);
      target = item.target || display;
      hint = item.hint || null;
      taskType = item.type || 'standard';
      isCorrupt = item.isCorrupt === true || item.corrupt === true;
    }

    const el = document.createElement('div');
    el.className = 'word-fall';

    // --- Store datasets for matching and scoring ---
    el.dataset.display = display;         // what is rendered (may have ____)
    el.dataset.target = target;          // what the player must type (exact match)
    el.dataset.original = target;          // keep for backward-compat with legacy code paths
    el.dataset.text = target.toLowerCase(); // for classic prefix matching
    el.dataset.type = taskType;
    if (hint) el.dataset.hint = hint;

    // --- Render: display text + optional hint sub-label ---
    const displaySpan = document.createElement('span');
    displaySpan.className = 'word-display';
    displaySpan.textContent = display;
    el.appendChild(displaySpan);

    if (hint) {
      const hintSpan = document.createElement('span');
      hintSpan.className = 'word-hint';
      hintSpan.textContent = hint;
      el.appendChild(hintSpan);
    }

    // --- Corruption / color class ---
    if (isCorrupt) {
      el.classList.add('danger'); // red pulsing
    } else if (isBuilder) {
      el.classList.add('kw-builder');
    } else {
      const key = target.toLowerCase().replace(/[^a-z#_]/g, '');
      const col = KW_COLORS[key];
      if (col) el.classList.add(col);
    }

    // Extra class for sniper/debug so we can style differently if desired
    if (taskType === 'sniper') el.classList.add('task-sniper');
    if (taskType === 'debug') el.classList.add('task-debug');

    // --- Positioning / timing ---
    // Use display text length for overflow calc (it may be longer than target)
    const maxLeftRandom = Math.max(0, 85 - (display.length * 1.1));
    const leftPct = 5 + Math.random() * maxLeftRandom;
    const speedBoost = isBuilder ? 0 : Math.min(8, (GS.levelId - 1) * 1.5);
    const dur = isBuilder ? 90 : Math.max(3, 11 - speedBoost + Math.random() * 8);
    const delayReduce = isBuilder ? 0 : Math.min(0.7, (GS.levelId - 1) * 0.1);
    const delay = isBuilder ? (i * 6.5) : (i * Math.max(0.4, 1.1 - delayReduce) + Math.random() * 1.2);
    // Difficulty Multiplier: Pro mode is 25% faster falling (0.8x duration)
    const diffSpeedMult = (GS.difficulty === 'pro') ? 0.8 : 1.0;

    // Builder Speed Buff: 10% faster falling base in builder mode
    const builderSpeedMult = (isBuilder && GS.mode === 'builder') ? 0.85 : 1.0;

    const finalDur = (dur * builderSpeedMult * diffSpeedMult).toFixed(1);
    el.style.cssText = `left:${leftPct}%;--fall-dur:${finalDur}s;--fall-dist:${fallDist};animation-delay:${delay.toFixed(1)}s;`;
    canvas.appendChild(el);
  });
}

// ── TWINKLING STARSCAPE ── static stars that pulse in the game canvas background ──
(function initTwinkle() {
  const STAR_COUNT = 120;
  const twinkleStars = Array.from({ length: STAR_COUNT }, () => ({
    xPct: Math.random() * 100,          // % of canvas width
    yPct: Math.random() * 100,          // % of canvas height
    r: 0.5 + Math.random() * 1.4,      // radius px
    baseOpacity: 0.15 + Math.random() * 0.45,
    opacity: 0,
    phase: Math.random() * Math.PI * 2, // staggered starting phase
    speed: 0.008 + Math.random() * 0.018, // oscillation speed (radians / frame)
  }));

  let twinkleCanvas = null;
  let twinkleCtx = null;
  let twinkleRAF = null;

  function ensureTwinkleCanvas() {
    const gameCanvas = document.getElementById('gameCanvas');
    if (!gameCanvas) return false;
    if (twinkleCanvas && twinkleCanvas.parentNode === gameCanvas) return true;
    // Create and insert behind all game elements
    twinkleCanvas = document.createElement('canvas');
    twinkleCanvas.id = 'twinkleStars';
    twinkleCanvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:0;width:100%;height:100%;';
    gameCanvas.insertBefore(twinkleCanvas, gameCanvas.firstChild);
    twinkleCtx = twinkleCanvas.getContext('2d');
    return true;
  }

  function resizeTwinkle() {
    if (!twinkleCanvas) return;
    const gc = document.getElementById('gameCanvas');
    if (!gc) return;
    twinkleCanvas.width = gc.offsetWidth;
    twinkleCanvas.height = gc.offsetHeight;
  }

  function renderTwinkle() {
    const gameActive = document.getElementById('screen-game')?.classList.contains('active');
    if (!gameActive || gamePaused) {
      twinkleRAF = requestAnimationFrame(renderTwinkle);
      return;
    }
    if (!ensureTwinkleCanvas()) { twinkleRAF = requestAnimationFrame(renderTwinkle); return; }
    resizeTwinkle();
    const W = twinkleCanvas.width, H = twinkleCanvas.height;
    twinkleCtx.clearRect(0, 0, W, H);
    for (const s of twinkleStars) {
      s.phase += s.speed;
      s.opacity = s.baseOpacity * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(s.phase)));
      const x = (s.xPct / 100) * W;
      const y = (s.yPct / 100) * H;
      twinkleCtx.beginPath();
      twinkleCtx.arc(x, y, s.r, 0, Math.PI * 2);
      twinkleCtx.fillStyle = `rgba(180, 220, 255, ${s.opacity.toFixed(3)})`;
      twinkleCtx.fill();
    }
    twinkleRAF = requestAnimationFrame(renderTwinkle);
  }

  // Kick off once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderTwinkle);
  } else {
    renderTwinkle();
  }
  window.addEventListener('resize', resizeTwinkle);
})();

function spawnScorePopup(points, sourceEl = null) {
  if (localStorage.getItem('set-score-popups') === 'false') return;
  const canvas = document.getElementById('gameCanvas');
  const ship = document.getElementById('playerShip');
  if (!canvas || !ship) return;

  let x, y;
  if (sourceEl) {
    // Show popup exactly at the word's position
    const rect = sourceEl.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    x = rect.left - canvasRect.left + (rect.width / 2);
    y = rect.top - canvasRect.top;
  } else {
    // Fallback to ship position (for level bonuses etc)
    const rect = ship.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const jitterX = (Math.random() * 40) - 20;
    x = rect.left - canvasRect.left + (rect.width / 2) + jitterX;
    y = rect.top - canvasRect.top - 20;
  }

  const popup = document.createElement('div');
  popup.className = 'score-popup';
  if (points > 20) popup.classList.add('big-score');

  // If we have a source element, show the keyword alongside the points
  if (sourceEl) {
    const keyword = sourceEl.querySelector('.word-display')?.textContent || sourceEl.dataset.text || '';
    popup.textContent = `${keyword.toUpperCase()} +${points}`;
    popup.classList.add('keyword-popup');
  } else {
    popup.textContent = (points >= 0 ? '+' : '') + points;
  }

  popup.style.left = x + 'px';
  popup.style.top = y + 'px';
  if (points < 0) popup.style.color = '#ff4d6d';

  canvas.appendChild(popup);
  setTimeout(() => popup.remove(), 850);
}

// ── SUBMIT SCORE when word destroyed ──────────────────────────
window.apiAddPoints = async function (points, success = false, sourceEl = null) {
  GS.sessionScore += points;
  GS.score = Math.max(0, GS.score + points); // never go below 0

  // Trigger floating popup
  spawnScorePopup(points, sourceEl);

  const scoreEl = document.getElementById('gameScore');
  if (scoreEl) scoreEl.textContent = Math.max(0, GS.sessionScore);
  syncUI();

  const data = await apiFetch('/api/update_score', {
    method: 'POST',
    body: JSON.stringify({
      points,
      language: GS.language,
      mode: GS.mode,
      difficulty: GS.difficulty,
      success,
    }),
  });
  if (data && data.total_score !== undefined) {
    GS.totalScore = data.total_score;
    syncUI();
  }
}

// Points for destroying a word
function calcPoints(isDanger) {
  const base = GS.mode === 'builder' ? 15 : 10;
  let p = isDanger ? base * 2 : base;

  // Speed multiplier based on typing CPS
  const elapsedSecs = (Date.now() - (GS._startTime || Date.now())) / 1000;
  const cps = elapsedSecs > 1 ? (GS._keysHit || 0) / elapsedSecs : 0;
  let speedMult = 1;
  if (cps >= 6) speedMult = 3;
  else if (cps >= 4) speedMult = 2;
  else if (cps >= 2.5) speedMult = 1.5;

  p = Math.ceil(p * speedMult);

  // Combo multiplier: 5+ (2x), 10+ (3x), 20+ (5x)
  let mult = 1;
  const combo = GS._currentCombo || 0;
  if (combo >= 20) mult = 5;
  else if (combo >= 10) mult = 3;
  else if (combo >= 5) mult = 2;

  return p * mult;
}
// Pro deduction — called directly with -1
// apiAddPoints handles negative values fine (server caps at 1000 abs value)

// ── RESET PROGRESS ────────────────────────────────────────────
async function apiResetProgress() {
  if (!confirm('Reset all progress and scores for current mode/language?')) return;
  const data = await apiFetch('/reset_progress', {
    method: 'POST',
    body: JSON.stringify({
      mode: GS.mode,
      difficulty: GS.difficulty,
      language: GS.language,
    }),
  });
  if (data.status === 'success') {
    GS.score = 0; syncUI();
    await window.apiStartGame(GS.language);
  }
}

// ── MODE & DIFFICULTY SELECTORS ───────────────────────────────
// ── WIZARD NAVIGATION ─────────────────────────────────────────
function wizardShowStep(stepId) {
  document.querySelectorAll('.setup-step').forEach(s => s.classList.remove('active'));
  const step = document.getElementById(stepId);
  if (step) {
    // Re-trigger animation by removing and re-adding active
    step.style.animation = 'none';
    step.classList.add('active');
    requestAnimationFrame(() => { step.style.animation = ''; });
  }
  updateBreadcrumb(stepId);
}

function wizardBack(stepId) {
  wizardShowStep(stepId);
  playUI('close');
}

function wizardReset() {
  // Clear all selections and go back to step 1
  GS.mode = null;
  GS.difficulty = null;
  GS.language = null;
  document.querySelectorAll('.setup-card').forEach(c => c.classList.remove('selected'));
  wizardShowStep('step-mode');
}

function wizardSelectMode(mode) {
  GS.mode = mode;
  // Visual selection
  document.querySelectorAll('#step-mode .setup-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('card-' + mode)?.classList.add('selected');
  playUI('select');
  // Advance after brief delay so user sees the selection
  setTimeout(() => wizardShowStep('step-diff'), 350);
}

function wizardSelectDiff(diff) {
  GS.difficulty = diff;
  document.querySelectorAll('#step-diff .setup-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('card-' + diff)?.classList.add('selected');
  playUI('select');
  setTimeout(() => wizardShowStep('step-lang'), 350);
}

async function wizardSelectLang(lang) {
  GS.language = lang;
  document.querySelectorAll('#step-lang .setup-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('card-' + lang)?.classList.add('selected');
  playUI('confirm');
  // FIX 9: register mode/lang/diff on server before game starts
  await apiFetch('/start_game', {
    method: 'POST',
    body: JSON.stringify({ language: lang, mode: GS.mode, difficulty: GS.difficulty })
  });

  // Consolidate completed levels: check local storage first
  const key = `${lang}_${GS.mode}_${GS.difficulty}`;
  let completed = [];
  if (GS.completedLevels && GS.completedLevels[key]) {
    completed = [...GS.completedLevels[key]]; // copy to avoid mutation
  }

  // Also merge with server rank tier so progress isn't lost if playing on a new device
  if (GS.langBadges && GS.langBadges[lang]) {
    const tier = GS.langBadges[lang].tier;
    for (let i = 1; i <= tier; i++) {
      if (!completed.includes(i)) completed.push(i);
    }
  }

  // If player has completed levels in this combo, show level select step
  if (completed.length > 0) {
    console.log("⚡ ENGINE: wizardSelectLang -> completed.length > 0 -> wizardShowLevelSelect");
    setTimeout(() => wizardShowLevelSelect(lang, completed), 350);
  } else {
    console.log("⚡ ENGINE: wizardSelectLang -> completed.length == 0 -> window.apiStartGame");
    setTimeout(() => window.apiStartGame(lang), 400);
  }
}

function wizardShowLevelSelect(lang, completedIds) {
  const list = document.getElementById('levelList');
  const sub = document.getElementById('stepLevelSub');
  if (!list) return;

  const langName = { python: 'Python', java: 'Java', c: 'C-Lang' }[lang] || lang;
  const modeLabel = GS.mode === 'builder' ? 'Builder' : 'Classic';
  if (sub) sub.textContent = `${langName} · ${modeLabel} · ${GS.difficulty.toUpperCase()} — Cleared: ${completedIds.join(', ')}`;

  // Build level tiles — show LVL 1 through max completed + 1 (next)
  const maxUnlocked = Math.max(...completedIds) + 1;
  list.innerHTML = '';

  // "Start fresh" tile always first
  const freshTile = document.createElement('div');
  freshTile.className = 'level-tile level-tile-fresh';
  freshTile.innerHTML = `<div class="lt-icon">↺</div><div class="lt-label">Start from LVL 1</div><div class="lt-sub">Reset session score</div>`;
  freshTile.onclick = () => { GS.levelId = 1; window.apiStartGame(lang, 1); playUI('confirm'); };
  list.appendChild(freshTile);

  for (let i = 1; i <= maxUnlocked; i++) {
    const cleared = completedIds.includes(i);
    const isNext = i === maxUnlocked;
    // All levels 1 → maxUnlocked are accessible, not just explicitly cleared ones
    const isAccessible = i < maxUnlocked; // everything before the "next" tile is playable
    const tile = document.createElement('div');
    tile.className = `level-tile ${cleared ? 'level-tile-cleared' : ''} ${isNext ? 'level-tile-next' : ''}`;
    tile.innerHTML = `
      <div class="lt-icon" style="font-size:22px;">${cleared ? '↺' : isNext ? '▶' : i}</div>
      <div class="lt-label" style="font-size:14px;font-weight:700;">LVL ${i}</div>
      <div class="lt-sub" style="font-size:11px;letter-spacing:2px;">${cleared ? 'REPLAY' : isNext ? 'NEXT' : 'REPLAY'}</div>
    `;
    if (isAccessible || isNext) {
      tile.onclick = () => {
        GS.levelId = i;
        window.apiStartGame(lang, i);
        playUI('confirm');
      };
    } else {
      tile.style.opacity = '0.35';
      tile.style.cursor = 'not-allowed';
    }
    list.appendChild(tile);
  }

  wizardShowStep('step-level');
  playUI('open');
}

function updateBreadcrumb(activeStep) {
  const steps = ['step-mode', 'step-diff', 'step-lang', 'step-level'];
  const labels = { 'step-mode': 'MODE', 'step-diff': 'DIFFICULTY', 'step-lang': 'LANGUAGE', 'step-level': 'LEVEL' };
  const bar = document.getElementById('idleSectorInfo');
  if (!bar) return;
  const activeIdx = steps.indexOf(activeStep);
  let html = '';
  steps.forEach((s, i) => {
    let cls = i < activeIdx ? 'done' : (i === activeIdx ? 'active' : 'crumb');
    const val = i === 0 && GS.mode ? GS.mode.toUpperCase()
      : i === 1 && GS.difficulty ? GS.difficulty.toUpperCase()
        : i === 2 && GS.language ? `<i class="${GS.language === 'python' ? 'devicon-python-plain' : GS.language === 'java' ? 'devicon-java-plain' : 'devicon-c-plain'}"></i> ` + GS.language.toUpperCase()
          : labels[s];
    html += `<span class="crumb ${cls}">${val}</span>`;
    if (i < steps.length - 1) html += '<span class="crumb-sep">›</span>';
  });
  bar.innerHTML = html;
}

// Legacy stubs — keep so nothing breaks
function setMode(mode) { GS.mode = mode; }
function setDifficulty(diff) { GS.difficulty = diff; }

// ── OUTPUT VISUALIZER — per-line and full-level output map ─────────
// Keys are exact line text (lowercase trim) → partial output shown when typed
const LINE_OUTPUT_MAP = {
  // LVL 1 — Hello World
  'print("hello, world!")': { out: 'Hello, World!', note: 'print() runs immediately' },
  // LVL 2 — Variables
  'name = "alex"': { out: '← stores "Alex" in memory', note: 'variable assigned' },
  'print("hi " + name)': { out: 'Hi Alex', note: '+ joins two strings' },
  // LVL 3 — If/Else
  'x = 10': { out: '← x now holds 10', note: 'integer assigned' },
  'if x > 5:': { out: '✓ condition is TRUE (10 > 5)', note: 'block runs' },
  '    print("big")': { out: 'Big', note: 'indented = inside the if' },
  'else:': { out: '← skipped (if was true)', note: 'else is ignored' },
  '    print("small")': { out: '← not printed', note: 'else block skipped' },
  // LVL 4 — For Loop
  'for i in range(3):': { out: 'i = 0, 1, 2  (3 times)', note: 'range starts at 0' },
  '    print(i)': { out: '0\n1\n2', note: 'prints each i' },
  // LVL 5 — Function
  'def greet(name):': { out: '← function defined, not run yet', note: 'def just stores it' },
  '    return "hello, " + name': { out: '← returns "Hello, " + name', note: 'return sends value back' },
  'print(greet("riya"))': { out: 'Hello, Riya', note: 'function called, result printed' },
  // LVL 6 — List
  'nums = [1, 2, 3]': { out: '← list: [1, 2, 3]', note: '[ ] creates a list' },
  'for n in nums:': { out: 'n = 1, then 2, then 3', note: 'visits each item' },
  '    print(n * 2)': { out: '2\n4\n6', note: 'n * 2 doubles each value' },
};

function showOutputToast(output, note) {
  const toast = document.getElementById('outputToast');
  const content = document.getElementById('outputToastContent');
  const noteEl = document.getElementById('outputToastNote');
  if (!toast || !content) return;

  const displayEl = document.getElementById('consoleOutput') || content;
  displayEl.innerHTML = output.replace(/\n/g, '<br>');
  if (noteEl) {
    noteEl.textContent = note ? '◈ ' + note : '';
    noteEl.style.display = note ? '' : 'none';
  }
  toast.style.display = 'block';
  // Re-trigger animation
  toast.classList.remove('toast-visible');
  requestAnimationFrame(() => toast.classList.add('toast-visible'));

  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => { toast.style.display = 'none'; }, 350);
  }, 3800);
}

function showLineOutputToast(lineText) {
  if (GS.mode !== 'builder') return;
  const key = lineText.trim().toLowerCase().replace(/\s+/g, ' ');
  const data = LINE_OUTPUT_MAP[key];
  if (data) showOutputToast(data.out, data.note);
}
// ── LIVE CODE EXECUTION — typewriter animation into the Execution Terminal modal ──
// Opens the modal if not already open, then types the output char-by-char.
// Returns a Promise so callers can await completion.
let _ioModalFromButton = false;

function openIOModal(fromButton = false) {
  _ioModalFromButton = fromButton;

  const outputStr = GS.expectedOutput;
  if (!outputStr && !fromButton) {
    // If no output to show and auto-triggered, just go to gameover screen
    goTo('screen-gameover');
    return;
  }

  const modal = document.getElementById('execTerminalModal');
  if (modal) modal.classList.add('open');
  try { playUI('open'); } catch (e) { }

  const inputPane = document.getElementById('ioInputPane');
  const outputPane = document.getElementById('terminalOutputText');
  const noteEl = document.getElementById('execTerminalNote');

  if (!inputPane || !outputPane) return;

  inputPane.innerHTML = '';
  outputPane.innerHTML = '';
  if (noteEl) noteEl.textContent = '● Analysing code...';

  // Build INPUT pane
  if (GS.words && GS.words.length > 0) {
    GS.words.forEach((w, idx) => {
      const lineText = w.display || w.target || w;
      const lineDiv = document.createElement('div');
      lineDiv.className = 'io-code-line';
      lineDiv.dataset.lineid = idx;
      lineDiv.textContent = lineText;

      lineDiv.addEventListener('mouseenter', () => highlightIOLine(idx, true));
      lineDiv.addEventListener('mouseleave', () => highlightIOLine(idx, false));

      inputPane.appendChild(lineDiv);
    });
  }

  if (!outputStr) {
    if (noteEl) noteEl.textContent = '✓ Execution complete (no output)';
    return;
  }

  const rawText = outputStr.replace(/\\n/g, '\n');
  const outLines = rawText.split('\n');

  outLines.forEach((t, idx) => {
    const outDiv = document.createElement('div');
    outDiv.className = 'io-output-line';
    outDiv.dataset.lineid = idx;

    outDiv.addEventListener('mouseenter', () => highlightIOLine(idx, true));
    outDiv.addEventListener('mouseleave', () => highlightIOLine(idx, false));

    outputPane.appendChild(outDiv);
  });

  // Animate typing for output lines
  simulateExecTypewriter(outLines, outputPane, noteEl);
}

function highlightIOLine(idx, active) {
  document.querySelectorAll(`.io-code-line[data-lineid="${idx}"], .io-output-line[data-lineid="${idx}"]`).forEach(el => {
    if (active) el.classList.add('io-highlight');
    else el.classList.remove('io-highlight');
  });
}

function simulateExecTypewriter(lines, pane, noteEl) {
  let chars = [];
  lines.forEach((lineText, lIdx) => {
    const charsArr = lineText.split('');
    chars.push({ lIdx, chars: charsArr, target: pane.children[lIdx] });
  });

  let currentWordIdx = 0;
  let currentCharIdx = 0;

  function typeNext() {
    if (currentWordIdx >= chars.length) {
      if (noteEl) noteEl.textContent = '✓ Execution complete';
      return;
    }
    const currentLine = chars[currentWordIdx];
    if (currentCharIdx >= currentLine.chars.length) {
      currentWordIdx++;
      currentCharIdx = 0;
      setTimeout(typeNext, 28);
      return;
    }

    currentLine.target.textContent += currentLine.chars[currentCharIdx++];
    pane.scrollTop = pane.scrollHeight;
    setTimeout(typeNext, 28);
  }

  setTimeout(typeNext, 320);
}

function closeIOModal() {
  const modal = document.getElementById('execTerminalModal');
  if (modal) modal.classList.remove('open');
  try { playUI('click'); } catch (e) { }

  // If we came from the game loop automatically, proceed to victory screen
  if (!_ioModalFromButton && !_gameOver || _isLevelClear && !_ioModalFromButton) {
    setTimeout(() => goTo('screen-gameover'), 200);
  }
}

function openExecutionTerminal() {
  openIOModal(true);
}

async function retryMission() {
  GS.sessionScore = 0;
  GS._scoreAtGameover = undefined;
  _gameOver = false;
  _missionSuccess = false;
  _isLevelClear = false;
  _levelCompleting = false;
  lives = 3;
  await window.apiStartGame(GS.language, GS.levelId);
}

// ── LEADERBOARD — fetch all and render ────────────────────────
// ── LEADERBOARD — fetch all and render ────────────────────────
let lbFilters = { mode: 'classic', diff: 'normal', lang: 'python' };

async function openLB() {
  document.getElementById('lbModal').classList.add('open');
  closeAllDD();
  try { playUI('open'); } catch (e) { }

  // Always show global rank if available
  updateMyLBPos();

  // Reset to global tab by default
  switchLBTab('global');
}

function updateMyLBPos() {
  const el = document.getElementById('lbMyRankVal');
  if (!el) return;
  if (!GS.username) { el.textContent = 'NOT LOGGED IN'; return; }

  // Use existing GS.rank data if available, or just fetch it
  if (GS.rank && GS.rank.name) {
    el.innerHTML = `<span style="color:${GS.rank.color}">${GS.rank.icon} ${GS.rank.name.toUpperCase()}</span>`;
  } else {
    el.innerHTML = '<span style="color:#fff">#' + (GS.globalPos || '?') + '</span>';
    fetchMyRank().then(() => {
      if (GS.rank) el.innerHTML = `<span style="color:${GS.rank.color}">${GS.rank.icon} ${GS.rank.name.toUpperCase()}</span>`;
    });
  }
}

async function switchLBTab(tab) {
  // UI toggle
  document.getElementById('lbTabGlobal').classList.toggle('active', tab === 'global');
  document.getElementById('lbTabSpecific').classList.toggle('active', tab === 'specific');
  document.getElementById('lbPanelGlobal').classList.toggle('active', tab === 'global');
  document.getElementById('lbPanelSpecific').classList.toggle('active', tab === 'specific');

  if (tab === 'global') {
    const data = await apiFetch('/leaderboard_all');
    if (data && data.leaderboard) renderLeaderboard(data.leaderboard, 'lbGridGlobal');
    else renderLeaderboard([], 'lbGridGlobal');
  } else {
    fetchLBSpecific();
  }
}

async function setLBFilter(key, val) {
  lbFilters[key] = val;

  // UI update for filter buttons
  if (key === 'mode') {
    document.querySelectorAll('#lbFilterMode .lb-filter-btn').forEach(b =>
      b.classList.toggle('active', b.textContent.toLowerCase() === val));
  } else if (key === 'diff') {
    document.querySelectorAll('#lbFilterDiff .lb-filter-btn').forEach(b =>
      b.classList.toggle('active', b.textContent.toLowerCase() === val));
  }

  fetchLBSpecific();
}

async function fetchLBSpecific() {
  const { mode, diff, lang } = lbFilters;
  const grid = document.getElementById('lbGridSpecific');
  if (grid) grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;opacity:0.5">FILTERING DATA...</div>';

  const data = await apiFetch(`/leaderboard?mode=${mode}&difficulty=${diff}&lang=${lang}`);
  if (data && data.leaderboard) renderLeaderboard(data.leaderboard, 'lbGridSpecific');
  else renderLeaderboard([], 'lbGridSpecific');
}

function renderLeaderboard(rows, containerId) {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  grid.innerHTML = '';

  const langNames = { python: '🐍 Python', java: '☕ Java', c: '⚙ C-Lang' };

  if (!rows || rows.length === 0) {
    grid.innerHTML = '<div class="lb-empty" style="grid-column:1/-1;text-align:center;padding:40px;opacity:0.5">NO ENTRIES FOUND</div>';
    return;
  }

  rows.forEach((player, i) => {
    const gr = player.global_rank || { name: 'Recruit', color: '#4a6080', icon: '⬡' };
    const lb = player.lang_badges || {};
    const card = document.createElement('div');
    card.className = 'lb-lang';
    card.style.cssText = `border-color:${gr.color}33;`;
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-family:'Share Tech Mono',monospace;font-size:9px;color:rgba(0,212,255,0.5);letter-spacing:2px;">#${i + 1} ${player.points !== undefined ? '· ' + player.points + ' PTS' : ''}</span>
        <span style="font-family:'Orbitron',monospace;font-size:11px;font-weight:700;color:white;letter-spacing:2px;">${player.username}</span>
      </div>
      <div style="font-family:'Orbitron',monospace;font-size:13px;font-weight:900;color:${gr.color};letter-spacing:3px;margin-bottom:10px;text-shadow:0 0 12px ${gr.color}88;">${gr.icon} ${gr.name.toUpperCase()}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        ${['python', 'java', 'c'].map(lang => {
      const b = lb[lang] || { icon: '⬡', name: 'Recruit', color: '#4a6080' };
      return `<div style="font-family:'Share Tech Mono',monospace;font-size:9px;color:${b.color};padding:3px 7px;border:1px solid ${b.color}44;letter-spacing:1px;">${langNames[lang]}: ${b.icon} ${b.name}</div>`;
    }).join('')}
      </div>`;
    grid.appendChild(card);
  });
}

function closeLB() {
  document.getElementById('lbModal').classList.remove('open');
  try { playUI('close'); } catch (e) { }
}

// ── SESSION CHECK on load ─────────────────────────────────────
window.addEventListener('load', () => {
  // Existing avatar restore
  const saved = sessionStorage.getItem('playerAvatar');
  if (saved) {
    const myIcon = document.getElementById('myAvatarIcon');
    if (myIcon) myIcon.textContent = saved;
    const firstRosterAvatar = document.querySelector('.roster-avatar');
    if (firstRosterAvatar) firstRosterAvatar.textContent = saved;
  }
  // Check if user has an active server session
  checkSession();
});

// ═══════════════════════════════════════════════
//  LEADERBOARD MODAL TOGGLES (legacy)
// ═══════════════════════════════════════════════
document.querySelectorAll('.modal-tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.modal-tab').forEach(x => x.classList.remove('active')); t.classList.add('active');
}));
document.querySelectorAll('.modal-diff-btn').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.modal-diff-btn').forEach(x => x.classList.remove('active')); t.classList.add('active');
}));
document.querySelectorAll('.mode-tab').forEach(t => t.addEventListener('click', () => {
  const p = t.closest('.mode-section');
  p.querySelectorAll('.mode-tab').forEach(x => x.classList.remove('active'));
  t.classList.add('active');
}));
document.querySelectorAll('.diff-pill').forEach(t => t.addEventListener('click', () => {
  const p = t.closest('.diff-section');
  p.querySelectorAll('.diff-pill').forEach(x => x.classList.remove('active'));
  t.classList.add('active');
}));
window.apiAddPoints = apiAddPoints;

// Load settings from localStorage
document.addEventListener('DOMContentLoaded', () => {
  const vol = document.getElementById('set-master-vol');
  const err = document.getElementById('set-error-flash');
  const pts = document.getElementById('set-score-popups');

  if (vol) {
    if (localStorage.getItem('set-master-vol')) vol.value = localStorage.getItem('set-master-vol');
    vol.addEventListener('input', (e) => {
      localStorage.setItem('set-master-vol', e.target.value);
      masterVolume = (e.target.value) / 100;
    });
    if (vol.nextElementSibling) vol.nextElementSibling.textContent = vol.value;
    masterVolume = vol.value / 100;
  }

  if (err) {
    if (localStorage.getItem('set-error-flash') !== null) err.checked = localStorage.getItem('set-error-flash') === 'true';
    err.addEventListener('change', (e) => localStorage.setItem('set-error-flash', e.target.checked));
  }

  if (pts) {
    if (localStorage.getItem('set-score-popups') !== null) pts.checked = localStorage.getItem('set-score-popups') === 'true';
    pts.addEventListener('change', (e) => localStorage.setItem('set-score-popups', e.target.checked));
  }

  const uiSounds = document.getElementById('set-ui-sounds');
  if (uiSounds) {
    if (localStorage.getItem('set-ui-sounds') !== null) {
      uiSounds.checked = localStorage.getItem('set-ui-sounds') === 'true';
    }
    uiSounds.addEventListener('change', (e) => {
      localStorage.setItem('set-ui-sounds', e.target.checked);
    });
  }
});

