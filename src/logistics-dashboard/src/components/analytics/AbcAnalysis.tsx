import Card from '../shared/Card';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getVar, fmtCurrency, CHART_COLORS, ABC_COLORS } from './chartUtils';
import type { AbcItem } from './analyticsHelpers';
import styles from './AbcAnalysis.module.css';

interface AbcAnalysisProps {
  data: AbcItem[];
  loading: boolean;
}

export default function AbcAnalysis({ data, loading }: AbcAnalysisProps) {
  if (loading) {
    return (
      <Card title="ABC Analysis (Pareto)" noPadding>
        <div className={styles.skeletonChartArea}>Loading chart data...</div>
      </Card>
    );
  }

  return (
    <Card title="ABC Analysis (Pareto)">
      {data.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.slice(0, 25)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="sku"
                tick={{ fill: getVar('--text-muted'), fontSize: 9, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                yAxisId="value"
                tick={{ fill: getVar('--text-muted'), fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                yAxisId="pct"
                orientation="right"
                domain={[0, 100]}
                tick={{ fill: getVar('--text-muted'), fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{ background: getVar('--bg-surface'), border: `1px solid ${getVar('--border-muted')}`, borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: getVar('--text-primary') }}
                formatter={(value, name) => {
                  if (name === 'cumulativePct') return [`${Number(value).toFixed(1)}%`, 'Cumulative'];
                  return [fmtCurrency(Number(value)), 'Value'];
                }}
              />
              <Bar
                yAxisId="value"
                dataKey="value"
                radius={[3, 3, 0, 0]}
                fill={CHART_COLORS[0]}
                shape={(props) => {
                  const p = props as { x: number; y: number; width: number; height: number; index: number };
                  const item = data[p.index];
                  const color = item ? ABC_COLORS[item.abcClass] : ABC_COLORS.C;
                  return (
                    <rect
                      x={p.x}
                      y={p.y}
                      width={p.width}
                      height={p.height}
                      fill={color}
                      rx={3}
                      ry={3}
                    />
                  );
                }}
              />
              <Line
                yAxisId="pct"
                dataKey="cumulativePct"
                stroke={CHART_COLORS[2]}
                strokeWidth={2}
                dot={false}
                type="monotone"
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className={styles.abcLegend}>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: ABC_COLORS.A }} />
              Class A (80% value)
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: ABC_COLORS.B }} />
              Class B (15% value)
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: ABC_COLORS.C }} />
              Class C (5% value)
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: CHART_COLORS[2], borderRadius: '50%' }} />
              Cumulative %
            </div>
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>No inventory data for ABC analysis</div>
      )}
    </Card>
  );
}
