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

  function hideLoader() {
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
     Animated counters
  --------------------------------------------------- */
  const counters = document.querySelectorAll('[data-count]');
  function animateCounter(el) {
    const target = parseFloat(el.getAttribute('data-count'));
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = reduceMotion ? 1 : 1200;
    const startTime = performance.now();

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = `${prefix}${value}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window && counters.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => counterObserver.observe(el));
  } else {
    counters.forEach(animateCounter);
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
