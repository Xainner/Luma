import { ImagePlus, Plus } from 'lucide-react'
import { useI18n } from '../../i18n'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

interface AddMenuProps {
  onAttach: () => void
  disabled?: boolean
}

/** Botón + con menú de composición (§8.3). Hoy: adjuntar; futuras acciones viven aquí. */
export default function AddMenu({ onAttach, disabled }: AddMenuProps) {
  const { t } = useI18n()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('composer.add')}
          title={t('composer.add')}
          disabled={disabled}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuItem onSelect={onAttach}>
          <ImagePlus />
          {t('composer.attachFile')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
