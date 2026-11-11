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

## C. Cloudflare (hosting, relay, backups)
1. dash.cloudflare.com: create a free account.
2. Workers & Pages → Create → Pages → Connect to Git → authorize "Cloudflare Workers and Pages" for `money-headache-remover`.
3. Project name `money-headache-remover` (the address becomes money-headache-remover.pages.dev). Production branch `main`.
   Framework preset None. Build command empty. Build output directory `public`. Save and Deploy.
4. Storage & Databases → D1 SQL Database → Create → name `money-vault`.
5. Workers & Pages → the project → Settings → Bindings → Add → D1 database. Variable name `DB`, database `money-vault`. Save.
6. Settings → Variables and Secrets → Add. Type Secret. Name `ANTHROPIC_API_KEY`. Value: the key from B3. Save.
7. Optional gate: another variable, Type Text, Name `INVITE_CODES`, Value: the code word friends type once (several: comma separated).
8. Deployments → latest → ⋯ → Retry deployment (so the key and the database take effect).
9. Open the address. /api/health should show `"ai":true,"vault":true`.

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
