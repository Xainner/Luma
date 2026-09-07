import type { Profile, ThoughtEffort } from '../../types'
import AddMenu from './AddMenu'
import ModelPicker from './ModelPicker'
import ThinkingPicker from './ThinkingPicker'
import ProfilePicker from './ProfilePicker'
import SendButton from './SendButton'

interface ComposerToolbarProps {
  isStreaming: boolean
  canSend: boolean
  onSend: () => void
  onStop: () => void
  onAttach: () => void
  attachDisabled: boolean
  models: string[]
  model: string
  onModelChange: (model: string) => void
  thinkingEffort: ThoughtEffort
  thinkingModel: string
  onThinkingChange: (effort: ThoughtEffort) => void
  profiles: Profile[]
  profileId: string
  onProfileChange: (id: string) => void
  onOpenSettings: () => void
}

/** Fila inferior del composer: + · modelo · thinking · perfil · send (§8.1). */
export default function ComposerToolbar({
  isStreaming,
  canSend,
  onSend,
  onStop,
  onAttach,
  attachDisabled,
  models,
  model,
  onModelChange,
  thinkingEffort,
  thinkingModel,
  onThinkingChange,
  profiles,
  profileId,
  onProfileChange,
  onOpenSettings,
}: ComposerToolbarProps) {
  return (
    <div className="flex items-center gap-1 pt-1">
      <AddMenu onAttach={onAttach} disabled={attachDisabled} />
      <ModelPicker
        models={models}
        model={model}
        onModelChange={onModelChange}
        onOpenSettings={onOpenSettings}
        disabled={isStreaming}
      />
      <ThinkingPicker
        effort={thinkingEffort}
        model={thinkingModel}
        onChange={onThinkingChange}
        onOpenSettings={onOpenSettings}
        disabled={isStreaming}
      />
      <ProfilePicker
        profiles={profiles}
        profileId={profileId}
        onChange={onProfileChange}
        onManage={onOpenSettings}
        disabled={isStreaming}
      />
      <span className="flex-1" />
      <SendButton isStreaming={isStreaming} disabled={!canSend} onSend={onSend} onStop={onStop} />
    </div>
  )
}
