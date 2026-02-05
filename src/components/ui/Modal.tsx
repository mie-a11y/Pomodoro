/**
 * Modal - 基础弹窗组件
 * 任务 #100-103
 */

import { useEffect, useCallback, useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  children,
  closeOnOverlayClick = true,
  closeOnEsc = true,
}: ModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  // 关闭处理（支持退场动画）
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  // #102: ESC 键关闭
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEsc, handleClose]);

  // #103: 点击遮罩关闭
  const handleOverlayClick = useCallback(() => {
    if (closeOnOverlayClick) {
      handleClose();
    }
  }, [closeOnOverlayClick, handleClose]);

  if (!isOpen && !isClosing) return null;

  return (
    // #100: 遮罩层
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isClosing ? 'animate-modal-fade-out' : 'animate-modal-fade-in'
      }`}
      onClick={handleOverlayClick}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/50" />

      {/* #101: 弹窗容器 */}
      <div
        className={`relative w-full max-w-sm mx-4 max-h-[85vh] overflow-y-auto
          bg-gradient-to-b from-[var(--bg-start)] to-[var(--bg-end)]
          rounded-2xl shadow-xl
          ${isClosing ? 'animate-modal-scale-out' : 'animate-modal-scale-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
