/* ==========================================================
   AIoT FDP Portal — Simulation & Lab Engine (Extended)
   ========================================================== */
'use strict';

/* =====================================================
   LAB ENGINE — manages per-experiment simulations
   ===================================================== */
const LabEngine = {
  running: {},
  intervals: {},
  history: {},
  speed: 1,

  startExperiment(expId, updateFn, intervalMs = 2000) {
    this.stopExperiment(expId);
    this.running[expId] = true;
    this.history[expId] = [];
    const interval = setInterval(() => {
      if (!this.running[expId]) return;
      const reading = updateFn();
      if (reading) {
        this.history[expId].push({ ts: formatTs(), ...reading });
        if (this.history[expId].length > 100) this.history[expId].shift();
      }
    }, intervalMs / this.speed);
    this.intervals[expId] = interval;
  },

  stopExperiment(expId) {
    this.running[expId] = false;
    if (this.intervals[expId]) { clearInterval(this.intervals[expId]); delete this.intervals[expId]; }
  },

  resetExperiment(expId) {
    this.stopExperiment(expId);
    this.history[expId] = [];
  },

  setSpeed(s) { this.speed = s; },

  exportCSV(expId) {
    const data = this.history[expId] || [];
    if (!data.length) { showToast('No data to export yet. Run the simulation first.', 'warning'); return; }
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(row => keys.map(k => row[k]).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `aiot-sim-${expId}-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast('Data exported as CSV', 'success');
  }
};

/* =====================================================
   CAMPUS SIMULATION ENGINE
   ===================================================== */
const CampusSim = {
  zones: {
    'room-a101': { name: 'Classroom A-101', icon: '🏫', occupied: true,  persons: 28, temp: 26.2, hum: 58, energy: 3.2, lights: true  },
    'room-b201': { name: 'Classroom B-201', icon: '🏫', occupied: false, persons: 0,  temp: 28.4, hum: 62, energy: 1.1, lights: true  },
    'comp-lab':  { name: 'Computer Lab',    icon: '💻', occupied: true,  persons: 22, temp: 22.8, hum: 52, energy: 8.4, lights: true  },
    'phys-lab':  { name: 'Physics Lab',     icon: '⚗️', occupied: true,  persons: 15, temp: 24.1, hum: 55, energy: 4.6, lights: true  },
    'library':   { name: 'Library',         icon: '📚', occupied: true,  persons: 35, temp: 23.5, hum: 50, energy: 2.8, lights: true  },
    'admin':     { name: 'Admin Block',     icon: '🏢', occupied: true,  persons: 12, temp: 25.0, hum: 56, energy: 2.1, lights: true  },
    'cafeteria': { name: 'Cafeteria',       icon: '🍽️', occupied: true,  persons: 48, temp: 27.3, hum: 65, energy: 5.5, lights: true  },
    'auditorium':{ name: 'Auditorium',      icon: '🎭', occupied: false, persons: 0,  temp: 29.0, hum: 68, energy: 0.5, lights: false },
  },
  waterLevel: 74,
  airQuality: 142,
  vibration: 0.12,

  step() {
    Object.values(this.zones).forEach(z => {
      z.temp     = clamp(+(z.temp + (Math.random()-0.5)*0.4).toFixed(1), 18, 38);
      z.hum      = clamp(+(z.hum  + (Math.random()-0.5)*1.0).toFixed(1), 30, 90);
      z.energy   = clamp(+(z.energy + (Math.random()-0.5)*0.2).toFixed(2), 0.1, 20);
      if (z.occupied) z.persons = clamp(z.persons + Math.floor((Math.random()-0.5)*3), 0, 60);
    });
    this.waterLevel = clamp(+(this.waterLevel + (Math.random()-0.5)*0.5).toFixed(1), 10, 100);
    this.airQuality = clamp(+(this.airQuality + (Math.random()-0.5)*8).toFixed(0), 50, 400);
    this.vibration  = clamp(+(this.vibration  + (Math.random()-0.5)*0.03).toFixed(3), 0.01, 2);
  },

  injectEvent(type) {
    switch(type) {
      case 'high-occupancy':
        Object.values(this.zones).forEach(z => { z.occupied = true; z.persons = Math.max(z.persons, 20 + Math.floor(Math.random()*30)); });
        break;
      case 'equipment-fault':
        this.vibration = 1.2 + Math.random() * 0.6;
        showToast('⚠️ Equipment fault injected — vibration spiked in Physics Lab', 'warning');
        break;
      case 'power-spike':
        Object.values(this.zones).forEach(z => { z.energy *= 2.5; });
        showToast('⚠️ Power spike injected — check energy readings', 'warning');
        break;
      case 'normal':
        Object.keys(this.zones).forEach(k => {
          const z = this.zones[k];
          z.temp = 24 + Math.random()*4; z.hum = 50 + Math.random()*20; z.energy = 1 + Math.random()*5;
        });
        this.vibration = 0.1 + Math.random()*0.15;
        break;
    }
  },

  getDecisions() {
    const d = [];
    const z = this.zones;
    if (!z['room-b201'].occupied && z['room-b201'].lights)
      d.push({ zone:'Classroom B-201', method:'THRESHOLD RULE', condition:'Unoccupied + lights ON', action:'Recommend: Switch off lights', level:'warning' });
    if (this.airQuality > 200)
      d.push({ zone:'Campus-wide', method:'THRESHOLD RULE', condition:`AQ ${this.airQuality}ppm > 200ppm`, action:'Recommend: Increase ventilation', level:'warning' });
    if (this.vibration > 0.8)
      d.push({ zone:'Physics Lab', method:'THRESHOLD RULE', condition:`Vibration ${this.vibration.toFixed(3)}g > 0.8g`, action:'Alert: Schedule equipment inspection', level:'danger' });
    if (this.waterLevel < 35)
      d.push({ zone:'Water System', method:'THRESHOLD RULE', condition:`Tank level ${this.waterLevel}% < 35%`, action:'Recommend: Enable pump (safety check passed)', level:'warning' });
    if (z['cafeteria'].temp > 28)
      d.push({ zone:'Cafeteria', method:'THRESHOLD RULE', condition:`Temp ${z['cafeteria'].temp}°C > 28°C`, action:'Recommend: Increase cooling', level:'warning' });
    if (!d.length)
      d.push({ zone:'Campus-wide', method:'THRESHOLD RULE', condition:'All parameters normal', action:'No action required', level:'success' });
    return d;
  }
};

/* Export */
window.LabEngine   = LabEngine;
window.CampusSim   = CampusSim;
window.clamp       = window.clamp || ((v,mn,mx) => Math.min(Math.max(v,mn),mx));
