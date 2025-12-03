import * as React from 'react';
import {View} from 'react-native';
import SVG, { Circle } from 'react-native-svg';
import Animated, {useSharedValue, useAnimatedProps, withTiming} from 'react-native-reanimated'
import {useEffect} from 'react';
import { AntDesign } from '@expo/vector-icons';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type RingProgressProps = {
  radius?: number;
  strokeWidth?: number;
  progress?: number;
}

const color = "#EE0F55";

const RingProgress = ({radius = 100, strokeWidth = 30, progress = 0.5}: RingProgressProps) => {
  const innerRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * innerRadius;

  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withTiming(progress, {duration: 1500})
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDasharray: [circumference * fill.value, circumference]
  }))
  return React.createElement(
    View,
    { style: { width: radius * 2, height: radius * 2 } },
    React.createElement(
      SVG,
      { style: { flex: 1 } },
      /* Background */
      React.createElement(Circle, {
        r: innerRadius,
        cx: radius,
        cy: radius,
        fill: "transparent",
        stroke: color,
        strokeWidth: strokeWidth,
        opacity: 0.2
      }),
      /* Foreground */
      React.createElement(AnimatedCircle, {
        animatedProps: animatedProps,
        r: innerRadius,
        cx: radius,
        cy: radius,
        fill: "transparent",
        stroke: color,
        strokeWidth: strokeWidth,
        strokeDasharray: [circumference * progress, circumference],
        strokeLinecap: "round",
        rotation: "-90",
        originX: radius,
        originY: radius
      })
    ),
    React.createElement(AntDesign, {
      name: "right",
      size: strokeWidth * 0.8,
      color: "black",
      style: {
        position: 'absolute',
        alignSelf: 'center',
        top: strokeWidth * 0.1,
      }
    })
  )
}


export default RingProgress;