import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rect' | 'circle';
  className?: string;
}

export default function Skeleton({
  width,
  height,
  variant = 'text',
  className,
}: SkeletonProps) {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    display: 'inline-block',
  };

  if (variant === 'text' && !height) {
    style.height = '1em';
  }

  if (variant === 'circle') {
    const size = width || height || 40;
    style.width = typeof size === 'number' ? `${size}px` : size;
    style.height = typeof size === 'number' ? `${size}px` : size;
  }

  return (
    <span
      className={`${styles.skeleton} ${styles[variant]}${className ? ` ${className}` : ''}`}
      style={style}
    />
  );
}
