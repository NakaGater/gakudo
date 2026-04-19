import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ForgotPasswordPage from '../page'

describe('ForgotPasswordPage', () => {
  it('renders email input', () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument()
  })

  it('renders submit button with text "リセットメールを送信"', () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByRole('button', { name: /リセットメールを送信/i })).toBeInTheDocument()
  })

  it('renders link back to login', () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByText(/ログインに戻る/i)).toBeInTheDocument()
  })
})
