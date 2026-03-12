import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import KpiCard from '../KpiCard'

describe('KpiCard', () => {
  const defaultProps = {
    label: 'Total Items',
    value: '1,234',
    icon: <span data-testid="icon">icon</span>,
    variant: 'teal' as const,
  }

  it('renders the label', () => {
    render(<KpiCard {...defaultProps} />)
    expect(screen.getByText('Total Items')).toBeInTheDocument()
  })

  it('renders the value', () => {
    render(<KpiCard {...defaultProps} />)
    expect(screen.getByText('1,234')).toBeInTheDocument()
  })

  it('renders the icon', () => {
    render(<KpiCard {...defaultProps} />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('renders trend indicator when provided (up)', () => {
    render(
      <KpiCard
        {...defaultProps}
        trend={{ direction: 'up', text: '+12% this week' }}
      />,
    )
    expect(screen.getByText('+12% this week')).toBeInTheDocument()
  })

  it('renders trend indicator when provided (down)', () => {
    render(
      <KpiCard
        {...defaultProps}
        trend={{ direction: 'down', text: '-5% this week' }}
      />,
    )
    expect(screen.getByText('-5% this week')).toBeInTheDocument()
  })

  it('does not render trend when not provided', () => {
    const { container } = render(<KpiCard {...defaultProps} />)
    // Trend SVGs are only rendered when trend prop is given
    expect(container.querySelectorAll('svg')).toHaveLength(0)
  })

  it('renders sparkline slot when provided', () => {
    render(
      <KpiCard
        {...defaultProps}
        sparkline={<div data-testid="sparkline">chart</div>}
      />,
    )
    expect(screen.getByTestId('sparkline')).toBeInTheDocument()
  })

  it('applies animation delay style', () => {
    const { container } = render(<KpiCard {...defaultProps} delay={200} />)
    const card = container.firstElementChild as HTMLElement
    expect(card.style.animationDelay).toBe('200ms')
  })
})
