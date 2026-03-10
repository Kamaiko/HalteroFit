/**
 * AddDayPill - Dashed pill button to add a new workout day
 *
 * Centered below the timeline day cards.
 */

import { memo, useCallback } from 'react';
import { Pressable } from 'react-native';

import { Text } from '@/components/ui/text';
import { Colors } from '@/constants';

interface AddDayPillProps {
  onPress: () => void;
}

export const AddDayPill = memo(function AddDayPill({ onPress }: AddDayPillProps) {
  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      className="self-center mt-3 mb-6 px-5 py-2 rounded-full active:opacity-60"
      style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.border.DEFAULT }}
      accessibilityRole="button"
      accessibilityLabel="Add a workout day"
    >
      <Text style={{ color: Colors.border.light, fontSize: 14, fontWeight: '500' }}>
        + Add a Day
      </Text>
    </Pressable>
  );
});
