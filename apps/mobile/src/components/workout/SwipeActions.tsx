/**
 * SwipeActions - Right-side action buttons revealed by swipe gesture
 *
 * Renders Edit + Delete buttons with icon + label stacked vertically.
 * Designed to be used as renderRightActions content in ReanimatedSwipeable.
 */

import { Colors, ICON_SIZE_SM, BORDER_RADIUS_LG } from '@/constants';
import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

// ── Constants ───────────────────────────────────────────────────────────
const ACTION_WIDTH = 76;

// ── Props ───────────────────────────────────────────────────────────────
interface SwipeActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

// ── Component ───────────────────────────────────────────────────────────
export const SwipeActions = memo(function SwipeActions({ onEdit, onDelete }: SwipeActionsProps) {
  return (
    <View style={styles.container}>
      {/* Edit button */}
      <Pressable
        onPress={onEdit}
        style={styles.editButton}
        className="active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel="Edit exercise"
      >
        <Ionicons name="pencil-outline" size={ICON_SIZE_SM} color={Colors.foreground.DEFAULT} />
        <Text style={styles.editLabel}>Edit</Text>
      </Pressable>

      {/* Delete button */}
      <Pressable
        onPress={onDelete}
        style={styles.deleteButton}
        className="active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel="Delete exercise"
      >
        <Ionicons name="trash-outline" size={ICON_SIZE_SM} color={Colors.primary.foreground} />
        <Text style={styles.deleteLabel}>Delete</Text>
      </Pressable>
    </View>
  );
});

// ── Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 8, // match card mb-2
    marginRight: 16, // match card mr-4
    borderRadius: BORDER_RADIUS_LG,
    overflow: 'hidden',
  },
  editButton: {
    width: ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.elevated,
    gap: 4,
  },
  deleteButton: {
    width: ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.destructive,
    gap: 4,
  },
  editLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.foreground.DEFAULT,
  },
  deleteLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary.foreground,
  },
});
