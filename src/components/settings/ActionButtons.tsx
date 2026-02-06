interface ActionButtonsProps {
  onSave: () => void;
  onCancel: () => void;
}

export function ActionButtons({ onSave, onCancel }: ActionButtonsProps) {
  return (
    <div className="flex gap-3 pt-6">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 rounded-xl bg-black/[0.03] py-2.5 text-sm font-medium text-[var(--color-text-muted)] transition-colors duration-150 hover:bg-black/[0.06] cursor-pointer"
      >
        取消
      </button>
      <button
        type="button"
        onClick={onSave}
        className="flex-1 rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-medium text-white shadow-[0_2px_8px_-2px_rgba(45,74,62,0.3)] transition-all duration-150 hover:bg-[var(--color-primary-dark)] hover:shadow-[0_4px_12px_-2px_rgba(45,74,62,0.4)] active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30 focus-visible:ring-offset-1 cursor-pointer"
      >
        保存
      </button>
    </div>
  );
}
