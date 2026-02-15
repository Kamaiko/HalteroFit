/**
 * Muscle Group Icon
 *
 * Renders a cropped SVG body diagram with the target muscle highlighted.
 * Uses the vendored body-highlighter SVG path data with a custom viewBox
 * to zoom into the relevant body region for each muscle group.
 *
 * Falls back to Ionicons for non-anatomical categories (cardio, show-all).
 */

import { memo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

import { Ionicons } from '@/components/ui/icon';
import { Colors, ICON_SIZE_MD } from '@/constants';

import { getMuscleIconData } from './muscleGroupIconConfig';

// ============================================================================
// Types
// ============================================================================

export interface MuscleGroupIconProps {
  /** Muscle group identifier matching MUSCLE_GROUPS[].id */
  muscleGroupId: string;
  /** Icon size in pixels (default: 36, fits in 48px circle container) */
  size?: number;
  /** Color variant: 'dark' for dark backgrounds (default), 'light' for white backgrounds */
  variant?: 'dark' | 'light';
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_ICON_SIZE = 36;
const DIM_BODY_COLOR_DARK = '#3f3f3f';
const DIM_BODY_COLOR_LIGHT = Colors.border.input;

// ============================================================================
// Component
// ============================================================================

export const MuscleGroupIcon = memo(function MuscleGroupIcon({
  muscleGroupId,
  size = DEFAULT_ICON_SIZE,
  variant = 'dark',
}: MuscleGroupIconProps) {
  const iconData = getMuscleIconData(muscleGroupId);

  // Fallback icons for non-anatomical categories
  if (!iconData) {
    const iconName = muscleGroupId === 'cardio' ? 'heart' : 'list';
    const color =
      muscleGroupId === 'show-all' ? Colors.foreground.DEFAULT : Colors.foreground.secondary;

    return <Ionicons name={iconName} size={ICON_SIZE_MD} color={color} />;
  }

  const isLight = variant === 'light';
  const dimColor = isLight ? DIM_BODY_COLOR_LIGHT : DIM_BODY_COLOR_DARK;
  const [vx, vy, vw, vh] = iconData.viewBox.split(' ');

  return (
    <Svg viewBox={iconData.viewBox} width={size} height={size}>
      {/* Layer 0: Background fill for light variant */}
      {isLight && <Rect x={vx} y={vy} width={vw} height={vh} fill={Colors.surface.white} />}

      {/* Layer 1: All body parts dimmed (anatomical silhouette context) */}
      {iconData.allPaths.map((d, i) => (
        <Path key={i} d={d} fill={dimColor} />
      ))}

      {/* Layer 2: Highlighted muscle (overwrites dim paths underneath) */}
      {iconData.highlightPaths.map((d, i) => (
        <Path key={`h${i}`} d={d} fill={Colors.primary.DEFAULT} />
      ))}
    </Svg>
  );
});
