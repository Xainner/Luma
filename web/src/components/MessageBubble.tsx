import { useState } from 'react'
import { Check, Copy, Maximize2, Pencil, RefreshCw, Sparkles, Trash2 } from 'lucide-react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import type { ChatMessage, VideoAttachment } from '../types'
import { useI18n } from '../i18n'
import { inputClass } from '../lib/ui'
import { uploadUrl } from '../lib/uploads'
import { copyText } from '../lib/clipboard'
import Markdown from './Markdown'

/** Slide de video para el lightbox (el core solo trae imagen). */
interface VideoSlide {
  type: 'video'
  src: string
  mime: string
  poster?: string
  title?: string
  autoPlay?: boolean
}

declare module 'yet-another-react-lightbox' {
  interface SlideTypes {
    video: VideoSlide
  }
}

interface MessageBubbleProps {
  message: ChatMessage
  isLast: boolean
  isStreaming: boolean
  onEdit?: (id: string, newText: string) => void
  onDelete?: (id: string) => void
  onRegenerate?: () => void
}

export default function MessageBubble({
  message,
  isLast,
  isStreaming,
  onEdit,
  onDelete,
  onRegenerate,
}: MessageBubbleProps) {
  const { t } = useI18n()
  const isUser = message.role === 'user'
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.content)
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [copied, setCopied] = useState(false)

  function videoSrc(vid: VideoAttachment): string | undefined {
    return vid.previewUrl ?? (vid.uploadId ? uploadUrl(vid.uploadId) : undefined) ?? vid.dataUrl
  }

  // Slides mixtos: imágenes + videos (los solo-thumb abren el thumb en grande).
  const imageSlides = (message.images ?? []).map((img) => ({
    type: 'image' as const,
    src: img.dataUrl,
    alt: img.name,
  }))
  const videoSlides = (message.videos ?? []).map((vid) => {
    const src = videoSrc(vid)
    if (src) {
      return {
        type: 'video' as const,
        src,
        mime: vid.mime || 'video/mp4',
        poster: vid.thumb,
        title: vid.name,
        autoPlay: true,
      }
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

  async function copyResponse() {
    if (await copyText(message.content)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }
  }

  function startEdit() {
    setDraft(message.content)
    setEditing(true)
  }

  function saveEdit() {
    onEdit?.(message.id, draft)
    setEditing(false)
  }

  if (isUser) {
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
                className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-medium text-mist-400 transition-colors hover:bg-white/5 hover:text-mist-100"
              >
                {t('chat.cancel')}
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={!draft.trim()}
                className="rounded-xl bg-gradient-to-r from-nebula-500 to-iris-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
              >
                {t('chat.save')}
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="group flex justify-end">
        <div className="max-w-[85%] sm:max-w-[75%]">
          {message.images && message.images.length > 0 && (
            <div
              className={`mb-1.5 grid gap-1.5 ${message.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
            >
              {message.images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  aria-label={img.name}
                  className="block w-full cursor-zoom-in rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-nebula-400"
                >
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    width={img.width}
                    height={img.height}
                    className="w-full rounded-2xl border border-white/10 object-cover shadow-lg transition-transform hover:scale-[1.01]"
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
              className={`mb-1.5 grid gap-1.5 ${message.videos.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
            >
              {message.videos.map((vid, j) => {
                const src = videoSrc(vid)
                const slideIdx = videoSlideIndex[j]
                const expand =
                  slideIdx != null ? (
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(slideIdx)}
                      aria-label={vid.name}
                      className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-white/90 opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
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
                      className="w-full rounded-2xl border border-white/10 bg-black shadow-lg"
                      style={{ maxHeight: 280 }}
                    />
                    {expand}
                  </div>
                ) : (
                  <div
                    key={vid.id}
                    className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-lg"
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
          <div className="rounded-2xl rounded-br-md bg-gradient-to-br from-nebula-500/80 via-iris-500/80 to-flare-500/70 px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-[0_8px_24px_rgba(124,58,237,0.35)]">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="mt-1 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={startEdit}
              aria-label={t('chat.edit')}
              className="rounded-lg p-1.5 text-mist-600 transition-colors hover:bg-white/5 hover:text-mist-200"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(message.id)}
              aria-label={t('chat.delete')}
              className="rounded-lg p-1.5 text-mist-600 transition-colors hover:bg-red-500/15 hover:text-red-400"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex gap-3">
      <div className="mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-nebula-500 to-iris-600 shadow-[0_0_16px_rgba(139,92,246,0.35)]">
        <Sparkles size={15} className="text-white" />
      </div>
      <div className="relative min-w-0 flex-1 pt-1">
        {message.thinking && (
          <details className="mb-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[13px]">
            <summary className="cursor-pointer select-none text-mist-500 transition-colors hover:text-mist-300">
              💭 {t('thinking.viewThought')}
              {isStreaming && isLast ? '…' : ''}
            </summary>
            <pre className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap font-sans leading-relaxed text-mist-400">
              {message.thinking}
            </pre>
          </details>
        )}
        <Markdown>{message.content}</Markdown>
        {isStreaming && isLast && (
          <span
            aria-hidden="true"
            className="ml-0.5 inline-block size-[9px] animate-caret rounded-[1px] bg-nebula-400 align-middle"
          />
        )}
        <div className="mt-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          {isLast && !isStreaming && message.content && (
            <button
              type="button"
              onClick={copyResponse}
              aria-label={t('bubble.copy')}
              className="rounded-lg p-1.5 text-mist-600 transition-colors hover:bg-white/5 hover:text-mist-200"
            >
              {copied ? <Check size={14} className="text-nebula-400" /> : <Copy size={14} />}
            </button>
          )}
          {isLast && !isStreaming && onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              aria-label={t('chat.regenerate')}
              className="rounded-lg p-1.5 text-mist-600 transition-colors hover:bg-white/5 hover:text-nebula-300"
            >
              <RefreshCw size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete?.(message.id)}
            aria-label={t('chat.delete')}
            className="rounded-lg p-1.5 text-mist-600 transition-colors hover:bg-red-500/15 hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
