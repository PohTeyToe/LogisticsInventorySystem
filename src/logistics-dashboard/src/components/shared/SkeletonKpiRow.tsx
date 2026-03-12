import Skeleton from './Skeleton';

const containerStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '16px',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: '20px',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '12px',
};

const valueStyle: React.CSSProperties = {
  marginBottom: '6px',
};

export default function SkeletonKpiRow() {
  return (
    <div style={containerStyle}>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} style={cardStyle}>
          <div style={headerStyle}>
            <Skeleton width={80} height={12} />
            <Skeleton variant="rect" width={36} height={36} />
          </div>
          <div style={valueStyle}>
            <Skeleton width={100} height={28} />
          </div>
          <Skeleton width={60} height={11} />
        </div>
      ))}
    </div>
  );
}
