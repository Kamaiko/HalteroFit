/**
 * DragHandle - 6-dot grip indicator for drag-to-reorder lists
 *
 * Renders a 2×3 dot grid inside a long-press Pressable.
 * Used by DayExerciseCard and EditDayExerciseCard.
 */

import { Colors } from '@/constants';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

export interface DragHandleProps {
  onDrag: () => void;
}

const DOT_SIZE = 3;
const DOT_GAP = 2;

function DotRow() {
  return (
    <View className="flex-row" style={{ gap: DOT_GAP }}>
      <View
        className="rounded-full"
        style={{ width: DOT_SIZE, height: DOT_SIZE, backgroundColor: Colors.background.elevated }}
      />
      <View
        className="rounded-full"
        style={{ width: DOT_SIZE, height: DOT_SIZE, backgroundColor: Colors.background.elevated }}
      />
    </View>
  );
}

export const DragHandle = memo(function DragHandle({ onDrag }: DragHandleProps) {
  return (
    <Pressable
      onLongPress={onDrag}
      delayLongPress={100}
      style={{ marginLeft: -8, marginRight: 4, paddingVertical: 8, paddingHorizontal: 4 }}
    >
      <View className="items-center justify-center" style={{ width: 10, height: 16 }}>
        <DotRow />
        <View style={{ marginTop: DOT_GAP }}>
          <DotRow />
        </View>
        <View style={{ marginTop: DOT_GAP }}>
          <DotRow />
        </View>
      </View>
    </Pressable>
  );
});
