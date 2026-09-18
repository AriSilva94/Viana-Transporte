import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { DatePicker } from '../components/ui/date-picker'
import { Select } from '../components/ui/select'
import { ExportMenu } from '../components/shared/ExportMenu'
import { initializeI18n } from '../i18n'

const cases = [
  {
    name: 'calendar',
    control: () => <DatePicker value="2026-09-17" onChange={vi.fn()} />,
    popup: () => screen.queryByText('Calendário'),
  },
  {
    name: 'select',
    control: () => (
      <Select value="one">
        <option value="one">Primeira opção</option>
        <option value="two">Segunda opção</option>
      </Select>
    ),
    popup: () => screen.queryByRole('listbox'),
  },
  {
    name: 'export menu',
    control: () => <ExportMenu onExportExcel={vi.fn()} onExportPdf={vi.fn()} />,
    popup: () => screen.queryByRole('menu'),
  },
]

beforeAll(async () => {
  await initializeI18n('pt-BR')
  // JSDOM has no layout; give Radix a visible anchor for interaction tests.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(40, 40, 200, 40))
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1024)
  vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(768)
})

afterAll(() => vi.restoreAllMocks())

describe.each(cases)('$name interactions', ({ control, popup }) => {
  it.each(['container', 'window', 'resize'])('stays open after %s changes', async (target) => {
    const user = userEvent.setup()
    render(
      <div data-testid="scroll-container" className="overflow-y-auto">
        {control()}
      </div>
    )
    const trigger = screen.getByRole('button')
    await user.click(trigger)
    expect(popup()).toBeInTheDocument()
    if (target === 'resize') fireEvent.resize(window)
    else fireEvent.scroll(target === 'window' ? window : screen.getByTestId('scroll-container'))
    expect(popup()).toBeInTheDocument()
  })

  it('closes with Escape and restores focus to the trigger', async () => {
    const user = userEvent.setup()
    render(control())
    const trigger = screen.getByRole('button')
    await user.click(trigger)
    expect(popup()).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(popup()).not.toBeInTheDocument()
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('closes when clicking outside', async () => {
    const user = userEvent.setup()
    render(
      <>
        {control()}
        <button>Fora</button>
      </>
    )
    await user.click(screen.getAllByRole('button')[0])
    expect(popup()).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Fora' }))
    expect(popup()).not.toBeInTheDocument()
  })

  it('stays open when unrelated content scrolls', async () => {
    const user = userEvent.setup()
    render(
      <>
        <div>{control()}</div>
        <div data-testid="unrelated" />
      </>
    )
    await user.click(screen.getByRole('button'))
    fireEvent.scroll(screen.getByTestId('unrelated'))
    expect(popup()).toBeInTheDocument()
  })
})

it('keeps the options open and selectable when their own list scrolls', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(
    <Select value="one" onChange={onChange}>
      <option value="one">Primeira opção</option>
      <option value="two">Segunda opção</option>
    </Select>
  )
  await user.click(screen.getByRole('button'))
  const option = screen.getByRole('button', { name: 'Segunda opção' })
  fireEvent.scroll(option.parentElement!)
  expect(screen.getByRole('listbox')).toBeInTheDocument()
  await user.click(option)
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ target: { value: 'two' } }))
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})

it('focuses search and clears the filter when reopening the select', async () => {
  const user = userEvent.setup()
  render(cases[1].control())
  const trigger = screen.getByRole('button')
  await user.click(trigger)
  expect(screen.getByRole('textbox')).toHaveFocus()
  await user.type(screen.getByRole('textbox'), 'Segunda')
  expect(screen.queryByTestId('select-option-one')).not.toBeInTheDocument()
  await user.keyboard('{Escape}')
  await user.click(trigger)
  expect(screen.getByRole('textbox')).toHaveValue('')
  expect(screen.getByTestId('select-option-one')).toBeInTheDocument()
})

it('selects a date and closes the calendar', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(<DatePicker value="2026-09-17" onChange={onChange} />)
  await user.click(screen.getByRole('button'))
  await user.click(screen.getByRole('button', { name: '18' }))
  expect(onChange).toHaveBeenCalledWith('2026-09-18')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('runs the selected export action', async () => {
  const user = userEvent.setup()
  const onExportPdf = vi.fn().mockResolvedValue(undefined)
  const onExportExcel = vi.fn().mockResolvedValue(undefined)
  render(<ExportMenu onExportPdf={onExportPdf} onExportExcel={onExportExcel} />)
  await user.click(screen.getByRole('button'))
  await user.click(screen.getByRole('menuitem', { name: 'PDF (.pdf)' }))
  expect(onExportPdf).toHaveBeenCalledOnce()
  expect(onExportExcel).not.toHaveBeenCalled()
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})
