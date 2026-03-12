import { useCallback, useEffect, useState } from "react";

interface UseCommandPaletteReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/**
 * Registers a global Ctrl+K (Windows/Linux) / Cmd+K (macOS) keyboard shortcut
 * to toggle a command palette. Cleans up the listener on unmount.
 */
export function useCommandPalette(): UseCommandPaletteReturn {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return { isOpen, open, close };
}
