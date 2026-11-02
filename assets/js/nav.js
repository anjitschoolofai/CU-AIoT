/* ============================================================
   AIoT FDP Portal — Shared Navigation & Shell Injector
   ============================================================ */
(function () {
  'use strict';

  function getRoot() {
    const path = location.pathname.replace(/\\/g, '/');
    // Depth-2 subdirs under /pages/: day1/, day2/, lab/
    if (path.includes('/pages/day1/') || path.includes('/pages/day2/') || path.includes('/pages/lab/')) return '../../';
    // Depth-1 pages under /pages/
    if (path.includes('/pages/')) return '../';
    // Root level (index.html)
    return '';
  }
  const ROOT = getRoot();

  const pages = [
    { id: 'home',         label: 'Home',          icon: '🏠', href: ROOT + 'index.html' },
    { id: 'day1',         label: 'Day 1',          icon: '📘', href: ROOT + 'pages/day1/index.html', badge: '13' },
    { id: 'day2',         label: 'Day 2',          icon: '📗', href: ROOT + 'pages/day2/index.html', badge: '9' },
    { id: 'architecture', label: 'Architecture',   icon: '🏛️', href: ROOT + 'pages/architecture.html' },
    { id: 'lab',          label: 'Virtual Lab',    icon: '🔬', href: ROOT + 'pages/lab/index.html',  badge: '5' },
    { id: 'campus',       label: 'Smart Campus',   icon: '🏫', href: ROOT + 'pages/campus.html' },
    { id: 'applications', label: 'Applications',   icon: '🌍', href: ROOT + 'pages/applications.html' },
    { id: 'research',     label: 'Research Papers', icon: '🔬', href: ROOT + 'pages/research.html', badge: '15' },
    { id: 'tutorials',    label: 'Tutorials',      icon: '📖', href: ROOT + 'pages/tutorials.html' },
    { id: 'projects',     label: 'Project Studio', icon: '🚀', href: ROOT + 'pages/projects.html' },
    { id: 'hardware',     label: 'Hardware Lab',   icon: '🔌', href: ROOT + 'pages/hardware.html' },
    { id: 'resources',    label: 'Resources',      icon: '📂', href: ROOT + 'pages/resources.html' },
    { id: 'assessment',   label: 'Assessment',     icon: '📝', href: ROOT + 'pages/assessment.html' },
  ];

  function getCurrentPage() {
    const path = location.pathname.replace(/\\/g, '/');
    if (path.endsWith('index.html') && path.includes('/day1/')) return 'day1';
    if (path.endsWith('index.html') && path.includes('/day2/')) return 'day2';
    if (path.includes('/lab/')) return 'lab';
    for (const p of pages) {
      if (p.href && path.endsWith(p.id + '.html')) return p.id;
    }
    return 'home';
  }

  function buildHeader() {
    const current = getCurrentPage();
    const topLinks = pages.slice(1).map(p =>
      `<a href="${p.href}" class="${current === p.id ? 'active' : ''}">${p.label}</a>`
    ).join('');

    return `
<header class="site-header" role="banner">
  <div class="header-brand" style="display:flex;align-items:center;gap:0.75rem;">
    <a href="https://pgaiirl.netlify.app/" target="_blank" rel="noopener noreferrer" title="Visit PGAIIRL Website (https://pgaiirl.netlify.app/)" style="display:flex;align-items:center;text-decoration:none;">
      <img src="${ROOT}Images/Final%20PGAIIRL%20Logo%202.0.png" alt="PGAIIRL Logo" class="brand-logo-img">
    </a>
    <a href="${ROOT}index.html" style="display:flex;flex-direction:column;text-decoration:none;">
      <span class="brand-title">AIoT FDP Portal</span>
      <span class="brand-sub">PGAIIRL · Crescent University</span>
    </a>
  </div>
  <nav class="top-nav" aria-label="Primary navigation">
    ${topLinks}
  </nav>
  <div class="mode-badge" role="group" aria-label="Demonstration mode">
    <button class="mode-btn learning"  data-mode="learning"  title="Learning Mode">📚 Learn</button>
    <button class="mode-btn sim"       data-mode="simulation" title="Simulation Mode">🔬 Sim</button>
    <button class="mode-btn hardware"  data-mode="hardware"   title="Real Hardware Mode">🔌 HW</button>
    <button class="float-btn" id="btn-presentation" title="Toggle Presentation Mode (Ctrl+P)" style="position:static;width:36px;height:36px;font-size:0.9rem;margin-left:0.5rem;">⛶</button>
  </div>
  <button class="menu-toggle" aria-label="Open navigation menu" aria-expanded="false">☰</button>
</header>`;
  }

  function buildSidebar() {
    const current = getCurrentPage();
    const links = pages.map(p => {
      const done = PortalState && PortalState.isComplete ? PortalState.isComplete(p.id) : false;
      return `<a class="sidebar-link ${current === p.id ? 'active' : ''}" href="${p.href}" data-page="${p.id}">
        <span class="icon">${p.icon}</span>
        <span>${p.label}</span>
        ${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
        ${done ? '<span class="done-mark">✓</span>' : ''}
      </a>`;
    }).join('');

    return `
<aside class="sidebar" id="main-sidebar" role="navigation" aria-label="Module navigation">
  <a href="https://pgaiirl.netlify.app/" target="_blank" rel="noopener noreferrer" class="sidebar-lab-badge" title="Visit PGAIIRL Website (https://pgaiirl.netlify.app/)" style="padding:1rem 1.15rem; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:0.75rem; background:rgba(0,188,212,0.03); text-decoration:none; transition:background 0.2s;">
    <img src="${ROOT}Images/Final%20PGAIIRL%20Logo%202.0.png" alt="PGAIIRL Logo" style="width:38px; height:38px; border-radius:8px; background:#fff; padding:2px; border:1px solid rgba(0,188,212,0.3); object-fit:contain; flex-shrink:0;">
    <div style="line-height:1.25;">
      <div style="font-size:0.78rem; font-weight:800; color:var(--white); font-family:var(--font-head); letter-spacing:0.04em;">PGAIIRL <span style="font-size:0.7rem;color:var(--cyan);">↗</span></div>
      <div style="font-size:0.62rem; color:var(--cyan); margin-top:2px;">Patteesha Global AI Institute</div>
    </div>
  </a>
  <div class="sidebar-section">
    <div class="sidebar-section-title">Navigation</div>
    ${links}
  </div>
  <div class="sidebar-section" style="margin-top:1rem;padding:1rem 1.25rem;border-top:1px solid var(--border);">
    <div class="sidebar-section-title">Session Progress</div>
    <div id="global-progress-fill-wrap" style="margin:0.5rem 0;">
      <div class="progress-bar"><div class="progress-fill" id="global-progress-fill" style="width:0%"></div></div>
      <div id="global-progress-label" style="font-size:0.72rem;color:var(--text-muted);margin-top:0.3rem;">0 modules visited</div>
    </div>
  </div>
</aside>`;
  }

  function injectShell() {
    // Only inject if body has data-portal attribute
    const body = document.body;
    if (!body.dataset.portal) return;

    const pageId = body.dataset.portal;

    // Inject header
    const headerEl = document.createElement('div');
    headerEl.innerHTML = buildHeader();
    body.insertBefore(headerEl.firstElementChild, body.firstChild);

    // Build wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'portal-wrapper';

    // Sidebar
    const sidebarEl = document.createElement('div');
    sidebarEl.innerHTML = buildSidebar();
    wrapper.appendChild(sidebarEl.firstElementChild);

    // Main content — wrap existing body content
    const main = document.createElement('main');
    main.className = 'main-content';
    main.id = 'main-content';
    main.setAttribute('role', 'main');

    // Move all remaining body children into main
    while (body.children.length > 1) {
      main.appendChild(body.children[1]);
    }

    // Append unified portal footer
    const footerEl = document.createElement('footer');
    footerEl.className = 'portal-injected-footer';
    footerEl.innerHTML = `
      <div style="margin-top:3.5rem; padding:1.5rem 0; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; font-size:0.8rem; color:var(--text-muted);">
        <div style="display:flex; align-items:center; gap:0.85rem;">
          <a href="https://pgaiirl.netlify.app/" target="_blank" rel="noopener noreferrer" title="Visit PGAIIRL Website (https://pgaiirl.netlify.app/)">
            <img src="${ROOT}Images/Final%20PGAIIRL%20Logo%202.0.png" alt="PGAIIRL Logo" style="width:40px; height:40px; border-radius:8px; background:#fff; padding:2px; border:1px solid rgba(0,188,212,0.3); object-fit:contain; cursor:pointer;">
          </a>
          <div>
            <a href="https://pgaiirl.netlify.app/" target="_blank" rel="noopener noreferrer" style="color:var(--white); text-decoration:none;"><strong style="color:var(--white);">PGAIIRL</strong> &bull; Patteesha Global AI Institute of Intelligent Research Labs <span style="color:var(--cyan);font-size:0.75rem;">↗</span></a>
            <div style="font-size:0.72rem; color:var(--cyan); margin-top:2px;">AIoT Faculty Development Programme &bull; Resource Person: <a href="https://www.linkedin.com/in/profanjitraja/" target="_blank" rel="noopener noreferrer" style="color:var(--cyan); font-weight:700; text-decoration:underline;">Prof. R. Anjit Raja</a> &bull; Crescent University</div>
          </div>
        </div>
        <div style="font-size:0.75rem; text-align:right;">
          <div style="color:var(--white); font-style:italic;">Engineering Intelligence with Purpose</div>
          <div style="color:var(--cyan); font-size:0.7rem; margin-top:2px;">3–4 November 2026</div>
        </div>
      </div>
    `;
    main.appendChild(footerEl);

    wrapper.appendChild(main);
    body.appendChild(wrapper);

    // Float toolbar
    body.insertAdjacentHTML('beforeend', `
      <div class="float-toolbar" aria-hidden="true">
        <button class="float-btn" id="scroll-top" title="Back to top" style="opacity:0.3;">↑</button>
      </div>
      <div id="toast-container" class="toast-container"></div>
    `);
  }

  // Run after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectShell);
  } else {
    injectShell();
  }
})();
