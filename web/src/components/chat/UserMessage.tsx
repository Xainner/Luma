import { useState } from 'react'
import { Check, Copy, Maximize2, Pencil, Trash2 } from 'lucide-react'
import type { ChatMessage } from '../../types'
import { useI18n } from '../../i18n'
import { copyText } from '../../lib/clipboard'
import { inputClass } from '../../lib/ui'
import { uploadUrl } from '../../lib/uploads'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'

/** Slide de video para el lightbox (el core solo trae imagen). */
interface VideoSlide {
  type: 'video'
  src: string
  poster?: string
  title?: string
  autoPlay?: boolean
}

declare module 'yet-another-react-lightbox' {
  interface SlideTypes {
    video: VideoSlide
  }
}

interface UserMessageProps {
  message: ChatMessage
  onEdit: (id: string, newText: string) => void
  onDelete: (id: string) => void
}

function videoSrcOf(vid: {
  previewUrl?: string
  uploadId?: string
  dataUrl?: string
}): string | undefined {
  return vid.previewUrl ?? (vid.uploadId ? uploadUrl(vid.uploadId) : undefined) ?? vid.dataUrl
}

/** Mensaje de usuario: surface neutral, adjuntos arriba, acciones al hover (§11). */
export default function UserMessage({ message, onEdit, onDelete }: UserMessageProps) {
  const { t } = useI18n()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.content)
  const [copied, setCopied] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(-1)

  const imageSlides = (message.images ?? []).map((img) => ({
    type: 'image' as const,
    src: img.dataUrl,
    alt: img.name,
  }))
  const videoSlides = (message.videos ?? []).map((vid) => {
    const src = videoSrcOf(vid)
    if (src) {
      return { type: 'video' as const, src, poster: vid.thumb, title: vid.name, autoPlay: true }
    }
    if (vid.thumb) {
      return { type: 'image' as const, src: vid.thumb, alt: vid.name, title: vid.name }
    }
    return null
  })
  const slides = [...imageSlides, ...videoSlides.filter((s) => s !== null)]
  const videoSlideIndex: Array<number | null> = []
  {
    let k = imageSlides.length
    for (const s of videoSlides) videoSlideIndex.push(s ? k++ : null)
  }

  async function copy() {
    if (await copyText(message.content)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }
  }

  function saveEdit() {
    onEdit(message.id, draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex justify-end">
        <div className="w-full max-w-[85%] sm:max-w-[75%]">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={Math.min(6, Math.max(2, draft.split('\n').length))}
            aria-label={t('chat.edit')}
            className={`${inputClass} resize-y`}
            autoFocus
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
            >
              {t('chat.cancel')}
            </button>
            <button
              type="button"
              onClick={saveEdit}
              disabled={!draft.trim()}
              className="rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
            >
              {t('chat.saveRegenerate')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const btn =
    'rounded-lg p-1.5 text-[var(--text-subtle)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]'

  return (
    <div className="group flex justify-end">
      <div className="max-w-[85%] sm:max-w-[80%]">
        {message.images && message.images.length > 0 && (
          <div
            className={`mb-2 grid gap-1.5 ${message.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
          >
            {message.images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setLightboxIndex(i)}
                aria-label={img.name}
                className="block w-full cursor-zoom-in rounded-[18px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-2)]"
              >
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  width={img.width}
                  height={img.height}
                  className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--bg-subtle)] object-contain"
                  style={{
                    maxHeight: 280,
                    aspectRatio:
                      img.width && img.height ? `${img.width} / ${img.height}` : undefined,
                  }}
                />
              </button>
            ))}
          </div>
        )}
        <Lightbox
          open={lightboxIndex >= 0}
          close={() => setLightboxIndex(-1)}
          index={lightboxIndex < 0 ? 0 : lightboxIndex}
          slides={slides}
          render={{
            slide: ({ slide }) =>
              slide.type === 'video' ? (
                <video
                  src={slide.src}
                  poster={slide.poster}
                  controls
                  autoPlay={slide.autoPlay}
                  playsInline
                  preload="metadata"
                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                >
                  <track kind="captions" />
                </video>
              ) : undefined,
          }}
        />
        {message.videos && message.videos.length > 0 && (
          <div
            className={`mb-2 grid gap-1.5 ${message.videos.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
          >
            {message.videos.map((vid, j) => {
              const src = videoSrcOf(vid)
              const slideIdx = videoSlideIndex[j]
              const expand =
                slideIdx != null ? (
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(slideIdx)}
                    aria-label={vid.name}
                    className="absolute top-2 right-2 rounded-lg bg-black/60 p-1.5 text-white/90 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80 focus-visible:opacity-100"
                  >
                    <Maximize2 size={14} />
                  </button>
                ) : null
              return src ? (
                <div key={vid.id} className="group relative">
                  <video
                    src={src}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full rounded-[18px] border border-[var(--border)] bg-black"
                    style={{ maxHeight: 280 }}
                  />
                  {expand}
                </div>
              ) : (
                <div
                  key={vid.id}
                  className="group relative w-full overflow-hidden rounded-[18px] border border-[var(--border)] bg-black"
                  style={{ maxHeight: 280 }}
                >
                  {slideIdx != null ? (
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(slideIdx)}
                      aria-label={vid.name}
                      className="block w-full cursor-zoom-in"
                    >
                      {vid.thumb && (
                        <img src={vid.thumb} alt={vid.name} className="w-full object-cover" />
                      )}
                    </button>
                  ) : (
                    vid.thumb && (
                      <img src={vid.thumb} alt={vid.name} className="w-full object-cover" />
                    )
                  )}
                  <span className="pointer-events-none absolute bottom-2 left-2 rounded-lg bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white/90">
                    🎬 {vid.name}
                    {typeof vid.duration === 'number' && vid.duration > 0
                      ? ` · ${Math.round(vid.duration)}s`
                      : ''}
                    {vid.frames?.length ? ` · ${vid.frames.length} frames al modelo` : ''}
                  </span>
                  {expand}
                </div>
              )
            })}
          </div>
        )}
        {message.content && (
          <div className="rounded-[20px] rounded-br-[10px] border border-[var(--border)] bg-[var(--bg-hover)] px-3.5 py-2.5 text-[15px] leading-relaxed text-[var(--text)]">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        )}
        <div className="mt-1 flex justify-end gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <button
            type="button"
            onClick={copy}
            aria-label={t('msg.copy')}
            title={t('msg.copy')}
            className={btn}
          >
            {copied ? <Check size={14} className="text-[var(--accent-2)]" /> : <Copy size={14} />}
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(message.content)
              setEditing(true)
            }}
            aria-label={t('chat.edit')}
            title={t('chat.edit')}
            className={btn}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(message.id)}
            aria-label={t('chat.delete')}
            title={t('chat.delete')}
            className="rounded-lg p-1.5 text-[var(--text-subtle)] transition-colors hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
