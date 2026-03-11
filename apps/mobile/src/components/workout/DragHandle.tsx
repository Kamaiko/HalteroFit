/**
 * DragHandle - 6-dot grip indicator for drag-to-reorder lists
 *
 * Renders a 2×3 dot grid inside a long-press Pressable.
 * Used by DayCard, DayExerciseCard, and EditDayExerciseCard.
 * Margins are the container's responsibility — this component only defines its hit area.
 */

import { Colors, DURATION_INSTANT } from '@/constants';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export interface DragHandleProps {
  onDrag?: () => void;
}

const DOT_SIZE = 3;
const DOT_GAP = 2;

function DotRow() {
  return (
    <View className="flex-row" style={styles.dotRow}>
      <View className="rounded-full" style={styles.dot} />
      <View className="rounded-full" style={styles.dot} />
    </View>
  );
}

export const DragHandle = memo(function DragHandle({ onDrag }: DragHandleProps) {
  return (
    <Pressable
      onLongPress={onDrag}
      delayLongPress={DURATION_INSTANT}
      disabled={!onDrag}
      style={styles.pressable}
    >
      <View className="items-center justify-center" style={styles.container}>
        <DotRow />
        <View style={styles.rowSpacer}>
          <DotRow />
        </View>
        <View style={styles.rowSpacer}>
          <DotRow />
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pressable: { paddingVertical: 12, paddingHorizontal: 14 },
  container: { width: 10, height: 16 },
  dotRow: { gap: DOT_GAP },
  dot: { width: DOT_SIZE, height: DOT_SIZE, backgroundColor: Colors.foreground.tertiary },
  rowSpacer: { marginTop: DOT_GAP },
});
