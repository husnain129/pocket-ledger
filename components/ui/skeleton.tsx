import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { AppTheme, Layout } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type Props = {
  width?: number | string;
  height?: number;
  radius?: number;
};

export function SkeletonBlock({
  width = "100%",
  height = 16,
  radius = 12,
}: Props) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];
  const pulse = useSharedValue(0.5);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <Animated.View
      style={[
        styles.block,
        animatedStyle,
        { width, height, borderRadius: radius, backgroundColor: theme.border },
      ]}
    />
  );
}

export function SkeletonStack() {
  return (
    <View style={styles.stack}>
      <SkeletonBlock height={24} width="65%" />
      <SkeletonBlock height={44} width="100%" />
      <SkeletonBlock height={120} width="100%" />
      <SkeletonBlock height={120} width="100%" />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    overflow: "hidden",
  },
  stack: {
    gap: Layout.gap,
  },
});
