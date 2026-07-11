function init3DEffects() {
  initHeroParallax();
  initTiltCards();
  initStatCounters();
  bindTiltCards(document.querySelectorAll(".tilt-card, .category-card"));
}

function initHeroParallax() {
  const hero = document.querySelector(".hero");
  const bg = document.querySelector(".hero-bg");
  if (!hero || !bg) return;

  window.addEventListener("scroll", () => {
    const rect = hero.getBoundingClientRect();
    if (rect.bottom > 0) {
      const offset = window.scrollY * 0.35;
      bg.style.transform = `scale(1.08) translateY(${offset}px)`;
    }
  });
}

function bindTiltCards(cards) {
  if (window.matchMedia("(hover: none)").matches) return;

  const maxTilt = 12;

  cards.forEach((card) => {
    if (card._tiltBound) return;
    card._tiltBound = true;

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${x * maxTilt}deg) rotateX(${-y * maxTilt}deg) translateZ(12px) scale(1.02)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

function initTiltCards() {
  bindTiltCards(document.querySelectorAll(".tilt-card, .category-card"));
}

function initStatCounters() {
  const stats = document.querySelectorAll(".stat strong");
  if (!stats.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const text = el.textContent.trim();
        const match = text.match(/^([\d.]+)(\+|★)?$/);
        if (!match) return;

        const target = parseFloat(match[1]);
        const suffix = match[2] || "";
        const isDecimal = match[1].includes(".");
        const duration = 1400;
        const start = performance.now();

        function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = target * eased;
          el.textContent = (isDecimal ? value.toFixed(1) : Math.floor(value)) + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
        observer.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );

  stats.forEach((s) => observer.observe(s));
}
