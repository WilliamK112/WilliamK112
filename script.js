(function setupPortfolioI18n() {
  const body = document.body;
  const toggle = document.querySelector('[data-theme-toggle]');
  if (!body || !toggle) return;

  const storageKey = 'portfolio-theme';
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const saved = window.localStorage.getItem(storageKey);
  const initialTheme = saved || (prefersLight ? 'light' : 'dark');

  function applyTheme(theme) {
    const getText = window.__portfolioI18n && typeof window.__portfolioI18n.getText === 'function'
      ? window.__portfolioI18n.getText
      : null;
    const isLight = theme === 'light';
    const lightLabel = getText ? getText('themeLight') : '☀️ Light';
    const darkLabel = getText ? getText('themeDark') : '🌙 Dark';
    const ariaToDark = getText ? getText('themeAriaToDark') : 'Switch to dark mode';
    const ariaToLight = getText ? getText('themeAriaToLight') : 'Switch to light mode';

    body.dataset.theme = theme;
    toggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
    toggle.setAttribute('aria-label', isLight ? ariaToDark : ariaToLight);
    toggle.textContent = isLight ? darkLabel : lightLabel;
  }

  applyTheme(initialTheme);

  toggle.addEventListener('click', () => {
    const nextTheme = body.dataset.theme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
  });

  window.__portfolioTheme = {
    applyTheme
  };

  window.addEventListener('portfolio-language-changed', () => {
    applyTheme(body.dataset.theme);
  });
})();

(function setupSignalField() {
  const canvas = document.getElementById('portfolio-signal-field');
  const cursor = document.querySelector('[data-cursor-light]');
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  if (!canvas || !ctx) return;

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = {
    x: window.innerWidth * 0.58,
    y: window.innerHeight * 0.34,
    active: false
  };
  let nodes = [];
  let dpr = 1;
  let width = 0;
  let height = 0;
  let colors = {
    node: '132, 238, 255',
    link: '142, 167, 255',
    pointer: '137, 247, 209'
  };

  function cssValue(name, fallback) {
    const value = window.getComputedStyle(document.body).getPropertyValue(name).trim();
    return value || fallback;
  }

  function refreshColors() {
    colors = {
      node: cssValue('--signal-node-rgb', '132, 238, 255'),
      link: cssValue('--signal-link-rgb', '142, 167, 255'),
      pointer: cssValue('--signal-pointer-rgb', '137, 247, 209')
    };
  }

  function resize() {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(104, Math.max(44, Math.floor((width * height) / 18500)));
    nodes = Array.from({ length: count }, (_, index) => ({
      x: (index * 149 + (index % 7) * 23) % width,
      y: (index * 83 + (index % 5) * 37) % height,
      vx: ((index % 5) - 2) * 0.11,
      vy: (((index + 2) % 7) - 3) * 0.08,
      r: 1.1 + (index % 4) * 0.34
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';

    nodes.forEach((node, index) => {
      if (!reduceMotion) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < -20) node.x = width + 20;
        if (node.x > width + 20) node.x = -20;
        if (node.y < -20) node.y = height + 20;
        if (node.y > height + 20) node.y = -20;
      }

      const pointerDistance = Math.hypot(node.x - pointer.x, node.y - pointer.y);
      const glow = Math.max(0, 1 - pointerDistance / 260);

      ctx.beginPath();
      ctx.fillStyle = `rgba(${colors.node}, ${0.14 + glow * 0.42})`;
      ctx.arc(node.x, node.y, node.r + glow * 1.8, 0, Math.PI * 2);
      ctx.fill();

      for (let otherIndex = index + 1; otherIndex < nodes.length; otherIndex += 1) {
        const other = nodes[otherIndex];
        const span = Math.hypot(node.x - other.x, node.y - other.y);
        if (span < 136) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${colors.link}, ${(1 - span / 136) * 0.13})`;
          ctx.lineWidth = 1;
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      }
    });

    if (pointer.active) {
      nodes.forEach((node) => {
        const span = Math.hypot(node.x - pointer.x, node.y - pointer.y);
        if (span < 214) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${colors.pointer}, ${(1 - span / 214) * 0.34})`;
          ctx.lineWidth = 1.15;
          ctx.moveTo(pointer.x, pointer.y);
          ctx.lineTo(node.x, node.y);
          ctx.stroke();
        }
      });
    }

    ctx.globalCompositeOperation = 'source-over';
    if (!reduceMotion) window.requestAnimationFrame(draw);
  }

  window.addEventListener('pointermove', (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
    document.body.classList.add('is-pointer-active');
    if (cursor) {
      cursor.style.transform = `translate3d(${event.clientX - 140}px, ${event.clientY - 140}px, 0)`;
    }
  }, { passive: true });

  window.addEventListener('pointerleave', () => {
    pointer.active = false;
    document.body.classList.remove('is-pointer-active');
  }, { passive: true });

  window.addEventListener('resize', () => {
    resize();
    if (reduceMotion) draw();
  }, { passive: true });

  new MutationObserver(() => {
    refreshColors();
    if (reduceMotion) draw();
  }).observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

  refreshColors();
  resize();
  draw();
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

  const en = {};
  document.querySelectorAll('[data-i18n], [data-i18n-placeholder]').forEach((node) => {
    if (node.hasAttribute('data-i18n')) {
      const key = node.getAttribute('data-i18n');
      if (key && en[key] === undefined) {
        en[key] = node.innerHTML;
      }
    }

    if (node.hasAttribute('data-i18n-placeholder')) {
      const key = node.getAttribute('data-i18n-placeholder');
      if (key && en[key] === undefined) {
        en[key] = node.getAttribute('placeholder') || '';
      }
    }
  });
  Object.assign(en, {
    langAriaToEnglish: 'Switch to English',
    langAriaToChinese: 'Switch to Chinese',
    themeDark: '🌙 Dark',
    themeAriaToDark: 'Switch to dark mode',
    themeAriaToLight: 'Switch to light mode',
    projectGitHub: 'GitHub'
  });

  const translations = {
    en,
    zh: {
      skipLinkText: '跳转到主要内容',
      themeLight: '☀️ 浅色',
      themeDark: '🌙 深色',
      themeAriaToDark: '切换到深色模式',
      themeAriaToLight: '切换到浅色模式',
      langButtonText: 'EN',
      langAriaToEnglish: '切换到英文',
      langAriaToChinese: '切换到中文',
      brandName: '康景威',
      navAbout: '关于',
      navWork: '工作',
      navProjects: '项目',
      navCertificates: '证书',
      navContact: '联系',
      topGitHub: 'GitHub',
      topLinkedIn: '领英',
      topDevpost: 'Devpost',
      heroEyebrow: '作品集',
      heroName: '康景威',
      heroRole: '软件工程师',
      heroLead: '威斯康星大学麦迪逊分校计算机科学与数据科学学生，专注软件工程、数据系统与应用机器学习。我将原型打磨成可靠的全栈工具、自动化流水线和计算机视觉工作流。',
      heroSignal1: '当前重点：羽毛球 AI 追踪',
      heroSignal2: '方向：AI 工程 + 系统',
      heroSignal3: '正在开放 2026 SWE/AI 实习机会',
      flipHint: '点击翻转',
      profileSnapshotTitle: '个人速览',
      profileName: '康景威（William）',
      profileSchool: '威斯康星大学麦迪逊 · 大三',
      profileDegree: '计算机科学 + 数据科学（双学位）',
      profileGraduation: '预计毕业：2027 年 5 月',
      profileGpa: 'GPA：3.91',
      profileFocus: '方向：AI、后端与数据系统',
      profileMiniTagSchool: '威斯康星大学麦迪逊 · 2027',
      profileMiniTagGpa: 'GPA：3.91',
      profileMiniInstagram: 'Instagram：@williamkangcw',
      uwMiniTitle: '威斯康星大学麦迪逊 CS 优势',
      uwMiniStanding: '我目前是威斯康星大学麦迪逊分校的大三本科生。',
      uwRankOverall: '全校第16名 CS',
      uwRankPublic: '公立大学第9名 CS',
      uwRankSystems: '系统方向第6名',
      uwRankLanguages: '编程语言方向第15名',
      uwRankAI: '人工智能方向第23名',
      uwPointSystems: '具备扎实的系统深度与研究导向。',
      uwPointExecution: '通过严谨的 CS 训练实现高质量工程执行。',
      uwSource: 'U.S. News + UW CS + CSRankings（UW 来源）',
      ctaResume: '简历 PDF',
      ctaEmail: '复制邮箱',
      ctaGithub: '查看 GitHub',
      ctaLinkedIn: '领英',
      ctaDevpost: 'Devpost',
      ctaBook: '预约 30 分钟交流',
      ctaMore: '更多作品',
      snapshotTitle: '速览',
      snapshotEducationLabel: '教育',
      snapshotEducationValue: '大三，计算机科学 + 数据科学双学位（2027）',
      snapshotFocusLabel: '方向',
      snapshotFocusValue: 'AI 工程 · 后端系统 · 数据流水线 · 产品交付',
      snapshotTechLabel: '技术',
      snapshotTechValue: 'TypeScript/JavaScript · Python · React/Next.js · Node/FastAPI · PostgreSQL/Redis · PyTorch/OpenCV · Docker/GitHub Actions/AWS',
      snapshotAuthLabel: '美国工作授权',
      snapshotAuthValue: '有',
      snapshotSponsorLabel: '签证支持',
      snapshotSponsorValue: '未来有',
      educationTitle: '教育背景',
      educationDesc: '在 <span class="keyword-highlight">乔治·华盛顿大学</span>（2023–2024）学习 <span class="keyword-highlight">数据科学</span>，随后于 2025–2027 年转入 <span class="keyword-highlight">威斯康星大学麦迪逊分校</span>，攻读 <span class="keyword-highlight">计算机科学与数据科学双学位</span>。<span class="keyword-highlight">GPA：3.91</span>。<span class="keyword-highlight">预计 2027 年 5 月毕业</span>。',
      statsProjects: '重点项目',
      statsExperience: '经验年限',
      workTitle: '工作经历',
      workNotePrefix: '共 6 段经历：数据、研究、运营与全栈工程方向（2024 年 6 月 - 至今）。来源：',
      workNoteLink: 'LinkedIn',
      work1Title: '全栈工程实习生 · Global AI（Global API Inc.）',
      work1Period: '2026 年 5 月 - 至今 · 纽约，美国',
      work1Desc: '在纽约参与 AI 与平台工程开发，独立交付从 Next.js/TypeScript 前端到 Node.js + FastAPI 后端、PostgreSQL 与 Redis 的端到端特性；构建安全角色体系、可观测性与数据监控能力，并通过 GitHub Actions 落地每周发布的 CI/CD 流程。',
      work2Title: '维修技师 · 威斯康星大学麦迪逊',
      work2Period: '2025 年 5 月 - 2025 年 8 月 · 3 个月 · 麦迪逊，美国',
      work3Title: '研究助理 · 中国科学技术协会',
      work3Period: '2024 年 12 月 - 2025 年 2 月 · 2 个月',
      work3Desc: '参与研究国家级关键技术人才配置机制的项目，支持数据采集、政策对比分析与研究报告编写。',
      work4Title: '数据采集与录入 · Marcus Harris Foundation',
      work4Period: '2024 年 10 月 - 2024 年 12 月 · 2 个月 · 美国',
      work4Desc: '使用 Python 自动化 IRS 非营利组织数据采集流程，并将大量数据整理进结构化奖学金数据库。',
      work5Title: '数据分析与自动化实习生 · Springer Capital',
      work5Period: '2024 年 8 月 - 2024 年 10 月 · 2 个月 · 芝加哥，美国',
      work5Desc: '通过 Excel、SQL 与 Python 进行数据采集与分析，利用自动化与可视化报告推进流程改进。',
      work6Title: '数据分析师 · Chihuo Inc',
      work6Period: '2024 年 6 月 - 2024 年 9 月 · 3 个月',
      work6Desc: '开展北美亚洲美食市场研究，结合 Python 与 Excel 输出数据驱动洞察。',
      openSourceTitle: '开源 PR',
      openSourceNote: '已核验的 merged PR，覆盖 GitHub、Docker、Microsoft、NVIDIA、Meta 工具链与开发者基础设施等成熟开源项目。每个链接都指向确定合并的 pull request。',
      openSourceMerged: '已核验 merged PR',
      openSourceActive: '不放 pending 链接',
      openSourceWorkflow: '真实 maintainer 评审 + CI 流程',
      openSourceMore: '查看更多 PR',
      projectsTitle: '项目',
      projectTechLabel: '技术：',
      projectImpactLabel: '影响：',
      project1Tech: 'Gemini Live、多模态语音交互、动态视觉。',
      project1Impact: '交付了一个生产风格的实时叙事演示，支持回合制玩法与实时 AI 回答。',
      project1Date: '最后更新：2026-03-16 16:44 UTC',
      project2Tech: 'AI 文档分析、流程自动化、租户工具。',
      project2Impact: '将租赁审核与检查报告流程转化为更快、可用性更高的租房工作流。',
      project2Date: '最后更新：2026-03-10 08:50 UTC',
      project3Subtitle: 'AI 辅助的团体餐厅发现',
      project3Tech: 'Next.js、React、Python、FastAPI、Google Gemini、Google Maps。',
      project3Impact: '构建 AI 餐厅发现产品，将小组偏好、位置与自然语言输入转化为可解释推荐。',
      project3Date: '最后更新：2026-04-11',
      project4Tech: '多智能体编排、桌面工作流、研究工具。',
      project4Impact: '支持实际研究和写作任务，构建了超越单一提示词演示的协同智能体流水线。',
      project4Date: '最后更新：2026-03-14 07:55 UTC',
      project5Tech: 'Python、计算机视觉、球员追踪、姿态叠加、羽毛球回收。',
      project5Impact: '产出稳定的双人羽毛球可视化展示，并生成可用于演示的比赛分析结果。',
      project5Date: '最后更新：2026-03-27',
      project6Subtitle: 'DreamerV3 vs PPO 在 NES Mario 上的对比测试，优先选择右侧通关路径',
      project6Tech: 'Python、强化学习、DreamerV3、PPO、实验诊断。',
      project6Impact: '对 Super Mario Bros 1-1 进行两种 RL 方法基准测试，完整记录工程过程，并发布 PPO 基线，能以右侧更优通关路径清关。',
      project6Date: '最后更新：2026-04-27 08:33 UTC',
      project6BestRun: '最佳演示 MP4',
      project7Subtitle: '实时神经信号可视化 MVP',
      project7Tech: 'Python、Streamlit、实时信号流水线、交互式可视化。',
      project7Impact: '构建端到端脑机接口 MVP，用于采集、检查与展示神经信号，用于应用机器学习原型。',
      project7Date: '最后更新：2026-04',
      project8Tech: 'LLM tracing、延迟日志、成本分析。',
      project8Impact: '通过失败、延迟和成本可见性，降低实验排障难度并便于优化。',
      project8Date: '最后更新：2026-03-16 15:33 UTC',
      project9Tech: '本地 LLM 资源匹配、指令生成。',
      project9Impact: '帮助用户将设备资源约束快速映射为可运行模型与命令选择。',
      project9Date: '最后更新：2026-03-18 04:22 UTC',
      project10Subtitle: 'AI 助手 + 纸上交易运营仪表盘',
      project10Tech: '评测、经济追踪、运营面板。',
      project10Impact: '将 AI 助手协作与 paper-trading 运营整合到一个面向生产的界面。',
      project10Date: '最后更新：2026-03-19 10:10 UTC',
      projectsIndicator: '显示 {{start}}-{{end}} / {{total}}',
      projectsMore: '查看更多项目',
      projectsBack: '返回前 6 个',
      projectsAllShown: '全部项目已展示',
      projectsNote: '精选项目聚焦 AI 工具、实际产品交付与可部署工程实践。',
      certificatesTitle: '证书',
      certificate1Meta: 'Google · 2026 年 4 月颁发',
      certificate1Title: '研究与洞察 AI',
      certificate1Desc: 'Google 证书，聚焦 AI 在研究流程、洞察生成和实践知识工作的加速应用。',
      certificate2Meta: 'Google · 2026 年 4 月颁发',
      certificate2Title: 'Google 数据分析师认证',
      certificate2Desc: '展示数据分析基础知识与流程，结合基于 Python 的问题解决能力。',
      certificate3Meta: 'Google · 2026 年 4 月颁发',
      certificate3Title: 'Google AI Essentials',
      certificate3Desc: '覆盖 AI 核心概念以及现代 AI 工具的实用使用，增强工程与生产力。',
      certificate4Meta: 'Anthropic · 2026 年 4 月颁发 · 2036 年 12 月到期',
      certificate4Title: '基于 Claude API 的开发',
      certificate4Desc: '验证使用 Anthropic API 构建应用与面向生产的 AI 集成实践。',
      certificate5Meta: 'Anthropic · 2026 年 4 月颁发 · 2036 年 12 月到期',
      certificate5Title: 'AI 流畅度：框架与基础',
      certificate5Desc: '聚焦 AI 框架、基础概念以及理解现代 AI 系统构建与应用的结构化认知。',
      certificate6Meta: 'Anthropic · 2026 年 4 月颁发 · 2036 年 12 月到期',
      certificate6Title: 'AI 的能力与局限',
      certificate6Desc: '强调模型优势、约束与现实工程决策中的 AI 评估能力。',
      certificate7Meta: 'Anthropic · 2026 年 4 月颁发 · 2036 年 12 月到期',
      certificate7Title: 'Claude 101',
      certificate7Desc: '面向 Claude 的入门认证，覆盖交互流程、提示词模式与面向智能体的实际使用。',
      certificate8Meta: 'Anthropic · 2026 年 4 月颁发 · 2036 年 12 月到期',
      certificate8Title: 'Claude 与 Google Vertex AI',
      certificate8Desc: '展示在 Google Vertex AI 上部署和使用 Claude 的经验，包含云端 AI 集成流程。',
      certificate9Meta: 'Anthropic · 2026 年 4 月颁发',
      certificate9Title: 'Model Context Protocol 入门',
      certificate9Desc: '覆盖 MCP 基础，以及模型上下文如何通过实际工具协议暴露给应用。',
      certificate10Meta: 'HackerRank · 2026 年 4 月颁发',
      certificate10Title: 'HackerRank 软件工程师认证',
      certificate10Desc: '通过可验证的软件工程测评，覆盖核心编程、问题解决与工程基础。',
      certificate11Meta: 'Airtable · 2026 年 4 月颁发 · 2028 年 5 月到期',
      certificate11Title: 'Airtable 无代码 AI 应用构建认证',
      certificate11Desc: '验证构建 AI 辅助无代码工作流与结构化 Airtable 应用体验的能力。',
      certificate12Meta: 'Google · 2026 年 4 月颁发',
      certificate12Title: 'Google AI Professional Certificate',
      certificate12Desc: '展示 Google AI 工具与实际工作流中的应用能力。',
      certificateVerify: '查看证书',
      certificatesIndicator: '显示 {{start}}-{{end}} / {{total}}',
      certificatesMore: '下一页',
      certificatesAllShown: '全部证书已展示',
      contactTitle: '联系',
      contactEmail: '复制邮箱',
      contactResume: '简历 PDF',
      contactGitHub: 'GitHub @WilliamK112',
      contactLinkedIn: '领英',
      contactDevpost: 'Devpost',
      messageTitle: '留言',
      messageDesc: '我目前对软件工程实习和项目合作持开放态度。留下简短留言，我会尽快回复。',
      formEmailLabel: '你的邮箱',
      formEmailPlaceholder: 'you@example.com',
      formMessageLabel: '留言内容',
      formMessagePlaceholder: '写下你的内容...',
      formSend: '发送',
      meetingTitle: '安排见面',
      meetingDesc: '在我的日程里直接预约 30 分钟会话。',
      meetingBtn: '预约会议',
      formSending: '发送中...',
      formMissingFields: '请填写邮箱和留言内容。',
      formSent: '已发送，感谢你的留言。',
      formFailed: '发送失败，请稍后重试。',
      copyEmailSuccess: '已复制邮箱',
      copyEmailFailed: '复制失败',
      projectTryOut: '立即体验',
      projectGitHub: 'GitHub',
    }
  };

  function getDictionary(lang) {
    return translations[lang] || translations.en || {};
  }

  function interpolate(template, vars) {
    if (!vars || typeof template !== 'string') return template;
    return template.replace(/{{\s*(\w+)\s*}}/g, (match, key) => {
      return vars[key] !== undefined ? vars[key] : match;
    });
  }

  function getText(key, vars = null) {
    const lang = document.documentElement.lang === 'zh-CN' ? 'zh' : 'en';
    const dict = getDictionary(lang);
    const raw = dict[key] !== undefined ? dict[key] : translations.en[key];
    return interpolate(raw || key, vars);
  }

  function applyLanguage(lang) {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    const isZh = lang === 'zh';
    const dict = getDictionary(lang);

    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.getAttribute('data-i18n');
      if (!key) return;
      const value = dict[key] !== undefined ? dict[key] : translations.en[key];
      if (value !== undefined) node.innerHTML = value;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
      const key = node.getAttribute('data-i18n-placeholder');
      if (!key) return;
      const value = dict[key] !== undefined ? dict[key] : translations.en[key];
      if (value !== undefined) node.setAttribute('placeholder', value);
    });

    toggle.setAttribute('aria-pressed', isZh ? 'true' : 'false');
    toggle.setAttribute('aria-label', isZh ? getText('langAriaToEnglish') : getText('langAriaToChinese'));
    toggle.textContent = isZh ? (dict.langButtonText || 'EN') : (translations.en.langButtonText || '中文');
    window.localStorage.setItem(storageKey, lang);
    window.dispatchEvent(new CustomEvent('portfolio-language-changed', {
      detail: { lang }
    }));

    if (window.__portfolioTheme && typeof window.__portfolioTheme.applyTheme === 'function' && document.body) {
      window.__portfolioTheme.applyTheme(document.body.dataset.theme || 'dark');
    }
  }

  window.__portfolioI18n = {
    getText,
    interpolate,
    getCurrentLang: () => (document.documentElement.lang === 'zh-CN' ? 'zh' : 'en'),
    translations
  };

  applyLanguage(initialLang);

  toggle.addEventListener('click', () => {
    const next = document.documentElement.lang === 'zh-CN' ? 'en' : 'zh';
    applyLanguage(next);
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

(function setupFragmentAssemblyReveal() {
  const sections = Array.from(document.querySelectorAll('main > section'))
    .filter((section) => section.id !== 'hero');
  if (!sections.length) return;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const pieceSelector = [
    'h2',
    'h3',
    '.section-note',
    '.recruiter-snapshot li',
    '.timeline li',
    '.stats > div',
    '.pill-row span',
    '.open-source-chip',
    '.certificate-card',
    '.contact-actions .btn',
    '.message-board',
    '.meeting-card'
  ].join(',');

  const mediaSelector = [
    '.project-flip-front',
    '.portrait-frame',
    '.uw-logo-showcase'
  ].join(',');

  sections.forEach((section) => {
    section.setAttribute('data-fragment-section', '');
    const pieces = Array.from(section.querySelectorAll(pieceSelector))
      .filter((node) => !node.closest('[data-fragment-piece]'));

    pieces.forEach((node, index) => {
      node.setAttribute('data-fragment-piece', '');
      node.style.setProperty('--fragment-delay', `${Math.min(index * 46, 460)}ms`);
      node.style.setProperty('--fragment-x', `${((index % 3) - 1) * 16}px`);
      node.style.setProperty('--fragment-y', `${22 + (index % 4) * 8}px`);
      node.style.setProperty('--fragment-rot', `${((index % 5) - 2) * 1.8}deg`);
    });

    Array.from(section.querySelectorAll(mediaSelector)).forEach((node, index) => {
      node.setAttribute('data-fragment-media', '');
      node.style.setProperty('--fragment-delay', `${Math.min(index * 58, 360)}ms`);
    });
  });
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
  const getText = window.__portfolioI18n && typeof window.__portfolioI18n.getText === 'function'
    ? window.__portfolioI18n.getText
    : null;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = getText ? getText('formSending') : 'Sending...';
    status.className = 'form-status';

    const emailInput = document.getElementById('sender-email');
    const messageInput = document.getElementById('sender-message');
    const email = emailInput && 'value' in emailInput ? emailInput.value.trim() : '';
    const message = messageInput && 'value' in messageInput ? messageInput.value.trim() : '';

    if (!email || !message) {
      status.textContent = getText ? getText('formMissingFields') : 'Please enter both your email and message.';
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
      status.textContent = getText ? getText('formSent') : 'Message sent. Thank you!';
      status.className = 'form-status success';
    } catch (error) {
      status.textContent = getText ? getText('formFailed') : 'Send failed. Please try again in a moment.';
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
  const getText = window.__portfolioI18n && typeof window.__portfolioI18n.getText === 'function'
    ? window.__portfolioI18n.getText
    : null;

  buttons.forEach((button) => {
    const originalText = button.textContent || 'Copy Email';
    button.addEventListener('click', async () => {
      const email = button.getAttribute('data-copy-email');
      if (!email) return;

      try {
        await navigator.clipboard.writeText(email);
        button.textContent = getText ? getText('copyEmailSuccess') : (document.documentElement.lang === 'zh-CN' ? '已复制邮箱' : 'Copied Email');
        button.classList.add('copied');
        window.setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('copied');
        }, 1600);
      } catch (error) {
        button.textContent = getText ? getText('copyEmailFailed') : (document.documentElement.lang === 'zh-CN' ? '复制失败' : 'Copy failed');
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
  const getText = window.__portfolioI18n && typeof window.__portfolioI18n.getText === 'function'
    ? window.__portfolioI18n.getText
    : null;

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
    if (indicator) {
      const label = getText
        ? getText('projectsIndicator', { start: total ? start + 1 : 0, end, total })
        : `Showing ${total ? start + 1 : 0}-${end} / ${total}`;
      indicator.textContent = label;
    }

    if (totalPages <= 1) {
      btn.textContent = getText ? getText('projectsAllShown') : 'All Projects Shown';
      btn.disabled = true;
    } else {
      btn.textContent = page === totalPages - 1 ? (getText ? getText('projectsBack') : 'Back to First 6') : (getText ? getText('projectsMore') : 'Show More Projects');
      btn.disabled = false;
    }
  }

  function refreshLanguageText() {
    applyPage(currentPage, false);
  }

  window.addEventListener('portfolio-language-changed', refreshLanguageText);

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
  const getText = window.__portfolioI18n && typeof window.__portfolioI18n.getText === 'function'
    ? window.__portfolioI18n.getText
    : null;

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

    if (indicator) {
      const currentEnd = Math.min(end, total);
      const label = getText
        ? getText('certificatesIndicator', { start: total ? start + 1 : 0, end: currentEnd, total })
        : `Showing ${total ? start + 1 : 0}-${currentEnd} / ${total}`;
      indicator.textContent = label;
    }
    btn.disabled = totalPages <= 1;
    if (totalPages <= 1) {
      btn.textContent = getText ? getText('certificatesAllShown') : (document.documentElement.lang === 'zh-CN' ? '已显示全部' : 'All Certificates Shown');
    } else {
      btn.textContent = getText ? getText('certificatesMore') : (document.documentElement.lang === 'zh-CN' ? '下一页' : 'Next Page');
    }
  }

  function refreshLanguageText() {
    applyPage(currentPage);
  }

  window.addEventListener('portfolio-language-changed', refreshLanguageText);

  btn.addEventListener('click', () => {
    if (totalPages <= 1) return;
    currentPage = (currentPage + 1) % totalPages;
    applyPage(currentPage);
  });

  applyPage(0);
})();

(function setupInteractionSfx() {
  const hasLocalStorage = (() => {
    try {
      const test = '__sfx_ls_test__';
      window.localStorage.setItem(test, '1');
      window.localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  })();

  const params = new URLSearchParams(window.location.search);
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefForceOn = params.get('sfx') === '1' || (hasLocalStorage && window.localStorage.getItem('portfolio-sfx') === 'on');
  const prefForceOff = params.get('sfx') === '0' || (hasLocalStorage && window.localStorage.getItem('portfolio-sfx') === 'off');

  const isEnabled = prefForceOff ? false : (!prefersReduced || prefForceOn);
  if (!isEnabled) return;

  const clickCooldownMs = 55;
  const slideCooldownMs = 75;
  const moveThreshold = 22;
  const durationThresholdMs = 420;
  const minSwipeDistance = 45;

  let audioCtx = null;
  let masterGain = null;
  let lastClick = 0;
  let lastSlide = 0;
  let pointerStart = null;
  let ignoreNextClick = false;
  let failedToUnlock = false;

  const interactiveSelector = [
    'a',
    'button',
    'input',
    'textarea',
    'select',
    '[role="button"]',
    '[role="link"]',
    '[role="menuitem"]',
    '[data-copy-email]',
    '[data-flip-card]',
    '[data-theme-toggle]',
    '[data-lang-toggle]',
    '[data-project-more]',
    '[data-certificate-more]'
  ].join(',');

  function ensureAudioContext() {
    if (!audioCtx) {
      const context = window.AudioContext || window.webkitAudioContext;
      if (!context) return null;

      audioCtx = new context();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.18;
      masterGain.connect(audioCtx.destination);
    }
    return audioCtx;
  }

  function unlockAudio() {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {
        failedToUnlock = true;
      });
    }
  }

  function playTone(startFreq, endFreq, durationMs, attack = 0.001, decay = 0.09, gain = 1, wave = 'sine') {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      failedToUnlock = true;
      return;
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(gain * 0.25, now + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, now + (durationMs / 1000));
    osc.type = wave;
    osc.frequency.setValueAtTime(startFreq, now);
    if (typeof endFreq === 'number') {
      osc.frequency.exponentialRampToValueAtTime(Math.max(28, endFreq), now + (durationMs / 1000));
    }

    osc.connect(env);
    env.connect(masterGain);
    osc.start(now);
    osc.stop(now + (durationMs / 1000) + 0.06);
  }

  function playClick() {
    const now = performance.now();
    if (now - lastClick < clickCooldownMs) return;
    lastClick = now;
    playTone(980, 620, 45, 0.001, 0.02, 1.0, 'sine');
    playTone(420, 240, 55, 0.004, 0.03, 0.6, 'triangle');
  }

  function playSlide(velocity) {
    const now = performance.now();
    if (now - lastSlide < slideCooldownMs) return;
    lastSlide = now;

    const speed = Math.min(Math.max(velocity / 1400, 0.55), 1.6);
    const start = 420 * speed;
    const end = Math.max(95, 360 / speed);
    playTone(start, end, 92, 0.003, 0.04, 0.95, 'triangle');
  }

  window.__portfolioSfx = window.__portfolioSfx || {};
  window.__portfolioSfx.test = function runPortfolioSfxTest() {
    unlockAudio();
    playClick();
  };
  window.__portfolioSfx.setEnabled = function setPortfolioSfxEnabled(next) {
    if (!hasLocalStorage) return;
    window.localStorage.setItem('portfolio-sfx', next ? 'on' : 'off');
    window.location.reload();
  };
  window.__portfolioSfx.status = function getPortfolioSfxStatus() {
    const ctx = ensureAudioContext();
    return {
      reducedMotionPref: prefersReduced,
      isEnabled,
      forceOn: prefForceOn,
      forceOff: prefForceOff,
      contextState: ctx ? ctx.state : 'uninitialized',
      contextExists: !!ctx,
      failedToUnlock
    };
  };

  function isInteractiveElement(target) {
    if (!(target instanceof Element)) return false;
    return target.closest(interactiveSelector) !== null;
  }

  document.addEventListener('pointerdown', (event) => {
    unlockAudio();
    if (!(event.target instanceof Element)) return;
    pointerStart = {
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
      active: true
    };
    ignoreNextClick = false;
  }, { passive: true });

  document.addEventListener('pointerup', (event) => {
    if (!pointerStart || !pointerStart.active) return;
    pointerStart.active = false;

    const dt = performance.now() - pointerStart.time;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    const distance = Math.hypot(dx, dy);
    const velocity = distance / Math.max(dt, 1);
    const dominatedX = Math.abs(dx) > Math.abs(dy) * 1.25;
    const dominatedY = Math.abs(dy) > Math.abs(dx) * 1.25;
    const isSwipe = dt <= durationThresholdMs && distance >= minSwipeDistance;
    const isDominated = dominatedX || dominatedY;

    if (isSwipe && (isDominated || distance >= minSwipeDistance * 1.35)) {
      playSlide(velocity);
      ignoreNextClick = true;
    }
  }, { passive: true });

  document.addEventListener('pointercancel', () => {
    if (pointerStart) pointerStart.active = false;
  }, { passive: true });

  document.addEventListener(
    'click',
    (event) => {
      if (ignoreNextClick) {
        ignoreNextClick = false;
        return;
      }
      if (!isInteractiveElement(event.target)) return;
      if (!(event.isTrusted)) return;
      unlockAudio();
      playClick();
    },
    true
  );

  document.addEventListener('keydown', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!isInteractiveElement(target)) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    unlockAudio();
    playClick();
  });

  document.addEventListener('wheel', (event) => {
    if (Math.abs(event.deltaX) < Math.abs(event.deltaY) * 1.15) return;
    if (Math.abs(event.deltaX) < moveThreshold * 2) return;
    playSlide(Math.abs(event.deltaX));
  }, { passive: true });

  window.addEventListener('blur', () => {
    ignoreNextClick = false;
    pointerStart = null;
  });
})();

(function setupSpatialDepthCards() {
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  if (!document.getElementById('spatial-depth-styles')) {
    const style = document.createElement('style');
    style.id = 'spatial-depth-styles';
    style.textContent = `
.spatial-card {
  --tilt-x: 0deg;
  --tilt-y: 0deg;
  --tilt-lift: 0px;
  --glare-x: 50%;
  --glare-y: 35%;
  --glare-opacity: 0;
  position: relative;
  isolation: isolate;
  transform: perspective(1000px) rotateX(var(--tilt-x)) rotateY(var(--tilt-y)) translate3d(0, var(--tilt-lift), 0);
  transform-style: preserve-3d;
  transition: transform 260ms cubic-bezier(.2,.7,.2,1), border-color 220ms ease, box-shadow 220ms ease, background 220ms ease;
  will-change: transform;
}
.spatial-card::before,
.spatial-card::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 2;
}
.spatial-card::before {
  background:
    radial-gradient(circle at var(--glare-x) var(--glare-y),
      rgba(255, 255, 255, 0.28),
      rgba(255, 255, 255, 0.1) 18%,
      transparent 48%);
  opacity: var(--glare-opacity);
  mix-blend-mode: screen;
  transition: opacity 240ms ease;
}
.spatial-card::after {
  padding: 1px;
  background:
    linear-gradient(135deg,
      rgba(255, 255, 255, 0.26),
      transparent 18%,
      transparent 72%,
      color-mix(in srgb, var(--accent) 28%, transparent));
  opacity: calc(0.2 + (var(--glare-opacity) * 0.28));
  mask: linear-gradient(#000, #000) content-box, linear-gradient(#000, #000);
  mask-composite: exclude;
}
.spatial-card.is-spatial-active {
  --tilt-lift: -5px;
  border-color: color-mix(in srgb, var(--accent) 46%, var(--line));
  box-shadow:
    0 28px 70px rgba(0, 0, 0, 0.28),
    0 18px 42px color-mix(in srgb, var(--accent) 16%, transparent);
}
.spatial-card > :not(.uw-logo-glow) {
  position: relative;
  z-index: 3;
}
.spatial-card .profile-flip-card,
.spatial-card .uw-flip-card,
.spatial-card .project-flip-inner,
.spatial-card h2,
.spatial-card h3,
.spatial-card .big {
  transform: translateZ(22px);
}
.spatial-card p,
.spatial-card li,
.spatial-card .label,
.spatial-card .certificate-meta {
  transform: translateZ(12px);
}`;
    document.head.appendChild(style);
  }

  const candidates = Array.from(document.querySelectorAll([
    '.portrait-frame',
    '.uw-logo-showcase',
    '.card:not(.education-card)',
    '.stats > div',
    '.project-card',
    '.certificate-card',
    '.ability-grid article'
  ].join(',')));
  if (!candidates.length) return;

  const maxTilt = 8;
  const resetDelayMs = 120;

  candidates.forEach((card) => {
    card.classList.add('spatial-card');

    let resetTimer = 0;

    function resetCard() {
      card.classList.remove('is-spatial-active');
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      card.style.setProperty('--glare-opacity', '0');
    }

    card.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      window.clearTimeout(resetTimer);

      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const localX = (event.clientX - rect.left) / rect.width;
      const localY = (event.clientY - rect.top) / rect.height;
      const rotateY = (localX - 0.5) * maxTilt;
      const rotateX = (0.5 - localY) * maxTilt;

      card.classList.add('is-spatial-active');
      card.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`);
      card.style.setProperty('--glare-x', `${(localX * 100).toFixed(2)}%`);
      card.style.setProperty('--glare-y', `${(localY * 100).toFixed(2)}%`);
      card.style.setProperty('--glare-opacity', '1');
    }, { passive: true });

    card.addEventListener('pointerleave', () => {
      resetTimer = window.setTimeout(resetCard, resetDelayMs);
    }, { passive: true });

    card.addEventListener('focusin', () => {
      card.classList.add('is-spatial-active');
      card.style.setProperty('--tilt-x', '-2deg');
      card.style.setProperty('--tilt-y', '2deg');
      card.style.setProperty('--glare-opacity', '0.5');
    });

    card.addEventListener('focusout', resetCard);
  });
})();
