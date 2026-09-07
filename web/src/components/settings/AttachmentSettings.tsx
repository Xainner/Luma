import { FileImage, Film } from 'lucide-react'
import { useI18n } from '../../i18n'
import { MEDIA_LIMITS } from '../../lib/media-config'
import { Section } from './parts'

/** Settings > Adjuntos (§25): límites y procesamiento, solo lectura informativa. */
export default function AttachmentSettings() {
  const { t } = useI18n()
  return (
    <div className="space-y-6">
      <Section title={t('settings.nav.attachments')} desc={t('settings.attachments.subtitle')}>
        <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] p-3.5">
          <FileImage
            size={18}
            className="mt-0.5 shrink-0 text-[var(--accent-2)]"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">
              {t('settings.attachments.images')}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {t('settings.attachments.imagesDesc', {
                n: MEDIA_LIMITS.maxImages,
                mb: MEDIA_LIMITS.maxImageMB,
              })}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] p-3.5">
          <Film size={18} className="mt-0.5 shrink-0 text-[var(--accent-2)]" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">
              {t('settings.attachments.videos')}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {t('settings.attachments.videosDesc', {
                n: MEDIA_LIMITS.maxVideos,
                mb: MEDIA_LIMITS.maxVideoMB,
              })}
            </p>
          </div>
        </div>
      </Section>

      <Section title={t('settings.attachments.processing')}>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-[var(--text-muted)]">
          <li>{t('settings.attachments.p1')}</li>
          <li>{t('settings.attachments.p2')}</li>
          <li>{t('settings.attachments.p3')}</li>
          <li>{t('settings.attachments.p4')}</li>
        </ul>
      </Section>
    </div>
  )
}
