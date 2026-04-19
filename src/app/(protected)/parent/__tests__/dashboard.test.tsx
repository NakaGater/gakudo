import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ParentDashboard from '../page'

describe('ParentDashboard', () => {
  it('renders "ホーム" heading', () => {
    render(<ParentDashboard />)
    expect(screen.getByRole('heading', { name: 'ホーム' })).toBeDefined()
  })
})
