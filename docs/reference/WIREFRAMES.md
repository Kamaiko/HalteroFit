# Wireframes & UI Specification

> **Source:** Competitor app analysis (PDF reference, 36 pages)
> **Updated:** 2026-03-10
> **Purpose:** UI patterns and screen specifications for Halterofit MVP

---

## Table of Contents

1. [Main Navigation](#1-main-navigation)
2. [Exercises Tab](#2-exercises-tab)
3. [Workout Tab](#3-workout-tab)
4. [Active Workout](#4-active-workout)
5. [Progress Tab](#5-progress-tab)
6. [Settings](#6-settings)
7. [Reusable Components](#7-reusable-components)
8. [Halterofit Mapping](#8-halterofit-mapping)

---

## 1. Main Navigation

### Bottom Tab Navigation

**4 onglets:**
| Onglet | Icône | Destination |
|--------|-------|-------------|
| Discover | Flame | Home/Feed |
| Workout | Checkmark | Plans/Planned |
| Exercises | Dumbbell | Exercise Library |
| Progress | Calendar | Stats/Calendar |

**Screenshot:** `screenshots/01-navigation/01-bottom-tabs.png`

### Header Patterns

- **Summary + Profile Icon:** Home (profile icon → Settings)
- **Titre + Back Arrow:** Pages de détail
- **Titre + Action Button:** Listes (ex: "+ Create Plan")

---

## 2. Exercises Tab

### 2.1 Muscle Selector Screen

**Purpose:** Sélectionner un groupe musculaire ou afficher tous les exercices

**UI Elements:**

- Grid 3x4 d'images anatomiques
- Labels sous chaque image: Triceps, Chest, Shoulder, Biceps, Abs, Back, Forearms, Upper Leg, Glutes, Cardio, Lower Leg, **Show All**
- Chaque cellule est cliquable

**User Flow:**

1. User arrive sur cette page depuis le tab "Exercises"
2. Click sur un muscle → ExerciseListScreen filtré
3. Click sur "Show All" → ExerciseListScreen complet

**Halterofit MVP:** Seul "Show All" sera actif, autres grayed-out

**Screenshot:** `screenshots/02-exercises/01-muscle-selector.png`

---

### 2.2 Exercise List Screen

**Purpose:** Afficher et rechercher les exercices

**UI Elements:**

- Header: "← Exercises" + bouton "+" (custom exercises - ignoré MVP)
- Search bar: "Search exercise name"
- Filtres chips: Muscles ▼ | Equipment ▼ | Type ▼
- Counter: "1332 exercises found"
- Sort: "Popular" (ignoré MVP)
- Liste scrollable d'ExerciseCards

**ExerciseCard:**

```
[Image] [Nom de l'exercice]
        [Muscles ciblés en gris]
```

**User Flow:**

1. Scroll pour parcourir
2. Search pour filtrer par nom
3. Click sur un exercice → ExerciseDetailScreen (optionnel MVP)

**Screenshot:** `screenshots/02-exercises/02-exercise-list.png`

---

### 2.3 Filter BottomSheet

**Purpose:** Filtrer les exercices par catégorie

**UI Elements:**

- Header avec 3 tabs: Muscle | Equipment | Type
- Liste d'options avec checkboxes
- Bouton "Deselect all"
- Gesture: swipe down pour fermer

**Equipment Categories:**

- No Equipment
- Gym Equipment (expandable)
  - Free Weights
  - Benches
  - Racks
  - Attachments
  - Weight Machines
  - Cardio Machines
  - Other

**Halterofit MVP:** Post-MVP (filtres)

**Screenshot:** `screenshots/02-exercises/03-filter-bottomsheet.png`

---

## 3. Workout Tab

### 3.1 All Plans Screen (PlansListScreen)

**Purpose:** Afficher tous les plans de l'utilisateur

**UI Elements:**

- Header: "← All Plans" + "+ Create Plan"
- Label: "Saved plans"
- Grid de PlanCards (2 colonnes)

**PlanCard:**

```
[CURRENT badge si actif]    [...]
[Image de fond]
[Nom du plan]
[Niveau • Goal • X DAYS]    [Select]
```

**Menu "..." (3 dots):**

- Delete
- Edit (ignoré MVP)
- Copy (ignoré MVP)
- Share (ignoré MVP)

**User Flow:**

1. Click sur "Select" → Active ce plan, va vers PlannedScreen
2. Click sur "+ Create Plan" → Crée nouveau plan, va vers PlannedScreen
3. Click sur "..." → Menu contextuel

**Screenshot:** `screenshots/03-plans/01-all-plans.png`

---

### 3.2 Workout Timeline (WorkoutScreen)

**Purpose:** Afficher le plan actif sous forme de timeline verticale accordéon

**UI Elements:**

- **CompactHeader:** nom du plan + chevron ▼ + subtitle "X days · Y exercises" + pill "All Plans" (→ PlansListScreen)
- **DraggableFlatList** de TimelineDayCards
- **AddDayPill** en footer ("+ Add a Day", dashed border)

**TimelineDayCard (collapsed, ~82px):**

```
[⠿] [MuscleIcon 48×48] [Nom du jour]              [···]
                         XX exercises
```

**TimelineDayCard (expanded):**

```
     [MuscleIcon 48×48] [Nom du jour]              [···]
                         XX exercises
                         ──────────────────────────
                         [Thumb] Exercise 1    [drag ⋮]
                         [Thumb] Exercise 2    [drag ⋮]
                         [+ Add exercise]
                         [▶ Start Workout]
```

**Comportement accordéon:** Un seul jour expanded à la fois. Tap sur un autre jour collapse le précédent.

**Drag contextuel:**

- Tous collapsed → drag les jours (réordonner via DragHandle)
- Un expanded → drag les exercices dans ce jour

**Animation:** Staggered fade-in des exercices à l'expand (40ms/item, cap 300ms)

**Phase 3+ (préparé visuellement, non implémenté) :**

- `isActiveWorkout` : bordure bleue 1.5px + barre accent gauche 3px avec glow
- Timer elapsed : collapsed → gauche du "···", expanded → sous le nom du jour
- Pill "End Workout" rouge remplace "Start Workout" pendant workout actif
- Autres jours masquent Start/End pendant workout actif
- Pulsing blue dot (7px, animation 2s) à côté du timer

---

### 3.3 Expanded Day Details (inline dans TimelineDayCard)

**Purpose:** Afficher les exercices d'un jour dans l'accordéon expanded

**UI Elements:**

- Liste d'exercices avec:
  - Image thumbnail (ExerciseThumbnail)
  - Nom de l'exercice
  - Swipe gauche → delete (DayExerciseCard + SwipeableContext)
- "+ Add exercise" button → AddExercisesScreen
- "Start Workout" button → ActiveWorkoutScreen (TODO: 3.1.3)
- Drag handles pour réordonner les exercices

**User Flow:**

1. Tap sur TimelineDayCard collapsed → expand avec fade-in des exercices
2. Tap "+ Add Exercise" → AddExercisesScreen
3. Swipe exercice gauche → action delete

---

### 3.4 Edit Day Screen

**Purpose:** Modifier le nom d'un jour et ses exercices

**UI Elements:**

- Header: "← Edit day (?)" + "Save"
- Jour tag: "MON Workout Day #1 ×"
- "+ Add exercise" button
- "Delete this day" button (rouge)
- Liste des exercices existants

**User Flow:**

1. Accessible via "..." → Edit sur un DayCard
2. Modifier nom, ajouter/supprimer exercices
3. "Save" pour confirmer

**Screenshot:** `screenshots/03-plans/04-edit-day.png`

---

### 3.5 Add Exercises Screen

**Purpose:** Sélectionner des exercices à ajouter à un jour

**UI Elements:**

- Header: "← Add Exercises" + "+" (custom - ignoré)
- Même layout que ExerciseListScreen MAIS:
  - Checkboxes à droite de chaque exercice
  - Bouton "Add X exercise(s)" en bas (disabled si 0)

**User Flow:**

1. Cocher les exercices désirés
2. Click "Add X exercise(s)"
3. Retour vers Day Details avec exercices ajoutés

**Screenshot:** `screenshots/03-plans/05-add-exercises.png`

---

### 3.6 Start Workout Button

**Position:** Intégré dans TimelineDayCard expanded (en bas de la liste d'exercices)

**États:**

- **Avant workout:** "Start Workout" (bouton bleu) visible uniquement dans le jour expanded
- **Pendant workout (Phase 3+):** Pill "End Workout" rouge remplace "Start Workout" dans le jour actif; autres jours masquent le bouton

**Changement vs ancien design:** N'est plus un bouton flottant fixe en bas à droite. Maintenant contextuel au jour sélectionné.

---

## 4. Active Workout

### 4.1 Active Workout Screen (ActiveWorkoutScreen)

**Purpose:** Logger les sets pendant l'entraînement

**UI Elements:**

- Header: "←" + icons (stats, history, "...")
- GIF animé de l'exercice (plein écran en haut)
- Progress bar horizontale (dots pour chaque exercice)
- Nom de l'exercice + "PLAY VIDEO"
- Tableau des sets:

```
Set  |  Lbs    |  Reps  |  ✓
-----|---------|--------|----
1    |  65     |  10    |  ✓ (vert si loggé)
2    |  65     |  10    |  ○
3    |  65     |  4     |  ○
+    |  65     |  4     | Delete
```

- "Per DB" note sous le premier set (poids par dumbbell)
- Footer: [Book icon] [Timer] [Log Set / Skip Rest]

**Interactions:**

- Click sur Lbs/Reps → Éditer la valeur
- Click "+" → Ajouter un set
- Click "Delete" → Supprimer le dernier set
- Swipe gauche/droite → Changer d'exercice
- Click "Log Set" → Logger le set actuel

**Screenshot:** `screenshots/04-active-workout/01-exercise-logging.png`

---

### 4.2 Rest Timer Widget

**Position:** Footer de ActiveWorkoutScreen

**États:**

**Timer inactif:**

```
[Book] [Clock 00:00] [    Log Set    ]
```

**Timer actif (après log):**

```
[Book] [01:46]       [   Skip Rest   ]
```

**Click sur timer → Expand:**

```
[Book] [Timer]       [   Skip Rest   ]
────────────────────────────────────────
       -15s                    +15s

            Rest Timer
              02:44
              (cercle bleu)

       ↺                          ▷

Rest Timer  03:00      Countdown  ○
```

**Fonctionnalités:**

- Countdown visuel (cercle qui se vide)
- +15s / -15s pour ajuster
- "Rest Timer XX:XX" pour configurer le défaut de l'exercice
- "Skip Rest" pour passer au prochain set

**Comportement après dernier set:**

- Auto-swipe vers le prochain exercice (immédiat, pas d'attente)

**Screenshot:** `screenshots/04-active-workout/02-rest-timer.png`

---

### 4.3 Workout Summary Screen (WorkoutSummaryScreen)

**Purpose:** Résumé et sauvegarde du workout

**UI Elements:**

- Header: "←" + "+ ADD EXERCISE"
- Progress bar (complet)
- "Workout Complete!" titre
- Nom du workout (modifiable avec ×)
- Stats: Duration | Volume | Records
- Stats: Calories | RPE
- Anatomie humaine (zones travaillées en bleu) - POST-MVP
- Liste des exercices loggés:

```
X Exercises

[Image] [Nom exercice]               [...]
        Set | Weight × reps | 1RM
        1   | 65 lb × 10    | 86.67 lb
        2   | 65 lb × 10    | 86.67 lb
```

- Footer: [Trash] [End & Save Workout]

**User Flow:**

1. Click "End & Save Workout" → Sauvegarde + splash + redirect Progress
2. Click Trash → Confirm dialog "Discard workout?"

**Screenshot:** `screenshots/04-active-workout/03-workout-complete.png`

---

### 4.4 Discard Workout Dialog

**Purpose:** Confirmer l'abandon du workout

**UI Elements:**

```
┌─────────────────────────────────┐
│ Are you sure you want to       │
│ discard this workout?          │
│                                │
│ Progress from this workout     │
│ will not be saved              │
│                                │
│     Cancel     Discard         │
└─────────────────────────────────┘
```

**Screenshot:** `screenshots/04-active-workout/04-discard-dialog.png`

---

## 5. Progress Tab

### 5.1 Progress Overview

**Purpose:** Vue d'ensemble des stats et calendrier

**UI Elements:**

- Header: [Avatar] Username [Refresh]
- Sub-tabs: **Overview** | Body | Activity
- Cards: Volume | Workout Time (avec mini-graphes)
- Calendrier mensuel (jours avec workout = cercle bleu)
- Stats: Total Sessions | Current Streak

**Halterofit MVP:** Simplifié - Settings accessible via Home screen profile icon

**Screenshot:** `screenshots/05-progress/01-overview.png`

---

### 5.2 Full Calendar Screen

**Purpose:** Voir l'historique complet des workouts

**UI Elements:**

- Header: "←" + stats (Workout Time | Total Sessions | Longest Streak)
- Calendriers mensuels empilés (scroll infini vers le passé)
- Jours avec workout = cercle bleu

**User Flow:**

1. Click sur un jour avec cercle bleu → WorkoutLogScreen

**Halterofit MVP:** Post-MVP

**Screenshot:** `screenshots/05-progress/02-calendar-full.png`

---

### 5.3 Workout Log Screen

**Purpose:** Détail d'un workout passé

**UI Elements:**

- Header: "← [Date]" + "+ ADD EXERCISE"
- Sub-tabs: **Logs** | Body Stats | Photos
- Start time
- Durée totale (ex: "59m")
- Anatomie humaine avec zones colorées
- Stats: Volume | Records | Exertion
- Liste des exercices:

```
[Image] [Nom exercice]               [...]
        Set | Weight × reps | 1RM
        1   | 65 lb × 10    | 86.67 lb
```

**Halterofit MVP:** Post-MVP (accessible depuis calendrier)

**Screenshot:** `screenshots/05-progress/03-workout-log.png`

---

## 6. Settings

### 6.1 Settings Screen

**Purpose:** Configuration du compte et préférences

**UI Elements:**

- Header: "← Settings"
- Profile card: [Avatar] [Name] [Email]
- Sections:
  - **Account:** Coaches, Privacy Settings, Refer a Friend
  - **Preferences:** Your Equipment, Dark Mode, Unit system, Workouts, Workout Audio, Rest Timer, Workout Reminders
  - **Connected App**

**Halterofit MVP:**

- Profile card → ProfileScreen
- Dark Mode toggle
- Unit system (inch/lb vs cm/kg)
- Rest Timer (default global)
- Logout

**Screenshot:** `screenshots/06-settings/01-settings-main.png`

---

### 6.2 Profile Screen

**Purpose:** Modifier les infos du profil

**UI Elements:**

- Header: "← Profile" + "Save"
- Avatar avec "Change photo" button
- Nom (avec pencil icon pour éditer)
- Fields:
  - Gender
  - Date of birth
  - Location (ignoré MVP)
  - Difficulty (ignoré MVP)
  - Training Goal (ignoré MVP)
  - Email (avec "Change" button)

**Halterofit MVP:**

- Nom (éditable)
- Gender
- Date of birth

**Screenshot:** `screenshots/06-settings/02-profile.png`

---

## 7. Reusable Components

### 7.1 SwipeableTabs

**Usage:** Overview/Day Details, Overview/Body/Activity, Logs/Body Stats/Photos

**Props:**

- `tabs: { key: string, label: string }[]`
- `activeTab: string`
- `onTabChange: (key: string) => void`

**Comportement:**

- Tabs cliquables dans le header
- Contenu swipeable horizontalement
- Indicateur animé sous le tab actif

---

### 7.2 BottomSheet

**Usage:** Filtres, Rest Timer, Menus contextuels

**Props:**

- `isOpen: boolean`
- `onClose: () => void`
- `snapPoints: string[]` (ex: ['50%', '90%'])

**Comportement:**

- Slide up depuis le bas
- Swipe down pour fermer
- Handle bar en haut

---

### 7.3 ConfirmDialog

**Usage:** Delete plan, Discard workout, Delete day

**Props:**

- `title: string`
- `message: string`
- `confirmLabel: string`
- `onConfirm: () => void`
- `onCancel: () => void`

---

### 7.4 ExerciseCard

**Props:**

- `exercise: Exercise`
- `showCheckbox?: boolean`
- `isChecked?: boolean`
- `onPress?: () => void`
- `onCheckChange?: (checked: boolean) => void`

---

### 7.5 SetRow

**Props:**

- `setNumber: number`
- `weight: number`
- `reps: number`
- `isLogged: boolean`
- `isActive: boolean` (highlight)
- `onWeightChange: (value: number) => void`
- `onRepsChange: (value: number) => void`

---

### 7.6 RestTimerWidget

**Props:**

- `isActive: boolean`
- `remainingSeconds: number`
- `defaultSeconds: number`
- `onSkip: () => void`
- `onDefaultChange: (seconds: number) => void`

---

## 8. Halterofit Mapping

### Reference Screens → Halterofit

| Reference Screen  | Halterofit Screen             | File                                     | MVP           |
| ----------------- | ----------------------------- | ---------------------------------------- | ------------- |
| Discover          | HomeScreen                    | `(tabs)/index.tsx`                       | Simplifié     |
| Muscle Selector   | ExerciseSelectorScreen        | `(tabs)/exercises/index.tsx`             | Show All only |
| Exercise List     | ExerciseListScreen            | `(tabs)/exercises/list.tsx`              | Oui           |
| All Plans         | PlansListScreen               | `plans/index.tsx`                        | Oui           |
| Workout Timeline  | WorkoutScreen                 | `(tabs)/workout.tsx`                     | Oui           |
| Day Details       | (inline dans TimelineDayCard) | `components/workout/TimelineDayCard.tsx` | Oui           |
| Edit Day          | EditDayScreen                 | `plans/[id]/day/[dayId]/edit.tsx`        | Oui           |
| Add Exercises     | AddExercisesScreen            | `plans/add-exercises.tsx`                | Oui           |
| Active Workout    | ActiveWorkoutScreen           | `workout/active.tsx`                     | Oui           |
| Workout Complete  | WorkoutSummaryScreen          | `workout/summary.tsx`                    | Oui           |
| Progress Overview | ProgressScreen                | `(tabs)/progress.tsx`                    | Simplifié     |
| Settings          | SettingsScreen                | `settings/index.tsx`                     | Oui           |
| Profile           | ProfileScreen                 | `settings/profile.tsx`                   | Oui           |

### Features Post-MVP

- Filtres exercices (Muscle, Equipment, Type)
- Custom exercises
- Full calendar avec historique
- Workout logs détaillés
- Anatomie humaine (zones musculaires)
- Analytics (Volume, Workout Time charts)
- 1RM calculations
- Timeout workout 4h (Leftover Session)
- Notifications rest timer
- Comparaison avec performances précédentes

---

_Document généré à partir de l'analyse de PDF de référence concurrentielle._
