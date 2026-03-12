import Skeleton from './Skeleton';

interface SkeletonTableProps {
  rows?: number;
  cols?: number;
}

const tableStyles: Record<string, React.CSSProperties> = {
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '13px',
  },
  th: {
    padding: '10px 16px',
    textAlign: 'left' as const,
    fontSize: '10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.8px',
    fontWeight: 600,
    background: 'var(--bg-elevated)',
    borderBottom: '1px solid var(--border-muted)',
    whiteSpace: 'nowrap' as const,
  },
  td: {
    padding: '10px 16px',
    borderBottom: '1px solid var(--border-muted)',
  },
};

export default function SkeletonTable({ rows = 5, cols = 5 }: SkeletonTableProps) {
  return (
    <table style={tableStyles.table}>
      <tbody>
        {Array.from({ length: rows }, (_, rowIdx) => (
          <tr key={rowIdx}>
            {Array.from({ length: cols }, (_, colIdx) => (
              <td key={colIdx} style={tableStyles.td}>
                <Skeleton
                  width={colIdx === 0 ? '70%' : `${40 + ((colIdx + rowIdx) % 4) * 15}%`}
                  height={14}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
