# Setting up the site (one time, about 20 minutes)

The page, the AI relay and the encrypted backups all run on one free Cloudflare Pages project.
Claude pushes code to GitHub; Cloudflare deploys it within a minute.

## A. GitHub (where the code lives)
1. github.com: sign in or create a free account.
2. Top right + → New repository. Name `money-headache-remover`. Private is fine. Create repository.
3. claude.ai → your initials → Settings → Connectors → GitHub → Connect. Install the Claude app on your account,
   "Only select repositories", tick `money-headache-remover`. (Team plan: an org owner may need to add the connector once
   under Organization settings → Connectors.)
4. Tell Claude: "GitHub done, repo is <username>/money-headache-remover".

## B. Anthropic key (your credits for the AI)
1. console.anthropic.com: sign up (separate from the claude.ai subscription).
2. Plans & Billing → Buy credits. $20 is plenty to start. Leave auto-reload off: then $20 is the hard ceiling.
3. Settings → API keys → Create Key, name `money-app`. Copy the key (sk-ant-...). Shown once. Never paste it into a chat.

## C. Cloudflare (hosting, relay, backups) as a Worker
Done on 2026-11-11: the project `money-headache-remover` is a Worker connected to the GitHub repo. Cloudflare runs
`npx wrangler deploy` on every push to `main`; `wrangler.toml` in the repo names the Worker, the `public` folder and the D1 binding.
Live address: https://money-headache-remover.mako-162.workers.dev
1. dash.cloudflare.com → Workers & Pages → Create → Import a repository → `money-headache-remover`. Deploy command `npx wrangler deploy`.
2. Storage & Databases → D1 SQL Database → Create → name `money-vault`. Copy its Database ID into `wrangler.toml` (done: a294d637-…).
3. Workers & Pages → the project → Settings → Variables and Secrets → Add. Type Secret. Name `ANTHROPIC_API_KEY`. Value: the key from B3. Save.
4. Optional gate: another variable, Type Text, Name `INVITE_CODES`, Value: the code word friends type once (several: comma separated).
5. Open the address: /api/health should show `"ai":true,"vault":true`.
A failed build that says "error occurred while fetching repository" only means the repo was empty at the time; Retry build after the first push.

## Optional settings (Variables and Secrets, Type Text)
| Name | Default | Meaning |
|---|---|---|
| `DAILY_TOKEN_CAP` | 3000000 | tokens a day across everyone; the relay stops at the cap |
| `USER_DAILY_CALLS` | 150 | AI calls a day from one browser |
| `IP_PER_MINUTE` | 30 | AI calls a minute from one network address |
| `MODEL_QUICK` | claude-haiku-5-5 | reading files, short answers |
| `MODEL_DEFAULT` | claude-sonnet-5-5 | the assistant |
| `MODEL_COMPLEX` | claude-sonnet-5-5 | reserved |
| `VAULT_WRITES_PER_DAY` | 400 | saves a day for one cloud copy |
| `SITE_VERSION` | | shown by /api/health |

## Custom address (later)
Pages project → Custom domains → add, for example, money.ozmedia.global, and follow the DNS step it shows.
