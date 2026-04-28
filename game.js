/* ═══════════════════════════════════════
   TANGERINE RUN — React Game Component
   Uses React.createElement (no JSX / no Babel)
   ═══════════════════════════════════════ */

const { useState, useEffect, useRef, useCallback } = React;
const h = React.createElement;

// ── Constants ──
const CANVAS_W = 340;
const CANVAS_H = 480;
const BASKET_W = 60;
const BASKET_H = 20;
const ITEM_SIZE = 28;
const SPAWN_INITIAL = 1200;
const SPAWN_MIN = 400;
const SPEED_INITIAL = 2.2;
const SPEED_INCREMENT = 0.15;
const DIFFICULTY_INTERVAL = 8000;

// ── Item types ──
const ITEMS = {
  ORANGE:  { emoji: '🍊', type: 'good', points: 1 },
  GREEN:   { emoji: '🟢', type: 'bad' },
  GOLDEN:  { emoji: '🌟', type: 'golden', points: 5 },
};

function TangerineRun() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const animRef = useRef(null);
  const [screen, setScreen] = useState('start'); // start | playing | over
  const [finalScore, setFinalScore] = useState(0);
  const [hudScore, setHudScore] = useState(0);
  const [hudLives, setHudLives] = useState(3);
  const [hudCombo, setHudCombo] = useState(0);
  const [hudMultiplier, setHudMultiplier] = useState(1);

  // ── Initialize game state ──
  function createGameState() {
    return {
      basket: { x: CANVAS_W / 2 - BASKET_W / 2 },
      items: [],
      score: 0,
      lives: 3,
      combo: 0,
      multiplier: 1,
      lastSpawn: 0,
      spawnInterval: SPAWN_INITIAL,
      fallSpeed: SPEED_INITIAL,
      lastDifficulty: 0,
      startTime: performance.now(),
      touching: false,
      touchX: CANVAS_W / 2,
    };
  }

  // ── Start game ──
  function startGame() {
    gameRef.current = createGameState();
    setHudScore(0);
    setHudLives(3);
    setHudCombo(0);
    setHudMultiplier(1);
    setScreen('playing');
  }

  // ── Game loop ──
  useEffect(() => {
    if (screen !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let lastTime = performance.now();

    function loop(now) {
      const g = gameRef.current;
      if (!g || g.lives <= 0) return;

      const dt = now - lastTime;
      lastTime = now;

      // Difficulty ramp
      const elapsed = now - g.startTime;
      if (elapsed - g.lastDifficulty > DIFFICULTY_INTERVAL) {
        g.lastDifficulty = elapsed;
        g.fallSpeed += SPEED_INCREMENT;
        g.spawnInterval = Math.max(SPAWN_MIN, g.spawnInterval - 60);
      }

      // Spawn items
      if (now - g.lastSpawn > g.spawnInterval) {
        g.lastSpawn = now;
        spawnItem(g);
      }

      // Move basket toward touch/mouse
      if (g.touching) {
        const target = g.touchX - BASKET_W / 2;
        g.basket.x += (target - g.basket.x) * 0.25;
        g.basket.x = Math.max(0, Math.min(CANVAS_W - BASKET_W, g.basket.x));
      }

      // Update items
      updateItems(g);

      // Draw
      draw(ctx, g);

      // Update HUD (throttled)
      setHudScore(g.score);
      setHudLives(g.lives);
      setHudCombo(g.combo);
      setHudMultiplier(g.multiplier);

      if (g.lives > 0) {
        animRef.current = requestAnimationFrame(loop);
      } else {
        setFinalScore(g.score);
        setScreen('over');
      }
    }

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [screen]);

  // ── Spawn ──
  function spawnItem(g) {
    const rand = Math.random();
    let itemDef;
    if (rand < 0.05) {
      itemDef = ITEMS.GOLDEN;
    } else if (rand < 0.28) {
      itemDef = ITEMS.GREEN;
    } else {
      itemDef = ITEMS.ORANGE;
    }

    g.items.push({
      x: Math.random() * (CANVAS_W - ITEM_SIZE),
      y: -ITEM_SIZE,
      ...itemDef,
    });
  }

  // ── Update ──
  function updateItems(g) {
    const basketTop = CANVAS_H - BASKET_H - 10;
    const toRemove = [];

    for (let i = 0; i < g.items.length; i++) {
      const item = g.items[i];
      item.y += g.fallSpeed;

      // Check catch
      if (
        item.y + ITEM_SIZE >= basketTop &&
        item.y + ITEM_SIZE <= basketTop + BASKET_H + 8 &&
        item.x + ITEM_SIZE > g.basket.x &&
        item.x < g.basket.x + BASKET_W
      ) {
        if (item.type === 'good' || item.type === 'golden') {
          const pts = item.points * g.multiplier;
          g.score += pts;
          g.combo++;
          if (g.combo >= 3 && g.combo % 3 === 0) {
            g.multiplier = Math.min(5, Math.floor(g.combo / 3) + 1);
          }
        } else {
          g.lives--;
          g.combo = 0;
          g.multiplier = 1;
        }
        toRemove.push(i);
        continue;
      }

      // Off screen
      if (item.y > CANVAS_H + 10) {
        // Missing a good/golden item loses a life
        if (item.type === 'good' || item.type === 'golden') {
          g.lives--;
          g.combo = 0;
          g.multiplier = 1;
        }
        toRemove.push(i);
      }
    }

    // Remove caught/missed items (reverse order)
    for (let i = toRemove.length - 1; i >= 0; i--) {
      g.items.splice(toRemove[i], 1);
    }
  }

  // ── Draw ──
  function draw(ctx, g) {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background subtle grid
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_W; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
    }
    for (let y = 0; y < CANVAS_H; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
    }

    // Items
    ctx.font = ITEM_SIZE + 'px serif';
    ctx.textBaseline = 'top';
    for (const item of g.items) {
      ctx.fillText(item.emoji, item.x, item.y);
    }

    // Basket
    const bx = g.basket.x;
    const by = CANVAS_H - BASKET_H - 10;

    ctx.fillStyle = '#FF6A00';
    ctx.fillRect(bx, by, BASKET_W, BASKET_H);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, BASKET_W, BASKET_H);

    // Basket label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🍊', bx + BASKET_W / 2, by + BASKET_H / 2);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'top';
  }

  // ── Touch / Mouse handlers ──
  function getCanvasX(e) {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    if (e.touches && e.touches.length > 0) {
      return (e.touches[0].clientX - rect.left) * scaleX;
    }
    return (e.clientX - rect.left) * scaleX;
  }

  function onPointerDown(e) {
    e.preventDefault();
    const g = gameRef.current;
    if (!g) return;
    g.touching = true;
    g.touchX = getCanvasX(e);
  }

  function onPointerMove(e) {
    e.preventDefault();
    const g = gameRef.current;
    if (!g || !g.touching) return;
    g.touchX = getCanvasX(e);
  }

  function onPointerUp() {
    const g = gameRef.current;
    if (g) g.touching = false;
  }

  // Keyboard
  useEffect(() => {
    if (screen !== 'playing') return;

    function onKey(e) {
      const g = gameRef.current;
      if (!g) return;
      const step = 18;
      if (e.key === 'ArrowLeft') {
        g.basket.x = Math.max(0, g.basket.x - step);
      } else if (e.key === 'ArrowRight') {
        g.basket.x = Math.min(CANVAS_W - BASKET_W, g.basket.x + step);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen]);

  // ── Render ──
  // ── Skip game helper ──
  function skipGame() {
    cancelAnimationFrame(animRef.current);
    setFinalScore(hudScore);
    setScreen('over');
  }

  if (screen === 'start') {
    return h('div', { className: 'game-container' },
      h('div', { className: 'game-start' },
        h('span', { className: 'tag' }, '— a little game'),
        h('h2', null, 'Tangerine Run 🍊'),
        h('p', null, 'Catch the oranges. Dodge the green ones.'),
        h('p', null, 'Miss an orange and you lose a life!'),
        h('p', null, 'Swipe or use arrow keys to move.'),
        h('div', { className: 'btn-row', style: { marginTop: '16px' } },
          h('button', { className: 'btn', onClick: startGame }, 'start game'),
          h('button', { className: 'btn btn--outline btn--small', onClick: skipGame }, 'skip game')
        )
      )
    );
  }

  if (screen === 'over') {
    return h('div', { className: 'game-container' },
      h('div', { className: 'game-over' },
        h('h2', null, 'Score: ' + finalScore),
        h('p', null, 'Not every moment is sweet.'),
        h('p', null, "But I'm learning"),
        h('p', null, 'to choose better ones.'),
        h('p', { className: 'delulu' },
          "let's make all couples at family functions jealous and all our delulus come tru inshallah 🤲"
        ),
        h('div', { className: 'btn-row' },
          h('button', { className: 'btn', onClick: startGame }, 'play again'),
          h('button', { className: 'btn btn--outline', onClick: function() { goHome(); } }, 'exit')
        )
      )
    );
  }

  // Playing
  return h('div', { className: 'game-container' },
    h('div', { className: 'game-hud' },
      h('span', null, '🍊 ' + hudScore),
      hudCombo >= 3
        ? h('span', { className: 'combo' }, 'x' + hudMultiplier + ' COMBO')
        : null,
      h('span', null, '❤️'.repeat(Math.max(0, hudLives)))
    ),
    h('canvas', {
      ref: canvasRef,
      className: 'game-canvas',
      width: CANVAS_W,
      height: CANVAS_H,
      style: { width: '100%', maxWidth: CANVAS_W + 'px' },
      onMouseDown: onPointerDown,
      onMouseMove: onPointerMove,
      onMouseUp: onPointerUp,
      onMouseLeave: onPointerUp,
      onTouchStart: onPointerDown,
      onTouchMove: onPointerMove,
      onTouchEnd: onPointerUp,
    }),
    h('button', {
      className: 'btn btn--outline btn--small',
      style: { marginTop: '12px', fontSize: '12px' },
      onClick: skipGame
    }, 'skip game')
  );
}

// ── Mount ──
function renderTangerineRun() {
  const root = document.getElementById('game-root');
  if (root) {
    ReactDOM.createRoot(root).render(h(TangerineRun));
  }
}
