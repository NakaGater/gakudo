import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ParentNav } from '../parent-nav'

vi.mock('next/navigation', () => ({
  usePathname: () => '/parent',
}))

describe('ParentNav', () => {
  it('renders all 4 tab labels', () => {
    render(<ParentNav />)
    expect(screen.getByText('ホーム')).toBeDefined()
    expect(screen.getByText('入退場')).toBeDefined()
    expect(screen.getByText('連絡')).toBeDefined()
    expect(screen.getByText('写真')).toBeDefined()
  })

  it('renders navigation element', () => {
    render(<ParentNav />)
    expect(screen.getByRole('navigation')).toBeDefined()
  })
})
