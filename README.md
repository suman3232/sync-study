# 📚 SyncStudy – Collaborative Study Rooms

🔗 Live Demo: https://sync-study-delta.vercel.app

SyncStudy is a real-time collaborative study platform that allows users to study together in virtual rooms with shared focus tools like Pomodoro timers, notes, and chat. The platform is designed to improve focus, accountability, and group productivity.

---

## 🚀 Features

- Email & password authentication using Supabase
- Create and join collaborative study rooms
- Shared Pomodoro timer (25/5 default) synchronized for all users
- Real-time collaborative notes with auto-save
- Room-based real-time chat
- Live participants panel with online status
- Clean, minimal, and responsive UI

---

## 🛠️ Tech Stack

**Frontend**
- React (Vite)
- TypeScript
- Tailwind CSS

**Backend**
- Supabase (Authentication, PostgreSQL, Realtime)

**Deployment**
- Vercel

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
