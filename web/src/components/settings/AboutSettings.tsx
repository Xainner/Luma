import Logo from '../Logo'
import { useI18n } from '../../i18n'
import { Section } from './parts'

/** Settings > Acerca de (§29): identidad y versión, nada operativo. */
export default function AboutSettings({ version }: { version: string }) {
  const { t } = useI18n()
  return (
    <div className="space-y-6">
      <Section title="Luma">
        <div className="flex items-center gap-3">
          <Logo size={44} radius="rounded-2xl" />
          <div>
            <p className="font-display text-base font-bold text-[var(--text)]">Luma</p>
            <p className="text-xs text-[var(--text-subtle)]">
              {t('settings.admin.statusVersion')}: {version}
            </p>
          </div>
        </div>
        <p className="text-sm text-[var(--text-muted)]">{t('settings.about.body')}</p>
        <p className="text-sm">
          <a
            href="https://github.com/Xainner/Luma"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--accent-2)] underline underline-offset-2 hover:brightness-110"
          >
            {t('settings.about.repo')}: Xainner/Luma
          </a>
        </p>
      </Section>
    </div>
  )
}
