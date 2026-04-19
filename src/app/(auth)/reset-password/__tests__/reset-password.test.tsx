import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResetPasswordPage from '../page'

describe('ResetPasswordPage', () => {
  it('renders new password input', () => {
    render(<ResetPasswordPage />)
    expect(screen.getByLabelText(/新しいパスワード/i)).toBeInTheDocument()
  })

  it('renders confirm password input', () => {
    render(<ResetPasswordPage />)
    expect(screen.getByLabelText(/パスワード確認/i)).toBeInTheDocument()
  })

  it('renders submit button with text "パスワードを更新"', () => {
    render(<ResetPasswordPage />)
    expect(screen.getByRole('button', { name: /パスワードを更新/i })).toBeInTheDocument()
  })
})
