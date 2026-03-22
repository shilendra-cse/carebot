# CareBot - Personal Health Companion

## Project Overview

**Project Name:** CareBot  
**Type:** Healthcare Web Application  
**Core Summary:** An all-in-one personal health companion that combines symptom analysis, medication management, doctor visit tracking, mental health support, and medical history - all accessible through an intelligent chat interface.  
**Target Audience:** General consumers seeking to manage their health proactively  
**USP:** "Your all-in-one health companion - track, analyze, and understand your health through conversation"

---

## Problem Statement

Many people struggle to manage their health proactively:
- Forget to take medications on time
- Don't know when to see a doctor for symptoms
- Miss important appointments
- Have no easy way to track health history
- Need quick answers to health questions

This app solves multiple pain points in one unified platform.

---

## Features

### 1. Symptom Analysis
- Log current symptoms (name, severity 1-10, duration, body part)
- AI-powered analysis suggesting possible causes
- Recommendations (rest, OTC meds, see a doctor)
- Track symptom history

### 2. Medication Reminders
- Add medications (name, dosage, frequency, times)
- Schedule daily/weekly reminders
- Track taken/missed doses
- Refill alerts when running low

### 3. Doctor Visits Tracker
- Schedule appointments (doctor name, specialty, date, time, location)
- Add visit notes after appointment
- View upcoming and past visits
- Reminders before appointments

### 4. Mental Health Companion
- Daily mood check-in (1-10 scale)
- Journal entries / free text notes
- Track anxiety triggers
- View mood trends over time

### 5. Medical History (Past Problems)
- Record past illnesses/conditions
- Add diagnoses, treatments, dates
- Family medical history
- Allergies and sensitivities

### 6. Smart Health Chat
- Ask questions about any health data
- Get AI insights from logged data
- General health Q&A
- Summarize trends and patterns

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, Tailwind CSS |
| **Backend** | Express.js, TypeScript |
| **Database** | PostgreSQL with Drizzle ORM |
| **Auth** | JWT (jsonwebtoken + bcryptjs) |
| **AI** | OpenAI (Vercel AI SDK) |
| **Deployment** | Docker (dev) |

---

## Database Schema

### Tables

```sql
-- Users
users: id, name, email, password, image, created_at, updated_at

-- Symptoms
symptoms: id, user_id, name, severity, duration, body_part, notes, analyzed, created_at

-- Medications
medications: id, user_id, name, dosage, frequency, times (json), start_date, end_date, active, created_at

-- Medication Logs
medication_logs: id, medication_id, user_id, taken_at, skipped, notes

-- Appointments
appointments: id, user_id, doctor_name, specialty, date, time, location, reason, notes, status, reminder_sent, created_at

-- Mood Logs
mood_logs: id, user_id, mood_score (1-10), anxiety_level (1-10), journal_entry, triggers (json), created_at

-- Medical History
medical_history: id, user_id, condition, diagnosis_date, treatment, doctor, notes, created_at

-- Allergies
allergies: id, user_id, allergen, reaction, severity, created_at
```

---

## User Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      User Signs Up                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Dashboard (Home)                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │Symptoms │ │  Meds   │ │Appts    │ │  Mood   │           │
│  │  ⚠️ 2   │ │ 💊 3    │ │ 📅 1    │ │ 😊 7    │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────┬───────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
    Log Symptom      Add Medication    Quick Chat
```

---

## API Endpoints

### Symptoms
- `POST /api/symptoms` - Log new symptom
- `GET /api/symptoms` - Get symptom history
- `GET /api/symptoms/:id` - Get single symptom
- `PUT /api/symptoms/:id` - Update symptom
- `DELETE /api/symptoms/:id` - Delete symptom
- `POST /api/symptoms/analyze` - AI analysis of symptom

### Medications
- `POST /api/medications` - Add medication
- `GET /api/medications` - List all medications
- `GET /api/medications/:id` - Get medication details
- `PUT /api/medications/:id` - Update medication
- `DELETE /api/medications/:id` - Delete medication
- `POST /api/medications/:id/log` - Log dose taken/skipped
- `GET /api/medications/today` - Get today's schedule

### Appointments
- `POST /api/appointments` - Schedule appointment
- `GET /api/appointments` - List appointments
- `GET /api/appointments/:id` - Get appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment
- `POST /api/appointments/:id/notes` - Add visit notes

### Mood
- `POST /api/mood` - Log mood
- `GET /api/mood` - Get mood history
- `GET /api/mood/trends` - Get mood trends

### Medical History
- `POST /api/history` - Add history entry
- `GET /api/history` - Get all history
- `PUT /api/history/:id` - Update entry
- `DELETE /api/history/:id` - Delete entry

### Chat
- `POST /api/chat` - Send message (existing)

---

## Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page (existing) |
| Sign In | `/signin` | Authentication |
| Dashboard | `/dashboard` | Overview of all health data |
| Symptoms | `/symptoms` | Log & view symptoms |
| Medications | `/medications` | Manage medications |
| Appointments | `/appointments` | Doctor visit tracker |
| Mood | `/mood` | Mental health check-ins |
| History | `/history` | Medical history |
| Chat | `/chat` | AI health assistant |

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Design & implement database schema
- [ ] Set up authentication
- [ ] Create API routes for all features
- [ ] Basic UI layout and navigation

### Phase 2: Core Features (Week 3-4)
- [ ] Dashboard with health summary
- [ ] Symptom logging & analysis
- [ ] Medication management
- [ ] Appointment tracker

### Phase 3: Enhanced Features (Week 5-6)
- [ ] Mental health companion
- [ ] Medical history
- [ ] Enhanced chat with data context

### Phase 4: Polish (Week 7)
- [ ] Charts and visualizations
- [ ] Responsive design
- [ ] Edge cases and error handling
- [ ] Testing and debugging

---

## Success Metrics

- Users can log all health data in one place
- AI provides helpful, accurate symptom analysis
- Medication reminders reduce missed doses
- Easy access to medical history for doctor visits
- Intuitive chat interface for quick queries

---

## Future Enhancements

- Apple Health / Google Fit integration
- Bluetooth device sync (BP monitor, glucometer)
- Family sharing / caregiver features
- Export health reports (PDF)
- Multi-language support
- Push notifications
- Prescription scanning (OCR)

---

## Notes for College Project

- Focus on solving **one** problem really well in MVP
- Document your design decisions
- Show the app to potential users for feedback
- Emphasize the "real problem" your app solves
