# BeInEvent

# 🎟️ Event Reservation Platform

A full-stack web application for managing events and reservations, built with **NestJS**, **Next.js**, **Docker**, and **CI/CD**.

---

## 📌 Description

Organizations such as training centers, companies, associations, or coworking spaces frequently organize events (trainings, workshops, conferences, internal meetings).

This platform centralizes:
- Event management
- Participant reservations
- Role-based access control
- Reservation lifecycle tracking

The application replaces manual processes (Excel, emails, forms) with a **secure, scalable, and automated solution**.

---

## 🚀 Features

### Events
- Create, update, publish, and cancel events
- Public catalog of available events
- Capacity management with remaining seats tracking

### Reservations
- Event reservation with business rules enforcement
- Reservation lifecycle:
  - `PENDING`
  - `CONFIRMED`
  - `REFUSED`
  - `CANCELED`
- PDF ticket generation for confirmed reservations

### Roles
- **Admin**: manage events, validate/refuse reservations, view statistics
- **Participant**: browse events, reserve, cancel, download ticket

---

## 🧑‍💻 Tech Stack

### Back-end
- **NestJS** (TypeScript)
- **MongoDB** or **PostgreSQL**
- JWT Authentication
- Role-based authorization
- DTO validation (`class-validator`)
- Jest (unit & e2e tests)

### Front-end
- **Next.js** + TypeScript
- SSR (public pages)
- CSR (authenticated dashboards)
- Dynamic routing (`/events/[id]`)
- Redux or Context API
- React Testing Library

### DevOps
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Docker Hub (image publishing)

---

## 📁 Project Structure

.
├── backend/
│ ├── src/
│ │ ├── auth/
│ │ ├── events/
│ │ ├── reservations/
│ │ ├── users/
│ │ └── common/
│ └── test/
├── frontend/
│ ├── app/
│ ├── components/
│ ├── services/
│ └── tests/
├── docker-compose.yml
├── .env.example
└── README.md


---

## 🔐 Business Rules

- Event statuses:
  - `DRAFT`, `PUBLISHED`, `CANCELED`
- Only `PUBLISHED` events are publicly visible
- Reservation statuses:
  - `PENDING`, `CONFIRMED`, `REFUSED`, `CANCELED`
- A participant **cannot reserve**:
  - A canceled or unpublished event
  - A full event
  - An event already reserved by them
- Event capacity must never be exceeded
- PDF ticket download is allowed **only for CONFIRMED reservations**

---

## ⚙️ Environment Variables

Create a `.env` file based on the example:

```bash
cp .env.example .env
Example:

JWT_SECRET=your_secret_key
DATABASE_URL=your_database_url
FRONTEND_URL=http://localhost:3000
🐳 Run with Docker
docker-compose up --build
Services:

Front-end → http://localhost:3000

Back-end → http://localhost:3001

Database → Docker container

🧪 Testing
Back-end
cd backend
npm run test
npm run test:e2e
Front-end
cd frontend
npm run test
🔄 CI/CD
GitHub Actions pipeline runs automatically on:

push

pull_request

Jobs
Install & cache dependencies

Lint

Tests

Build

❌ Pipeline fails if lint, tests, or build fails
📦 Docker images are published to Docker Hub

CI secrets (required for Docker publish):
- DOCKERHUB_USERNAME
- DOCKERHUB_TOKEN

📅 Project Management
Project planned and tracked using JIRA

Work organized into:

Epics

User Stories

Tasks & Sub-tasks

GitHub commits reference JIRA tickets:

ERP-23: prevent overbooking on reservations
JIRA automation rule:

Move ticket to Done when related PR is merged

👤 Author
Abdo Taouil
Full Stack Developer

📄 License
This project is developed for educational purposes.


---

If you want next, I can:
- ✅ Add **badges** (build, tests, Docker)
- ✅ Split README into **Backend / Frontend sections**
- ✅ Make it **even shorter** (recruiter-friendly)
- ✅ Align it exactly with **YouCode / jury expectations**

Just tell me 💪

