# StudyOrbit 🚀

### AI-Powered Academic Command Center

StudyOrbit is a full-stack AI-powered productivity and career workspace designed for students.

It brings your **documents, tasks, calendar, focus sessions, career planning, notifications, profile data, and AI assistance** into one authenticated workspace.

Instead of switching between multiple productivity tools, StudyOrbit provides one private environment where your academic and career information can be organized, searched, analyzed, and acted upon.

---

## ✨ Why StudyOrbit?

Students often manage their academic life across multiple disconnected tools:

- 📄 PDFs and study documents
- 📝 Notes and saved resources
- 📅 Deadlines and calendar events
- ⏱️ Focus sessions
- 🎯 Career goals
- 📊 Skills and career readiness
- 🔔 Deadline notifications
- 🤖 AI assistance

StudyOrbit brings these workflows together into one context-aware platform.

> **One workspace for studying, focusing, organizing, and planning your career.**

---

# 🌟 Core Features

## 🔐 Secure Authentication

StudyOrbit uses Firebase Authentication with protected server sessions.

### Supported authentication

- Email & password login
- Email & password signup
- Google authentication
- Google account chooser
- Forgot-password flow
- Logout
- Persistent authenticated sessions
- Server-side session verification

### Security principles

- No guest access
- No demo user creation
- No automatic dashboard access
- Protected authenticated routes
- Server-side page authentication
- API authentication
- User-specific database records

Unauthenticated users cannot access the private workspace.

---

# 🏠 Landing Page

The landing page introduces StudyOrbit and directs users toward authentication.

### Includes

- StudyOrbit branding
- Product overview
- Feature highlights
- Workspace visualization
- Get Started CTA
- Sign In CTA
- Responsive layout

---

# 📊 Dashboard

The Dashboard acts as the student's academic command center.

It surfaces real user data such as:

- Today's tasks
- Upcoming deadlines
- Focus minutes
- Recent documents
- Career goals
- Workspace activity
- AI entry point

The dashboard does **not** use fake demo records or seeded user activity.

When data is unavailable, StudyOrbit shows contextual empty states instead.

---

# 📚 Documents

StudyOrbit provides a dedicated document workspace for academic material.

### Features

- Upload documents
- PDF/DOCX processing
- Document search
- Document filtering
- Tags
- Folder organization
- Rename documents
- Move documents
- Document preview
- Download documents
- Delete documents
- Resource links

Documents are associated with the authenticated user's profile.

---

# 📅 Calendar

The Calendar provides a structured view of academic schedules and deadlines.

### Features

- Calendar events
- Deadline tracking
- Month-based view
- Event organization
- Responsive calendar layout
- Event overflow handling
- Upcoming deadline visibility

The interface is optimized to remain usable on smaller screens without crushed calendar cells.

---

# ⏱️ Focus

StudyOrbit includes a dedicated focus environment for productive study sessions.

### Features

- Focus timer
- Study sessions
- Session tracking
- Focus statistics
- Responsive timer controls
- Focus history

Focus activity is associated with the authenticated user.

---

# 🌿 Relax

Relax provides a lightweight wellness and recovery environment designed around focused study breaks.

### Features

- Ambient experiences
- Nature sounds
- Music
- Breathing exercises
- Mood tracking
- Relax sessions
- Session history

Relax activity is stored against the authenticated user's profile where applicable.

---

# 🎯 Career

StudyOrbit provides a career-planning workspace for students.

### Features

- Career profile
- Education information
- Skills
- Interests
- Career goals
- Career readiness
- Skill-gap information
- Career roadmaps
- AI-assisted career analysis

Career information is private to the authenticated user.

---

# 🔔 Notifications

StudyOrbit provides deadline-aware notifications.

The reminder system focuses on meaningful deadlines rather than generating unnecessary inbox noise.

### Current reminder logic

Notifications can be generated for:

- Overdue tasks/events
- Deadlines within the next 48 hours

A duplicate guard prevents repeated deadline alerts within the configured window.

---

# 🤖 AI Workspace

StudyOrbit includes an AI-powered workspace for interacting with academic and career context.

### AI capabilities include

- AI chat
- Conversation history
- Context-aware assistance
- Document-related AI workflows
- Career analysis
- Resume analysis
- AI-powered recommendations

The AI layer is designed to work with authenticated user context rather than a shared demo identity.

---

# 👤 Profile

The Profile area contains the user's academic and career identity.

### Profile information

- Name
- Email
- Avatar
- Education
- College
- Degree
- Skills
- Interests
- Career goals
- LinkedIn
- GitHub
- Career readiness

Profile information is linked to the authenticated Firebase identity.

---

# 🧠 User Data Isolation

Every authenticated user receives a private `UserProfile`.

User records are scoped using the internal user profile relationship.

This keeps data such as:

- Documents
- Events
- Focus sessions
- Career information
- Goals
- Notifications
- Mood entries
- AI-related records

associated with the correct authenticated user.

StudyOrbit does not intentionally create a shared guest workspace.

---

# 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │      StudyOrbit     │
                    │    Web Application  │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
        ┌────────▼────────┐        ┌─────────▼────────┐
        │   Next.js UI    │        │   Authentication  │
        │   React / App   │        │     Firebase      │
        │     Router      │        └─────────┬────────┘
        └────────┬────────┘                  │
                 │                           │
                 └─────────────┬─────────────┘
                               │
                       ┌───────▼────────┐
                       │ Next.js API    │
                       │ Route Handlers │
                       └───────┬────────┘
                               │
                    ┌──────────▼──────────┐
                    │       Prisma       │
                    │        ORM         │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │    PostgreSQL DB    │
                    └─────────────────────┘

                               │
                    ┌──────────▼──────────┐
                    │     AI Services     │
                    │ Gemini / AI Provider │
                    └─────────────────────┘
