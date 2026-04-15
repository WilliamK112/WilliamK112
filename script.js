(function setupThemeToggle() {
  const body = document.body;
  const toggle = document.querySelector('[data-theme-toggle]');
  if (!body || !toggle) return;

  const storageKey = 'portfolio-theme';
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const saved = window.localStorage.getItem(storageKey);
  const initialTheme = saved || (prefersLight ? 'light' : 'dark');

  function applyTheme(theme) {
    body.dataset.theme = theme;
    const isLight = theme === 'light';
    toggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
    toggle.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
    toggle.textContent = isLight ? '🌙 Dark' : '☀️ Light';
  }

  applyTheme(initialTheme);

  toggle.addEventListener('click', () => {
    const nextTheme = body.dataset.theme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
  });
})();

(function setupEntryMaskIntro() {
  const intro = document.querySelector('[data-entry-intro]');
  if (!intro) return;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    intro.remove();
    return;
  }

  // Keep intro simple: fade out in 0.5s.
  const holdMs = 900;
  const fadeMs = 500;

  window.setTimeout(() => {
    intro.classList.add('is-end');
  }, holdMs);

  window.setTimeout(() => {
    if (document.body.contains(intro)) intro.remove();
  }, holdMs + fadeMs + 40);
})();

(function setupLanguageToggle() {
  const toggle = document.querySelector('[data-lang-toggle]');
  if (!toggle) return;

  const storageKey = 'portfolio-language';
  const saved = window.localStorage.getItem(storageKey);
  const initialLang = saved || 'en';

  const translations = {
    en: {
      heroEyebrow: 'Portfolio',
      heroName: 'Ching-Wei Kang',
      heroRole: 'Software Engineer',
      heroLead: 'UW-Madison CS + Data Science student building AI products, backend systems, and developer tooling. I turn prototypes into product-grade demos across full-stack apps, automation pipelines, and computer vision workflows.',
      heroSignal1: 'Now Shipping: Badminton AI Tracking',
      heroSignal2: 'Focus: AI Engineering + Systems',
      heroSignal3: 'Open to 2026 SWE/AI Internships',
      ctaResume: 'Resume PDF',
      ctaEmail: 'Copy Email',
      ctaGithub: 'View GitHub',
      ctaLinkedIn: 'LinkedIn',
      ctaBook: 'Book 30-Min Intro',
      ctaMore: 'More General Work',
      snapshotTitle: 'Snapshot',
      snapshotEducationLabel: 'Education',
      snapshotEducationValue: 'Junior, BS CS + Data Science Double Major (2027)',
      snapshotFocusLabel: 'Focus',
      snapshotFocusValue: 'AI Engineering · Backend Systems · Data Pipelines · Product Delivery',
      snapshotTechLabel: 'Tech',
      snapshotTechValue: 'TypeScript · Python · Node.js',
      snapshotAuthLabel: 'Work Auth (US)',
      snapshotAuthValue: 'Yes',
      snapshotSponsorLabel: 'Sponsorship',
      snapshotSponsorValue: 'Yes (future)',
      educationTitle: 'Education',
      educationDesc: 'Studied <span class="keyword-highlight">Data Science</span> at <span class="keyword-highlight">George Washington University</span> (2023–2024), then transferred to <span class="keyword-highlight">the University of Wisconsin–Madison</span> (2025–2027), where I am pursuing a <span class="keyword-highlight">BS double major in Computer Science and Data Science</span>. <span class="keyword-highlight">GPA: 3.91</span>. <span class="keyword-highlight">Expected graduation: May 2027</span>.',
      statsProjects: 'Featured Projects',
      statsExperience: 'Months Experience',
      experienceTitle: 'Experience and Focus',
      exp1Title: 'Full-Stack and AI',
      exp1Desc: 'Led full-stack delivery with Next.js/TypeScript/Node.js/PostgreSQL as project lead. Built AI-assisted document processing workflows and LLM-integrated product features.',
      exp2Title: 'Data Pipelines',
      exp2Desc: 'Built Python data ingestion pipelines (BeautifulSoup/Requests/Pandas) and processed 50,000+ records.',
      exp3Title: 'Open-Source Tooling',
      exp3Desc: 'Shipping practical AI + developer tools. Local LLM usability, benchmarking, and product-focused engineering.',
      workTitle: 'Work Experience',
      workNotePrefix: '5 roles across data, research, and operations (Jun 2024 - Aug 2025). Source:',
      workNoteLink: 'LinkedIn',
      projectsTitle: 'Projects',
      projectsMore: 'Show More Projects',
      projectsNote: 'Selected projects focused on AI tooling, practical product delivery, and deployable engineering.',
      certificatesTitle: 'Certificates',
      certificatesMore: 'Next Page',
      certificatesNote: 'Latest certificates are shown first. Source of truth is LinkedIn, and older certificates can be paged through.',
      contactTitle: 'Contact',
      contactEmail: 'Copy Email',
      contactResume: 'Resume PDF',
      contactLinkedIn: 'LinkedIn',
      messageTitle: 'Leave a Message',
      messageDesc: 'Open to software engineering internships and project collaboration—send a quick message and I’ll follow up.',
      formEmailLabel: 'Your Email',
      formEmailPlaceholder: 'you@example.com',
      formMessageLabel: 'Message',
      formMessagePlaceholder: 'Write your message...',
      formSend: 'Send',
      meetingTitle: 'Schedule a Meeting',
      meetingDesc: 'Book a 30-minute meeting directly on my calendar.',
      meetingBtn: 'Schedule Meeting'
    },
    zh: {
      heroEyebrow: '个人作品集',
      heroName: '康景威',
      heroRole: '软件工程师',
      heroLead: '我就读于威斯康星大学麦迪逊分校，主修计算机科学与数据科学，主要方向是 AI 产品、后端系统与开发者工具。我擅长把原型快速推进到可展示、可使用的工程化成果。',
      heroSignal1: '当前重点：羽毛球 AI 追踪系统',
      heroSignal2: '方向：AI 工程与系统能力',
      heroSignal3: '正在寻找 2026 软件 / AI 工程实习',
      ctaResume: '查看简历 PDF',
      ctaEmail: '复制邮箱',
      ctaGithub: '查看 GitHub',
      ctaLinkedIn: '领英主页',
      ctaBook: '预约 30 分钟交流',
      ctaMore: '更多作品',
      snapshotTitle: '速览',
      snapshotEducationLabel: '教育背景',
      snapshotEducationValue: '威斯康星大学麦迪逊分校大三，计算机科学 + 数据科学双专业（2027）',
      snapshotFocusLabel: '技术方向',
      snapshotFocusValue: 'AI 工程 · 后端系统 · 数据流水线 · 产品交付',
      snapshotTechLabel: '核心技术',
      snapshotTechValue: 'TypeScript · Python · Node.js',
      snapshotAuthLabel: '美国工作授权',
      snapshotAuthValue: '有',
      snapshotSponsorLabel: '未来签证支持',
      snapshotSponsorValue: '需要（未来）',
      educationTitle: '教育背景',
      educationDesc: '2023–2024 年就读于<span class="keyword-highlight">乔治·华盛顿大学</span>，学习<span class="keyword-highlight">数据科学</span>；2025–2027 年转学至<span class="keyword-highlight">威斯康星大学麦迪逊分校</span>，攻读<span class="keyword-highlight">计算机科学与数据科学双专业</span>。<span class="keyword-highlight">GPA：3.91</span>，<span class="keyword-highlight">预计 2027 年 5 月毕业</span>。',
      statsProjects: '重点项目',
      statsExperience: '相关经验（月）',
      experienceTitle: '经历与技术重点',
      exp1Title: '全栈开发与 AI',
      exp1Desc: '曾以项目负责人身份推进 Next.js / TypeScript / Node.js / PostgreSQL 的全栈交付，并落地 AI 文档处理流程与 LLM 集成产品功能。',
      exp2Title: '数据流水线',
      exp2Desc: '使用 BeautifulSoup、Requests 与 Pandas 构建 Python 数据采集流程，累计处理超过 50,000 条记录。',
      exp3Title: '开源工具与工程产品化',
      exp3Desc: '持续打造实用型 AI 与开发者工具，聚焦本地 LLM 可用性、评测能力与面向产品的工程落地。',
      workTitle: '工作经历',
      workNotePrefix: '共 5 段数据、研究与运营相关经历（2024 年 6 月 - 2025 年 8 月）。来源：',
      workNoteLink: 'LinkedIn',
      projectsTitle: '项目',
      projectsMore: '查看更多项目',
      projectsNote: '精选项目聚焦于 AI 工具、真实产品交付能力，以及可部署的工程实践。',
      certificatesTitle: '证书',
      certificatesMore: '下一页',
      certificatesNote: '默认优先展示最新证书，信息来源以 LinkedIn 为准，旧证书可翻页查看。',
      contactTitle: '联系我',
      contactEmail: '复制邮箱',
      contactResume: '简历 PDF',
      contactLinkedIn: '领英主页',
      messageTitle: '给我留言',
      messageDesc: '我目前开放软件工程实习与项目合作机会，欢迎留下信息，我会尽快回复。',
      formEmailLabel: '你的邮箱',
      formEmailPlaceholder: 'you@example.com',
      formMessageLabel: '留言内容',
      formMessagePlaceholder: '写下你想说的话...',
      formSend: '发送',
      meetingTitle: '预约交流',
      meetingDesc: '你可以直接在我的日程中预约一场 30 分钟的交流。',
      meetingBtn: '预约会议'
    }
  };

  function applyLanguage(lang) {
    const dict = translations[lang] || translations.en;
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.getAttribute('data-i18n');
      if (!key || !(key in dict)) return;
      node.innerHTML = dict[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
      const key = node.getAttribute('data-i18n-placeholder');
      if (!key || !(key in dict)) return;
      node.setAttribute('placeholder', dict[key]);
    });
    const isZh = lang === 'zh';
    toggle.setAttribute('aria-pressed', isZh ? 'true' : 'false');
    toggle.setAttribute('aria-label', isZh ? 'Switch to English' : 'Switch to Chinese');
    toggle.textContent = isZh ? 'EN' : '中文';
  }

  applyLanguage(initialLang);

  toggle.addEventListener('click', () => {
    const next = document.documentElement.lang === 'zh-CN' ? 'en' : 'zh';
    applyLanguage(next);
    window.localStorage.setItem(storageKey, next);
  });
})();

// Minimal JS to integrate small accessibility tweaks.
(function optimizeTabOrder() {
  const skip = document.querySelector('.skip-link');
  const hero = document.querySelector('.hero');
  if (skip && hero) hero.tabIndex = -1;
})();

(function setupHeroSceneSequence() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia && window.matchMedia('(max-width: 700px)').matches;

  const stagedSelectors = [
    '.eyebrow',
    '.hero-heading',
    '.lead',
    '.signal-bar',
    '.hero-visuals',
    '.hero-cta'
  ];

  stagedSelectors.forEach((selector, index) => {
    const node = hero.querySelector(selector);
    if (!node) return;
    node.setAttribute('data-scene-seq', '');
    node.style.setProperty('--scene-delay', `${index * 90}ms`);
  });

  if (prefersReduced) {
    hero.classList.add('hero-ready');
    hero.style.setProperty('--hero-progress', '0');
    return;
  }

  requestAnimationFrame(() => {
    hero.classList.add('hero-ready');
  });

  let rafId = 0;
  function updateHeroProgress() {
    rafId = 0;
    const rect = hero.getBoundingClientRect();
    const travel = Math.max(rect.height * 0.95, 420);
    const progress = Math.min(Math.max((0 - rect.top) / travel, 0), 1);
    const effectiveProgress = isMobile ? Math.min(progress, 0.62) : progress;
    const titleShift = isMobile ? effectiveProgress * -8 : effectiveProgress * -18;
    const scale = isMobile ? 1 : (1 - effectiveProgress * 0.035);

    hero.style.setProperty('--hero-progress', effectiveProgress.toFixed(4));
    hero.style.setProperty('--hero-title-shift', `${titleShift.toFixed(2)}px`);
    hero.style.setProperty('--hero-overlay-opacity', (effectiveProgress * 0.22).toFixed(4));
    hero.style.setProperty('--hero-text-dim', (1 - (effectiveProgress * (isMobile ? 0.32 : 0.5))).toFixed(4));
    hero.style.setProperty('--hero-scale', scale.toFixed(4));
  }

  function requestUpdate() {
    if (rafId) return;
    rafId = requestAnimationFrame(updateHeroProgress);
  }

  updateHeroProgress();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
})();

(function setupSectionScrollReveal() {
  const sections = Array.from(document.querySelectorAll('main > section'))
    .filter((section) => section.id !== 'hero');
  if (!sections.length) return;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || !('IntersectionObserver' in window)) {
    sections.forEach((section) => {
      section.setAttribute('data-scroll-reveal', '');
      section.classList.add('is-visible');
    });
    return;
  }

  sections.forEach((section, index) => {
    section.setAttribute('data-scroll-reveal', '');
    section.style.transitionDelay = `${Math.min(index * 45, 180)}ms`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -10% 0px' });

  sections.forEach((section) => observer.observe(section));
})();

(function setupProjectCardReveal() {
  const cards = Array.from(document.querySelectorAll('[data-project-grid] .project-card'));
  if (!cards.length) return;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || !('IntersectionObserver' in window)) {
    cards.forEach((card) => {
      card.setAttribute('data-project-reveal', '');
      card.classList.add('is-visible');
    });
    return;
  }

  cards.forEach((card, index) => {
    card.setAttribute('data-project-reveal', '');
    card.style.setProperty('--project-delay', `${(index % 3) * 45}ms`);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

  cards.forEach((card) => observer.observe(card));
})();

(function setupMessageFormSubmit() {
  const form = document.querySelector('.message-form');
  const status = document.getElementById('form-status');
  if (!form || !status) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = 'Sending...';
    status.className = 'form-status';

    const emailInput = document.getElementById('sender-email');
    const messageInput = document.getElementById('sender-message');
    const email = emailInput && 'value' in emailInput ? emailInput.value.trim() : '';
    const message = messageInput && 'value' in messageInput ? messageInput.value.trim() : '';

    if (!email || !message) {
      status.textContent = 'Please enter both your email and message.';
      status.className = 'form-status error';
      return;
    }

    try {
      const response = await fetch('https://formsubmit.co/ajax/ckang53@wisc.edu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email,
          message,
          _subject: 'New portfolio message',
          _captcha: 'false',
          _template: 'table',
        }),
      });

      if (!response.ok) throw new Error('Request failed');

      form.reset();
      status.textContent = 'Message sent. Thank you!';
      status.className = 'form-status success';
    } catch (error) {
      status.textContent = 'Send failed. Please try again in a moment.';
      status.className = 'form-status error';
    }
  });
})();

(function setupFlipCards() {
  const flipCards = document.querySelectorAll('[data-flip-card]');
  if (!flipCards.length) return;

  flipCards.forEach((card) => {
    card.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('a')) return;
      const isFlipped = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', isFlipped ? 'true' : 'false');
    });
  });
})();

(function setupCopyEmailButtons() {
  const buttons = document.querySelectorAll('[data-copy-email]');
  if (!buttons.length) return;

  buttons.forEach((button) => {
    const originalText = button.textContent || 'Copy Email';
    button.addEventListener('click', async () => {
      const email = button.getAttribute('data-copy-email');
      if (!email) return;

      try {
        await navigator.clipboard.writeText(email);
        button.textContent = document.documentElement.lang === 'zh-CN' ? '已复制邮箱' : 'Copied Email';
        button.classList.add('copied');
        window.setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('copied');
        }, 1600);
      } catch (error) {
        button.textContent = email;
        button.classList.add('copied');
        window.setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('copied');
        }, 2200);
      }
    });
  });
})();

(function setupProjectShowMore() {
  const grid = document.querySelector('[data-project-grid]');
  const btn = document.querySelector('[data-project-more]');
  const indicator = document.querySelector('[data-project-indicator]');
  if (!grid || !btn) return;

  const cards = Array.from(grid.querySelectorAll('.project-card'));
  const pageSize = 6;
  const total = cards.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  let currentPage = 0;
  let isAnimating = false;

  function visibleCardsForPage(page) {
    const start = page * pageSize;
    const end = start + pageSize;
    return cards.map((card, idx) => ({ card, show: idx >= start && idx < end }));
  }

  function applyPage(page, animateIn = false) {
    const map = visibleCardsForPage(page);
    map.forEach(({ card, show }, i) => {
      card.classList.remove('is-out', 'is-in');
      card.style.display = show ? '' : 'none';
      if (show && animateIn) {
        card.style.animationDelay = `${i * 40}ms`;
        card.classList.add('is-in');
      }
    });

    const start = page * pageSize;
    const end = Math.min(start + pageSize, total);
    if (indicator) indicator.textContent = `Showing ${total ? start + 1 : 0}-${end} / ${total}`;

    if (totalPages <= 1) {
      btn.textContent = 'All Projects Shown';
      btn.disabled = true;
    } else {
      btn.textContent = page === totalPages - 1 ? 'Back to First 6' : 'Show More Projects';
      btn.disabled = false;
    }
  }

  btn.addEventListener('click', () => {
    if (totalPages <= 1 || isAnimating) return;
    isAnimating = true;

    const lockedY = window.scrollY;
    const currentlyVisible = cards.filter((c) => c.style.display !== 'none');
    currentlyVisible.forEach((card, i) => {
      card.classList.remove('is-in');
      card.style.animationDelay = `${i * 35}ms`;
      card.classList.add('is-out');
    });

    window.setTimeout(() => {
      currentPage = (currentPage + 1) % totalPages;
      applyPage(currentPage, true);
      requestAnimationFrame(() => window.scrollTo({ top: lockedY, left: 0, behavior: 'auto' }));

      window.setTimeout(() => {
        cards.forEach((c) => {
          c.classList.remove('is-in');
          c.style.animationDelay = '0ms';
        });
        requestAnimationFrame(() => window.scrollTo({ top: lockedY, left: 0, behavior: 'auto' }));
        isAnimating = false;
      }, 520);
    }, 460);
  });

  applyPage(0, false);
})();

(function setupCertificatePagination() {
  const grid = document.querySelector('[data-certificate-grid]');
  const btn = document.querySelector('[data-certificate-more]');
  const indicator = document.querySelector('[data-certificate-indicator]');
  if (!grid || !btn) return;

  const cards = Array.from(grid.querySelectorAll('[data-certificate-card]'));
  const pageSize = 3;
  const total = cards.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  let currentPage = 0;

  function applyPage(page) {
    const start = page * pageSize;
    const end = start + pageSize;

    cards.forEach((card, idx) => {
      card.style.display = idx >= start && idx < end ? '' : 'none';
    });

    if (indicator) indicator.textContent = `Showing ${total ? start + 1 : 0}-${Math.min(end, total)} / ${total}`;
    btn.disabled = totalPages <= 1;
    if (totalPages <= 1) {
      btn.textContent = document.documentElement.lang === 'zh-CN' ? '已显示全部' : 'All Certificates Shown';
    } else {
      btn.textContent = document.documentElement.lang === 'zh-CN' ? '下一页' : 'Next Page';
    }
  }

  btn.addEventListener('click', () => {
    if (totalPages <= 1) return;
    currentPage = (currentPage + 1) % totalPages;
    applyPage(currentPage);
  });

  applyPage(0);
})();
