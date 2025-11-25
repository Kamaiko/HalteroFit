# Design System - Halterofit

This document captures strategic design insights, competitor analysis, and design principles for Halterofit. It focuses on high-level guidance rather than detailed wireframes, following an agile approach where detailed specs are created just-in-time during implementation.

## Table of Contents

1. [Competitor Analysis](#competitor-analysis)
2. [Design Principles](#design-principles)
3. [Color System](#color-system)
4. [Component Strategy](#component-strategy)
5. [Interaction Principles](#interaction-principles)

## Competitor Analysis

### Research Methodology

Analyzed 3 leading workout tracking apps (Strong, Hevy, Jefit) to identify successful UI/UX patterns and visual design choices.

### Key Findings

#### Strong App (1.2M+ users)

**Strengths:**

- Clean, minimalist interface
- One action per screen approach
- Blue accent color for calendar/active states
- Simple, intuitive workout logging
- Full user control over reps/weight/rest

**UI Patterns:**

- Checkmark to complete sets
- Distraction-free workout screen (no nav bar, no pop-ups)
- Large, tappable buttons suitable for gym use

#### Hevy App (9M+ users)

**Strengths:**

- "Most intuitive tracker" (user feedback)
- Seamless logging experience
- Customizable rest timers (5s-5min, 15s increments)
- Live activity widget integration
- Set type markers (Warmup, Normal, Drop, Failure, Superset)

**UI Patterns:**

- Tap checkmark → complete set → trigger rest timer (elegant flow)
- Rest timer with skip/adjust controls
- Dark/light theme support
- Notification system for rest timer completion

#### Jefit App (1.4M+ users)

**Strengths:**

- Comprehensive exercise library (1,400+ exercises with filters: body part, equipment, type)
- Previous workout data pre-loaded in set logging table
- Workout programs library (Find Workouts vs My Plans distinction)
- Swipe navigation between exercises during active workout

**UI Patterns:**

- Tri-section active workout layout: exercise video (top), set table (middle), rest timer (bottom)
- Minimizable rest timer (swipe down for low-profile mode)
- "W" marker for warmup sets in logging table
- Bottom tab navigation (Workout, Exercises, Progress, Community, Profile)

**UX Trade-offs:**

- Feature-rich but "crowded/overwhelming" for new users
- Learning curve exists (prioritizes functionality over minimalism)

#### General Fitness App Best Practices

**Critical UX Principles:**

1. **Distraction-Free Design**: One action per screen, no clutter during workouts
2. **Large Touch Targets**: Buttons optimized for in-motion use (minimum 44x44px, preferably 56x56px)
3. **Multi-Modal Feedback**: Visual + auditory + haptic (users don't constantly look at screen)
4. **Quick Logging**: Goal → plan → start workflow in <60 seconds
5. **Progress Visualization**: Charts, pyramids, stats (90% retention with good UX)

**Notification/Modal Patterns:**

- **High-contrast modals**: Critical alerts, confirmations
- **Low-contrast inline**: Supplemental info, non-urgent
- **Snackbars/Toasts**: Quick feedback without interruption
- **Timed properly**: Minimize frustration, easy to dismiss

## Design Principles

### 1. **Offline-First Clarity**

- Always show data state (synced, pending, offline)
- No spinners or loading states that block interaction
- Immediate feedback for all actions

### 2. **Gym-Optimized Interface**

- Large touch targets (minimum 44x44px, preferably 56x56px)
- High contrast for readability in various lighting
- One primary action per screen
- Minimal text input (use pickers/steppers when possible)

### 3. **Context-Aware Intelligence**

- Show relevant data based on workout phase
- Adapt UI based on nutrition phase (bulk/cut/maintenance)
- Smart defaults based on history

### 4. **Progressive Disclosure**

- Basic features upfront (weight, reps)
- Advanced features accessible but not prominent (RIR, tempo, notes)
- Analytics revealed after sufficient data collected

## Color System

### Design Rationale

**Primary Color Decision: #4299e1 (Blue)**

**Rationale:**

- **Trust & Focus**: Blue universally signals reliability, calm, focus (critical during intense workouts)
- **Industry Standard**: Strong app (1.2M users) uses blue for active states/calendar
- **Accessibility**: Better contrast against dark backgrounds (#0A0A0A) than cyan
- **Emotional Association**: Blue = discipline, consistency, progress (core bodybuilding values)

**Rejected Alternative: #00E5FF (Cyan)**

- Too vibrant/distracting during workouts
- Less contrast against dark backgrounds
- Lacks trust/reliability association
- No competitive precedent in fitness apps

### Color Palette

**Backgrounds:**

- `background.DEFAULT`: `#0A0A0A` - Deep black (OLED-friendly, reduces eye strain)
- `background.surface`: `#1A1A1A` - Card backgrounds (subtle elevation)
- `background.elevated`: `#2A2A2A` - Elevated cards (modals, overlays)

**Brand Colors:**

- `primary.DEFAULT`: `#4299e1` - Brand blue (buttons, active states)
- `primary.dark`: `#2b6cb0` - Pressed states, hover
- `primary.light`: `#63b3ed` - Highlights, accents

**Semantic Colors:**

- `success`: `#38a169` - Progress green (completed sets, achievements)
- `warning`: `#d69e2e` - Caution amber (plateau warnings)
- `danger`: `#e53e3e` - Critical red (overtraining alerts, delete actions)
- `info`: `#3182ce` - Information blue (tooltips, help)

**Text Colors:**

- `foreground.DEFAULT`: `#e2e8f0` - Primary text (high contrast)
- `foreground.secondary`: `#a0aec0` - Secondary text (labels, metadata)
- `foreground.tertiary`: `#718096` - Tertiary text (placeholders, disabled)

**RPE Colors** (Rate of Perceived Exertion):

- `rpe.low`: `#38a169` - RPE 1-5 (Easy - green)
- `rpe.medium`: `#d69e2e` - RPE 6-7 (Moderate - amber)
- `rpe.high`: `#e53e3e` - RPE 8-9 (Hard - red)
- `rpe.max`: `#c53030` - RPE 10 (Maximum - dark red)

## Component Strategy

### Current Stack

- **Base Library**: React Native Reusables (shadcn/ui port)
- **Icons**: @expo/vector-icons (Material, Ionicons, FontAwesome)
- **Styling**: NativeWind v4 (Tailwind CSS for React Native)
- **Animations**: Reanimated v4 (when needed)

### Installed Components

**Phase 1 Ready (Auth Screens):**

- Button, Input, Label → Login/Register forms
- Card → Form wrappers, content containers
- Alert → Error/success messages
- Text → Base text component

**Phase 2+ Ready (Workout Logging):**

- Progress → Set completion indicators, goal tracking
- Skeleton → Loading states for exercise lists

### Component Design Guidelines

**Touch Targets:**

- Primary actions: 56x56px minimum (gym-friendly)
- Secondary actions: 44x44px minimum (Apple HIG standard)
- Text inputs: 48px height minimum (easy tapping with gloves)

**Visual Hierarchy:**

- Primary action: Solid fill, `primary` color, high contrast
- Secondary action: Outline, `border` color, lower contrast
- Tertiary action: Ghost (no border), subtle hover/press

**Feedback:**

- Haptic feedback on all button presses (light impact)
- Visual feedback: 90% opacity on press (activeOpacity={0.9})
- Loading states: Skeleton loaders (no spinners that block UI)

## Interaction Principles

### Core Patterns (From Competitor Analysis)

**1. Quick Add with Progressive Disclosure**

- Pre-filled forms with smart defaults (last set's values)
- Advanced options hidden behind "Advanced" toggle
- Goal: 1-tap logging for 80% of use cases

**2. Inline Editing**

- Tap to modify values without modal dialogs
- Steppers for numeric inputs (±5 lbs, ±1 rep)
- Minimal keyboard usage during workouts

**3. Swipe Actions**

- Left swipe: Edit action (yellow/amber accent)
- Right swipe: Delete action (red/danger accent)
- Pattern inspired by iOS Mail app (familiar UX)

**4. Multi-Modal Feedback**

- Visual: Color change, animation
- Auditory: Completion sounds (optional, user-controlled)
- Haptic: Buzz on set completion, timer expiry

### Animation Strategy

**Timing:**

- Quick interactions: 200ms (button press, toggle)
- Content transitions: 300ms (screen navigation, modal open)
- Background updates: 400-600ms (chart animations, progress bars)

**Curves:**

- Ease-out: Entering elements (start fast, slow down)
- Ease-in-out: Transitioning elements (smooth both ends)
- Spring: Interactive elements (natural, physics-based)

**Library:**

- Reanimated v4 for complex animations (Skia-based, 60fps guaranteed)
- NativeWind transitions for simple opacity/scale (CSS-based, lightweight)

## Implementation Notes

### Agile Approach

This design system documents strategic insights and principles discovered during competitor analysis. **Detailed wireframes and interaction specs are intentionally deferred until implementation phase** to avoid premature design work that will change based on user testing and technical constraints.

### Design-First Workflow

When implementing new features:

1. Review competitor patterns (this document)
2. Create low-fi wireframes just-in-time (in feature branch)
3. Build functional prototype
4. User test and iterate
5. Document final patterns here (post-implementation)

### References

- Strong App: https://www.strong.app/
- Hevy App: https://www.hevyapp.com/
- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
- Material Design (Fitness): https://m3.material.io/
