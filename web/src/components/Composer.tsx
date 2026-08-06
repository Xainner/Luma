import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ImagePlus, Paperclip, Send, Square, X } from 'lucide-react'
import type { ImageAttachment } from '../types'
import { useI18n } from '../i18n'
import { prepareImage } from '../lib/images'

interface ComposerProps {
  onSend: (text: string, images: ImageAttachment[]) => Promise<boolean>
  isStreaming: boolean
  onStop: () => void
}

const MAX_IMAGES = 6

export default function Composer({ onSend, isStreaming, onStop }: ComposerProps) {
  const { t } = useI18n()
  const [text, setText] = useState('')
  const [images, setImages] = useState<ImageAttachment[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function autosize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`
  }

  async function addFiles(list: Iterable<File>) {
    const files = Array.from(list).filter((f) => f.type.startsWith('image/'))
    if (files.length === 0) return
    const room = MAX_IMAGES - images.length
    if (room <= 0) return
    const prepared = await Promise.all(files.slice(0, room).map((f) => prepareImage(f)))
    setImages((prev) => [...prev, ...prepared].slice(0, MAX_IMAGES))
  }

  async function handleSend() {
    const content = text.trim()
    if (isStreaming || (!content && images.length === 0)) return
    const ok = await onSend(content, images)
    if (!ok) return
    setText('')
    setImages([])
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
              <ImagePlus size={20} /> {t('composer.dropImages')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-ink-900/85 p-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-colors focus-within:border-nebula-400/50">
        <div className="min-w-0 flex-1">
          {images.length > 0 && (
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
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={text}
            rows={1}
            aria-label={t('composer.message')}
            placeholder={isStreaming ? t('composer.placeholderStreaming') : t('composer.placeholder')}
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
            className="block max-h-[180px] w-full resize-none bg-transparent text-[15px] leading-relaxed text-mist-100 placeholder:text-mist-600 focus:outline-none"
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files)
            e.target.value = ''
          }}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label={t('composer.attach')}
          disabled={isStreaming || images.length >= MAX_IMAGES}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-mist-500 transition-colors hover:bg-white/5 hover:text-nebula-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Paperclip size={19} />
        </button>

        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            aria-label={t('composer.stop')}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-500/90 text-white shadow-[0_4px_16px_rgba(239,68,68,0.4)] transition-all hover:bg-red-500 active:scale-95"
          >
            <Square size={15} fill="currentColor" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            aria-label={t('composer.send')}
            disabled={!text.trim() && images.length === 0}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-nebula-500 to-iris-600 text-white shadow-[0_4px_18px_rgba(139,92,246,0.5)] transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            <Send size={17} />
          </button>
        )}
      </div>
      <p className="mt-1.5 px-1 text-center text-[11px] text-mist-600">{t('composer.hint')}</p>
    </div>
  )
}
