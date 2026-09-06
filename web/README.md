# Apex Learn Web

> Admin and content management web app for Apex Learn — built with React, Vite, and Tailwind CSS

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2.8 | UI library |
| Vite | 8.2.0 | Build tool + dev server |
| TypeScript | 6.0.3 | Type safety |
| Tailwind CSS | 4.3.3 | Styling |
| TipTap | 3.30.x | Rich text editor with LaTeX |
| KaTeX | 0.18.4 | LaTeX rendering |
| React Router | 7.18.2 | Client-side routing |
| Axios | 1.19.0 | HTTP client |
| React Query | 5.101.4 | Server state management |
| oxlint | 1.76.0 | Linting |

## Features

- **Set Password** — Invited users (teachers, students) set their password with school/role/subject selection
- **Teacher Management** — Assign up to 2 subjects per teacher
- **Rich Text Editor** — TipTap with:
  - LaTeX formula support (`$...$` inline, `$$...$$` block) via `@tiptap/extension-mathematics` + KaTeX
  - Code blocks with syntax highlighting (`@tiptap/extension-code-block-lowlight` + lowlight)
  - Images, links, text alignment, highlight, underline
  - Placeholder text
- **Forgot Password** — Request password reset via email

## Getting Started

```bash
cd atlas-learn-client/web
npm install
npm run dev
```

Opens at http://localhost:8081

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript compile + Vite build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run oxlint |

## Project Structure

```
src/
├── pages/
│   ├── Login.tsx              # Email/password + OTP login
│   ├── Signup.tsx             # New user registration
│   ├── SetPassword.tsx        # Set password for invited users
│   ├── ForgotPassword.tsx     # Request password reset
│   ├── Teachers.tsx           # Teacher management (admin)
│   └── Profile.tsx            # User profile
├── components/
│   ├── TipTapEditor.tsx       # Rich text editor with LaTeX toolbar
│   └── ...
├── lib/
│   ├── api.ts                 # Axios API client
│   └── ...
├── App.tsx                    # Router setup
├── main.tsx                   # Entry point
└── index.html
```

## Environment

Server API URL configured in the API client (defaults to `https://atlas-learn-server-production.up.railway.app/api/v1`).

## Branding

- Dark teal (`#084A59`) primary buttons — never yellow on white
- Gold (`#F2B138`) for accents and highlights
- Tailwind CSS theme: `--color-primary`, `--color-primary-dark`, `--color-accent`

## Linting

Uses oxlint (configured in `.oxlintrc.json`). Type-aware lint rules can be enabled by installing `oxlint-tsgolint`.
