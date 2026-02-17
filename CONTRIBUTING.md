# Contributing to SutraID

Thank you for your interest in contributing to SutraID! This project is being prepared for **open-source, production-grade, and self-hosted** usage. Contributions of all kinds are welcome: bug reports, documentation, tests, and new features.

By participating in this project, you agree to follow the **`CODE_OF_CONDUCT.md`**.

---

## How to Get Started

### 1. Fork and Clone

1. Fork the repository on GitHub.
2. Clone your fork:

```bash
git clone https://github.com/<your-username>/SutraID.git
cd SutraID
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/gowthamkiam/SutraID.git
```

### 2. Install Prerequisites

- **Node.js**: 20 or later
- **pnpm**: 8 or later
- **Docker**: 24+ (for the Docker-based workflow)
- **PostgreSQL**: 15+ (if running without Docker)

### 3. Install Dependencies

From the repository root:

```bash
pnpm install
```

### 4. Environment Configuration

1. Copy the root environment template:

```bash
cp .env.example .env
```

2. Copy the app-specific templates (optional but recommended):

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env.local
```

3. Fill in all required environment variables with **non-production** values.  
   - Do **not** commit real secrets.
   - Use placeholder or local-only credentials.

See the **Environment Variables Explained** section in `README.md` for details.

### 5. Run the Stack (Local)

#### Option A: With Docker (recommended)

```bash
docker-compose up --build
```

This will start:

- `db` – PostgreSQL
- `backend` – NestJS API on `http://localhost:3000`
- `web` – Next.js frontend on `http://localhost:3001`

#### Option B: Without Docker

1. Start PostgreSQL locally and ensure `DATABASE_URL` is set correctly.
2. Apply Prisma migrations:

```bash
cd apps/backend
pnpm prisma:migrate
```

3. Start backend and frontend in separate terminals:

```bash
cd apps/backend
pnpm dev

cd ../web
pnpm dev
```

---

## Development Workflow

### Branching

- Use **`dev`** as the default development branch.
- Keep **`main`** stable and releasable.
- For contributions, create feature branches:

```bash
git checkout dev
git pull upstream dev
git checkout -b feature/my-change
```

### Code Style & Linting

- Backend (NestJS / TypeScript):
  - Run `pnpm lint` at the root, or `pnpm lint` inside `apps/backend`.
- Frontend (Next.js / React):
  - Run `pnpm lint` at the root, or `pnpm lint` inside `apps/web`.

Please ensure:

- TypeScript types pass
- ESLint passes
- No obvious security issues are introduced

### Testing

- Backend:

```bash
cd apps/backend
pnpm test
```

- Frontend:

```bash
cd apps/web
pnpm lint
```

(Front-end tests can be expanded over time.)

---

## Submitting Changes

1. **Update / add tests** for your change where appropriate.
2. Run the full validation suite from the repo root:

```bash
pnpm lint
pnpm test
pnpm build
```

3. Commit your changes with a clear, descriptive message:

```bash
git commit -s -m "feat: short summary of change"
```

4. Push your branch to your fork and open a Pull Request against the `dev` branch of the main repository.

### Pull Request Guidelines

- Describe **what** the change does and **why** it’s needed.
- Note any breaking changes or migration steps.
- Reference related issues (e.g. `Closes #123`).
- Confirm you have not committed secrets or sensitive data.

---

## Security & Secrets

- Do **not** include API keys, passwords, JWT secrets, or database URLs with real credentials in:
  - Code
  - Configuration files
  - Git history
  - Issue descriptions or PRs
- Use the placeholders defined in `.env.example` instead.

If you believe you have found a security vulnerability, **do not** open a public issue.  
Follow the process described in `SECURITY.md` instead.

---

## Community and Support

- Be respectful and follow `CODE_OF_CONDUCT.md`.
- Use GitHub Issues for:
  - Bug reports
  - Feature requests
  - Documentation improvements

Thank you for helping make SutraID better for everyone.

