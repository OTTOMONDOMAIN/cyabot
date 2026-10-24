# Hosting & Environment Variable Configuration Guide

Comprehensive blueprint and guide explaining all environment variables, host settings, and Discord Developer Portal configurations required when deploying the Cya Bot application to any custom host or domain.

### User Review & Critical Decisions

> [!IMPORTANT]
> When hosting on any new domain or changing hosts, Discord OAuth2 security requires matching your public URL in two places:
> 1. In your server's `.env` as `APP_URL` (e.g. `APP_URL=https://yourdomain.com`).
> 2. In the **Discord Developer Portal** under **OAuth2 -> Redirects** as `https://yourdomain.com/auth/callback`.

- **Confirmed Decision**: Provide clear, comprehensive environment variable documentation and Discord Developer Portal settings for hosting and domain migration.
- **Environment Standard**: Standardize `.env.example` with detailed inline comments explaining `APP_URL`, `PORT`, and Discord credentials so anyone deploying the app has a turnkey reference.

---

### 1. Overview & Core Concept

- **What It Does**: Explains how the Express full-stack application determines its public host URL, how OAuth2 redirect URLs are constructed, and how to change hosts or domains without breaking Discord login, server fetching, or admin controls.
- **Target Audience / Persona**: Server owner / administrator hosting the Cya Bot web dashboard on a custom domain, VPS, cloud provider, or container.
- **Key Value**: Zero downtime or OAuth authentication errors when migrating domains.

---

### 2. Required Environment Variables

When you deploy to a new host, configure these variables in your environment or `.env` file:

```bash
# 1. The public URL of your website (NO trailing slash)
# Used by the server to construct the Discord OAuth2 redirect_uri:
APP_URL=https://your-domain.com

# 2. Port for the Node.js / Express server (default: 3000)
PORT=3000

# 3. Discord Application Client ID (from Discord Developer Portal -> General Information)
DISCORD_CLIENT_ID=1552270485520384112

# 4. Discord Application Client Secret (from Discord Developer Portal -> OAuth2)
DISCORD_CLIENT_SECRET=your_client_secret_here

# 5. Discord Bot Token (from Discord Developer Portal -> Bot -> Reset Token)
# Used to verify guild memberships and manage bot features
DISCORD_BOT_TOKEN=your_bot_token_here
```

---

### 3. Discord Developer Portal Settings

Whenever you change `APP_URL` (e.g., from the default preview URL to `https://cya.lat` or `https://your-custom-host.com`), you must update Discord:

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Select your application (**Cya Bot** / Client ID `1552270485520384112`).
3. Click on the **OAuth2** tab in the left sidebar.
4. Under **Redirects**, click **Add Redirect**.
5. Add your new URL with `/auth/callback`:
   ```
   https://your-domain.com/auth/callback
   ```
6. Click **Save Changes** at the bottom of the page.

> [!NOTE]
> You can keep multiple redirect URIs in Discord Developer Portal (e.g., one for development `http://localhost:3000/auth/callback`, one for preview, and one for your production domain `https://your-domain.com/auth/callback`). Discord allows multiple allowed redirect URIs.

---

### 4. Technical Architecture & Request Flow

```
┌────────────────────────────────────────────────────────┐
│               Client Browser                           │
│  (Window detects window.location.origin)               │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│               Express Server (server.ts)               │
│  Uses: req.query.origin || process.env.APP_URL         │
│  Builds: ${APP_URL}/auth/callback                      │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│            Discord OAuth2 Authorize Endpoint           │
│  Validates redirect_uri matches Developer Portal list   │
└────────────────────────────────────────────────────────┘
```

---

### 5. Implementation Steps

1. **Update `.env.example`**: Add documented descriptions for `APP_URL`, `PORT`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, and `DISCORD_BOT_TOKEN`.
2. **Server Verification**: Ensure `server.ts` safely parses `APP_URL` without trailing slashes and handles both reverse-proxy headers (`X-Forwarded-Proto`, `X-Forwarded-Host`) and explicit `APP_URL` configuration.
3. **Run Compilation**: Validate build and server integrity.
