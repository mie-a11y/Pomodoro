import { motion } from 'framer-motion';

const THUMB_SPRING = { type: 'spring' as const, stiffness: 500, damping: 30 };

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[22px] w-10 items-center rounded-full transition-colors duration-200 cursor-pointer ${
        checked ? 'bg-[var(--color-primary)]' : 'bg-black/[0.06]'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <motion.span
        className="absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm"
        animate={{ x: checked ? 20 : 2 }}
        transition={THUMB_SPRING}
      />
    </button>
  );
}
