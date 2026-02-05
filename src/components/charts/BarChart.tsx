/**
 * BarChart Component
 *
 * Abstraction layer for bar charts using Victory Native.
 * Provides a simple, reusable interface that can be easily swapped if we change chart libraries.
 *
 * Usage:
 *   <BarChart
 *     data={[45, 52, 48, 60]}
 *     labels={['Mon', 'Tue', 'Wed', 'Thu']}
 *     title="Daily Sets"
 *   />
 *
 * Benefits:
 * - Simple prop interface (library-agnostic)
 * - Dark theme by default (matches app design)
 * - Responsive sizing
 * - Smooth animations
 */

import { View, Text, Dimensions } from 'react-native';
import { CartesianChart, Bar } from 'victory-native';
import {
  Colors,
  CHART_DEFAULT_HEIGHT,
  CHART_WIDTH_RATIO,
  CHART_DOMAIN_PADDING,
  DURATION_MODERATE,
} from '@/constants';

/**
 * Props are library-agnostic
 * If we change from Victory Native to another library,
 * we only need to change the implementation, not the interface
 */
interface BarChartProps {
  /** Y-axis data points (bar heights) */
  data: number[];

  /** X-axis labels (must match data length) */
  labels: string[];

  /** Optional chart title */
  title?: string;

  /** Chart width (default: 90% of screen width) */
  width?: number;

  /** Chart height (default: CHART_DEFAULT_HEIGHT) */
  height?: number;

  /** Bar color (default: primary color) */
  barColor?: string;

  /** Show values on top of bars (default: false) */
  showValues?: boolean;
}

export function BarChart({
  data,
  labels,
  title,
  width,
  height = CHART_DEFAULT_HEIGHT,
  barColor = Colors.primary.DEFAULT,
  showValues = false,
}: BarChartProps) {
  // Calculate default width as 90% of screen width
  const defaultWidth = Dimensions.get('window').width * CHART_WIDTH_RATIO;
  const chartWidth = width || defaultWidth;

  // Transform data for Victory Native
  // Victory expects array of {x, y} objects
  const chartData = data.map((y, index) => ({
    x: index,
    y,
  }));

  return (
    <View className="items-center mb-4">
      {title && <Text className="text-lg font-semibold text-foreground mb-2">{title}</Text>}

      <CartesianChart
        data={chartData}
        xKey="x"
        yKeys={['y']}
        domainPadding={{
          top: CHART_DOMAIN_PADDING,
          bottom: CHART_DOMAIN_PADDING,
          left: CHART_DOMAIN_PADDING,
          right: CHART_DOMAIN_PADDING,
        }}
      >
        {({ points, chartBounds }) => (
          <Bar
            points={points.y}
            chartBounds={chartBounds}
            color={barColor}
            roundedCorners={{
              topLeft: 4,
              topRight: 4,
            }}
            animate={{ type: 'timing', duration: DURATION_MODERATE }}
          />
        )}
      </CartesianChart>

      {/* X-axis labels */}
      <View className="flex-row justify-between w-full px-4 mt-2">
        {labels.map((label, index) => (
          <Text
            key={index}
            className="text-xs text-foreground-muted"
            style={{ width: chartWidth / labels.length, textAlign: 'center' }}
          >
            {label}
          </Text>
        ))}
      </View>

      {/* Optional: Show values on top of bars */}
      {showValues && (
        <View className="flex-row justify-between w-full px-4 absolute top-12">
          {data.map((value, index) => (
            <Text
              key={index}
              className="text-xs font-semibold text-foreground"
              style={{ width: chartWidth / data.length, textAlign: 'center' }}
            >
              {value}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
