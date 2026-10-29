// Decorative snowfall plus a burst of confetti on the reveal.
// Pure canvas, no dependencies, and it bows out entirely if the visitor has
// asked for reduced motion.

(function () {
  const canvas = document.getElementById('snow');
  if (!canvas) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    canvas.style.display = 'none';
    window.celebrate = () => {};
    return;
  }

  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let flakes = [];
  let confetti = [];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth = window.innerWidth;
    height = canvas.clientHeight = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.round((width * height) / 26000);
    flakes = Array.from({ length: count }, makeFlake);
  }

  function makeFlake() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.8 + Math.random() * 2.2,
      speed: 0.25 + Math.random() * 0.75,
      drift: (Math.random() - 0.5) * 0.4,
      phase: Math.random() * Math.PI * 2,
    };
  }

  const CONFETTI_COLORS = ['#e8c87a', '#d6455a', '#2f8f5b', '#f7f4ee', '#b3283b'];

  window.celebrate = function celebrate() {
    for (let i = 0; i < 140; i++) {
      confetti.push({
        x: width / 2 + (Math.random() - 0.5) * 120,
        y: height * 0.38,
        vx: (Math.random() - 0.5) * 11,
        vy: -6 - Math.random() * 9,
        size: 4 + Math.random() * 6,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
        color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
        life: 1,
      });
    }
  };

  function frame() {
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#ffffff';
    for (const f of flakes) {
      f.y += f.speed;
      f.phase += 0.012;
      f.x += f.drift + Math.sin(f.phase) * 0.35;

      if (f.y > height + 5) {
        f.y = -5;
        f.x = Math.random() * width;
      }
      if (f.x < -5) f.x = width + 5;
      if (f.x > width + 5) f.x = -5;

      ctx.globalAlpha = 0.35 + (f.r / 3) * 0.5;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (confetti.length) {
      for (const c of confetti) {
        c.vy += 0.32;
        c.vx *= 0.995;
        c.x += c.vx;
        c.y += c.vy;
        c.rot += c.spin;
        c.life -= 0.006;

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.globalAlpha = Math.max(0, c.life);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      confetti = confetti.filter((c) => c.life > 0 && c.y < height + 40);
    }

    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  frame();
})();
