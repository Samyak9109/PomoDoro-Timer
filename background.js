// FocusFlow – background.js (Service Worker, Manifest V3)

const ALARM = "focusflow_tick";

const DEFAULT_STATE = {
  phase: "work",           // "work" | "break"
  isRunning: false,
  timeLeft: 25 * 60,      // seconds
  totalTime: 25 * 60,
  breakDuration: 5,        // minutes: 5 | 15 | 30
  soundEnabled: true,
  pomodorosCompleted: 0,
  lastTick: null,
  activeTaskId: null
};

// ── Install: seed storage ──────────────────────────────────────
chrome.runtime.onInstalled.addListener(async () => {
  const { timerState } = await chrome.storage.local.get("timerState");
  if (!timerState) {
    await chrome.storage.local.set({ timerState: DEFAULT_STATE, tasks: [] });
  }
});

// ── Message handler ───────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  dispatch(msg).then(sendResponse).catch(err => sendResponse({ error: err.message }));
  return true;
});

async function dispatch(msg) {
  let { timerState, tasks } = await chrome.storage.local.get(["timerState", "tasks"]);
  let state = timerState || { ...DEFAULT_STATE };
  tasks = tasks || [];

  // Sync elapsed time if running
  if (state.isRunning && state.lastTick) {
    const elapsed = Math.floor((Date.now() - state.lastTick) / 1000);
    state.timeLeft = Math.max(0, state.timeLeft - elapsed);
    state.lastTick = Date.now();
  }

  switch (msg.action) {

    case "GET_STATE":
      await chrome.storage.local.set({ timerState: state });
      return { state, tasks };

    case "START":
      if (state.timeLeft <= 0) {
        // Reset before starting
        state.timeLeft = state.phase === "work" ? 25 * 60 : state.breakDuration * 60;
        state.totalTime = state.timeLeft;
      }
      state.isRunning = true;
      state.lastTick = Date.now();
      await chrome.alarms.clear(ALARM);
      chrome.alarms.create(ALARM, { periodInMinutes: 1 / 60 });
      await chrome.storage.local.set({ timerState: state });
      return { state, tasks };

    case "PAUSE":
      state.isRunning = false;
      state.lastTick = null;
      await chrome.alarms.clear(ALARM);
      await chrome.storage.local.set({ timerState: state });
      return { state, tasks };

    case "RESET":
      await chrome.alarms.clear(ALARM);
      state.isRunning = false;
      state.lastTick = null;
      state.timeLeft = state.phase === "work" ? 25 * 60 : state.breakDuration * 60;
      state.totalTime = state.timeLeft;
      await chrome.storage.local.set({ timerState: state });
      return { state, tasks };

    case "SET_PHASE": {
      await chrome.alarms.clear(ALARM);
      state.phase = msg.phase;
      state.isRunning = false;
      state.lastTick = null;
      state.timeLeft = msg.phase === "work" ? 25 * 60 : state.breakDuration * 60;
      state.totalTime = state.timeLeft;
      await chrome.storage.local.set({ timerState: state });
      return { state, tasks };
    }

    case "SET_BREAK":
      state.breakDuration = msg.duration;
      if (state.phase === "break" && !state.isRunning) {
        state.timeLeft = msg.duration * 60;
        state.totalTime = state.timeLeft;
      }
      await chrome.storage.local.set({ timerState: state });
      return { state, tasks };

    case "TOGGLE_SOUND":
      state.soundEnabled = !state.soundEnabled;
      await chrome.storage.local.set({ timerState: state });
      return { state, tasks };

    case "SET_ACTIVE_TASK":
      state.activeTaskId = msg.taskId;
      await chrome.storage.local.set({ timerState: state });
      return { state, tasks };

    // ── Task CRUD ──────────────────────────────────────────────
    case "ADD_TASK": {
      const task = {
        id: Date.now().toString(),
        name: msg.name,
        pomodoros: msg.pomodoros,
        remaining: msg.pomodoros,
        done: false,
        createdAt: Date.now()
      };
      tasks.push(task);
      await chrome.storage.local.set({ tasks });
      return { state, tasks };
    }

    case "DELETE_TASK": {
      tasks = tasks.filter(t => t.id !== msg.id);
      if (state.activeTaskId === msg.id) state.activeTaskId = null;
      await chrome.storage.local.set({ tasks, timerState: state });
      return { state, tasks };
    }

    case "TOGGLE_TASK": {
      tasks = tasks.map(t => t.id === msg.id ? { ...t, done: !t.done } : t);
      await chrome.storage.local.set({ tasks });
      return { state, tasks };
    }

    default:
      return { state, tasks };
  }
}

// ── Alarm tick ─────────────────────────────────────────────────
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM) return;

  let { timerState, tasks } = await chrome.storage.local.get(["timerState", "tasks"]);
  if (!timerState?.isRunning) return;

  const elapsed = timerState.lastTick
    ? Math.floor((Date.now() - timerState.lastTick) / 1000)
    : 1;

  timerState.timeLeft = Math.max(0, timerState.timeLeft - elapsed);
  timerState.lastTick = Date.now();

  if (timerState.timeLeft <= 0) {
    // ── Session complete ──────────────────────────────────────
    timerState.isRunning = false;
    timerState.lastTick = null;
    await chrome.alarms.clear(ALARM);

    if (timerState.phase === "work") {
      timerState.pomodorosCompleted = (timerState.pomodorosCompleted || 0) + 1;

      // Decrement active task
      if (timerState.activeTaskId && tasks) {
        tasks = tasks.map(t => {
          if (t.id === timerState.activeTaskId) {
            const remaining = Math.max(0, t.remaining - 1);
            return { ...t, remaining, done: remaining === 0 };
          }
          return t;
        });
        await chrome.storage.local.set({ tasks });
      }
    }

    // Notification
    const isWork = timerState.phase === "work";
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: isWork ? "🍅 Pomodoro Complete!" : "⏰ Break Over!",
      message: isWork ? "Take a well-earned break." : "Back to focus — you've got this!",
      priority: 2
    });

    // Auto-switch phase
    const nextPhase = isWork ? "break" : "work";
    timerState.phase = nextPhase;
    timerState.timeLeft = nextPhase === "work"
      ? 25 * 60
      : timerState.breakDuration * 60;
    timerState.totalTime = timerState.timeLeft;
  }

  await chrome.storage.local.set({ timerState });
});
