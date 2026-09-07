import { useEffect, useRef } from 'react'
import type { ImageAttachment, Profile, ThoughtEffort, VideoAttachment } from '../../types'
import { useI18n } from '../../i18n'
import { useComposerStore } from '../../stores/composer'
import AttachmentTray from './AttachmentTray'
import ComposerToolbar from './ComposerToolbar'

export type ComposerPlacement = 'centered' | 'bottom'

interface ComposerProps {
  placement: ComposerPlacement
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
  onOpenSettings: () => void
}

/**
 * Composer v2: una sola unidad visual (tray + textarea + toolbar).
 * El estado vive en el store, así que conserva draft y adjuntos al pasar
 * de `centered` a `bottom`.
 */
export default function Composer({
  placement,
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
  onOpenSettings,
}: ComposerProps) {
  const { t } = useI18n()
  const text = useComposerStore((s) => s.text)
  const images = useComposerStore((s) => s.images)
  const videos = useComposerStore((s) => s.videos)
  const preparing = useComposerStore((s) => s.preparing)
  const attachError = useComposerStore((s) => s.attachError)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function focus() {
      textareaRef.current?.focus()
    }
    window.addEventListener('luma:focus-composer', focus)
    return () => window.removeEventListener('luma:focus-composer', focus)
  }, [])

  useEffect(() => {
    textareaRef.current?.focus()
  }, [placement])

  function autosize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`
  }

  async function handleSend() {
    const { text: content, images: imgs, videos: vids } = useComposerStore.getState()
    if (isStreaming || (!content.trim() && imgs.length === 0 && vids.length === 0)) return
    const ok = await onSend(content, imgs, vids)
    if (!ok) return
    useComposerStore.getState().clearAll()
    autosize()
    textareaRef.current?.focus()
  }

  const canSend = !!text.trim() || images.length > 0 || videos.length > 0

  return (
    <div className="relative">
      <div className="border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.24)] transition-colors focus-within:border-[var(--accent-2)]/50 rounded-[26px]">
        <AttachmentTray
          images={images}
          videos={videos}
          onRemoveImage={(id) => useComposerStore.getState().removeImage(id)}
          onRemoveVideo={(id) => useComposerStore.getState().removeVideo(id)}
        />
        <textarea
          ref={textareaRef}
          value={text}
          rows={placement === 'centered' ? 2 : 1}
          aria-label={t('composer.message')}
          placeholder={isStreaming ? t('composer.placeholderStreaming') : t('composer.placeholder')}
          onChange={(e) => {
            useComposerStore.getState().setText(e.target.value)
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
              void useComposerStore.getState().addFiles(e.clipboardData.files)
            }
          }}
          className="block max-h-[240px] min-h-13 w-full resize-none bg-transparent text-[15px] leading-relaxed text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void useComposerStore.getState().addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <ComposerToolbar
          isStreaming={isStreaming}
          canSend={canSend}
          onSend={handleSend}
          onStop={onStop}
          onAttach={() => fileInputRef.current?.click()}
          attachDisabled={isStreaming}
          models={models}
          model={model}
          onModelChange={onModelChange}
          thinkingEffort={thinkingEffort}
          thinkingModel={thinkingModel}
          onThinkingChange={onThinkingChange}
          profiles={profiles}
          profileId={profileId}
          onProfileChange={onProfileChange}
          onOpenSettings={onOpenSettings}
        />
      </div>
      {preparing && (
        <p role="status" className="mt-1.5 px-1 text-center text-[11px] text-[var(--accent-2)]">
          ⏳ Procesando video: {preparing}…
        </p>
      )}
      {attachError && (
        <p role="alert" className="mt-1.5 px-1 text-center text-[11px] text-[var(--warning)]">
          {attachError}
        </p>
      )}
    </div>
  )
}
