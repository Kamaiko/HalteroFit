/**
 * BrandIcon - Halterofit barbell-H logo as a reusable SVG component
 *
 * Renders the brand logo at any size with customizable color.
 * Supports an optional diagonal gradient for premium effects (e.g. carbon fiber).
 * Derived from assets/branding/icon.svg (viewBox 120x100).
 *
 * @example
 * <BrandIcon size={64} color={Colors.foreground.secondary} />
 * <BrandIcon size={72} color={Colors.brand.carbonDark} gradientColors={[Colors.brand.carbonLight, Colors.brand.carbonDark]} />
 */

import { memo } from 'react';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/** Aspect ratio of the original viewBox (120:100) */
const ASPECT_RATIO = 1.2;

interface BrandIconProps {
  /** Icon height in pixels — width is auto-calculated (1.2:1 ratio) */
  size: number;
  /** Fill color for the logo (used when gradientColors is not provided) */
  color: string;
  /** Optional diagonal gradient [startColor, endColor] — top-left to bottom-right */
  gradientColors?: readonly [string, string];
}

export const BrandIcon = memo(function BrandIcon({ size, color, gradientColors }: BrandIconProps) {
  const fill = gradientColors ? 'url(#brand-gradient)' : color;

  return (
    <Svg width={size * ASPECT_RATIO} height={size} viewBox="0 0 120 100">
      {gradientColors && (
        <Defs>
          <LinearGradient
            id="brand-gradient"
            x1="0"
            y1="0"
            x2="120"
            y2="100"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={gradientColors[0]} />
            <Stop offset="1" stopColor={gradientColors[1]} />
          </LinearGradient>
        </Defs>
      )}
      {/* Outer thin bars */}
      <Rect x={17} y={38} width={4} height={24} rx={2} fill={fill} />
      <Rect x={99} y={38} width={4} height={24} rx={2} fill={fill} />
      {/* Inner weight plates */}
      <Rect x={24} y={30} width={7} height={40} rx={2.5} fill={fill} />
      <Rect x={89} y={30} width={7} height={40} rx={2.5} fill={fill} />
      {/* H left upright */}
      <Rect x={35} y={22} width={12} height={56} rx={1.5} fill={fill} />
      {/* H right upright */}
      <Rect x={73} y={22} width={12} height={56} rx={1.5} fill={fill} />
      {/* H crossbar */}
      <Rect x={35} y={45} width={50} height={10} rx={1.5} fill={fill} />
    </Svg>
  );
});
