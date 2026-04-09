import { render, screen } from '@testing-library/react'
import { describe, expect, it, beforeAll } from 'vitest'
import { DatePicker } from '../components/ui/date-picker'
import { initializeI18n } from '../i18n'

describe('DatePicker', () => {
  beforeAll(async () => {
    await initializeI18n('pt-BR')
  })

  it('renderiza com valor inicial preenchido sem entrar em loop de atualizacao', () => {
    const { rerender } = render(<DatePicker value="2026-03-05" onChange={() => undefined} />)

    expect(() => {
      rerender(<DatePicker value="2026-03-05" onChange={() => undefined} />)
    }).not.toThrow()

    expect(screen.getByRole('button')).toHaveTextContent('05/03/2026')
  })
})
