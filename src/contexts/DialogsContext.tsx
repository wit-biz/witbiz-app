
"use client";

import React, { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { type Client } from '@/lib/types';
import { AddEditClientDialog } from '@/components/shared/AddEditClientDialog';

interface DialogsContextType {
  isSmartUploadDialogOpen: boolean;
  setIsSmartUploadDialogOpen: (isOpen: boolean) => void;
  isAddClientDialogOpen: boolean;
  setIsAddClientDialogOpen: (isOpen: boolean) => void;
  editingClient: Client | null;
  setEditingClient: (client: Client | null) => void;
}

const DialogsContext = createContext<DialogsContextType | undefined>(undefined);

export function DialogsProvider({ children }: { children: ReactNode }) {
  const [isSmartUploadDialogOpen, setIsSmartUploadDialogOpen] = useState(false);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const value = useMemo(() => ({
    isSmartUploadDialogOpen,
    setIsSmartUploadDialogOpen,
    isAddClientDialogOpen,
    setIsAddClientDialogOpen,
    editingClient,
    setEditingClient,
  }), [isSmartUploadDialogOpen, isAddClientDialogOpen, editingClient]);

  return (
    <DialogsContext.Provider value={value}>
      {children}
      <AddEditClientDialog
        isOpen={isAddClientDialogOpen || !!editingClient}
        onClose={() => {
          setIsAddClientDialogOpen(false);
          setEditingClient(null);
        }}
        client={editingClient}
      />
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
