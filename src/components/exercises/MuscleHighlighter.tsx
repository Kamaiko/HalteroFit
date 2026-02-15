/**
 * Muscle Highlighter Component
 *
 * Displays front and back SVG body diagrams with highlighted muscles.
 * Target muscles are shown in the primary brand color, secondary muscles
 * in a darker muted variant for clear visual hierarchy.
 *
 * Reusable across exercise detail and future workout recap screens.
 */

import { memo, useMemo } from 'react';
import { View } from 'react-native';

import Body from '@/lib/body-highlighter';
import { Colors } from '@/constants/colors';
import { getMuscleHighlighterData } from '@/utils/muscles';

// ============================================================================
// Types
// ============================================================================

export interface MuscleHighlighterProps {
  targetMuscles: string[];
  secondaryMuscles: string[];
}

// ============================================================================
// Constants
// ============================================================================

// Intensity 1 = target (primary), Intensity 2 = secondary (muted)
const HIGHLIGHT_COLORS = [Colors.primary.DEFAULT, Colors.primary.muted];

const BODY_SCALE = 0.7;

// ============================================================================
// Component
// ============================================================================

export const MuscleHighlighter = memo(function MuscleHighlighter({
  targetMuscles,
  secondaryMuscles,
}: MuscleHighlighterProps) {
  const { data, hasAnyMuscle } = useMemo(
    () => getMuscleHighlighterData(targetMuscles, secondaryMuscles),
    [targetMuscles, secondaryMuscles]
  );

  if (!hasAnyMuscle) {
    return null;
  }

  return (
    <View className="mb-6 flex-row items-center justify-center gap-4 px-8">
      <Body
        data={data}
        gender="male"
        side="front"
        scale={BODY_SCALE}
        colors={HIGHLIGHT_COLORS}
        border={Colors.border.DEFAULT}
      />
      <Body
        data={data}
        gender="male"
        side="back"
        scale={BODY_SCALE}
        colors={HIGHLIGHT_COLORS}
        border={Colors.border.DEFAULT}
      />
    </View>
  );
});
