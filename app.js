/* ═══════════════════════════════════════
   APLOGY — app.js
   Section transitions, animations, interactions
   ═══════════════════════════════════════ */

let currentSection = 0;
const TOTAL = 9;

document.addEventListener('DOMContentLoaded', () => {
  showSection(0);
  setupNoDodge();
});

/* ── Navigation ── */
function showSection(index) {
  if (index < 0 || index >= TOTAL) return;

  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

  const target = document.getElementById('section-' + index);
  if (!target) return;

  // Small delay so the browser registers the class removal first
  requestAnimationFrame(() => {
    target.classList.add('active');
    currentSection = index;
    onSectionEnter(index);
  });
}

function nextSection() {
  showSection(currentSection + 1);
}

/* ── Section enter hooks ── */
function onSectionEnter(index) {
  switch (index) {
    case 1: revealLines('section-1'); break;
    case 2: revealLines('section-2'); break;
    case 3: revealRegrets(); break;
    case 4: revealFlowchart(); break;
    case 6: revealLines('section-6'); break;
    case 8: initGame(); break;
  }
}

/* ── Sequential line reveal ── */
function revealLines(sectionId) {
  const section = document.getElementById(sectionId);
  const lines = section.querySelectorAll('.reveal-line');
  const btn = section.querySelector('.next-btn');

  // Reset
  lines.forEach(l => l.classList.remove('shown'));
  if (btn) btn.classList.remove('visible');

  lines.forEach((line, i) => {
    setTimeout(() => line.classList.add('shown'), (i + 1) * 700);
  });

  if (btn) {
    setTimeout(() => btn.classList.add('visible'), (lines.length + 1) * 700 + 300);
  }
}

/* ── Regret list reveal ── */
function revealRegrets() {
  const items = document.querySelectorAll('#section-3 .regret-list li');
  const btn = document.querySelector('#section-3 .next-btn');

  items.forEach(li => li.classList.remove('shown'));
  if (btn) btn.classList.remove('visible');

  items.forEach((li, i) => {
    setTimeout(() => li.classList.add('shown'), (i + 1) * 500);
  });

  if (btn) {
    setTimeout(() => btn.classList.add('visible'), (items.length + 1) * 500 + 300);
  }
}

/* ── Flowchart reveal ── */
function revealFlowchart() {
  const nodes = document.querySelectorAll('#flowchart .flow-node, #flowchart .flow-arrow');
  const btn = document.querySelector('#section-4 .next-btn');

  nodes.forEach(n => n.classList.remove('shown'));
  if (btn) btn.classList.remove('visible');

  nodes.forEach((node, i) => {
    setTimeout(() => node.classList.add('shown'), (i + 1) * 450);
  });

  if (btn) {
    setTimeout(() => btn.classList.add('visible'), (nodes.length + 1) * 450 + 400);
  }
}

/* ── NO button dodge ── */
function setupNoDodge() {
  const btnNo = document.getElementById('btn-no');
  if (!btnNo) return;

  let dodgeCount = 0;

  function dodge(e) {
    e.preventDefault();
    e.stopPropagation();
    dodgeCount++;

    const wrap = document.getElementById('yesno-wrap');
    const wrapRect = wrap.getBoundingClientRect();
    const btnRect = btnNo.getBoundingClientRect();

    // Calculate available space
    const maxX = wrapRect.width - btnRect.width;
    const maxY = 100;

    // Pick a random offset
    const randX = Math.random() * maxX - maxX / 2;
    const randY = Math.random() * maxY;

    btnNo.style.position = 'relative';
    btnNo.style.left = randX + 'px';
    btnNo.style.top = -randY + 'px';

    // After a few dodges shrink it slightly
    if (dodgeCount > 3) {
      btnNo.style.fontSize = '13px';
      btnNo.style.padding = '8px 16px';
    }
    if (dodgeCount > 6) {
      btnNo.textContent = 'still no?';
    }
    if (dodgeCount > 9) {
      btnNo.textContent = '😤';
      btnNo.style.opacity = '0.5';
    }
  }

  // Desktop hover
  btnNo.addEventListener('mouseenter', dodge);
  // Mobile touch
  btnNo.addEventListener('touchstart', dodge, { passive: false });
}

/* ── YES handler ── */
function handleYes() {
  const question = document.getElementById('yesno-question');
  const message = document.getElementById('yes-message');

  question.style.transition = 'opacity 0.5s ease';
  question.style.opacity = '0';

  setTimeout(() => {
    question.style.display = 'none';
    message.classList.add('visible');
  }, 500);
}

/* ── Game init (called when section 8 enters) ── */
let gameInitialized = false;

function initGame() {
  if (gameInitialized) return;
  gameInitialized = true;

  // game.js will handle rendering into #game-root
  if (typeof renderTangerineRun === 'function') {
    renderTangerineRun();
  }
}

/* ── Utility: go back to section 0 (used by game exit) ── */
function goHome() {
  gameInitialized = false;
  showSection(0);
}
