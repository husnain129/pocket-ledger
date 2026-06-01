import { StyleSheet, Text, View } from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";

import { AppTheme, Layout } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type LineSeries = Array<{ label: string; value: number }>;
type PieSeries = Array<{
  label: string;
  value: number;
  color: string;
  text: string;
}>;
type BarSeries = Array<{ label: string; value: number }>;

type CardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

function ChartCard({ title, subtitle, children }: CardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {subtitle}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

export function SpendingLineChart({ data }: { data: LineSeries }) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];

  return (
    <ChartCard title="Daily spending" subtitle="Current period trend">
      <LineChart
        data={data}
        thickness={3}
        color={theme.primary}
        hideRules
        curved
        isAnimated
        areaChart
        startFillColor={theme.primary}
        endFillColor={theme.primary}
        startOpacity={0.28}
        endOpacity={0.02}
        yAxisColor={theme.border}
        xAxisColor={theme.border}
        yAxisTextStyle={{ color: theme.textMuted, fontSize: 11 }}
        xAxisLabelTextStyle={{ color: theme.textMuted, fontSize: 11 }}
        noOfSections={4}
        spacing={36}
        initialSpacing={8}
        width={300}
        height={180}
        hideDataPoints={false}
        dataPointsColor={theme.secondary}
        textColor={theme.text}
        textShiftY={-8}
        textShiftX={-10}
      />
    </ChartCard>
  );
}

export function SpendingDonutChart({ data }: { data: PieSeries }) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];

  return (
    <ChartCard title="By category" subtitle="Spending mix">
      <View style={{ alignItems: "center" }}>
        <PieChart
          data={data}
          donut
          showGradient
          sectionAutoFocus
          radius={90}
          innerRadius={56}
          centerLabelComponent={() => (
            <View style={styles.centerLabel}>
              <Text style={[styles.centerLabelValue, { color: theme.text }]}>
                {data.length}
              </Text>
              <Text
                style={[styles.centerLabelText, { color: theme.textMuted }]}
              >
                categories
              </Text>
            </View>
          )}
        />
      </View>
    </ChartCard>
  );
}

export function SpendingBarChart({ data }: { data: BarSeries }) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = AppTheme[colorScheme];

  return (
    <ChartCard title="Weekly comparison" subtitle="Last four weeks">
      <BarChart
        data={data}
        barWidth={24}
        spacing={20}
        roundedTop
        hideRules
        frontColor={theme.secondary}
        yAxisColor={theme.border}
        xAxisColor={theme.border}
        yAxisTextStyle={{ color: theme.textMuted, fontSize: 11 }}
        xAxisLabelTextStyle={{ color: theme.textMuted, fontSize: 11 }}
        height={200}
        width={300}
        isAnimated
      />
    </ChartCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Layout.radius,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 13,
    marginTop: -4,
  },
  centerLabel: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabelValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  centerLabelText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
