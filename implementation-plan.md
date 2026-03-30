# Implementation Plan

## Phase 1: Project Setup & Foundation

- [ ] 1.1 Initialize monorepo structure (`/backend`, `/frontend`)
- [ ] 1.2 Set up backend: Node.js + Express + TypeScript, folder structure (routes, controllers, middleware, services)
- [ ] 1.3 Set up frontend: Vite + React + TypeScript + React Router, folder structure (pages, components, hooks, services)
- [ ] 1.4 Set up PostgreSQL with Prisma, initial config and connection
- [ ] 1.5 Set up environment variables and config management
- [ ] 1.6 Set up Docker and docker-compose for local development (backend, frontend, postgres)

## Phase 2: Database Schema & Models

- [ ] 2.1 Design and create Prisma schema: User model (id, email, name, password, role: ADMIN/AGENT)
- [ ] 2.2 Add Prisma schema: Ticket model (id, subject, body, status: OPEN/RESOLVED/CLOSED, category: GENERAL/TECHNICAL/REFUND, createdAt, updatedAt)
- [ ] 2.3 Add Prisma schema: Ticket-Agent relationship (assignedTo)
- [ ] 2.4 Add Prisma schema: Message model (id, ticketId, sender, body, createdAt) for conversation threads
- [ ] 2.5 Add Prisma schema: Session model for DB session auth
- [ ] 2.6 Run initial migration and seed script (create default admin user)

## Phase 3: Authentication & User Management

- [ ] 3.1 Implement password hashing (bcrypt)
- [ ] 3.2 Implement session middleware (express-session + connect-pg-simple)
- [ ] 3.3 Build auth routes: POST /auth/login, POST /auth/logout, GET /auth/me
- [ ] 3.4 Build role-based authorization middleware (admin-only, agent-only, authenticated)
- [ ] 3.5 Build admin routes: CRUD agents (POST /users, GET /users, DELETE /users/:id)
- [ ] 3.6 Frontend: Login page
- [ ] 3.7 Frontend: Auth context/provider, protected routes
- [ ] 3.8 Frontend: Admin — agent management page (list, create, delete agents)

## Phase 4: Core Ticket System

- [ ] 4.1 Build ticket routes: GET /tickets (list, with filters by status/category/assignee), GET /tickets/:id
- [ ] 4.2 Build ticket routes: POST /tickets (create), PATCH /tickets/:id (update status, assign agent)
- [ ] 4.3 Build message routes: GET /tickets/:id/messages, POST /tickets/:id/messages
- [ ] 4.4 Frontend: Ticket list/dashboard page (filterable by status, category)
- [ ] 4.5 Frontend: Ticket detail page (view ticket info, message thread)
- [ ] 4.6 Frontend: Create ticket form (for manual ticket creation)
- [ ] 4.7 Frontend: Update ticket status, assign to agent
- [ ] 4.8 Frontend: Reply to ticket (compose message within ticket)

## Phase 5: Email Integration

- [ ] 5.1 Research and finalize email provider (Mailchimp transactional / Mailgun / SendGrid / IMAP)
- [ ] 5.2 Implement email pulling service: fetch incoming emails on a schedule
- [ ] 5.3 Parse incoming emails and auto-create tickets (subject, body, sender email)
- [ ] 5.4 Implement email sending service: send replies from the system as emails
- [ ] 5.5 Link email replies back to existing ticket threads (thread detection)
- [ ] 5.6 Build background job/cron for periodic email polling

## Phase 6: AI Features

- [ ] 6.1 Set up AI service layer (Claude API integration, abstracted so provider can be swapped)
- [ ] 6.2 Auto-categorization: classify incoming tickets into General/Technical/Refund
- [ ] 6.3 AI ticket summary: generate a summary for agents on the ticket detail page
- [ ] 6.4 AI suggested replies: generate 1-3 reply suggestions for agents to choose/edit
- [ ] 6.5 AI auto-response: for simple/common queries, draft and send automatic replies
- [ ] 6.6 Response improvement: agent writes a draft, AI polishes tone/grammar/completeness
- [ ] 6.7 Human escalation logic: AI flags tickets it can't handle confidently for agent review

## Phase 7: Dashboard & Analytics

- [ ] 7.1 Backend: GET /stats endpoint (open/resolved/closed counts, tickets per category, avg response time)
- [ ] 7.2 Frontend: Admin dashboard with ticket stats and overview charts
- [ ] 7.3 Frontend: Agent dashboard — assigned tickets, quick actions

## Phase 8: Polish & Deployment

- [ ] 8.1 Error handling and input validation across all endpoints
- [ ] 8.2 Loading states, error states, and empty states across all frontend pages
- [ ] 8.3 Responsive design pass
- [ ] 8.4 Production Dockerfiles (backend + frontend)
- [ ] 8.5 Railway deployment config (services, env vars, managed Postgres)
- [ ] 8.6 End-to-end testing of full flow: email in -> ticket created -> AI categorizes -> agent responds -> email out
