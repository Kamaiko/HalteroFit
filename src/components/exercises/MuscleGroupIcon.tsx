/**
 * Muscle Group Icon
 *
 * Renders a cropped SVG body diagram with the target muscle highlighted.
 * Uses the vendored body-highlighter SVG path data with a custom viewBox
 * to zoom into the relevant body region for each muscle group.
 *
 * Falls back to Ionicons for non-anatomical categories (cardio).
 */

import { memo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

import { Ionicons } from '@/components/ui/icon';
import { Colors, ICON_SIZE_MUSCLE, ICON_SIZE_XL } from '@/constants';

import { getMuscleIconData } from './muscleGroupIconConfig';

// ============================================================================
// Types
// ============================================================================

export interface MuscleGroupIconProps {
  /** Muscle group identifier matching MUSCLE_GROUPS[].id */
  muscleGroupId: string;
  /** Icon size in pixels (default: ICON_SIZE_MUSCLE) */
  size?: number;
  /** Color variant: 'dark' for dark backgrounds (default), 'light' for white backgrounds */
  variant?: 'dark' | 'light';
}

// ============================================================================
// Constants
// ============================================================================

const DIM_BODY_COLOR_DARK = Colors.muscle.dimBody;
const DIM_BODY_COLOR_LIGHT = Colors.border.input;
/** Padding ratio applied to viewBox to prevent silhouette edge bleed (4% per side) */
const VIEWBOX_PADDING_RATIO = 0.04;

// ============================================================================
// Component
// ============================================================================

export const MuscleGroupIcon = memo(function MuscleGroupIcon({
  muscleGroupId,
  size = ICON_SIZE_MUSCLE,
  variant = 'dark',
}: MuscleGroupIconProps) {
  const iconData = getMuscleIconData(muscleGroupId);

  // Fallback icon for cardio (only non-SVG category remaining)
  if (!iconData) {
    return <Ionicons name="heart" size={ICON_SIZE_XL} color={Colors.primary.DEFAULT} />;
  }

  const isLight = variant === 'light';
  const dimColor = isLight ? DIM_BODY_COLOR_LIGHT : DIM_BODY_COLOR_DARK;

  // Apply uniform padding to prevent silhouette from touching icon edges
  const [rawX, rawY, rawW, rawH] = iconData.viewBox.split(' ').map(Number) as [
    number,
    number,
    number,
    number,
  ];
  const px = Math.round(rawW * VIEWBOX_PADDING_RATIO);
  const py = Math.round(rawH * VIEWBOX_PADDING_RATIO);
  const vx = rawX - px;
  const vy = rawY - py;
  const vw = rawW + 2 * px;
  const vh = rawH + 2 * py;
  const viewBox = `${vx} ${vy} ${vw} ${vh}`;

  return (
    <Svg viewBox={viewBox} width={size} height={size}>
      {/* Layer 0: Background fill for light variant */}
      {isLight && <Rect x={vx} y={vy} width={vw} height={vh} fill={Colors.surface.white} />}

      {/* Layer 1: All body parts dimmed (anatomical silhouette context) */}
      {iconData.allPaths.map((d, i) => (
        <Path
          key={i}
          d={d}
          fill={dimColor}
          stroke={dimColor}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ))}

      {/* Layer 2: Highlighted muscle (overwrites dim paths underneath) */}
      {iconData.highlightPaths.map((d, i) => (
        <Path
          key={`h${i}`}
          d={d}
          fill={Colors.primary.DEFAULT}
          stroke={Colors.primary.DEFAULT}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
});
