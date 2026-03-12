interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color: string;
  filled?: boolean;
  label?: string;
}

export default function Sparkline({
  data,
  width = 80,
  height = 28,
  color,
  filled = false,
  label = 'Trend sparkline',
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const polylinePoints = points.join(' ');

  const polygonPoints = filled
    ? `${padding},${height - padding} ${polylinePoints} ${width - padding},${height - padding}`
    : '';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="sparkline"
      role="img"
      aria-label={label}
    >
      {filled && (
        <polygon
          points={polygonPoints}
          fill={color}
          opacity={0.1}
        />
      )}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
