import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoginPage from '../page'

describe('LoginPage', () => {
  it('renders email input', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument()
  })

  it('renders password input', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument()
  })

  it('renders login button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /ログイン/i })).toBeInTheDocument()
  })

  it('renders forgot password link', () => {
    render(<LoginPage />)
    expect(screen.getByText(/パスワードを忘れた/i)).toBeInTheDocument()
  })
})
