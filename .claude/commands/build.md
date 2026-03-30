Run the following steps in order:

1. **Tests** — Run `cd frontend && bun run test:e2e` (requires test database to be running)
2. **Type-check** — Run `cd backend && bun run typecheck` and `cd frontend && bun run typecheck`
3. **Lint** — Run `cd frontend && bun run lint`
4. **Build** — Run `cd frontend && bun run build`

If any step fails, fix ALL errors — including preexisting ones — and re-run the failing step until it passes before moving on.

Once all steps pass, review the current state of the project — file structure, recent git commits, tech stack, dev commands, and any new patterns or conventions. Then update CLAUDE.md at the project root to accurately reflect the project.

Keep the format concise and useful for future Claude sessions. Do not remove existing sections that are still accurate — only add, update, or remove outdated information.
