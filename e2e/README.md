# End-to-End Testing

This directory contains E2E test strategies for Halterofit.

## Structure

```
e2e/
└── manual/          # Manual testing documentation
    ├── README.md   # Manual testing guide
    └── checklists/ # Test checklists for critical flows

.maestro/            # Maestro automated E2E tests (root level)
├── auth/           # Authentication flows (Phase 1)
├── workflows/      # User journeys (Phase 2+)
└── config.yaml     # Global Maestro configuration
```

## Test Types

### Manual E2E (`manual/`)

- **Purpose**: Document critical flows for manual validation
- **When**: Before automation, edge cases, exploratory testing
- **Audience**: QA testers, developers

### Maestro E2E (`.maestro/`)

- **Purpose**: Automated regression testing on real devices
- **When**: Phase 1+ (after Maestro setup - Task 1.22)
- **Audience**: CI/CD pipeline, developers
- **Location**: `.maestro/` in project root (industry best practice)

## Quick Start

### Manual Testing

See [manual/README.md](./manual/README.md) for checklists and procedures.

### Maestro Testing

```bash
# Install Maestro (once)
curl -Ls "https://get.maestro.mobile.dev" | bash

# Run all flows
maestro test .maestro/

# Run specific flow
maestro test .maestro/auth/login.yaml
```

## References

- [TESTING.md](../docs/TESTING.md) - Complete testing strategy
- [Maestro Documentation](https://maestro.mobile.dev)
