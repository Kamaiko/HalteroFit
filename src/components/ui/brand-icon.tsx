/**
 * BrandIcon - Halterofit barbell-H logo as a reusable SVG component
 *
 * Renders the brand logo at any size with customizable color.
 * Derived from assets/branding/icon.svg (viewBox 120x100).
 *
 * @example
 * <BrandIcon size={64} color={Colors.foreground.secondary} />
 */

import { memo } from 'react';
import Svg, { Rect } from 'react-native-svg';

/** Aspect ratio of the original viewBox (120:100) */
const ASPECT_RATIO = 1.2;

interface BrandIconProps {
  /** Icon height in pixels — width is auto-calculated (1.2:1 ratio) */
  size: number;
  /** Fill color for the logo */
  color: string;
}

export const BrandIcon = memo(function BrandIcon({ size, color }: BrandIconProps) {
  return (
    <Svg width={size * ASPECT_RATIO} height={size} viewBox="0 0 120 100">
      {/* Outer thin bars */}
      <Rect x={17} y={38} width={4} height={24} rx={2} fill={color} />
      <Rect x={99} y={38} width={4} height={24} rx={2} fill={color} />
      {/* Inner weight plates */}
      <Rect x={24} y={30} width={7} height={40} rx={2.5} fill={color} />
      <Rect x={89} y={30} width={7} height={40} rx={2.5} fill={color} />
      {/* H left upright */}
      <Rect x={35} y={22} width={12} height={56} rx={1.5} fill={color} />
      {/* H right upright */}
      <Rect x={73} y={22} width={12} height={56} rx={1.5} fill={color} />
      {/* H crossbar */}
      <Rect x={35} y={45} width={50} height={10} rx={1.5} fill={color} />
    </Svg>
  );
});
