// FocusFlow — popup.js
// All UI state, event wiring, and message passing to background.js

// ── DOM refs ───────────────────────────────────────────────────
const timeDisplay  = document.getElementById("timeDisplay");
const phaseLabel   = document.getElementById("phaseLabel");
const ringFill     = document.getElementById("ringFill");
const startBtn     = document.getElementById("startBtn");
const resetBtn     = document.getElementById("resetBtn");
const soundBtn     = document.getElementById("soundBtn");
const soundIcon    = document.getElementById("soundIcon");
const pomoCount    = document.getElementById("pomoCount");
const tabWork      = document.getElementById("tabWork");
const tabBreak     = document.getElementById("tabBreak");
const breakRow     = document.getElementById("breakRow");
const taskInput    = document.getElementById("taskInput");
const pomoInput    = document.getElementById("pomoInput");
const addTaskBtn   = document.getElementById("addTaskBtn");
const taskList     = document.getElementById("taskList");
const emptyState   = document.getElementById("emptyState");
const brandDot     = document.querySelector(".brand-dot");

// Ring circumference for r=78: 2πr ≈ 490
const CIRCUMFERENCE = 490;

// ── Local UI state ─────────────────────────────────────────────
let state = null;
let tasks = [];
let tickInterval = null;

// ── Init ───────────────────────────────────────────────────────
async function init() {
  const res = await sendMsg({ action: "GET_STATE" });
  state = res.state;
  tasks = res.tasks || [];
  render();
  if (state.isRunning) startLocalTick();
}

// ── Message helper ─────────────────────────────────────────────
function sendMsg(msg) {
  return new Promise(resolve => chrome.runtime.sendMessage(msg, resolve));
}

// ── Local tick for smooth countdown ───────────────────────────
function startLocalTick() {
  stopLocalTick();
  tickInterval = setInterval(() => {
    if (!state.isRunning) { stopLocalTick(); return; }
    state.timeLeft = Math.max(0, state.timeLeft - 1);
    updateTimerDisplay();
    updateRing();
    if (state.timeLeft <= 0) {
      stopLocalTick();
      playDoneSound();
      // Re-sync from background after session completes
      setTimeout(async () => {
        const res = await sendMsg({ action: "GET_STATE" });
        state = res.state;
        tasks = res.tasks || [];
        render();
      }, 800);
    }
  }, 1000);
}

function stopLocalTick() {
  if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
}

// ── Render ─────────────────────────────────────────────────────
function render() {
  if (!state) return;
  updateTimerDisplay();
  updateRing();
  updateControls();
  updateTabs();
  updateBreakOpts();
  updateSound();
  updatePomoCount();
  renderTasks();
}

function updateTimerDisplay() {
  const m = Math.floor(state.timeLeft / 60).toString().padStart(2, "0");
  const s = (state.timeLeft % 60).toString().padStart(2, "0");
  timeDisplay.textContent = `${m}:${s}`;

  const labels = {
    running_work:  "FOCUSING",
    running_break: "ON BREAK",
    paused_work:   "PAUSED",
    paused_break:  "PAUSED",
    idle_work:     "READY",
    idle_break:    "READY"
  };
  const key = state.isRunning
    ? `running_${state.phase}`
    : `idle_${state.phase}`;
  phaseLabel.textContent = labels[key] || "READY";
}

function updateRing() {
  const progress = state.totalTime > 0
    ? state.timeLeft / state.totalTime
    : 1;
  const offset = CIRCUMFERENCE * (1 - progress);
  ringFill.style.strokeDashoffset = offset;

  if (state.phase === "break") {
    ringFill.classList.add("break-ring");
  } else {
    ringFill.classList.remove("break-ring");
  }
}

function updateControls() {
  if (state.isRunning) {
    startBtn.textContent = "PAUSE";
    startBtn.className   = "btn-main pause";
    brandDot.style.animationPlayState = "running";
  } else {
    startBtn.textContent = state.timeLeft <= 0 ? "RESTART" : "START";
    startBtn.className   = state.phase === "break"
      ? "btn-main break-btn"
      : "btn-main";
    brandDot.style.animationPlayState = "paused";
  }
}

function updateTabs() {
  tabWork.classList.toggle("active", state.phase === "work");
  tabBreak.classList.toggle("active", state.phase === "break");
  breakRow.style.display = state.phase === "break" ? "flex" : "none";
}

function updateBreakOpts() {
  document.querySelectorAll(".break-opt").forEach(btn => {
    btn.classList.toggle("active", +btn.dataset.mins === state.breakDuration);
  });
}

function updateSound() {
  if (state.soundEnabled) {
    soundIcon.innerHTML = `
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>`;
    soundBtn.classList.remove("muted-sound");
  } else {
    soundIcon.innerHTML = `
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <line x1="23" y1="9" x2="17" y2="15"></line>
      <line x1="17" y1="9" x2="23" y2="15"></line>`;
    soundBtn.classList.add("muted-sound");
  }
}

function updatePomoCount() {
  pomoCount.textContent = state.pomodorosCompleted || 0;
}

// ── Task Rendering ─────────────────────────────────────────────
function renderTasks() {
  const items = tasks.filter(t => !t.done).concat(tasks.filter(t => t.done));

  if (items.length === 0) {
    taskList.innerHTML = '';
    taskList.appendChild(createEmptyState());
    return;
  }

  taskList.innerHTML = '';
  items.forEach(task => {
    taskList.appendChild(createTaskEl(task));
  });
}

function createEmptyState() {
  const div = document.createElement("div");
  div.className = "empty-state";
  div.textContent = "No tasks yet. Add one above ↑";
  return div;
}

function createTaskEl(task) {
  const isActive = state.activeTaskId === task.id;
  const div = document.createElement("div");
  div.className = `task-item${isActive ? " active-task" : ""}${task.done ? " done-task" : ""}`;
  div.dataset.id = task.id;

  // Active dot
  if (isActive) {
    const dot = document.createElement("div");
    dot.className = "active-dot";
    div.appendChild(dot);
  }

  // Checkbox
  const check = document.createElement("div");
  check.className = `task-check${task.done ? " checked" : ""}`;
  check.addEventListener("click", e => { e.stopPropagation(); toggleTask(task.id); });
  div.appendChild(check);

  // Name
  const name = document.createElement("div");
  name.className = `task-name${task.done ? " strikethrough" : ""}`;
  name.textContent = task.name;
  div.appendChild(name);

  // Pomo count
  const pomos = document.createElement("div");
  pomos.className = "task-pomos";
  pomos.innerHTML = `🍅 <span>${task.remaining}/${task.pomodoros}</span>`;
  div.appendChild(pomos);

  // Delete
  const del = document.createElement("button");
  del.className = "task-del";
  del.innerHTML = "×";
  del.title = "Delete task";
  del.addEventListener("click", e => { e.stopPropagation(); deleteTask(task.id); });
  div.appendChild(del);

  // Click row = set active task
  div.addEventListener("click", () => setActiveTask(task.id));

  return div;
}

// ── Task Actions ───────────────────────────────────────────────
async function addTask() {
  const name = taskInput.value.trim();
  const pomodoros = Math.max(1, Math.min(20, parseInt(pomoInput.value) || 1));
  if (!name) { taskInput.focus(); return; }

  const res = await sendMsg({ action: "ADD_TASK", name, pomodoros });
  state = res.state;
  tasks = res.tasks;
  taskInput.value = "";
  pomoInput.value = 1;
  renderTasks();
}

async function deleteTask(id) {
  const res = await sendMsg({ action: "DELETE_TASK", id });
  state = res.state;
  tasks = res.tasks;
  renderTasks();
}

async function toggleTask(id) {
  const res = await sendMsg({ action: "TOGGLE_TASK", id });
  state = res.state;
  tasks = res.tasks;
  renderTasks();
}

async function setActiveTask(id) {
  const newId = state.activeTaskId === id ? null : id;
  const res = await sendMsg({ action: "SET_ACTIVE_TASK", taskId: newId });
  state = res.state;
  tasks = res.tasks;
  renderTasks();
}

// ── Sound ──────────────────────────────────────────────────────
function playDoneSound() {
  if (!state.soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99]; // C5 E5 G5
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  } catch (e) { /* sound unavailable */ }
}

// ── Event Listeners ────────────────────────────────────────────

// Start / Pause
startBtn.addEventListener("click", async () => {
  const action = state.isRunning ? "PAUSE" : "START";
  const res = await sendMsg({ action });
  state = res.state;
  tasks = res.tasks;
  if (state.isRunning) startLocalTick(); else stopLocalTick();
  render();
});

// Reset
resetBtn.addEventListener("click", async () => {
  stopLocalTick();
  const res = await sendMsg({ action: "RESET" });
  state = res.state;
  tasks = res.tasks;
  render();
});

// Sound toggle
soundBtn.addEventListener("click", async () => {
  const res = await sendMsg({ action: "TOGGLE_SOUND" });
  state = res.state;
  updateSound();
});

// Phase tabs
[tabWork, tabBreak].forEach(tab => {
  tab.addEventListener("click", async () => {
    if (tab.dataset.phase === state.phase) return;
    stopLocalTick();
    const res = await sendMsg({ action: "SET_PHASE", phase: tab.dataset.phase });
    state = res.state;
    tasks = res.tasks;
    render();
  });
});

// Break duration
document.querySelectorAll(".break-opt").forEach(btn => {
  btn.addEventListener("click", async () => {
    const mins = parseInt(btn.dataset.mins);
    const res = await sendMsg({ action: "SET_BREAK", duration: mins });
    state = res.state;
    updateBreakOpts();
    if (state.phase === "break") updateTimerDisplay();
  });
});

// Add task
addTaskBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", e => { if (e.key === "Enter") addTask(); });

// ── Kick off ───────────────────────────────────────────────────
init();
