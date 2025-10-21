
"use client";

import React, { createContext, useContext, useState, useMemo, type ReactNode } from 'react';

interface DialogsContextType {
  isAddClientDialogOpen: boolean;
  setIsAddClientDialogOpen: (isOpen: boolean) => void;
  isSmartUploadDialogOpen: boolean;
  setIsSmartUploadDialogOpen: (isOpen: boolean) => void;
}

const DialogsContext = createContext<DialogsContextType | undefined>(undefined);

export function DialogsProvider({ children }: { children: ReactNode }) {
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [isSmartUploadDialogOpen, setIsSmartUploadDialogOpen] = useState(false);

  const value = useMemo(() => ({
    isAddClientDialogOpen,
    setIsAddClientDialogOpen,
    isSmartUploadDialogOpen,
    setIsSmartUploadDialogOpen,
  }), [isAddClientDialogOpen, isSmartUploadDialogOpen]);

  return (
    <DialogsContext.Provider value={value}>
      {children}
    </DialogsContext.Provider>
  );
}

export function useDialogs() {
  const context = useContext(DialogsContext);
  if (context === undefined) {
    throw new Error('useDialogs must be used within a DialogsProvider');
  }
  return context;
}
