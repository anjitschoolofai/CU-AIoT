/* ==========================================================
   AIoT FDP Training Portal — Core JavaScript
   ========================================================== */
'use strict';

/* =====================================================
   1. STATE MANAGEMENT
   ===================================================== */
const PortalState = {
  mode: 'learning',       // 'learning' | 'simulation' | 'hardware'
  currentPage: 'home',
  completedModules: JSON.parse(localStorage.getItem('aiot_completed') || '[]'),
  simRunning: false,
  simIntervals: [],
  presentationMode: false,

  setMode(m) {
    this.mode = m;
    localStorage.setItem('aiot_mode', m);
    document.dispatchEvent(new CustomEvent('modechange', { detail: m }));
  },
  markComplete(moduleId) {
    if (!this.completedModules.includes(moduleId)) {
      this.completedModules.push(moduleId);
      localStorage.setItem('aiot_completed', JSON.stringify(this.completedModules));
    }
  },
  isComplete(moduleId) { return this.completedModules.includes(moduleId); },
  clearIntervals() { this.simIntervals.forEach(clearInterval); this.simIntervals = []; }
};

/* =====================================================
   2. UTILITY HELPERS
   ===================================================== */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
const rand = (min, max, dp = 1) => +(Math.random() * (max - min) + min).toFixed(dp);
const lerp = (a, b, t) => a + (b - a) * t;
const formatTs = () => new Date().toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' });

function showToast(msg, type = 'success', duration = 3000) {
  let container = $('#toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || '•'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => { setTimeout(() => toast.classList.add('show'), 10); });
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, duration);
}

/* =====================================================
   3. TABS
   ===================================================== */
function initTabs(container = document) {
  $$('.tabs .tab-btn', container).forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.tabs');
      const target = btn.dataset.tab;
      const section = btn.closest('section') || btn.closest('.card') || document;
      $$('.tab-btn', group).forEach(b => b.classList.remove('active'));
      $$('.tab-pane', section).forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const pane = $(`#${target}`, section) || $(`[data-tab-content="${target}"]`, section);
      if (pane) pane.classList.add('active');
    });
  });
}

/* =====================================================
   4. ACCORDION
   ===================================================== */
function initAccordion(container = document) {
  $$('.acc-header', container).forEach(hdr => {
    hdr.addEventListener('click', () => {
      const item = hdr.closest('.acc-item');
      const wasOpen = item.classList.contains('open');
      $$('.acc-item', item.closest('.accordion')).forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
}

/* =====================================================
   5. MODE SWITCHER
   ===================================================== */
function initModeSwitcher() {
  $$('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      PortalState.setMode(mode);
      $$('.mode-btn').forEach(b => b.classList.remove('active'));
      $$('.mode-btn').forEach(b => { if (b.dataset.mode === mode) b.classList.add('active'); });
      updateModeUI(mode);
    });
  });

  // Restore saved mode
  const saved = localStorage.getItem('aiot_mode') || 'learning';
  PortalState.mode = saved;
  $$('.mode-btn').forEach(b => { if (b.dataset.mode === saved) b.classList.add('active'); });
  updateModeUI(saved);
}

function updateModeUI(mode) {
  const labels = { learning: '📚 Learning Mode', simulation: '🔬 Simulation Mode', hardware: '🔌 Real Hardware Mode' };
  const modeBanner = $('#mode-banner');
  if (modeBanner) {
    modeBanner.textContent = labels[mode] || '';
    modeBanner.className = `mode-banner-bar mode-${mode}`;
  }

  // Show/hide mode-specific sections
  $$('[data-mode]').forEach(el => {
    const vis = el.dataset.mode === mode || el.dataset.mode === 'all';
    el.style.display = vis ? '' : 'none';
  });

  // Update data labels on sensor cards
  if (mode === 'simulation') {
    $$('.sensor-label').forEach(l => l.className = 'label-simulated sensor-label');
    $$('.sensor-label').forEach(l => l.innerHTML = '🔬 SIMULATED');
  } else if (mode === 'hardware') {
    $$('.sensor-label').forEach(l => l.className = 'label-disconnected sensor-label');
    $$('.sensor-label').forEach(l => l.innerHTML = '⚡ DISCONNECTED — hardware not detected');
  } else {
    $$('.sensor-label').forEach(l => l.className = 'label-illustrative sensor-label');
    $$('.sensor-label').forEach(l => l.innerHTML = '📖 ILLUSTRATIVE EXAMPLE');
  }
}

/* =====================================================
   6. CHART ENGINE (using Chart.js CDN)
   ===================================================== */
const ChartManager = {
  charts: {},

  createLineChart(canvasId, labels, datasets, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    if (this.charts[canvasId]) { this.charts[canvasId].destroy(); }
    const cfg = {
      type: 'line',
      data: { labels, datasets: datasets.map(ds => ({
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.4,
        fill: ds.fill !== undefined ? ds.fill : true,
        ...ds
      })) },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: {
          legend: { labels: { color: '#90a4b7', font: { size: 11 } } },
          tooltip: { backgroundColor: '#112240', titleColor: '#e8f4ff', bodyColor: '#90a4b7', borderColor: '#00bcd4', borderWidth: 1 }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#90a4b7', maxTicksLimit: 8, font: { size: 10 } } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#90a4b7', font: { size: 10 } } }
        },
        ...options
      }
    };
    this.charts[canvasId] = new Chart(canvas, cfg);
    return this.charts[canvasId];
  },

  createBarChart(canvasId, labels, datasets, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    if (this.charts[canvasId]) { this.charts[canvasId].destroy(); }
    this.charts[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: { labels, datasets: datasets.map(ds => ({ borderRadius: 4, ...ds })) },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#90a4b7', font: { size: 11 } } },
          tooltip: { backgroundColor: '#112240', titleColor: '#e8f4ff', bodyColor: '#90a4b7' }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#90a4b7', font: { size: 10 } } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#90a4b7', font: { size: 10 } } }
        },
        ...options
      }
    });
    return this.charts[canvasId];
  },

  createDoughnutChart(canvasId, labels, data, colors) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    if (this.charts[canvasId]) { this.charts[canvasId].destroy(); }
    this.charts[canvasId] = new Chart(canvas, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: '#0a1628', borderWidth: 2 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#90a4b7', font: { size: 10 }, padding: 12 } }
        }
      }
    });
    return this.charts[canvasId];
  },

  pushPoint(chartId, label, ...dataPoints) {
    const chart = this.charts[chartId];
    if (!chart) return;
    chart.data.labels.push(label);
    dataPoints.forEach((dp, i) => {
      if (chart.data.datasets[i]) chart.data.datasets[i].data.push(dp);
    });
    if (chart.data.labels.length > 30) {
      chart.data.labels.shift();
      chart.data.datasets.forEach(ds => ds.data.shift());
    }
    chart.update('none');
  }
};

/* =====================================================
   7. SIMULATION ENGINE
   ===================================================== */
const SimEngine = {
  sensors: {
    temperature: { value: 26.4, min: 20, max: 40, unit: '°C', drift: 0.3 },
    humidity:    { value: 58.2, min: 30, max: 90, unit: '%RH', drift: 1.0 },
    airquality:  { value: 142,  min: 50, max: 400, unit: 'ppm', drift: 5  },
    occupancy:   { value: 0,    min: 0,  max: 30, unit: 'persons', drift: 2 },
    energy:      { value: 12.4, min: 2,  max: 50, unit: 'kW', drift: 0.8  },
    vibration:   { value: 0.12, min: 0,  max: 2,  unit: 'g', drift: 0.05 },
    soilmoisture:{ value: 62,   min: 20, max: 100,unit: '%', drift: 1.5   },
    waterlevel:  { value: 74,   min: 0,  max: 100,unit: '%', drift: 0.5   },
  },

  step(sensorKey) {
    const s = this.sensors[sensorKey];
    if (!s) return;
    const noise = (Math.random() - 0.5) * 2 * s.drift;
    s.value = clamp(+(s.value + noise).toFixed(2), s.min, s.max);
    return s.value;
  },

  getAll() {
    const result = {};
    Object.keys(this.sensors).forEach(k => { result[k] = this.sensors[k].value; });
    return result;
  },

  setManual(key, val) {
    if (this.sensors[key]) this.sensors[key].value = +val;
  },

  getAlert(key) {
    const thresholds = {
      temperature: { warn: 30, crit: 35 },
      humidity:    { warn: 75, crit: 85 },
      airquality:  { warn: 200, crit: 300 },
      vibration:   { warn: 0.8, crit: 1.5 },
    };
    const s = this.sensors[key];
    const t = thresholds[key];
    if (!s || !t) return 'normal';
    if (s.value >= t.crit) return 'critical';
    if (s.value >= t.warn) return 'warning';
    return 'normal';
  }
};

/* =====================================================
   8. SIDEBAR NAVIGATION
   ===================================================== */
function initSidebar() {
  $$('.sidebar-link').forEach(link => {
    link.addEventListener('click', () => {
      const target = link.dataset.page;
      if (target) navigateTo(target, link.dataset.params ? JSON.parse(link.dataset.params) : {});
    });
  });

  // Mobile toggle
  const toggle = $('.menu-toggle');
  const sidebar = $('.sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (!sidebar.contains(e.target) && !toggle.contains(e.target)) sidebar.classList.remove('open');
    });
  }
}

/* =====================================================
   9. QUIZ ENGINE
   ===================================================== */
function initQuiz(container = document) {
  $$('.quiz-option', container).forEach(opt => {
    opt.addEventListener('click', () => {
      const question = opt.closest('.quiz-question');
      if ($('.quiz-option.correct', question) || $('.quiz-option.wrong', question)) return; // Already answered
      const isCorrect = opt.dataset.correct === 'true';
      opt.classList.add(isCorrect ? 'correct' : 'wrong');
      if (!isCorrect) {
        const correctOpt = $('[data-correct="true"]', question);
        if (correctOpt) correctOpt.classList.add('correct');
      }
      const explanation = $('.quiz-explanation', question);
      if (explanation) explanation.classList.add('show');
      showToast(isCorrect ? 'Correct! Well done.' : 'Not quite — see the explanation below.', isCorrect ? 'success' : 'warning');
    });
  });
}

/* =====================================================
   10. ARCHITECTURE LAYER INTERACTIVITY
   ===================================================== */
function initArchDiagram(container = document) {
  $$('.arch-layer', container).forEach(layer => {
    layer.addEventListener('click', () => {
      const wasSelected = layer.classList.contains('selected');
      $$('.arch-layer', container).forEach(l => l.classList.remove('selected'));
      if (!wasSelected) layer.classList.add('selected');
    });
  });
}

/* =====================================================
   11. PROGRESS TRACKING
   ===================================================== */
function updateProgress() {
  const total = $$('.module-card').length;
  const done  = PortalState.completedModules.length;
  const pct   = total ? Math.round((done / total) * 100) : 0;
  const fill  = $('#global-progress-fill');
  const label = $('#global-progress-label');
  if (fill) fill.style.width = pct + '%';
  if (label) label.textContent = `${done} / ${total} modules completed`;

  $$('.module-card').forEach(card => {
    const mid = card.dataset.moduleId;
    if (mid && PortalState.isComplete(mid)) {
      card.classList.add('completed');
      const mark = card.querySelector('.done-mark');
      if (!mark) {
        const m = document.createElement('span');
        m.className = 'done-mark'; m.textContent = '✓';
        card.querySelector('.module-num')?.append(m);
      }
    }
  });
}

/* =====================================================
   12. KEYBOARD SHORTCUTS
   ===================================================== */
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'p') { e.preventDefault(); togglePresentation(); }
  if (e.key === 'Escape') { $('.sidebar.open')?.classList.remove('open'); }
});

function togglePresentation() {
  PortalState.presentationMode = !PortalState.presentationMode;
  document.body.classList.toggle('presentation-mode', PortalState.presentationMode);
  showToast(PortalState.presentationMode ? 'Presentation mode ON (Ctrl+P to exit)' : 'Presentation mode OFF', 'info');
}

/* =====================================================
   13. SENSOR SPARKLINE (mini inline chart)
   ===================================================== */
function createSparkline(canvasId, data, color = '#00bcd4') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
}

/* =====================================================
   14. MQTT SIMULATION VISUALIZER
   ===================================================== */
function startMqttVisualizer(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const logEl = container.querySelector('.mqtt-log');
  if (!logEl) return;

  const topics = ['campus/room101/temperature', 'campus/lab/humidity', 'campus/energy/consumption', 'campus/water/level'];
  const interval = setInterval(() => {
    if (PortalState.mode !== 'simulation') return;
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const value = rand(18, 45, 2);
    const ts    = formatTs();
    const line  = document.createElement('div');
    line.className = 'terminal';
    line.style.cssText = 'padding:0.3rem 0.6rem;margin-bottom:0.25rem;font-size:0.75rem;';
    line.innerHTML = `<span class="prompt">[${ts}]</span> <span class="value">PUBLISH</span> <span class="cmd">${topic}</span> → <span class="value">${value}</span>`;
    logEl.prepend(line);
    if (logEl.children.length > 8) logEl.lastChild.remove();
  }, 1800);
  PortalState.simIntervals.push(interval);
}

/* =====================================================
   15. MAIN INIT
   ===================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initAccordion();
  initModeSwitcher();
  initSidebar();
  initQuiz();
  initArchDiagram();
  updateProgress();

  // Float toolbar: scroll-to-top
  const scrollBtn = $('#scroll-top');
  if (scrollBtn) {
    scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', () => {
      scrollBtn.style.opacity = window.scrollY > 300 ? '1' : '0.3';
    });
  }

  // Presentation mode button
  const presBtn = $('#btn-presentation');
  if (presBtn) presBtn.addEventListener('click', togglePresentation);

  // Module card click → mark complete on first visit
  $$('.module-card[data-page]').forEach(card => {
    card.addEventListener('click', () => {
      const mid = card.dataset.moduleId;
      if (mid) { PortalState.markComplete(mid); updateProgress(); }
    });
  });

  console.log('%cAIoT FDP Portal', 'color:#00bcd4;font-size:1.4rem;font-weight:900;');
  console.log('%cProf. R. Anjit Raja | Crescent University', 'color:#90a4b7;');
});

/* Export for page scripts */
window.PortalState = PortalState;
window.SimEngine   = SimEngine;
window.ChartManager = ChartManager;
window.showToast   = showToast;
window.createSparkline = createSparkline;
window.startMqttVisualizer = startMqttVisualizer;
window.formatTs    = formatTs;
window.rand        = rand;
