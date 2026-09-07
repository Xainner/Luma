import { useState } from 'react'
import { BrainCircuit, Check } from 'lucide-react'
import type { ThoughtEffort } from '../../types'
import { supportsThinking } from '../../lib/model-capabilities'
import { useI18n } from '../../i18n'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Separator } from '../ui/separator'

interface ThinkingPickerProps {
  effort: ThoughtEffort
  model: string
  onChange: (effort: ThoughtEffort) => void
  onOpenSettings: () => void
  disabled?: boolean
}

const LEVELS: Array<{
  value: ThoughtEffort
  dot: string
  desc: 'thinking.descOff' | 'thinking.descLow' | 'thinking.descMedium' | 'thinking.descHigh'
}> = [
  { value: 'off', dot: '○', desc: 'thinking.descOff' },
  { value: 'low', dot: '◔', desc: 'thinking.descLow' },
  { value: 'medium', dot: '◑', desc: 'thinking.descMedium' },
  { value: 'high', dot: '●', desc: 'thinking.descHigh' },
]

/** Chip de thinking con menú de niveles (§8.5, §59). Sin emojis: icono + texto. */
export default function ThinkingPicker({
  effort,
  model,
  onChange,
  onOpenSettings,
  disabled,
}: ThinkingPickerProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const capable = supportsThinking(model)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled || !capable}
          aria-label={t('composer.thinkingLabel')}
          title={capable ? `${t('composer.thinkingLabel')} · ${model}` : t('composer.noReasoning')}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-1.5 text-[12px] font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <BrainCircuit size={13} className="shrink-0 text-[var(--accent-2)]" aria-hidden="true" />
          {capable ? t(`thinking.${effort}`) : t('composer.noReasoning')}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <p className="px-2 pt-1 pb-2 text-[11px] font-semibold tracking-widest text-[var(--text-subtle)] uppercase">
          {t('composer.thinkingMenu')}
        </p>
        <div role="radiogroup" aria-label={t('composer.thinkingMenu')} className="space-y-0.5">
          {LEVELS.map(({ value, dot, desc }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={effort === value}
              onClick={() => {
                onChange(value)
                setOpen(false)
              }}
              className="flex w-full items-start gap-2.5 rounded-[10px] px-2.5 py-2 text-left transition-colors hover:bg-[var(--bg-hover)]"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 w-4 shrink-0 text-center text-[13px] text-[var(--accent-2)]"
              >
                {dot}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-medium text-[var(--text)]">
                  {t(`thinking.${value}`)}
                  {effort === value && <Check size={14} className="text-[var(--accent-2)]" />}
                </span>
                <span className="block text-xs text-[var(--text-subtle)]">{t(desc)}</span>
              </span>
            </button>
          ))}
        </div>
        {model && (
          <p className="px-2 pt-2 text-[11px] text-[var(--text-subtle)]">
            {t('composer.savedFor', { model })}
          </p>
        )}
        <Separator className="my-1.5" />
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            onOpenSettings()
          }}
          className="flex w-full items-center rounded-[10px] px-2.5 py-2 text-[13px] font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
        >
          {t('composer.advancedConfig')}
        </button>
      </PopoverContent>
    </Popover>
  )
}
