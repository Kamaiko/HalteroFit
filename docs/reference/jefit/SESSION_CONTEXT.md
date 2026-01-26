# Session Context - Jefit UI Implementation

> **Dernière mise à jour:** 2026-01-25
> **But:** Maintenir le contexte entre sessions pour l'implémentation UI basée sur Jefit

---

## État Actuel

### Documentation Complétée
- [x] Structure dossiers screenshots créée
- [x] JEFIT_UI_SPEC.md créé (~400 lignes)
- [x] Screenshots extraits et réorganisés (35 fichiers)
- [x] Migration BD v8 complétée (WatermelonDB + Supabase)
- [x] Composants UI de base créés (SwipeableTabs, BottomSheet, ConfirmDialog)
- [x] Database operations layer créé (plans.ts)
- [x] DATABASE.md mis à jour

### Prochaines Étapes
1. ~~**Phase B: Exercise Library** - ExerciseSelectorScreen, ExerciseListScreen~~ ✅
2. **Phase C: Plans & Templates** - PlansListScreen, PlanDetailScreen, etc.
3. **Phase D: Active Workout** - ActiveWorkoutScreen, SetLogging, RestTimer
4. **Phase E: Settings** - SettingsScreen, ProfileScreen

---

## Décisions Clés (Validées)

| Décision | Choix |
|----------|-------|
| Architecture BD | 3 nouvelles tables (workout_plans, plan_days, plan_day_exercises) |
| Exercise Type field | Non requis (Muscle/Equipment suffisent) |
| Rest Timer | Hiérarchie: exercice > global > 90s |
| Muscle selector MVP | Page avec "Show All" seulement |
| Timeout 4h | Post-MVP |
| Anatomie images | Post-MVP (placeholder) |
| Auto-swipe | Immédiat après dernier set |

---

## Structure Screenshots (35 fichiers)

```
screenshots/
├── 01-navigation/ (1)
│   └── 01-discover-home.png
├── 02-exercises/ (3)
│   ├── 01-muscle-selector.png
│   ├── 02-exercise-list.png
│   └── 03-equipment-filter.png
├── 03-plans/ (12)
│   ├── 01-all-plans.png
│   ├── 02-plan-context-menu.png
│   ├── 03-planned-overview.png
│   ├── 04-edit-day-empty.png
│   ├── 05-day-details-empty.png
│   ├── 06-exercise-picker.png
│   ├── 07-exercise-picker-selected.png
│   ├── 08-day-with-exercise.png
│   ├── 09-overview-with-day.png
│   ├── 10-delete-confirmation.png
│   ├── 11-multi-day-plan.png
│   └── 12-day-exercises-list.png
├── 04-active-workout/ (11)
│   ├── 01-cardio-logging.png
│   ├── 02-strength-logging.png
│   ├── 03-set-completed-timer.png
│   ├── 04-rest-timer-expanded.png
│   ├── 05-timer-interval.png
│   ├── 06-timer-countdown.png
│   ├── 07-workout-complete.png
│   ├── 08-discard-confirmation.png
│   ├── 09-exercise-history.png
│   ├── 10-exercise-chart.png
│   └── 11-saving-splash.png
├── 05-progress/ (6)
│   ├── 01-progress-overview.png
│   ├── 02-calendar-detail.png
│   ├── 03-workout-log-header.png
│   ├── 04-workout-log-sets.png
│   ├── 05-leftover-session.png
│   └── 06-workout-log-jan24.png
└── 06-settings/ (2)
    ├── 01-settings-main.png
    └── 02-profile-edit.png
```

---

## Architecture BD v8 (Implémentée ✅)

### Nouvelles Tables

```sql
-- workout_plans
id, user_id, name, is_active, cover_image_url, created_at, updated_at

-- plan_days
id, plan_id, name, day_of_week, order_index, created_at, updated_at

-- plan_day_exercises
id, plan_day_id, exercise_id, order_index, target_sets, target_reps,
rest_timer_seconds, notes, created_at, updated_at
```

### Modifications

```sql
-- workouts: +plan_id, +plan_day_id
-- users: +default_rest_timer_seconds
```

---

## Écrans à Implémenter (MVP)

### Phase B: Exercise Library ✅
- [x] ExerciseSelectorScreen → `(tabs)/exercises/index.tsx`
- [x] ExerciseListScreen → `(tabs)/exercises/list.tsx`
- [x] exercises.ts operations layer created

### Phase C: Plans & Templates
- [ ] PlansListScreen → `plans/index.tsx`
- [ ] PlanDetailScreen → `plans/[id]/index.tsx`
- [ ] EditDayScreen → `plans/[id]/day/[dayId]/edit.tsx`
- [ ] AddExercisesScreen → `plans/add-exercises.tsx`

### Phase D: Active Workout
- [ ] ActiveWorkoutScreen → `workout/active.tsx`
- [ ] WorkoutSummaryScreen → `workout/summary.tsx`
- [ ] SetLoggingComponent
- [ ] RestTimerWidget

### Phase E: Settings
- [ ] SettingsScreen → `settings/index.tsx`
- [ ] ProfileScreen → `settings/profile.tsx`

---

## Composants Réutilisables

| Composant | Package | Statut |
|-----------|---------|--------|
| SwipeableTabs | react-native-pager-view | ✅ Créé |
| BottomSheet | @gorhom/bottom-sheet | ✅ Créé |
| ConfirmDialog | custom | ✅ Créé |
| ExerciseCard | custom | À créer |
| SetRow | custom | À créer |
| RestTimerWidget | custom | À créer |

---

## Documents de Référence

- **Plan approuvé:** `~/.claude/plans/fancy-herding-sky.md`
- **UI Spec complète:** `docs/reference/jefit/JEFIT_UI_SPEC.md`
- **BD actuelle:** `src/services/database/local/schema.ts` (v8)
- **Roadmap projet:** `docs/ROADMAP.md`
- **Tasks:** `docs/TASKS.md`

---

## Notes Importantes

1. **"Per DB"** = Poids par dumbbell (pair = x2)
2. **Barre bleue** = Jour "actif" dans un plan (premier ou dernier sélectionné)
3. **Bottom Sheet** = Pattern utilisé pour filtres, rest timer, menus contextuels
4. **SwipeableTabs** = Pattern utilisé pour Overview/Day Details, History/Chart/Guide

---

*Mettre à jour ce fichier après chaque session de travail significative.*
