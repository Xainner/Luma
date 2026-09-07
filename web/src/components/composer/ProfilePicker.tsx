import { useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import type { Profile } from '../../types'
import { useI18n } from '../../i18n'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Separator } from '../ui/separator'

interface ProfilePickerProps {
  profiles: Profile[]
  profileId: string
  onChange: (id: string) => void
  onManage: () => void
  disabled?: boolean
}

/** Chip de perfil con selector (§8.6, §60). Sin master prompt en el selector. */
export default function ProfilePicker({
  profiles,
  profileId,
  onChange,
  onManage,
  disabled,
}: ProfilePickerProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const active = profiles.find((p) => p.id === profileId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={t('composer.profileLabel')}
          title={t('composer.profileLabel')}
          className="hidden h-8 max-w-32 cursor-pointer items-center gap-1.5 rounded-lg px-1.5 text-[12px] font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)] focus:outline-none disabled:opacity-50 sm:inline-flex"
        >
          <span aria-hidden="true" className="shrink-0">
            {active ? active.emoji : <Sparkles size={13} className="text-[var(--accent-2)]" />}
          </span>
          <span className="truncate">{active ? active.name : t('composer.noProfile')}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <p className="px-2 pt-1 pb-2 text-[11px] font-semibold tracking-widest text-[var(--text-subtle)] uppercase">
          {t('composer.profileMenu')}
        </p>
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
            className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left transition-colors hover:bg-[var(--bg-hover)]"
          >
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-sm text-[var(--text-subtle)]"
            >
              ○
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-medium text-[var(--text)]">
                {t('composer.noProfile')}
                {profileId === '' && <Check size={14} className="text-[var(--accent-2)]" />}
              </span>
              <span className="block truncate text-xs text-[var(--text-subtle)]">
                {t('composer.noProfileDesc')}
              </span>
            </span>
          </button>
          {profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onChange(p.id)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left transition-colors hover:bg-[var(--bg-hover)]"
            >
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-base"
                style={{ background: `${p.color}22`, border: `1px solid ${p.color}55` }}
              >
                {p.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-medium text-[var(--text)]">
                  <span className="truncate">{p.name}</span>
                  {p.id === profileId ? (
                    <Check size={14} className="shrink-0 text-[var(--accent-2)]" />
                  ) : (
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: p.color }}
                    />
                  )}
                </span>
              </span>
            </button>
          ))}
        </div>
        <Separator className="my-1.5" />
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            onManage()
          }}
          className="flex w-full items-center rounded-[10px] px-2.5 py-2 text-[13px] font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
        >
          {t('composer.manageProfiles')}
        </button>
      </PopoverContent>
    </Popover>
  )
}
