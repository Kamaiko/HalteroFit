# Maestro E2E Tests

End-to-end tests using [Maestro](https://maestro.mobile.dev) for real device testing with SQLite.

## Structure

```
.maestro/
├── flows/
│   ├── auth/           # Authentication flows (login, signup, logout)
│   └── workout/        # Workout flows (create, log sets, complete)
├── config.yaml         # Global Maestro configuration
└── README.md           # This file
```

## Quick Start

```bash
# Install Maestro (once)
curl -Ls "https://get.maestro.mobile.dev" | bash

# Run all flows
maestro test .maestro/

# Run specific flow
maestro test .maestro/flows/auth/login.yaml

# Interactive test creation
maestro studio
```

## When to Use Maestro

Use Maestro E2E tests for scenarios that **cannot be tested with Jest**:

- WatermelonDB sync protocol (`_changed`, `_status` columns)
- `synchronize()` method (requires native SQLite)
- Real Supabase authentication and RLS
- Multi-device conflict resolution
- Complete user journeys

## Test Philosophy

> "Write tests. Not too many. Mostly integration." - Kent C. Dodds

Maestro tests are expensive (slow, require device). Use sparingly for:

1. Critical user flows (auth, core features)
2. Sync protocol validation
3. Regression testing before releases

See [docs/TESTING.md](../docs/TESTING.md) for complete testing strategy.
