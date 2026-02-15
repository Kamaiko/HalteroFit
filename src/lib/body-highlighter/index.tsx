/**
 * Body Highlighter Component (Vendored)
 *
 * SVG-based human body parts highlighter for React Native.
 * Vendored from react-native-body-highlighter@3.1.3 (0 active maintainers).
 *
 * Modifications from original:
 * - Removed ramda dependency (replaced differenceWith with native filter)
 * - Fixed duplicate Slug type entry
 * - Updated import paths for vendored location
 * - Replaced hardcoded '#3f3f3f' fills with Colors.muscle.dimBody
 * - Added 'lats' slug: extracted latissimus dorsi paths from original 'upper-back' entry
 *
 * @see https://github.com/HichamELBSI/react-native-body-highlighter
 */

import React, { memo, useCallback } from 'react';
import { Path } from 'react-native-svg';
import { Colors } from '@/constants/colors';

import { bodyFront } from './assets/bodyFront';
import { bodyBack } from './assets/bodyBack';
import { SvgMaleWrapper } from './components/SvgMaleWrapper';
import { bodyFemaleFront } from './assets/bodyFemaleFront';
import { bodyFemaleBack } from './assets/bodyFemaleBack';
import { SvgFemaleWrapper } from './components/SvgFemaleWrapper';

export type Slug =
  | 'abs'
  | 'adductors'
  | 'ankles'
  | 'biceps'
  | 'calves'
  | 'chest'
  | 'deltoids'
  | 'feet'
  | 'forearm'
  | 'gluteal'
  | 'hamstring'
  | 'hands'
  | 'hair'
  | 'head'
  | 'knees'
  | 'lats'
  | 'lower-back'
  | 'neck'
  | 'obliques'
  | 'quadriceps'
  | 'tibialis'
  | 'trapezius'
  | 'triceps'
  | 'upper-back';

export interface BodyPart {
  color?: string;
  slug?: Slug;
  path?: {
    common?: string[];
    left?: string[];
    right?: string[];
  };
}

export interface ExtendedBodyPart extends BodyPart {
  intensity?: number;
  side?: 'left' | 'right';
}

export type BodyProps = {
  colors?: ReadonlyArray<string>;
  data: ReadonlyArray<ExtendedBodyPart>;
  scale?: number;
  side?: 'front' | 'back';
  gender?: 'male' | 'female';
  onBodyPartPress?: (b: ExtendedBodyPart, side?: 'left' | 'right') => void;
  border?: string | 'none';
};

const Body = ({
  colors = ['#0984e3', '#74b9ff'],
  data,
  scale = 1,
  side = 'front',
  gender = 'male',
  onBodyPartPress,
  border = '#dfdfdf',
}: BodyProps) => {
  const mergedBodyParts = useCallback(
    (dataSource: ReadonlyArray<BodyPart>) => {
      const innerData = data
        .map((d) => {
          const foundBodyPart = dataSource.find((e) => e.slug === d.slug);
          return foundBodyPart;
        })
        .filter(Boolean) as BodyPart[];

      const coloredBodyParts = innerData.map((d) => {
        const bodyPart = data.find((e) => e.slug === d.slug);
        let colorIntensity = 1;
        if (bodyPart?.intensity) colorIntensity = bodyPart.intensity;
        return { ...d, color: colors[colorIntensity - 1] };
      });

      // Elements in dataSource that have no matching slug in data (replaces ramda differenceWith)
      const unmatched = dataSource.filter(
        (a) => !data.some((b) => a.slug === b.slug),
      );

      return [...unmatched, ...coloredBodyParts];
    },
    [data, colors],
  );

  const getColorToFill = (bodyPart: ExtendedBodyPart) => {
    if (bodyPart.intensity) {
      return colors[bodyPart.intensity - 1];
    }
    return bodyPart.color;
  };

  const renderBodySvg = (bodyToRender: ReadonlyArray<BodyPart>) => {
    const SvgWrapper = gender === 'male' ? SvgMaleWrapper : SvgFemaleWrapper;

    return (
      <SvgWrapper side={side} scale={scale} border={border}>
        {mergedBodyParts(bodyToRender).map((bodyPart: ExtendedBodyPart) => {
          const commonPaths = (bodyPart.path?.common ?? []).map((path) => {
            const dataCommonPath = data.find((d) => d.slug === bodyPart.slug)
              ?.path?.common;

            return (
              <Path
                key={path}
                onPress={() => onBodyPartPress?.(bodyPart)}
                id={bodyPart.slug}
                fill={
                  dataCommonPath ? getColorToFill(bodyPart) : bodyPart.color
                }
                d={path}
              />
            );
          });

          const leftPaths = (bodyPart.path?.left ?? []).map((path) => {
            const isOnlyRight =
              data.find((d) => d.slug === bodyPart.slug)?.side === 'right';

            return (
              <Path
                key={path}
                onPress={() => onBodyPartPress?.(bodyPart, 'left')}
                id={bodyPart.slug}
                fill={isOnlyRight ? Colors.muscle.dimBody : getColorToFill(bodyPart)}
                d={path}
              />
            );
          });
          const rightPaths = (bodyPart.path?.right ?? []).map((path) => {
            const isOnlyLeft =
              data.find((d) => d.slug === bodyPart.slug)?.side === 'left';

            return (
              <Path
                key={path}
                onPress={() => onBodyPartPress?.(bodyPart, 'right')}
                id={bodyPart.slug}
                fill={isOnlyLeft ? Colors.muscle.dimBody : getColorToFill(bodyPart)}
                d={path}
              />
            );
          });

          return [...commonPaths, ...leftPaths, ...rightPaths];
        })}
      </SvgWrapper>
    );
  };

  if (gender === 'female') {
    return renderBodySvg(side === 'front' ? bodyFemaleFront : bodyFemaleBack);
  }

  return renderBodySvg(side === 'front' ? bodyFront : bodyBack);
};

export default memo(Body);
