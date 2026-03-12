import Card from '../shared/Card';
import { Treemap, ResponsiveContainer } from 'recharts';
import { fmtCurrency } from './chartUtils';
import type { TreemapNode } from './analyticsHelpers';
import styles from './CategoryDistribution.module.css';

interface CategoryDistributionProps {
  data: TreemapNode[];
  loading: boolean;
}

// ---------- Custom Treemap content ----------
interface TreemapContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  size: number;
  fill: string;
}

function CustomTreemapContent({ x, y, width, height, name, size, fill }: TreemapContentProps) {
  if (width < 40 || height < 30) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} opacity={0.85} rx={4} ry={4} stroke="var(--bg-surface)" strokeWidth={2} />
      <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" className={styles.treemapLabel}>
        {name.length > 12 ? name.slice(0, 12) + '...' : name}
      </text>
      <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" className={styles.treemapValue}>
        {fmtCurrency(size)}
      </text>
    </g>
  );
}

export default function CategoryDistribution({ data, loading }: CategoryDistributionProps) {
  if (loading) {
    return (
      <Card title="Category Value Distribution" noPadding>
        <div className={styles.skeletonChartArea}>Loading chart data...</div>
      </Card>
    );
  }

  return (
    <Card title="Category Value Distribution">
      {data.length > 0 ? (
        <div className={styles.treemapContainer}>
          <ResponsiveContainer width="100%" height={280}>
            <Treemap
              data={data}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="var(--bg-surface)"
              content={<CustomTreemapContent x={0} y={0} width={0} height={0} name="" size={0} fill="" />}
            />
          </ResponsiveContainer>
        </div>
      ) : (
        <div className={styles.emptyState}>No category data available</div>
      )}
    </Card>
  );
}
