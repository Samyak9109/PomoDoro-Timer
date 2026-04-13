# 🍅 FocusFlow — Pomodoro Timer Chrome Extension

> **Personal vibe-coded project** — built for fun, flow, and getting things done. No roadmap, no stakeholders, just vibes and productivity. ✨

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat-square&logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-orange?style=flat-square)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 📸 Overview

**FocusFlow** is a lightweight Chrome Extension built on the [Pomodoro Technique](https://en.wikipedia.org/wiki/Pomodoro_Technique) — work in focused 25-minute sprints, take structured breaks, and track your tasks as you go. No accounts, no cloud, no fluff. Just you and the timer.

---

## ✨ Features

- **🍅 Pomodoro Timer** — 25-minute focused work sessions with Start / Pause / Reset
- **☕ Flexible Breaks** — Choose 5, 15, or 30 minute breaks
- **🔔 Sound Notifications** — Web Audio API chime when sessions end (no external files)
- **✅ Task Checklist** — Add tasks with Pomodoro estimates and track them in real time
- **🎯 Active Task Tracking** — Link a task to your current session; Pomodoros auto-decrement on completion
- **🔊 Sound Toggle** — Mute notifications when you need silence
- **💾 Persistent State** — Timer keeps running even when the popup is closed, using `chrome.storage.local`
- **🔔 Chrome Notifications** — Native OS-level alerts when sessions complete

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Platform | Chrome Extension — Manifest V3 |
| Frontend | HTML, CSS, JavaScript (Vanilla) |
| Background | Service Worker (`background.js`) |
| Timer Engine | `chrome.alarms` API |
| Storage | `chrome.storage.local` |
| Notifications | Chrome Notifications API + Web Audio API |
| Fonts | Outfit + Space Mono (Google Fonts) |

---

## 📁 Project Structure

```
focusflow/
├── manifest.json       # Extension config (Manifest V3)
├── background.js       # Service worker — timer, alarms, notifications
├── popup.html          # Extension popup UI
├── popup.css           # Styles (dark theme)
├── popup.js            # UI logic, task CRUD, sound
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

## 🚀 Installation (Load Unpacked — Local Dev)

1. **Clone or download** this repository
   ```bash
   git clone https://github.com/your-username/focusflow-extension.git
   ```

2. Open **Google Chrome** and navigate to:
   ```
   chrome://extensions/
   ```

3. Toggle **"Developer mode"** ON (top-right corner)

4. Click **"Load unpacked"**

5. Select the `focusflow/` folder

6. The 🍅 icon will appear in your Chrome toolbar — click to launch!

---

## 🔄 How It Works

```
Open Extension
     │
     ▼
Add a task + Pomodoro estimate
     │
     ▼
Click "START" → 25-min countdown begins
     │
     ▼
⏰ Timer ends → Sound plays + Chrome notification
     │
     ▼
Active task's Pomodoro count decrements automatically
     │
     ▼
Select break (5 / 15 / 30 min) → Break timer runs
     │
     ▼
⏰ Break ends → Sound plays
     │
     ▼
Repeat until tasks are ✅ done!
```

---

## ⚙️ Permissions Used

| Permission | Why |
|---|---|
| `alarms` | Keeps the timer running accurately in the background |
| `storage` | Persists tasks, timer state, and preferences across sessions |
| `notifications` | Shows OS-level alerts when sessions end |

> No data is ever collected or sent anywhere. Everything stays local in your browser.

---

## 🗺️ Roadmap / Future Ideas

These are vibe-based, no promises 😄

- [ ] 📊 Productivity analytics dashboard
- [ ] 🔁 Auto-start break after Pomodoro
- [ ] 🚫 Website blocker during focus sessions
- [ ] ☁️ Sync across devices
- [ ] 📱 Mobile PWA version

---

## 🧑‍💻 About This Project

This is a **personal vibe-coded project** — meaning it was built purely for the joy of building, with no sprints, no tickets, and no product managers. The PRD was a vibe. The design was a vibe. The whole thing is a vibe.

If it helps you focus, great. If you want to fork it and make it yours — even better. Contributions, issues, and PRs are welcome but expectations are chill. 🙌

---

## 📄 License

MIT — do whatever you want with it.

---

<div align="center">
  Made with 🍅 and too much coffee &nbsp;|&nbsp; Built by a developer, for developers
</div>
