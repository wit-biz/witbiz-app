
"use client";

import React, { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { type Client } from '@/lib/types';
import { AddEditClientDialog } from '@/components/shared/AddEditClientDialog';
import { SmartDocumentUploadDialog } from '@/components/shared/SmartDocumentUploadDialog';
import { useRouter } from 'next/navigation';

interface DialogsContextType {
  isSmartUploadDialogOpen: boolean;
  setIsSmartUploadDialogOpen: (isOpen: boolean) => void;
  isAddClientDialogOpen: boolean;
  setIsAddClientDialogOpen: (isOpen: boolean) => void;
  editingClient: Client | null;
  setEditingClient: (client: Client | null) => void;
  preselectedServiceId: string | null;
  setPreselectedServiceId: (serviceId: string | null) => void;
}

const DialogsContext = createContext<DialogsContextType | undefined>(undefined);

export function DialogsProvider({ children }: { children: ReactNode }) {
  const [isSmartUploadDialogOpen, setIsSmartUploadDialogOpen] = useState(false);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | null>(null);
  const router = useRouter();


  const value = useMemo(() => ({
    isSmartUploadDialogOpen,
    setIsSmartUploadDialogOpen,
    isAddClientDialogOpen,
    setIsAddClientDialogOpen,
    editingClient,
    setEditingClient,
    preselectedServiceId,
    setPreselectedServiceId,
  }), [isSmartUploadDialogOpen, isAddClientDialogOpen, editingClient, preselectedServiceId]);

  const handleSmartUploadClose = (isOpen: boolean) => {
      if(!isOpen) {
          setPreselectedServiceId(null);
      }
      setIsSmartUploadDialogOpen(isOpen);
  }

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
      <SmartDocumentUploadDialog
            isOpen={isSmartUploadDialogOpen}
            onOpenChange={handleSmartUploadClose}
            onClientAdded={(client) => {
                router.push(`/contacts?openClient=${client.id}`);
            }}
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
