import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Button } from '@/components/ui/Button'

afterEach(() => {
  cleanup()
})

describe('Button', () => {
  it('renderiza children', () => {
    render(<Button>Guardar</Button>)
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
  })

  it('renderiza label', () => {
    render(<Button label="Enviar" />)
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument()
  })

  it('llama onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('deshabilita con loading y no dispara click', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick} loadingLabel="Espera">
        Ok
      </Button>,
    )
    const btn = screen.getByRole('button', { name: /espera/i })
    expect(btn).toBeDisabled()
    await user.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })
})
