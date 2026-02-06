import { useState } from 'react';
import { useStore } from '../../stores/useStore';
import { Modal } from '../ui/Modal';
import { SettingsContent } from './SettingsContent';

export function SettingsModal() {
  const isOpen = useStore((s) => s.isSettingsOpen);
  const closeSettings = useStore((s) => s.closeSettings);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={closeSettings} title="设置" subtitle="调整您的专注体验">
      <SettingsInner onClose={closeSettings} />
    </Modal>
  );
}

/** Inner component that mounts fresh each time the modal opens, so draft state resets naturally. */
function SettingsInner({ onClose }: { onClose: () => void }) {
  const storeSettings = useStore((s) => s.settings);
  const storeVolume = useStore((s) => s.volume);
  const storeMuted = useStore((s) => s.isMuted);
  const updateSettings = useStore((s) => s.updateSettings);
  const setVolume = useStore((s) => s.setVolume);
  const toggleMute = useStore((s) => s.toggleMute);

  // Draft state — fresh on each mount (modal open)
  const [draft, setDraft] = useState(storeSettings);
  const [draftVolume, setDraftVolume] = useState(storeVolume);
  const [draftMuted, setDraftMuted] = useState(storeMuted);

  const handleSave = () => {
    updateSettings(draft);
    setVolume(draftVolume);
    if (draftMuted !== storeMuted) toggleMute();
    onClose();
  };

  return (
    <SettingsContent
      settings={draft}
      onSettingsChange={setDraft}
      volume={draftVolume}
      onVolumeChange={setDraftVolume}
      isMuted={draftMuted}
      onMutedChange={setDraftMuted}
      onSave={handleSave}
      onCancel={onClose}
    />
  );
}
