(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  /* ---------------------------------------------------
     Loader
  --------------------------------------------------- */
  const loader = document.getElementById('loader');
  const MIN_LOAD_MS = reduceMotion ? 0 : 900;
  const MAX_LOAD_MS = 2000;
  const start = performance.now();

  /* Mede a largura real do texto (em px) pra máquina de escrever não
     cortar palavras — a unidade "ch" não bate com fontes proporcionais */
  function measureTypewriterWidths() {
    document.querySelectorAll('.fx-type').forEach((el) => {
      el.style.setProperty('--fx-full-width', `${el.scrollWidth}px`);
    });
  }

  function hideLoader() {
    measureTypewriterWidths();
    const elapsed = performance.now() - start;
    const wait = Math.min(Math.max(MIN_LOAD_MS - elapsed, 0), MAX_LOAD_MS);
    setTimeout(() => {
      loader && loader.classList.add('is-hidden');
      document.body.classList.add('is-loaded');
    }, wait);
  }

  if (document.readyState === 'complete') {
    hideLoader();
  } else {
    window.addEventListener('load', hideLoader);
    setTimeout(hideLoader, MAX_LOAD_MS);
  }

  /* ---------------------------------------------------
     Scroll reveal
  --------------------------------------------------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------------------------------------------------
     Nav: scrolled state + active section + progress
  --------------------------------------------------- */
  const siteNav = document.getElementById('siteNav');
  const navLinks = document.querySelectorAll('[data-nav-link]');
  const navLinksMobile = document.querySelectorAll('[data-nav-link-mobile]');
  const sections = Array.from(navLinks)
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  const navProgress = document.getElementById('navProgress');

  function setActiveLink(id) {
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
    });
    navLinksMobile.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveLink(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });

    sections.forEach((sec) => navObserver.observe(sec));
  }

  function updateNavOnScroll() {
    const scrollTop = window.scrollY;
    siteNav && siteNav.classList.toggle('is-scrolled', scrollTop > 8);

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (navProgress) navProgress.style.width = `${pct}%`;
  }
  window.addEventListener('scroll', updateNavOnScroll, { passive: true });
  updateNavOnScroll();

  /* ---------------------------------------------------
     Mobile nav (hamburger)
  --------------------------------------------------- */
  const navBurger = document.getElementById('navBurger');
  const navMobile = document.getElementById('navMobile');

  function closeMobileNav() {
    navBurger && navBurger.setAttribute('aria-expanded', 'false');
    navMobile && navMobile.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function toggleMobileNav() {
    const isOpen = navMobile && navMobile.classList.contains('is-open');
    if (isOpen) {
      closeMobileNav();
    } else {
      navBurger && navBurger.setAttribute('aria-expanded', 'true');
      navMobile && navMobile.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
  }

  navBurger && navBurger.addEventListener('click', toggleMobileNav);
  navLinksMobile.forEach((link) => link.addEventListener('click', closeMobileNav));

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileNav();
  });

  /* ---------------------------------------------------
     Nav links: embaralhar letras no hover
  --------------------------------------------------- */
  if (!isTouch && !reduceMotion) {
    const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    function scrambleText(span) {
      const original = span.dataset.text;
      if (span.dataset.scrambling === 'true') return;
      span.dataset.scrambling = 'true';
      const length = original.length;
      const totalFrames = 10;
      let frame = 0;

      const interval = setInterval(() => {
        let output = '';
        for (let i = 0; i < length; i++) {
          if (original[i] === ' ') { output += ' '; continue; }
          const revealAt = (i / length) * totalFrames + totalFrames * 0.4;
          output += frame >= revealAt ? original[i] : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
        span.textContent = output;
        frame++;
        if (frame > totalFrames) {
          clearInterval(interval);
          span.textContent = original;
          span.dataset.scrambling = 'false';
        }
      }, 35);
    }

    navLinks.forEach((link) => {
      const textNode = Array.from(link.childNodes).find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
      if (!textNode) return;
      const span = document.createElement('span');
      span.dataset.text = textNode.textContent.trim();
      span.textContent = span.dataset.text;
      link.replaceChild(span, textNode);
      link.addEventListener('mouseenter', () => scrambleText(span));
    });
  }

  /* ---------------------------------------------------
     Cursor glow
  --------------------------------------------------- */
  const cursorGlow = document.getElementById('cursorGlow');
  if (cursorGlow && !isTouch && !reduceMotion) {
    let raf = null;
    window.addEventListener('mousemove', (e) => {
      cursorGlow.classList.add('is-active');
      if (raf) return;
      raf = requestAnimationFrame(() => {
        cursorGlow.style.setProperty('--cx', `${e.clientX - 210}px`);
        cursorGlow.style.setProperty('--cy', `${e.clientY - 210}px`);
        raf = null;
      });
    });
    window.addEventListener('mouseleave', () => cursorGlow.classList.remove('is-active'));
  }

  /* ---------------------------------------------------
     Magnetic buttons
  --------------------------------------------------- */
  if (!isTouch && !reduceMotion) {
    document.querySelectorAll('.magnetic').forEach((btn) => {
      const strength = 0.25;
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * strength;
        const y = (e.clientY - rect.top - rect.height / 2) * strength;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ---------------------------------------------------
     Tilt cards
  --------------------------------------------------- */
  if (!isTouch && !reduceMotion) {
    document.querySelectorAll('.tilt-card').forEach((card) => {
      const maxTilt = 5;
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const rx = (0.5 - py) * maxTilt;
        const ry = (px - 0.5) * maxTilt;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ---------------------------------------------------
     Revelar por palavra
  --------------------------------------------------- */
  const splitEls = document.querySelectorAll('[data-split-reveal]');
  if (splitEls.length && !reduceMotion) {
    splitEls.forEach((el) => {
      const words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      words.forEach((word, i) => {
        const span = document.createElement('span');
        span.className = 'split-word';
        span.style.setProperty('--word-delay', `${i * 0.025}s`);
        span.textContent = word;
        el.appendChild(span);
        el.appendChild(document.createTextNode(' '));
      });
    });

    if ('IntersectionObserver' in window) {
      const splitObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-split-visible');
            splitObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      splitEls.forEach((el) => splitObserver.observe(el));
    } else {
      splitEls.forEach((el) => el.classList.add('is-split-visible'));
    }
  } else {
    splitEls.forEach((el) => el.classList.add('is-split-visible'));
  }

  /* ---------------------------------------------------
     Scroll-linked: título preenchendo + cartões empilhando
  --------------------------------------------------- */
  const fillTitles = Array.from(document.querySelectorAll('.section-title'));
  const stackCards = Array.from(document.querySelectorAll('#projects .case-card'));
  const processList = document.querySelector('.process-list');

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  function updateScrollEffects() {
    const vh = window.innerHeight;

    fillTitles.forEach((title) => {
      const rect = title.getBoundingClientRect();
      const progress = clamp01((vh * 0.85 - rect.top) / (rect.height + vh * 0.35));
      title.style.setProperty('--fill', `${(progress * 100).toFixed(1)}%`);
    });

    if (processList) {
      const rect = processList.getBoundingClientRect();
      const progress = clamp01((vh * 0.75 - rect.top) / rect.height);
      processList.style.setProperty('--timeline-fill', `${(progress * 100).toFixed(1)}%`);
    }

    if (stackCards.length && window.innerWidth >= 640) {
      stackCards.forEach((card, i) => {
        const next = stackCards[i + 1];
        if (!next) {
          card.style.filter = '';
          return;
        }
        const cardRect = card.getBoundingClientRect();
        const nextRect = next.getBoundingClientRect();
        const overlap = Math.max(0, cardRect.bottom - nextRect.top);
        const progress = clamp01(overlap / (cardRect.height * 0.7));
        card.style.filter = progress > 0.02
          ? `brightness(${(1 - progress * 0.4).toFixed(2)}) blur(${(progress * 1.5).toFixed(2)}px)`
          : '';
      });
    } else {
      stackCards.forEach((card) => { card.style.filter = ''; });
    }
  }

  if (!reduceMotion && (fillTitles.length || stackCards.length || processList)) {
    let scrollEffectsRaf = null;
    const onScrollEffects = () => {
      if (scrollEffectsRaf) return;
      scrollEffectsRaf = requestAnimationFrame(() => {
        updateScrollEffects();
        scrollEffectsRaf = null;
      });
    };
    window.addEventListener('scroll', onScrollEffects, { passive: true });
    window.addEventListener('resize', onScrollEffects);
    updateScrollEffects();
  }

  /* ---------------------------------------------------
     Esqueleto carregando: some quando a imagem do case chega
  --------------------------------------------------- */
  document.querySelectorAll('.case-shot').forEach((img) => {
    const markLoaded = () => {
      const visual = img.closest('.case-visual');
      if (visual) visual.classList.add('is-img-loaded');
    };
    if (img.complete) markLoaded();
    else img.addEventListener('load', markLoaded, { once: true });
  });

  /* ---------------------------------------------------
     Contador de números
  --------------------------------------------------- */
  const fxCounters = document.querySelectorAll('.fx-count');
  function animateFxCount(el) {
    const target = parseFloat(el.dataset.alvo);
    const casas = Number(el.dataset.casas || 0);
    const sufixo = el.dataset.sufixo || '';
    const duration = reduceMotion ? 1 : 1600;
    let startTime = null;

    function step(now) {
      if (startTime === null) startTime = now;
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = (target * eased).toFixed(casas) + sufixo;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window && fxCounters.length) {
    const fxCountObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateFxCount(entry.target);
          fxCountObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    fxCounters.forEach((el) => fxCountObserver.observe(el));
  } else {
    fxCounters.forEach(animateFxCount);
  }

  /* ---------------------------------------------------
     Projetos: imagem chega em faixas
  --------------------------------------------------- */
  const caseVisuals = document.querySelectorAll('.case-visual');
  if (caseVisuals.length && !reduceMotion && 'IntersectionObserver' in window) {
    const STRIP_COUNT = 5;
    const stripObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.querySelector('.case-strips').classList.add('is-out');
          stripObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    caseVisuals.forEach((visual) => {
      if (!visual.querySelector('.case-shot')) return;
      const strips = document.createElement('div');
      strips.className = 'case-strips';
      for (let i = 0; i < STRIP_COUNT; i++) {
        const strip = document.createElement('div');
        strip.className = 'case-strip';
        strip.style.transitionDelay = `${i * 0.05}s`;
        strips.appendChild(strip);
      }
      visual.appendChild(strips);
      stripObserver.observe(visual);
    });
  }

  /* ---------------------------------------------------
     Contato: texto de partículas
  --------------------------------------------------- */
  const particleCanvas = document.querySelector('.particle-heading');
  if (particleCanvas && isTouch) {
    particleCanvas.style.display = 'none';
  } else if (particleCanvas && !reduceMotion) {
    const pCtx = particleCanvas.getContext('2d');
    const pText = particleCanvas.dataset.text || '';
    const pMouse = { x: -999, y: -999 };
    let pPoints = [];
    let pRaf = null;

    function buildParticleText() {
      particleCanvas.width = particleCanvas.clientWidth;
      particleCanvas.height = particleCanvas.clientHeight;
      const off = document.createElement('canvas');
      off.width = particleCanvas.width;
      off.height = particleCanvas.height;
      const offCtx = off.getContext('2d');
      offCtx.fillStyle = '#fff';
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      const fontFamily = "'Fraunces', Georgia, serif";
      let size = Math.min(56, particleCanvas.width / 8);
      offCtx.font = `700 ${size}px ${fontFamily}`;
      while (offCtx.measureText(pText).width > particleCanvas.width * 0.9 && size > 12) {
        size -= 2;
        offCtx.font = `700 ${size}px ${fontFamily}`;
      }
      offCtx.fillText(pText, particleCanvas.width / 2, particleCanvas.height / 2);

      const data = offCtx.getImageData(0, 0, particleCanvas.width, particleCanvas.height).data;
      pPoints = [];
      const step = 3;
      for (let y = 0; y < particleCanvas.height; y += step) {
        for (let x = 0; x < particleCanvas.width; x += step) {
          if (data[(y * particleCanvas.width + x) * 4 + 3] > 128) {
            pPoints.push({
              ox: x, oy: y,
              x: Math.random() * particleCanvas.width,
              y: Math.random() * particleCanvas.height,
              vx: 0, vy: 0,
            });
          }
        }
      }
    }
    buildParticleText();
    window.addEventListener('resize', buildParticleText);

    particleCanvas.addEventListener('mousemove', (e) => {
      const r = particleCanvas.getBoundingClientRect();
      pMouse.x = e.clientX - r.left;
      pMouse.y = e.clientY - r.top;
    });
    particleCanvas.addEventListener('mouseleave', () => { pMouse.x = pMouse.y = -999; });

    function tickParticles() {
      pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
      pCtx.fillStyle = 'rgba(255,255,255,0.85)';
      pPoints.forEach((p) => {
        const dx = p.x - pMouse.x;
        const dy = p.y - pMouse.y;
        const d = Math.hypot(dx, dy);
        if (d < 60) {
          const f = (60 - d) / 60;
          p.vx += (dx / d) * f * 2.2;
          p.vy += (dy / d) * f * 2.2;
        }
        p.vx += (p.ox - p.x) * 0.09;
        p.vy += (p.oy - p.y) * 0.09;
        p.vx *= 0.8;
        p.vy *= 0.8;
        p.x += p.vx;
        p.y += p.vy;
        pCtx.fillRect(p.x, p.y, 1.8, 1.8);
      });
      pRaf = requestAnimationFrame(tickParticles);
    }

    if ('IntersectionObserver' in window) {
      const particleObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          if (!pRaf) tickParticles();
        } else if (pRaf) {
          cancelAnimationFrame(pRaf);
          pRaf = null;
        }
      }, { threshold: 0 });
      particleObserver.observe(particleCanvas);
    } else {
      tickParticles();
    }
  }

  /* ---------------------------------------------------
     Confete
  --------------------------------------------------- */
  const confettiCanvas = document.getElementById('confettiCanvas');
  function fireConfetti() {
    if (!confettiCanvas || reduceMotion) return;
    const ctx = confettiCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    confettiCanvas.width = window.innerWidth * dpr;
    confettiCanvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = ['#FFFFFF', '#D4D4D4', '#A3A3A3', '#8A8A8A'];
    const particles = Array.from({ length: 90 }, () => ({
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.65,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 14 - 6,
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      life: 1,
    }));

    const gravity = 0.35;
    function tick() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      let alive = false;
      particles.forEach((p) => {
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vr;
        p.life -= 0.012;
        if (p.life > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(p.life, 0);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        }
      });
      if (alive) {
        requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    }
    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------
     FAQ accordion
  --------------------------------------------------- */
  document.querySelectorAll('.faq-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';
      document.querySelectorAll('.faq-trigger').forEach((t) => t.setAttribute('aria-expanded', 'false'));
      trigger.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  /* ---------------------------------------------------
     Contact form → redireciona para o WhatsApp com a mensagem pronta
  --------------------------------------------------- */
  const form = document.getElementById('contactForm');
  const WHATSAPP_NUMBER = '5573999844036';

  /* ---------------------------------------------------
     Custom select (tipo de projeto)
  --------------------------------------------------- */
  const customSelect = document.getElementById('projectField');
  if (customSelect) {
    const trigger = document.getElementById('projectTrigger');
    const menu = customSelect.querySelector('.custom-select-menu');
    const valueEl = trigger.querySelector('.custom-select-value');
    const nativeSelect = document.getElementById('project');
    const options = Array.from(menu.querySelectorAll('li'));
    let activeIndex = -1;

    function closeMenu() {
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    }

    function openMenu() {
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      const selected = options.findIndex((li) => li.getAttribute('aria-selected') === 'true');
      setActive(selected >= 0 ? selected : 0);
    }

    function setActive(index) {
      options.forEach((li) => li.classList.remove('is-active'));
      activeIndex = index;
      if (options[activeIndex]) {
        options[activeIndex].classList.add('is-active');
        options[activeIndex].scrollIntoView({ block: 'nearest' });
      }
    }

    function selectOption(li) {
      options.forEach((opt) => opt.setAttribute('aria-selected', 'false'));
      li.setAttribute('aria-selected', 'true');
      valueEl.textContent = li.dataset.value;
      valueEl.removeAttribute('data-is-placeholder');
      nativeSelect.value = li.dataset.value;
      nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      const errorEl = document.getElementById('project-error');
      if (errorEl && errorEl.textContent) {
        errorEl.textContent = '';
        customSelect.classList.remove('has-error');
      }
      closeMenu();
      trigger.focus();
    }

    trigger.addEventListener('click', () => {
      if (menu.hidden) openMenu(); else closeMenu();
    });

    options.forEach((li) => {
      li.addEventListener('click', () => selectOption(li));
      li.addEventListener('mouseenter', () => setActive(options.indexOf(li)));
    });

    trigger.addEventListener('keydown', (e) => {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Escape'].includes(e.key)) e.preventDefault();
      if (e.key === 'ArrowDown') { if (menu.hidden) { openMenu(); } else { setActive(Math.min(activeIndex + 1, options.length - 1)); } }
      else if (e.key === 'ArrowUp') { if (menu.hidden) { openMenu(); } else { setActive(Math.max(activeIndex - 1, 0)); } }
      else if (e.key === 'Enter' || e.key === ' ') { if (menu.hidden) { openMenu(); } else if (options[activeIndex]) { selectOption(options[activeIndex]); } }
      else if (e.key === 'Escape') { closeMenu(); }
    });

    document.addEventListener('click', (e) => {
      if (!customSelect.contains(e.target)) closeMenu();
    });
  }

  function clearFieldErrors() {
    form.querySelectorAll('.field-error').forEach((el) => { el.textContent = ''; });
    form.querySelectorAll('.form-field').forEach((el) => el.classList.remove('has-error'));
  }

  function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (errorEl) errorEl.textContent = message;
    if (field) field.closest('.form-field').classList.add('has-error');
  }

  function validateForm() {
    clearFieldErrors();
    let valid = true;

    const name = form.name.value.trim();
    const project = form.project.value;
    const message = form.message.value.trim();

    if (name.length < 2) {
      showFieldError('name', 'Digite seu nome completo.');
      valid = false;
    }
    if (!project) {
      showFieldError('project', 'Selecione o tipo de projeto.');
      valid = false;
    }
    if (message.length < 10) {
      showFieldError('message', 'Conte um pouco mais sobre o projeto (mínimo 10 caracteres).');
      valid = false;
    }

    return valid;
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validateForm()) return;

      const name = form.name.value.trim();
      const project = form.project.value;
      const message = form.message.value.trim();

      const text = `Olá! Meu nome é ${name}.\nTipo de projeto: ${project}\n\n${message}`;
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

      fireConfetti();
      window.open(url, '_blank', 'noopener');
    });

    form.querySelectorAll('input, textarea').forEach((field) => {
      field.addEventListener('input', () => {
        const errorEl = document.getElementById(`${field.id}-error`);
        if (errorEl && errorEl.textContent) {
          errorEl.textContent = '';
          field.closest('.form-field').classList.remove('has-error');
        }
      });
    });
  }
})();
