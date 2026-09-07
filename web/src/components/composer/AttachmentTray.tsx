import { Clapperboard, X } from 'lucide-react'
import type { ImageAttachment, VideoAttachment } from '../../types'
import { useI18n } from '../../i18n'

interface AttachmentTrayProps {
  images: ImageAttachment[]
  videos: VideoAttachment[]
  onRemoveImage: (id: string) => void
  onRemoveVideo: (id: string) => void
}

/** Previews dentro del composer (§8.8): cards de imagen 72–88px, video ancho con meta. */
export default function AttachmentTray({
  images,
  videos,
  onRemoveImage,
  onRemoveVideo,
}: AttachmentTrayProps) {
  const { t } = useI18n()
  if (images.length === 0 && videos.length === 0) return null
  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {images.map((img) => (
        <div key={img.id} className="group relative">
          <img
            src={img.dataUrl}
            alt={img.name}
            title={img.name}
            className="h-20 w-20 rounded-xl border border-[var(--border)] object-cover"
          />
          <button
            type="button"
            aria-label={t('composer.removeImage', { name: img.name })}
            onClick={() => onRemoveImage(img.id)}
            className="absolute -top-1.5 -right-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] p-0.5 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--danger)] focus-visible:opacity-100"
          >
            <X size={12} />
          </button>
        </div>
      ))}
      {videos.map((vid) => (
        <div
          key={vid.id}
          className="group relative flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-2 pr-8"
        >
          <span className="relative block h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-black">
            {vid.previewUrl ? (
              <video
                src={vid.previewUrl}
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              />
            ) : vid.thumb ? (
              <img src={vid.thumb} alt={vid.name} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                <Clapperboard size={18} className="text-white/70" />
              </span>
            )}
          </span>
          <span className="min-w-0">
            <span
              title={vid.name}
              className="block max-w-36 truncate text-[13px] font-medium text-[var(--text)]"
            >
              {vid.name}
            </span>
            <span className="block text-[11px] text-[var(--text-subtle)]">
              {typeof vid.duration === 'number' && vid.duration > 0
                ? `${Math.round(vid.duration)} s · `
                : ''}
              {vid.frames?.length ?? 0} frames
            </span>
          </span>
          <button
            type="button"
            aria-label={t('composer.removeVideo', { name: vid.name })}
            onClick={() => onRemoveVideo(vid.id)}
            className="absolute top-1.5 right-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] p-0.5 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--danger)] focus-visible:opacity-100"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
