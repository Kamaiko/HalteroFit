# Security Policy

## Supported Versions

| Version                   | Supported          |
| ------------------------- | ------------------ |
| 0.x (current development) | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT open a public issue**
2. Email: `security@halterofit.app`
3. Include: description, reproduction steps, potential impact
4. Expected response: within 48 hours

## Security Measures

- **Database:** Row Level Security (RLS) — users can only access their own data
- **Local Storage:** MMKV with native encryption for auth tokens and session data
- **Network:** HTTPS (TLS 1.3) for all API communication
- **Authentication:** Supabase Auth with JWT tokens and automatic refresh
- **Monitoring:** Sentry error tracking with PII stripped (production only)
- **CI/CD:** TruffleHog secret scanning on every push

For detailed security architecture, see [docs/reference/TECHNICAL.md](docs/reference/TECHNICAL.md#security--monitoring).
