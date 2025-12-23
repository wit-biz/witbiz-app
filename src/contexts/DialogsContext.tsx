
"use client";

import React, { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { type Client, type Task } from '@/lib/types';
import { AddEditClientDialog } from '@/components/shared/AddEditClientDialog';
import { useRouter } from 'next/navigation';
import { AddTaskDialog } from '@/components/shared/AddTaskDialog';
import { AddPromoterDialog } from '@/components/shared/AddPromoterDialog';
import { AddSupplierDialog } from '@/components/shared/AddSupplierDialog';
import { useCRMData } from './CRMDataContext';
import { SmartDocumentUploadDialog } from '@/components/shared/SmartDocumentUploadDialog';


interface DialogsContextType {
  isSmartUploadDialogOpen: boolean;
  setIsSmartUploadDialogOpen: (isOpen: boolean) => void;
  
  isAddClientDialogOpen: boolean;
  setIsAddClientDialogOpen: (isOpen: boolean) => void;
  editingClient: Client | null;
  setEditingClient: (client: Client | null) => void;
  
  isAddTaskDialogOpen: boolean;
  setIsAddTaskDialogOpen: (isOpen: boolean) => void;

  isAddPromoterDialogOpen: boolean;
  setIsAddPromoterDialogOpen: (isOpen: boolean) => void;

  isAddSupplierDialogOpen: boolean;
  setIsAddSupplierDialogOpen: (isOpen: boolean) => void;

  preselectedServiceId: string | null;
  setPreselectedServiceId: (serviceId: string | null) => void;
  
  preselectedClientId: string | null;
  setPreselectedClientId: (clientId: string | null) => void;
  
  preselectedSupplierId: string | null;
  setPreselectedSupplierId: (supplierId: string | null) => void;
  
  preselectedPromoterId: string | null;
  setPreselectedPromoterId: (promoterId: string | null) => void;
  
  openSmartUploadForSupplier: (supplierId: string) => void;
  openSmartUploadForClient: (clientId: string) => void;
  openSmartUploadForPromoter: (promoterId: string) => void;
}

const DialogsContext = createContext<DialogsContextType | undefined>(undefined);

export function DialogsProvider({ children }: { children: ReactNode }) {
  const [isSmartUploadDialogOpen, setIsSmartUploadDialogOpen] = useState(false);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isAddPromoterDialogOpen, setIsAddPromoterDialogOpen] = useState(false);
  const [isAddSupplierDialogOpen, setIsAddSupplierDialogOpen] = useState(false);

  const [preselectedServiceId, setPreselectedServiceId] = useState<string | null>(null);
  const [preselectedClientId, setPreselectedClientId] = useState<string | null>(null);
  const [preselectedSupplierId, setPreselectedSupplierId] = useState<string | null>(null);
  const [preselectedPromoterId, setPreselectedPromoterId] = useState<string | null>(null);
  const router = useRouter();
  const { clients, addTask, addPromoter, addSupplier } = useCRMData();

  const handleAddTask = async (data: Omit<Task, 'id' | 'status'>) => {
    await addTask(data);
  };

  const handleAddPromoter = async (data: any) => {
      await addPromoter(data);
  }

  const handleAddSupplier = async (data: any) => {
      await addSupplier(data);
  }

  const openSmartUploadForSupplier = (supplierId: string) => {
    setPreselectedSupplierId(supplierId);
    setIsSmartUploadDialogOpen(true);
  };
  
  const openSmartUploadForClient = (clientId: string) => {
    setPreselectedClientId(clientId);
    setIsSmartUploadDialogOpen(true);
  };
  
  const openSmartUploadForPromoter = (promoterId: string) => {
    setPreselectedPromoterId(promoterId);
    setIsSmartUploadDialogOpen(true);
  };

  const value = useMemo(() => ({
    isSmartUploadDialogOpen,
    setIsSmartUploadDialogOpen,
    isAddClientDialogOpen,
    setIsAddClientDialogOpen,
    editingClient,
    setEditingClient,
    isAddTaskDialogOpen,
    setIsAddTaskDialogOpen,
    isAddPromoterDialogOpen,
    setIsAddPromoterDialogOpen,
    isAddSupplierDialogOpen,
    setIsAddSupplierDialogOpen,
    preselectedServiceId,
    setPreselectedServiceId,
    preselectedClientId,
    setPreselectedClientId,
    preselectedSupplierId,
    setPreselectedSupplierId,
    preselectedPromoterId,
    setPreselectedPromoterId,
    openSmartUploadForSupplier,
    openSmartUploadForClient,
    openSmartUploadForPromoter,
  }), [isSmartUploadDialogOpen, isAddClientDialogOpen, editingClient, preselectedServiceId, preselectedClientId, preselectedSupplierId, preselectedPromoterId, isAddTaskDialogOpen, isAddPromoterDialogOpen, isAddSupplierDialogOpen]);

  const handleSmartUploadClose = (isOpen: boolean) => {
      if(!isOpen) {
          setPreselectedServiceId(null);
          setPreselectedClientId(null);
          setPreselectedSupplierId(null);
          setPreselectedPromoterId(null);
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
            preselectedServiceId={preselectedServiceId || undefined}
            preselectedClientId={preselectedClientId || undefined}
            preselectedSupplierId={preselectedSupplierId || undefined}
            preselectedPromoterId={preselectedPromoterId || undefined}
        />
       <AddTaskDialog
          isOpen={isAddTaskDialogOpen}
          onOpenChange={setIsAddTaskDialogOpen}
          clients={clients}
          onTaskAdd={handleAddTask}
          isWorkflowMode={false}
      />
      <AddPromoterDialog
          isOpen={isAddPromoterDialogOpen}
          onClose={() => setIsAddPromoterDialogOpen(false)}
          onAdd={handleAddPromoter as any}
      />
       <AddSupplierDialog
          isOpen={isAddSupplierDialogOpen}
          onClose={() => setIsAddSupplierDialogOpen(false)}
          onAdd={handleAddSupplier}
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
