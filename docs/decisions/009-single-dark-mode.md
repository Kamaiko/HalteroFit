# ADR-009: Single Dark Mode

**Status:** Accepted
**Date:** 2025-10
**Category:** UI

## Context

Halterofit is used in gym environments: fluorescent lighting, outdoor sun, and low-light areas between sets. Dark mode performs well across all of these scenarios and is the dominant preference among fitness app users on OLED devices. Supporting both light and dark themes doubles the surface area for UI testing and design review — a maintenance cost that is not justified for an MVP built by a solo developer.

## Decision

Ship dark mode only, with no light mode toggle. The entire color system is defined for a single dark theme.

## Consequences

### Benefits

- Dark backgrounds (`#0A0A0A`) improve readability under the bright and variable lighting conditions typical in gyms
- OLED screens render true black pixels as off, reducing battery consumption during workouts
- A single theme eliminates all conditional theming logic from components, simplifying every style decision
- Faster to build and validate: every screen only needs to be reviewed in one visual context

### Trade-offs

- Users who prefer light mode have no option — this is a known limitation accepted for MVP scope
- App Store accessibility reviewers may note the absence of a light mode; unlikely to cause rejection but worth monitoring

## References

- Related: [ADR-007](007-nativewind-v4.md) (theme configured in tailwind.config.ts)
- Implementation: `tailwind.config.ts` (background `#0A0A0A`, primary `#0EA5E9`), `src/constants/colors.ts`
