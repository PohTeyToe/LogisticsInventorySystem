import Card from '../shared/Card';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getVar, CHART_COLORS } from './chartUtils';
import type { MovementTrend } from './analyticsHelpers';
import styles from './MovementTrends.module.css';

interface MovementTrendsProps {
  data: MovementTrend[];
  loading: boolean;
}

export default function MovementTrends({ data, loading }: MovementTrendsProps) {
  if (loading) {
    return (
      <Card title="Stock Movement Trends" noPadding>
        <div className={styles.skeletonChartArea}>Loading chart data...</div>
      </Card>
    );
  }

  return (
    <Card title="Stock Movement Trends">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS[3]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS[3]} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS[4]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS[4]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fill: getVar('--text-muted'), fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: getVar('--text-muted'), fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ background: getVar('--bg-surface'), border: `1px solid ${getVar('--border-muted')}`, borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: getVar('--text-primary') }}
              formatter={(value, name) => [
                Number(value),
                name === 'inQty' ? 'Stock In' : 'Stock Out',
              ]}
            />
            <Area
              type="monotone"
              dataKey="inQty"
              stackId="1"
              stroke={CHART_COLORS[3]}
              strokeWidth={2}
              fill="url(#gradIn)"
            />
            <Area
              type="monotone"
              dataKey="outQty"
              stackId="1"
              stroke={CHART_COLORS[4]}
              strokeWidth={2}
              fill="url(#gradOut)"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className={styles.emptyState}>No movement data available</div>
      )}
    </Card>
  );
}
