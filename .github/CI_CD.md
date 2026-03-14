# CI/CD Pipeline Documentation

Complete reference for all GitHub Actions workflows, secrets, and troubleshooting.

## Workflows Overview

| Workflow | File | Triggers | Purpose |
|-|-|-|-|
| Azure Deploy | `azure-deploy.yml` | Push/PR to main (API paths) | Build, test, deploy .NET API |
| Frontend CI | `frontend-ci.yml` | Push/PR to main (frontend paths) | Lint, typecheck, test, build React |
| Claude Review | `claude-review.yml` | PR open/reopen + `@claude` | AI code review |
| CodeQL | `codeql.yml` | PR + weekly (Monday 6am UTC) | Security scanning (C# + JS/TS) |
| Commit Lint | `commit-lint.yml` | PR title | Conventional commit enforcement |
| Vercel Preview | `vercel-preview.yml` | PR (frontend paths) | Preview deploy URLs on PRs |
| Vercel Staging | `vercel-staging.yml` | Push to main (frontend paths) | Deploy frontend to Vercel production |
| Azure Frontend | `azure-frontend.yml` | Push to main (frontend paths) | Deploy frontend to Azure SWA mirror |
| Dependabot | `dependabot.yml` | Weekly/monthly schedule | Dependency updates |

All workflows use **concurrency groups** — pushing new commits to a PR branch cancels in-progress runs (except Claude review, which completes).

---

## azure-deploy.yml — API Build, Test & Deploy

### Triggers
- Push to `main` (path-filtered: API, tests, workflow file)
- PRs targeting `main` (same path filter)
- Manual dispatch (`workflow_dispatch`)

### Path Filters
Only runs when these paths change:
- `src/LogisticsAPI/**`
- `tests/**`
- `*.sln`
- `.github/workflows/azure-deploy.yml`

### Jobs

#### 1. build-and-test
- Restores NuGet packages (cached via `actions/cache`)
- Builds in Release mode
- Runs 68 xUnit tests with code coverage
- Publishes API artifact

#### 2. deploy (main branch only)
- Downloads build artifact
- Deploys to Azure App Service via publish profile
- Only runs on push/dispatch to main (not PRs)

### Troubleshooting

| Problem | Fix |
|-|-|
| NuGet restore fails | Check if new packages were added. Clear cache with `dotnet nuget locals all --clear` |
| Tests fail | Run `dotnet test` locally. Check for SQLite file lock issues |
| Deploy fails | Verify `AZURE_WEBAPP_PUBLISH_PROFILE` secret is current. Re-download from Azure portal |
| Workflow doesn't trigger | Check path filters — only API/test changes trigger this workflow |

---

## frontend-ci.yml — React Frontend CI

### Triggers
- Push to `main`
- PRs targeting `main`
- **Path filter:** `src/logistics-dashboard/**` or `.github/workflows/frontend-ci.yml`

### Jobs

#### 1. lint
- Runs ESLint via `npm run lint`
- Fast feedback — fails independently of build

#### 2. build-and-test
- TypeScript check (`tsc -b --noEmit`)
- Vitest tests (12 tests)
- Production build with Azure API URL

### Troubleshooting

| Problem | Fix |
|-|-|
| Lint fails | Run `cd src/logistics-dashboard && npm run lint` locally |
| TypeScript errors | Run `npx tsc -b --noEmit` in the frontend directory |
| Tests fail | Run `npm test` locally. Check for jsdom/environment issues |
| Build fails | Usually a TypeScript error. Check the build output |

---

## claude-review.yml — AI Code Review

### Configuration
- **Model:** claude-opus-4-6
- **Max turns:** 100
- **Tools:** Bash, Read, Write, Edit, Glob, Grep, Agent, WebFetch

### Jobs

#### 1. auto-review (on PR open/reopen)
- Full staff-level review covering architecture, security, performance, testing
- Posts summary via `gh pr comment`, inline issues via `gh pr review`
- Does NOT trigger on `synchronize` (saves API costs per push)

#### 2. claude-assist (on `@claude` in PR comments)
- Responds to ad-hoc questions from contributors
- Has full project context via system prompt

#### 3. claude-review-assist (on `@claude` in review comments)
- Same as claude-assist but for inline review comment threads

### Usage
- **Auto review:** Opens automatically on new PRs
- **Ask a question:** Comment `@claude <your question>` on a PR
- **Re-review:** Comment `@claude please re-review this PR`
- **Targeted:** `@claude is the tenant isolation fixed in this controller?`

### Troubleshooting

| Problem | Fix |
|-|-|
| Review not posted | Check Actions tab. First PR adding workflow is skipped (expected) |
| `@claude` not responding | Must be in a PR comment, not an issue comment |
| Generic/shallow review | Check if checkout succeeded. Claude needs full repo access |
| Rate limited | Check Anthropic dashboard. Reduce `--max-turns` if needed |

---

## Secrets Reference

| Secret | Purpose | How to get |
|-|-|-|
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Azure App Service deployment | Azure Portal > App Service > Get Publish Profile |
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude Code OAuth for PR review bot | Available as shell env var `$CLAUDE_CODE_OAUTH_TOKEN` |
| `VERCEL_TOKEN` | Vercel CLI preview deploys | Available as shell env var `$VERCEL_TOKEN` |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Azure SWA deployment | `az staticwebapp secrets list --name logistics-dashboard-abdallah` |
| `VERCEL_ORG_ID` | Vercel staging deploys | Vercel dashboard > Settings > General |
| `VERCEL_PROJECT_ID` | Vercel staging deploys | Vercel dashboard > Settings > General |

### Setup for new repos
Tokens are available as shell environment variables. Set them on a new repo with:
```
gh secret set CLAUDE_CODE_OAUTH_TOKEN --body "$CLAUDE_CODE_OAUTH_TOKEN"
gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN"
```

---

## Dependabot

Automated dependency update PRs:
- **NuGet** (.NET packages): weekly on Monday, max 5 open PRs
- **npm** (React frontend): weekly on Monday, max 5 open PRs
- **GitHub Actions**: weekly on Monday, max 3 open PRs
- **Docker** (API + frontend base images): monthly

PRs are auto-labeled (`dependencies` + ecosystem label) for easy filtering.

---

## vercel-preview.yml — Frontend Preview Deploys

### Triggers
- PRs targeting `main`
- **Path filter:** `src/logistics-dashboard/**` or `.github/workflows/vercel-preview.yml`

### How it works
1. Resets git author to repo owner (Vercel Hobby plan requirement)
2. Builds with `vercel build` via CLI
3. Deploys with `vercel deploy --prebuilt`
4. Posts/updates a "Preview Deploy" PR comment with preview URL, deployment history, and build logs

Production stays on Azure — Vercel is preview/experimental only.

### Troubleshooting

| Problem | Fix |
|-|-|
| Build fails | Check build logs in the PR comment `<details>` section |
| No preview URL | Check if `VERCEL_TOKEN` secret is valid. Regenerate at vercel.com/account/tokens |
| "Commit author not a member" | The reset-author step didn't run. Check Actions log |

---

## vercel-staging.yml — Vercel Production Deploy

### Triggers
- Push to `main` (path-filtered: frontend, workflow file)

### How it works
1. Installs Vercel CLI
2. Pulls production config via `vercel pull`
3. Builds with `vercel build --prod`
4. Deploys with `vercel deploy --prebuilt --prod`

No PR comments or deployment tracking — that's handled by `vercel-preview.yml` for PRs.

### Troubleshooting

| Problem | Fix |
|-|-|
| Deploy fails | Check `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets |
| Wrong environment | Ensure `--prod` flag is present in both build and deploy steps |

---

## azure-frontend.yml — Azure SWA Mirror Deploy

### Triggers
- Push to `main` (path-filtered: frontend, workflow file)
- Manual dispatch (`workflow_dispatch`)

### How it works
1. Builds the React frontend with `npm run build`
2. Uploads the `dist/` directory to Azure Static Web Apps
3. Uses `skip_app_build: true` — we build ourselves for consistency with Vercel

SPA routing handled by `staticwebapp.config.json` in the frontend directory.

### Troubleshooting

| Problem | Fix |
|-|-|
| Deploy fails | Check `AZURE_STATIC_WEB_APPS_API_TOKEN` secret. Regenerate: `az staticwebapp secrets list` |
| 404 on routes | Verify `staticwebapp.config.json` is in the `dist/` output (Vite copies `public/` files) |
| CORS errors | Check API CORS config in `Program.cs` includes the SWA hostname |

---

## codeql.yml — Security Scanning

### Triggers
- Push to `main`
- PRs targeting `main`
- Weekly schedule: Monday 6am UTC

### Jobs

#### 1. analyze-csharp
- Builds the .NET solution and runs CodeQL analysis
- Catches SQL injection, path traversal, insecure deserialization, etc.

#### 2. analyze-javascript
- Scans TypeScript/JavaScript without build step
- Catches XSS, prototype pollution, regex DoS, etc.

Results appear in the **Security** tab of the repository.

### Troubleshooting

| Problem | Fix |
|-|-|
| C# analysis fails | Usually a build error. Check if `dotnet build` works locally |
| JS analysis slow | Normal — first run indexes the codebase. Subsequent runs are faster |
| False positives | Dismiss via Security tab with a reason. CodeQL learns from dismissals |

---

## commit-lint.yml — Conventional Commits

Validates PR titles match conventional commit format. Enforced types:
`feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`, `style`

PR title must be 72 characters or fewer.

### Examples
- `feat: add warehouse capacity chart` — new feature
- `fix: resolve tenant isolation in stock movements` — bug fix
- `chore: update dependencies` — maintenance
- `docs: update API endpoint table` — documentation only

### Troubleshooting

| Problem | Fix |
|-|-|
| PR title rejected | Edit the PR title to match `type: description` format |
| Type not recognized | Use one of: feat, fix, chore, docs, refactor, test, perf, ci, style |

---

## CODEOWNERS

`@PohTeyToe` owns all paths. GitHub shows ownership in PR file review and automatically requests review from owners.
