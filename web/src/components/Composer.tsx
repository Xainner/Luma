import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Brain, Clapperboard, ImagePlus, Paperclip, Send, Square, X } from 'lucide-react'
import type { ImageAttachment, Profile, ThoughtEffort, VideoAttachment } from '../types'
import { useI18n } from '../i18n'
import { prepareImage } from '../lib/images'
import { prepareVideo } from '../lib/videos'
import { uploadFile } from '../lib/uploads'
import { MEDIA_LIMITS } from '../lib/media-config'

interface ComposerProps {
  onSend: (text: string, images: ImageAttachment[], videos: VideoAttachment[]) => Promise<boolean>
  isStreaming: boolean
  onStop: () => void
  thinkingEffort: ThoughtEffort
  thinkingModel: string
  onThinkingChange: (effort: ThoughtEffort) => void
  models: string[]
  model: string
  onModelChange: (model: string) => void
  profiles: Profile[]
  profileId: string
  onProfileChange: (id: string) => void
}

const MAX_IMAGES = MEDIA_LIMITS.maxImages
const MAX_VIDEOS = MEDIA_LIMITS.maxVideos

export default function Composer({
  onSend,
  isStreaming,
  onStop,
  thinkingEffort,
  thinkingModel,
  onThinkingChange,
  models,
  model,
  onModelChange,
  profiles,
  profileId,
  onProfileChange,
}: ComposerProps) {
  const { t } = useI18n()
  const [text, setText] = useState('')
  const [images, setImages] = useState<ImageAttachment[]>([])
  const [videos, setVideos] = useState<VideoAttachment[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [attachError, setAttachError] = useState('')
  const [preparing, setPreparing] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function focus() {
      textareaRef.current?.focus()
    }
    window.addEventListener('luma:focus-composer', focus)
    return () => window.removeEventListener('luma:focus-composer', focus)
  }, [])

  function autosize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`
  }

  function revokePreview(v: VideoAttachment) {
    if (v.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(v.previewUrl)
  }

  async function addFiles(list: Iterable<File>) {
    const all = Array.from(list)
    const imageFiles = all.filter((f) => f.type.startsWith('image/'))
    const videoFiles = all.filter((f) => f.type.startsWith('video/'))
    if (imageFiles.length === 0 && videoFiles.length === 0) return
    setAttachError('')

    const imageRoom = MAX_IMAGES - images.length
    const videoRoom = MAX_VIDEOS - videos.length
    const imgToAdd = imageRoom > 0 ? imageFiles.slice(0, imageRoom) : []
    const vidToAdd = videoRoom > 0 ? videoFiles.slice(0, videoRoom) : []
    const skipped: string[] = []
    if (imageFiles.length > imgToAdd.length) skipped.push('imágenes (máx 6)')
    if (videoFiles.length > vidToAdd.length) skipped.push('videos (máx 3)')
    if (imgToAdd.length === 0 && vidToAdd.length === 0) {
      setAttachError(`Límite alcanzado: ${skipped.join(' · ')}. Quita adjuntos para agregar más.`)
      return
    }

    const errors: string[] = []
    if (skipped.length) errors.push(`Se omitieron ${skipped.join(' y ')} por límite.`)
    const preparedImages: ImageAttachment[] = []
    for (const f of imgToAdd) {
      try {
        preparedImages.push(await prepareImage(f))
      } catch (err) {
        errors.push(err instanceof Error ? err.message : `No se pudo leer ${f.name}.`)
      }
    }
    const preparedVideos: VideoAttachment[] = []
    for (const f of vidToAdd) {
      setPreparing(f.name)
      try {
        const vid = await prepareVideo(f, {
          onProgress: (done, total) => setPreparing(`${f.name} · frame ${done}/${total}`),
        })
        // Sube el original para playback persistente; si falla, igual sirven los frames
        setPreparing(`${f.name} · subiendo…`)
        try {
          const up = await uploadFile(f, (loaded, total) =>
            setPreparing(
              `${f.name} · subiendo ${Math.round((loaded / Math.max(1, total)) * 100)}%`,
            ),
          )
          vid.uploadId = up.id
        } catch (err) {
          errors.push(
            `“${f.name}” se analizará por frames pero sin playback: ${err instanceof Error ? err.message : 'subida falló.'}`,
          )
        }
        preparedVideos.push(vid)
      } catch (err) {
        errors.push(err instanceof Error ? err.message : `No se pudo procesar ${f.name}.`)
      } finally {
        setPreparing(null)
      }
    }
    if (preparedImages.length) {
      setImages((prev) => [...prev, ...preparedImages].slice(0, MAX_IMAGES))
    }
    if (preparedVideos.length) {
      setVideos((prev) => [...prev, ...preparedVideos].slice(0, MAX_VIDEOS))
    }
    if (errors.length) setAttachError(errors.join(' '))
  }

  async function handleSend() {
    const content = text.trim()
    if (isStreaming || (!content && images.length === 0 && videos.length === 0)) return
    const ok = await onSend(content, images, videos)
    if (!ok) return
    videos.forEach(revokePreview)
    setText('')
    setImages([])
    setVideos([])
    setAttachError('')
    autosize()
    textareaRef.current?.focus()
  }

  return (
    <div
      className="relative"
      onDragEnter={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return
        setIsDragging(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        void addFiles(e.dataTransfer.files)
      }}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute -inset-2 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed border-nebula-400/70 bg-ink-900/90 backdrop-blur-sm"
          >
            <p className="flex items-center gap-2 font-display font-semibold text-nebula-300">
              <ImagePlus size={20} /> {t('composer.dropMedia')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2 rounded-[26px] border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.24)] transition-colors focus-within:border-[var(--accent-2)]/50">
        <div className="min-w-0 flex-1">
          {(images.length > 0 || videos.length > 0) && (
            <div className="mb-2 flex flex-wrap gap-2">
              {images.map((img) => (
                <div key={img.id} className="group relative">
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    className="h-16 w-16 rounded-xl border border-white/10 object-cover"
                  />
                  <button
                    type="button"
                    aria-label={t('composer.removeImage', { name: img.name })}
                    onClick={() => setImages((prev) => prev.filter((i) => i.id !== img.id))}
                    className="absolute -right-1.5 -top-1.5 rounded-full border border-white/15 bg-ink-800 p-0.5 text-mist-400 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {videos.map((vid) => (
                <div key={vid.id} className="group relative">
                  <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-white/10 bg-black">
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
                    ) : null}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Clapperboard size={18} className="text-white/90" />
                    </span>
                    {vid.frames?.length ? (
                      <span className="absolute bottom-0.5 right-1 rounded bg-black/70 px-1 text-[10px] font-semibold text-white/90">
                        {vid.frames.length}f
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label={t('composer.removeVideo', { name: vid.name })}
                    onClick={() => {
                      revokePreview(vid)
                      setVideos((prev) => prev.filter((v) => v.id !== vid.id))
                    }}
                    className="absolute -right-1.5 -top-1.5 rounded-full border border-white/15 bg-ink-800 p-0.5 text-mist-400 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={text}
            rows={1}
            aria-label={t('composer.message')}
            placeholder={
              isStreaming ? t('composer.placeholderStreaming') : t('composer.placeholder')
            }
            onChange={(e) => {
              setText(e.target.value)
              autosize()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                handleSend()
              }
            }}
            onPaste={(e) => {
              if (e.clipboardData.files.length > 0) {
                e.preventDefault()
                void addFiles(e.clipboardData.files)
              }
            }}
            className="block max-h-[180px] w-full resize-none bg-transparent text-[15px] leading-relaxed text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none"
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files)
            e.target.value = ''
          }}
        />

        <div className="flex items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label={t('composer.attach')}
            title={t('composer.attach')}
            disabled={isStreaming || (images.length >= MAX_IMAGES && videos.length >= MAX_VIDEOS)}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Paperclip size={17} />
          </button>

          {models.length > 0 ? (
            <label className="inline-flex min-w-0 items-center">
              <span className="sr-only">{t('composer.modelLabel')}</span>
              <select
                value={model}
                onChange={(e) => onModelChange(e.target.value)}
                disabled={isStreaming}
                title={t('composer.modelLabel')}
                aria-label={t('composer.modelLabel')}
                className="max-w-36 cursor-pointer truncate rounded-lg border border-transparent bg-transparent px-1.5 py-1 font-mono text-[11px] font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--border)] hover:text-[var(--text)] focus:outline-none disabled:opacity-50"
              >
                {!models.includes(model) && <option value="">{t('composer.noModel')}</option>}
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="px-1.5 text-[11px] text-[var(--text-subtle)]">
              {t('composer.noModel')}
            </span>
          )}

          <span
            className="inline-flex items-center gap-1"
            title={
              thinkingModel
                ? `${t('composer.thinkingLabel')} · ${thinkingModel}`
                : t('composer.thinkingLabel')
            }
          >
            <Brain size={12} className="shrink-0 text-[var(--accent-2)]" aria-hidden="true" />
            <label className="inline-flex items-center">
              <span className="sr-only">{t('composer.thinkingLabel')}</span>
              <select
                value={thinkingEffort}
                onChange={(e) => onThinkingChange(e.target.value as ThoughtEffort)}
                disabled={isStreaming}
                aria-label={t('composer.thinkingLabel')}
                className="cursor-pointer rounded-lg border border-transparent bg-transparent px-1 py-1 text-[11px] font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--border)] hover:text-[var(--text)] focus:outline-none disabled:opacity-50"
              >
                <option value="off">{t('thinking.off')}</option>
                <option value="low">{t('thinking.low')}</option>
                <option value="medium">{t('thinking.medium')}</option>
                <option value="high">{t('thinking.high')}</option>
              </select>
            </label>
          </span>

          <label className="hidden min-w-0 items-center sm:inline-flex">
            <span className="sr-only">{t('composer.profileLabel')}</span>
            <select
              value={profileId}
              onChange={(e) => onProfileChange(e.target.value)}
              disabled={isStreaming}
              title={t('composer.profileLabel')}
              aria-label={t('composer.profileLabel')}
              className="max-w-28 cursor-pointer truncate rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-[11px] font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--border)] hover:text-[var(--text)] focus:outline-none disabled:opacity-50"
            >
              <option value="">{t('composer.noProfile')}</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.emoji} {p.name}
                </option>
              ))}
            </select>
          </label>

          <span className="flex-1" />

          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              aria-label={t('composer.stop')}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--danger)] text-white transition-all hover:brightness-110 active:scale-95"
            >
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              aria-label={t('composer.send')}
              title="Enter"
              disabled={!text.trim() && images.length === 0 && videos.length === 0}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:bg-[var(--bg-subtle)] disabled:text-[var(--text-subtle)]"
            >
              <Send size={16} />
            </button>
          )}
        </div>
      </div>
      {preparing && (
        <p className="mt-1 px-1 text-center text-[11px] text-nebula-300">
          ⏳ Procesando video: {preparing}…
        </p>
      )}
      {attachError && (
        <p className="mt-1 px-1 text-center text-[11px] text-amber-400">{attachError}</p>
      )}
    </div>
  )
}
