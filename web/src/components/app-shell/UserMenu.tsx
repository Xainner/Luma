import type { ReactNode } from 'react'
import { Check, Languages, LogOut, Monitor, Moon, Settings2, Sun } from 'lucide-react'
import type { Language, User } from '../../types'
import type { Theme } from '../../lib/theme'
import { useI18n } from '../../i18n'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

interface UserMenuProps {
  user: User
  theme: Theme
  lang: Language
  trigger: ReactNode
  onOpenSettings: () => void
  onThemeChange: (theme: Theme) => void
  onLanguageChange: (lang: Language) => void
  onLogout: () => void
}

const THEMES: Array<{ value: Theme; icon: typeof Monitor }> = [
  { value: 'system', icon: Monitor },
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
]

export default function UserMenu({
  user,
  theme,
  lang,
  trigger,
  onOpenSettings,
  onThemeChange,
  onLanguageChange,
  onLogout,
}: UserMenuProps) {
  const { t } = useI18n()
  const otherLang: Language = lang === 'es' ? 'en' : 'es'
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-64">
        <DropdownMenuLabel>
          <span className="block truncate text-sm font-semibold normal-case text-[var(--text)]">
            {user.email}
          </span>
          <span className="mt-0.5 inline-block rounded-md bg-[var(--accent)]/15 px-1.5 py-px text-[11px] font-semibold text-[var(--accent)]">
            {user.role === 'admin' ? t('sidebar.admin') : t('sidebar.user')}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onOpenSettings}>
          <Settings2 />
          {t('usermenu.settings')}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Languages />
            {t('usermenu.language')}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onSelect={() => onLanguageChange('es')}>
              {lang === 'es' && <Check />}
              Español
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onLanguageChange(otherLang)}>
              {lang === 'en' && <Check />}
              English
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Monitor />
            {t('usermenu.theme')}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {THEMES.map(({ value, icon: Icon }) => (
              <DropdownMenuItem key={value} onSelect={() => onThemeChange(value)}>
                <Icon />
                {t(`theme.${value}`)}
                {theme === value && <Check className="ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onLogout}>
          <LogOut />
          {t('usermenu.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
