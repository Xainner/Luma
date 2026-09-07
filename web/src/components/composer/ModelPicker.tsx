import { useState } from 'react'
import { Command } from 'cmdk'
import { Box, Check } from 'lucide-react'
import { useI18n } from '../../i18n'
import { modelBadges, shortModelName } from '../../lib/model-capabilities'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

interface ModelPickerProps {
  models: string[]
  model: string
  onModelChange: (model: string) => void
  onOpenSettings: () => void
  disabled?: boolean
}

/** Chip de modelo con CommandPopover searchable (§8.4, §58). */
export default function ModelPicker({
  models,
  model,
  onModelChange,
  onOpenSettings,
  disabled,
}: ModelPickerProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={t('composer.modelLabel')}
          title={t('composer.modelLabel')}
          className="inline-flex h-8 max-w-40 cursor-pointer items-center gap-1.5 rounded-lg px-1.5 text-[12px] font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)] focus:outline-none disabled:opacity-50"
        >
          <Box size={13} className="shrink-0" aria-hidden="true" />
          <span className="truncate font-mono">
            {models.length ? shortModelName(model) || t('composer.noModel') : t('composer.noModel')}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command label={t('composer.modelLabel')}>
          <Command.Input
            placeholder={t('composer.searchModels')}
            className="h-10 w-full border-b border-[var(--border)] bg-transparent px-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-subtle)]"
          />
          <Command.List className="max-h-64 overflow-y-auto p-1.5">
            <Command.Empty className="px-3 py-5 text-center text-[13px] text-[var(--text-subtle)]">
              {t('composer.noModelsFound')}
            </Command.Empty>
            {models.map((m) => (
              <Command.Item
                key={m}
                value={m}
                onSelect={() => {
                  onModelChange(m)
                  setOpen(false)
                }}
                className="flex cursor-pointer flex-col gap-0.5 rounded-[10px] px-2.5 py-2 outline-none select-none aria-selected:bg-[var(--bg-hover)]"
              >
                <span className="flex w-full items-center gap-2 text-sm text-[var(--text)]">
                  <span className="min-w-0 flex-1 truncate font-mono text-[13px]" title={m}>
                    {m}
                  </span>
                  {m === model && <Check size={14} className="shrink-0 text-[var(--accent-2)]" />}
                </span>
                <span className="text-[11px] text-[var(--text-subtle)]">
                  {modelBadges(m).join(' · ')}
                </span>
              </Command.Item>
            ))}
          </Command.List>
          <div className="border-t border-[var(--border)] p-1.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onOpenSettings()
              }}
              className="flex w-full items-center rounded-[10px] px-2.5 py-2 text-[13px] font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
            >
              {t('composer.manageModels')}
            </button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
