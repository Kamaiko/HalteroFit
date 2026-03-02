/**
 * LineChart Component
 *
 * TODO: Not yet consumed — will be used when analytics is implemented
 *
 * Abstraction layer for line charts using Victory Native.
 * Provides a simple, reusable interface that can be easily swapped if we change chart libraries.
 *
 * Usage:
 *   <LineChart
 *     data={[12000, 13500, 14200]}
 *     labels={['Week 1', 'Week 2', 'Week 3']}
 *     title="Weekly Volume"
 *   />
 */

import { View, Text, Dimensions } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import { Colors, CHART_WIDTH_RATIO, CHART_DOMAIN_PADDING, DURATION_MODERATE } from '@/constants';

interface LineChartProps {
  /** Y-axis data points */
  data: number[];

  /** X-axis labels (must match data length) */
  labels: string[];

  /** Optional chart title */
  title?: string;

  /** Chart width (default: 90% of screen width) */
  width?: number;

  /** Smooth curve interpolation (default: true) */
  smoothCurve?: boolean;

  /** Line color (default: primary color) */
  lineColor?: string;
}

export function LineChart({
  data,
  labels,
  title,
  width,
  smoothCurve = true,
  lineColor = Colors.primary.DEFAULT,
}: LineChartProps) {
  const defaultWidth = Dimensions.get('window').width * CHART_WIDTH_RATIO;
  const chartWidth = width || defaultWidth;

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
        {({ points }) => (
          <Line
            points={points.y}
            color={lineColor}
            strokeWidth={3}
            curveType={smoothCurve ? 'natural' : 'linear'}
            animate={{ type: 'timing', duration: DURATION_MODERATE }}
          />
        )}
      </CartesianChart>

      {/* X-axis labels (Victory Native doesn't render them by default in basic setup) */}
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
    </View>
  );
}
