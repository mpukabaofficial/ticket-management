# Ticket Management System

## Project Overview
AI-powered ticket management system for an online school. See `project-scope.md` for full scope and `tech-stack.md` for stack decisions.

## Tech Stack
- **Backend:** Node.js + Express + TypeScript (Bun runtime)
- **Frontend:** Vite + React + TypeScript + React Router
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** Database sessions
- **Deployment:** Docker + Railway

## Project Structure
- `backend/` — Express API server
- `frontend/` — Vite React SPA
- `docker-compose.yml` — Local dev environment (Postgres, backend, frontend)

## Development
- Use `bun` as the package manager and runtime
- Backend runs on port 3000, frontend on port 5173
- `cd backend && bun run dev` — start backend with watch mode
- `cd frontend && bun run dev` — start frontend with HMR

## Documentation
- Always use **Context7** MCP server to fetch up-to-date documentation for any library, framework, or tool used in this project before writing code or giving advice. Do not rely solely on training data.
