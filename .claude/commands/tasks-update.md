---
description: Auto-detect completed tasks and update TASKS.md
allowed-tools: Bash(git log:*), Bash(git diff:*), Read, Edit, Grep
argument-hint: [next|status]
---

# /tasks-update - Auto-Magic Task Completion

Auto-detects completed work and cascades 6 levels of updates automatically.

---

## 🎯 Usage

```bash
/tasks-update              # Auto-detect & update
/tasks-update next         # Suggest next task
/tasks-update status       # Show kanban
```

---

## 🔍 Auto-Detection

Analyzes 4 sources to detect completion:

1. **Git commits** (last 24h) - messages, files, count
2. **Kanban DOING** - tasks marked in progress
3. **File patterns** - matches task "Files:" with git diff
4. **Task descriptions** - keyword matching

**Handles ambiguity:**

- Single strong match → Auto-proceeds with confirmation
- Multiple candidates → Shows numbered list, user picks
- No match → Shows DOING column, asks which task

---

## 🔄 Auto-Cascade Updates (6 Levels)

One command updates **6 levels automatically:**

### Core (1-2)

1. Task checkbox: `[ ]` → `[x]`
2. Last Updated: Set to current date (YYYY-MM-DD)

### Kanban (3-5)

3. DOING → DONE: Move task, remove "(started)"
4. Auto-rotate DONE: Keep last 5, drop oldest if >5
5. Update TODO: Remove completed task if present

### Migration (6)

6. Check sub-section: If 100% complete, trigger CHANGELOG migration
   - Extract sub-section from TASKS.md
   - Format with `<details>` collapse
   - Insert at top of CHANGELOG (reverse chronological)
   - Remove from TASKS.md

**Time:** All 6 updates in ~2 seconds.

---

## 📋 Example

```bash
/tasks-update
```

**Success:**

```
🔍 Analyzing recent work...

✅ Detected: 1.1.1 Create login screen UI
   Evidence: 3 commits, src/app/(auth)/login.tsx ✓

📊 Auto-updated:
   ✓ Task marked [x] in TASKS.md
   ✓ Kanban: 1.1.1 moved DOING → DONE
   ✓ Last Updated: 2025-11-20

⏭️ Next: 1.1.2 Register screen UI [M - 2h]

Start this task? [Y/n]
```

**Ambiguous:**

```
🤔 Multiple tasks detected:

Which task did you complete?
1. 1.1.1 Login screen (4 commits, login.tsx)
2. 1.1.2 Register screen (2 commits, register.tsx)

[1/2]: _
```

---

## 📦 CHANGELOG Migration

When sub-section reaches 100%:

```
✅ Sub-section 1.1: Auth UI & Screens complete (5/5)

🔄 Migrating to CHANGELOG...
   ✓ Extracted 5 tasks from TASKS.md
   ✓ Created <details> collapse block
   ✓ Inserted at top of CHANGELOG (reverse chronological)
   ✓ Removed sub-section from TASKS.md

📋 CHANGELOG.md updated
🗑️  TASKS.md cleaned

⏭️ Next: Phase 1.2 Testing Infrastructure
```

**Format:** See [Task & Documentation Format Specification](../.claude/lib/tasks-format-spec.md) § CHANGELOG Format

---

## 🎯 Constraints

### Performance

- <5 seconds for auto-detection
- <2 seconds for cascade updates
- Git analysis: last 24h commits only

### Scope - DO

- Analyze `git log`, `git diff`
- Parse TASKS.md (header + phase sections)
- Update checkboxes, Kanban, Last Updated
- Trigger CHANGELOG migration when sub-section complete

### Scope - DO NOT

- Calculate task counters or progress %
- Modify git history
- Read files outside project directory

### Detection Heuristics

- Match task ID with commit messages
- Match "Files:" field with changed files
- Match keywords in task description
- Prioritize DOING column tasks
- Simple confidence (strong/weak/none), no complex %

---

## ⚠️ Error Handling

| Scenario              | Response                                                                      |
| --------------------- | ----------------------------------------------------------------------------- |
| No recent commits     | "ℹ️ No recent commits (last 24h). Still working? Or mark specific task?"      |
| Task already complete | "✓ Task 1.1.1 already complete (2025-11-18). Next: 1.1.2..."                  |
| Blocked dependencies  | "⚠️ Cannot start 1.3.1 - Dependencies: 1.1.1 (pending). Complete 1.1.1 first" |

---

## 📚 Reference

- **Format Spec**: `.claude/lib/tasks-format-spec.md`
- **Kanban Structure**: `TASKS.md` § Kanban
- **CHANGELOG Format**: `CHANGELOG.md`
