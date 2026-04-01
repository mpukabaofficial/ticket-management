# Notes

## To Revisit
- Should admins be able to delete other admin users? Currently all ADMIN role users are protected from deletion.

## Polish button improvements
- Give the polish prompt access to the knowledge base so replies are grounded in actual policies
- Include the conversation history so the polished reply has full context
- Apply the same formatting rules as auto-resolve (first name greeting, paragraphs over bullets, "Best regards, Code with Mosh Support" sign-off)

## Testing strategy

- Reduce auth-related E2E tests — move validation, error handling, and guard logic into unit tests instead.
- E2E tests should only cover auth flows that require a real backend and database (e.g., login happy path, session persistence across navigation, cookie-based redirects).
- Schema validation (missing fields, invalid input, trimming), route guard rendering, and error display should be covered by unit tests, not E2E.
