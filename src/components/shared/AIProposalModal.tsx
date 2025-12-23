"use client";

import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Check, X, Edit3, AlertTriangle, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import type { Client } from '@/lib/types';

interface EntityMatch {
  matched: boolean;
  matchType: 'rfc' | 'name' | null;
  id: string | null;
  name: string;
  rfc?: string | null;
  suggestCreate?: boolean;
}

interface AvailableEntity {
  id: string;
  name: string;
  rfc?: string;
}

interface AIProposal {
  documentType: string;
  confidence: number;
  // Raw extracted data from backend (ALL fields)
  rawExtracted: Record<string, any>;
  extractedFields: {
    vendorName?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    dueDate?: string;
    totalAmount?: number;
    currency?: string;
    lineItems?: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
    taxAmount?: number;
    subtotal?: number;
  };
  suggestedActions: {
    createTransaction?: {
      type: 'income' | 'expense';
      amount: number;
      description: string;
      categoryId?: string;
    };
    updateClient?: {
      field: string;
      value: string;
    };
    createTask?: {
      title: string;
      description: string;
      clientId?: string;
      dueDate?: string;
      dueTime?: string;
      location?: string;
    };
  };
  // Asociaciones automáticas detectadas
  associations?: {
    supplier?: EntityMatch | null;
    client?: EntityMatch | null;
    availableSuppliers?: AvailableEntity[];
    availableClients?: AvailableEntity[];
    availablePromoters?: AvailableEntity[];
  };
}

interface DocumentInfo {
  id: string;
  name: string;
  savedProposal?: any; // Propuesta guardada previamente en doc.ai.proposal
}

interface DocumentState {
  proposal: AIProposal | null;
  editedProposal: AIProposal | null;
  isAnalyzing: boolean;
  isApplying: boolean;
  error: string | null;
  currentStep: number;
  stepError: string | null;
  applySuggestedTransaction: boolean;
  applySuggestedTask: boolean;
  selectedSupplierId: string | null;
  selectedClientId: string | null;
  createNewSupplier: boolean;
  createNewClient: boolean;
  applySupplierAssociation: boolean;
  applyClientAssociation: boolean;
  isEditing: boolean;
  applied: boolean;
}

interface AIProposalModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  documents: DocumentInfo[];
  clients: Client[];
  onProposalApplied?: () => void;
}

const createInitialDocState = (): DocumentState => ({
  proposal: null,
  editedProposal: null,
  isAnalyzing: false,
  isApplying: false,
  error: null,
  currentStep: 0,
  stepError: null,
  applySuggestedTransaction: false,
  applySuggestedTask: false,
  selectedSupplierId: null,
  selectedClientId: null,
  createNewSupplier: false,
  createNewClient: false,
  applySupplierAssociation: true,
  applyClientAssociation: true,
  isEditing: false,
  applied: false,
});

export function AIProposalModal({
  isOpen,
  onOpenChange,
  documents,
  clients,
  onProposalApplied,
}: AIProposalModalProps) {
  const { toast } = useToast();
  
  // Current document index
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  
  // State per document
  const [docStates, setDocStates] = useState<Map<string, DocumentState>>(new Map());
  
  const steps = [
    { id: 1, name: 'Autenticando usuario' },
    { id: 2, name: 'Enviando solicitud al servidor' },
    { id: 3, name: 'Validando documento en Firestore' },
    { id: 4, name: 'Descargando archivo de Storage' },
    { id: 5, name: 'Procesando con Document AI' },
    { id: 6, name: 'Extrayendo campos' },
    { id: 7, name: 'Generando propuesta' },
  ];
  
  // Current document
  const currentDoc = documents[currentDocIndex] || { id: '', name: '' };
  const currentState = docStates.get(currentDoc.id) || createInitialDocState();
  
  // Destructure current state for easier access
  const {
    proposal, editedProposal, isAnalyzing, isApplying, error,
    currentStep, stepError, applySuggestedTransaction, applySuggestedTask,
    selectedSupplierId, selectedClientId, createNewSupplier, createNewClient,
    applySupplierAssociation, applyClientAssociation, isEditing, applied,
  } = currentState;

  // Update state for current document
  const updateCurrentState = (updates: Partial<DocumentState>) => {
    setDocStates(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(currentDoc.id) || createInitialDocState();
      newMap.set(currentDoc.id, { ...current, ...updates });
      return newMap;
    });
  };

  // Initialize states for all documents
  useEffect(() => {
    if (isOpen && documents.length > 0) {
      setCurrentDocIndex(0);
      const initialStates = new Map<string, DocumentState>();
      documents.forEach(doc => {
        initialStates.set(doc.id, createInitialDocState());
      });
      setDocStates(initialStates);
    }
  }, [isOpen, documents.length]);

  // Analyze current document when switching or when modal opens
  // If document has savedProposal, load it directly instead of calling API
  useEffect(() => {
    if (isOpen && currentDoc.id && !currentState.proposal && !currentState.isAnalyzing && !currentState.applied) {
      if (currentDoc.savedProposal) {
        // Load saved proposal directly - no API call needed
        loadSavedProposal(currentDoc.savedProposal);
      } else {
        // No saved proposal, analyze with Document AI
        analyzeDocument();
      }
    }
  }, [isOpen, currentDoc.id, currentState.proposal, currentState.isAnalyzing]);

  // Helper setters that update the current document's state
  const setEditedProposal = (value: AIProposal | null) => updateCurrentState({ editedProposal: value });
  const setIsAnalyzing = (value: boolean) => updateCurrentState({ isAnalyzing: value });
  const setIsApplying = (value: boolean) => updateCurrentState({ isApplying: value });
  const setError = (value: string | null) => updateCurrentState({ error: value });
  const setCurrentStep = (value: number) => updateCurrentState({ currentStep: value });
  const setStepError = (value: string | null) => updateCurrentState({ stepError: value });
  const setProposal = (value: AIProposal | null) => {
    updateCurrentState({ 
      proposal: value,
      editedProposal: value ? JSON.parse(JSON.stringify(value)) : null,
      applySuggestedTransaction: !!value?.suggestedActions?.createTransaction,
      applySuggestedTask: false, // Default OFF
    });
  };
  const setApplySuggestedTransaction = (value: boolean) => updateCurrentState({ applySuggestedTransaction: value });
  const setApplySuggestedTask = (value: boolean) => updateCurrentState({ applySuggestedTask: value });
  const setSelectedSupplierId = (value: string | null) => updateCurrentState({ selectedSupplierId: value });
  const setSelectedClientId = (value: string | null) => updateCurrentState({ selectedClientId: value });
  const setCreateNewSupplier = (value: boolean) => updateCurrentState({ createNewSupplier: value });
  const setCreateNewClient = (value: boolean) => updateCurrentState({ createNewClient: value });
  const setApplySupplierAssociation = (value: boolean) => updateCurrentState({ applySupplierAssociation: value });
  const setApplyClientAssociation = (value: boolean) => updateCurrentState({ applyClientAssociation: value });
  const setIsEditing = (value: boolean) => updateCurrentState({ isEditing: value });
  const setApplied = (value: boolean) => updateCurrentState({ applied: value });

  const updateTaskField = (field: string, value: any) => {
    if (!editedProposal) return;
    if (!editedProposal?.suggestedActions?.createTask) return;
    setEditedProposal({
      ...editedProposal,
      suggestedActions: {
        ...editedProposal.suggestedActions,
        createTask: {
          ...editedProposal.suggestedActions.createTask,
          [field]: value,
        },
      },
    });
  };

  const ensureTransactionAction = () => {
    if (!editedProposal) return;
    if (editedProposal.suggestedActions?.createTransaction) return;

    setEditedProposal({
      ...editedProposal,
      suggestedActions: {
        ...editedProposal.suggestedActions,
        createTransaction: {
          type: 'expense',
          amount: editedProposal.extractedFields.totalAmount || 0,
          description: editedProposal.extractedFields.vendorName || '',
        },
      },
    });
  };

  // Load a previously saved proposal without calling Document AI
  const loadSavedProposal = (apiProposal: any) => {
    console.log('📂 Loading saved proposal:', apiProposal);
    
    // Map backend transaction type to frontend type
    const mapTransactionType = (backendType: string): 'income' | 'expense' => {
      const t = (backendType || '').toLowerCase();
      if (t.includes('ingreso') || t.includes('income')) return 'income';
      return 'expense';
    };
    
    const extractedCurrency = apiProposal.extracted?.currency;
    const summaryCurrency = apiProposal.summary?.currency;
    const finalCurrency = (extractedCurrency && extractedCurrency.trim() !== '') 
      ? extractedCurrency.toUpperCase() 
      : (summaryCurrency && summaryCurrency.trim() !== '') 
        ? summaryCurrency.toUpperCase() 
        : 'MXN';
    
    const rawExtracted = apiProposal.extracted || {};
    
    const transformedProposal: AIProposal = {
      documentType: apiProposal.suggestedType || 'Otro',
      confidence: apiProposal.confidence || 0.5,
      rawExtracted: rawExtracted,
      extractedFields: {
        vendorName: rawExtracted?.supplierName || rawExtracted?.emisor_nombre || apiProposal.summary?.from || undefined,
        invoiceNumber: rawExtracted?.invoiceId || rawExtracted?.timbre_uuid || rawExtracted?.cfdi_folio || apiProposal.summary?.documentId || undefined,
        totalAmount: rawExtracted?.primaryAmount || rawExtracted?.cfdi_total || rawExtracted?.totalAmount || apiProposal.summary?.total || undefined,
        invoiceDate: rawExtracted?.date || rawExtracted?.cfdi_fecha_emision || apiProposal.summary?.documentDate || undefined,
        dueDate: rawExtracted?.dueDate || apiProposal.summary?.dueDate || undefined,
        currency: finalCurrency,
        taxAmount: rawExtracted?.totalTaxAmount || rawExtracted?.total_impuestos_trasladados || apiProposal.summary?.tax || undefined,
        subtotal: rawExtracted?.netAmount || rawExtracted?.cfdi_subtotal || apiProposal.summary?.subtotal || undefined,
      },
      suggestedActions: {
        createTransaction: apiProposal.suggested?.transaction ? {
          type: mapTransactionType(apiProposal.suggested.transaction.type),
          amount: apiProposal.suggested.transaction.amount || rawExtracted?.primaryAmount || 0,
          description: apiProposal.suggested.transaction.description || '',
        } : undefined,
        createTask: apiProposal.suggested?.task?.title ? {
          title: apiProposal.suggested.task.title,
          description: apiProposal.suggested.task.description || '',
          clientId: apiProposal.suggested.task.clientId || undefined,
          dueDate: apiProposal.suggested.task.dueDate || undefined,
          dueTime: apiProposal.suggested.task.dueTime || undefined,
          location: apiProposal.suggested.task.location || undefined,
        } : undefined,
      },
      associations: apiProposal.associations || undefined,
    };
    
    // Initialize association states
    const assoc = apiProposal.associations;
    if (assoc?.supplier?.matched && assoc.supplier.id) {
      setSelectedSupplierId(assoc.supplier.id);
      setCreateNewSupplier(false);
    } else if (assoc?.supplier?.suggestCreate) {
      setSelectedSupplierId(null);
      setCreateNewSupplier(true);
    }
    if (assoc?.client?.matched && assoc.client.id) {
      setSelectedClientId(assoc.client.id);
      setCreateNewClient(false);
    } else if (assoc?.client?.suggestCreate) {
      setSelectedClientId(null);
      setCreateNewClient(true);
    }
    
    setProposal(transformedProposal);
  };

  const analyzeDocument = async () => {
    setIsAnalyzing(true);
    setError(null);
    setStepError(null);
    setProposal(null);
    setCurrentStep(1);

    try {
      // Paso 1: Autenticando usuario
      setCurrentStep(1);
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        setStepError('No hay usuario autenticado');
        throw new Error('No autenticado');
      }

      // Paso 2: Enviando solicitud al servidor
      setCurrentStep(2);
      const response = await fetch('/api/ai/documents/analyze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ docId: currentDoc.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Map server errors to steps
        const errorStep = mapErrorToStep(data.error);
        setCurrentStep(errorStep);
        setStepError(getErrorMessage(data.error));
        throw new Error(data.error || 'Error al analizar el documento');
      }

      // Paso 7: Propuesta generada
      setCurrentStep(7);
      
      // Transform API response to match modal structure
      const apiProposal = data.proposal;
      
      // Map backend transaction type to frontend type
      const mapTransactionType = (backendType: string): 'income' | 'expense' => {
        const t = (backendType || '').toLowerCase();
        if (t.includes('ingreso') || t.includes('income')) return 'income';
        return 'expense'; // Default to expense for "Egreso" and others
      };
      
      // Ensure currency is never empty - default to MXN
      const extractedCurrency = apiProposal.extracted?.currency;
      const summaryCurrency = apiProposal.summary?.currency;
      const finalCurrency = (extractedCurrency && extractedCurrency.trim() !== '') 
        ? extractedCurrency.toUpperCase() 
        : (summaryCurrency && summaryCurrency.trim() !== '') 
          ? summaryCurrency.toUpperCase() 
          : 'MXN';
      
      console.log('💰 Currency detection:', { extractedCurrency, summaryCurrency, finalCurrency });
      
      // Store ALL extracted data
      const rawExtracted = apiProposal.extracted || {};
      console.log('📋 Raw extracted data:', rawExtracted);
      
      const transformedProposal: AIProposal = {
        documentType: apiProposal.suggestedType || 'Otro',
        confidence: apiProposal.confidence || 0.5,
        rawExtracted: rawExtracted,
        extractedFields: {
          vendorName: rawExtracted?.supplierName || rawExtracted?.emisor_nombre || apiProposal.summary?.from || undefined,
          invoiceNumber: rawExtracted?.invoiceId || rawExtracted?.timbre_uuid || rawExtracted?.cfdi_folio || apiProposal.summary?.documentId || undefined,
          totalAmount: rawExtracted?.primaryAmount || rawExtracted?.cfdi_total || rawExtracted?.totalAmount || apiProposal.summary?.total || undefined,
          invoiceDate: rawExtracted?.date || rawExtracted?.cfdi_fecha_emision || apiProposal.summary?.documentDate || undefined,
          dueDate: rawExtracted?.dueDate || apiProposal.summary?.dueDate || undefined,
          currency: finalCurrency,
          taxAmount: rawExtracted?.totalTaxAmount || rawExtracted?.total_impuestos_trasladados || apiProposal.summary?.tax || undefined,
          subtotal: rawExtracted?.netAmount || rawExtracted?.cfdi_subtotal || apiProposal.summary?.subtotal || undefined,
        },
        suggestedActions: {
          createTransaction: apiProposal.suggested?.transaction ? {
            type: mapTransactionType(apiProposal.suggested.transaction.type),
            amount: apiProposal.suggested.transaction.amount || rawExtracted?.primaryAmount || 0,
            description: apiProposal.suggested.transaction.description || '',
          } : undefined,
          createTask: apiProposal.suggested?.task?.title ? {
            title: apiProposal.suggested.task.title,
            description: apiProposal.suggested.task.description || '',
            clientId: apiProposal.suggested.task.clientId || undefined,
            dueDate: apiProposal.suggested.task.dueDate || undefined,
            dueTime: apiProposal.suggested.task.dueTime || undefined,
            location: apiProposal.suggested.task.location || undefined,
          } : undefined,
        },
        // Asociaciones automáticas del backend
        associations: apiProposal.associations || undefined,
      };
      
      // Inicializar estados de asociación basados en lo detectado
      const assoc = apiProposal.associations;
      if (assoc?.supplier?.matched && assoc.supplier.id) {
        setSelectedSupplierId(assoc.supplier.id);
        setCreateNewSupplier(false);
      } else if (assoc?.supplier?.suggestCreate) {
        setSelectedSupplierId(null);
        setCreateNewSupplier(true);
      }
      if (assoc?.client?.matched && assoc.client.id) {
        setSelectedClientId(assoc.client.id);
        setCreateNewClient(false);
      } else if (assoc?.client?.suggestCreate) {
        setSelectedClientId(null);
        setCreateNewClient(true);
      }
      
      setProposal(transformedProposal);
      setCurrentStep(0); // Reset - completed successfully
    } catch (err: any) {
      setError(err.message || 'Error desconocido al analizar');
      toast({
        variant: 'destructive',
        title: 'Error de Análisis',
        description: err.message || 'No se pudo analizar el documento.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const mapErrorToStep = (error: string): number => {
    switch (error) {
      case 'missing_auth':
      case 'invalid_auth':
        return 1;
      case 'invalid_json':
      case 'missing_docId':
        return 2;
      case 'document_not_found':
      case 'missing_storagePath':
        return 3;
      case 'storage_download_failed':
        return 4;
      case 'processor_not_configured':
      case 'documentai_error':
      case 'analyze_failed':
        return 5;
      default:
        return 2;
    }
  };
  
  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'missing_auth':
        return 'Token de autenticación no enviado';
      case 'invalid_auth':
        return 'Token de autenticación inválido';
      case 'invalid_json':
        return 'JSON inválido en la solicitud';
      case 'missing_docId':
        return 'ID del documento no proporcionado';
      case 'document_not_found':
        return 'Documento no encontrado en Firestore';
      case 'missing_storagePath':
        return 'El documento no tiene ruta de almacenamiento (storagePath)';
      case 'storage_download_failed':
        return 'Error al descargar archivo de Firebase Storage';
      case 'processor_not_configured':
        return 'Procesador de Document AI no configurado';
      case 'documentai_error':
        return 'Error de Google Document AI';
      case 'analyze_failed':
        return 'Error general en el análisis - ver logs del servidor';
      default:
        return error || 'Error desconocido';
    }
  };

  const applyProposal = async () => {
    if (!editedProposal) return;

    if (applySuggestedTask && !editedProposal?.suggestedActions?.createTask?.clientId) {
      toast({
        variant: 'destructive',
        title: 'Falta Cliente',
        description: 'Para crear una tarea debes seleccionar un cliente.',
      });
      return;
    }

    setIsApplying(true);

    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('No autenticado');
      }

      const proposalToApply: AIProposal = JSON.parse(JSON.stringify(editedProposal));
      if (!applySuggestedTransaction) {
        if (proposalToApply.suggestedActions) delete proposalToApply.suggestedActions.createTransaction;
      }
      if (!applySuggestedTask) {
        if (proposalToApply.suggestedActions) delete proposalToApply.suggestedActions.createTask;
      }
      if (proposalToApply.suggestedActions && Object.keys(proposalToApply.suggestedActions).length === 0) {
        (proposalToApply as any).suggestedActions = {};
      }

      // Construir objeto de asociaciones para enviar al backend
      const associationsToApply: any = {};
      if (applySupplierAssociation) {
        if (selectedSupplierId) {
          associationsToApply.supplierId = selectedSupplierId;
        } else if (createNewSupplier && editedProposal.associations?.supplier) {
          associationsToApply.createSupplier = {
            name: editedProposal.associations.supplier.name,
            rfc: editedProposal.associations.supplier.rfc,
          };
        }
      }
      if (applyClientAssociation) {
        if (selectedClientId) {
          associationsToApply.clientId = selectedClientId;
        } else if (createNewClient && editedProposal.associations?.client) {
          associationsToApply.createClient = {
            name: editedProposal.associations.client.name,
            rfc: editedProposal.associations.client.rfc,
          };
        }
      }

      const response = await fetch('/api/ai/documents/apply', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          docId: currentDoc.id,
          proposal: proposalToApply,
          associations: associationsToApply,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al aplicar la propuesta');
      }

      toast({
        title: 'Propuesta Aplicada',
        description: 'Los cambios sugeridos por la IA han sido aplicados correctamente.',
      });

      // Mark current document as applied
      setApplied(true);
      
      // If single document, close immediately
      if (documents.length === 1) {
        onProposalApplied?.();
        onOpenChange(false);
        return;
      }
      
      // For multiple documents, move to next unprocessed
      const nextUnprocessedIdx = documents.findIndex((doc, idx) => {
        if (idx <= currentDocIndex) return false;
        const state = docStates.get(doc.id);
        return !state?.applied;
      });
      
      if (nextUnprocessedIdx !== -1) {
        setCurrentDocIndex(nextUnprocessedIdx);
      } else {
        // No more pending, close modal
        onProposalApplied?.();
        onOpenChange(false);
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error al Aplicar',
        description: err.message || 'No se pudo aplicar la propuesta.',
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleReject = () => {
    toast({
      title: 'Propuesta Rechazada',
      description: 'La propuesta de IA ha sido descartada.',
    });
    
    // Mark as applied (skipped) so we don't re-analyze
    setApplied(true);
    
    // If multiple documents, move to next
    if (documents.length > 1) {
      const nextUnprocessedIdx = documents.findIndex((doc, idx) => {
        if (idx <= currentDocIndex) return false;
        const state = docStates.get(doc.id);
        return !state?.applied;
      });
      
      if (nextUnprocessedIdx !== -1) {
        setCurrentDocIndex(nextUnprocessedIdx);
      } else {
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  const updateExtractedField = (field: string, value: any) => {
    if (!editedProposal) return;
    setEditedProposal({
      ...editedProposal,
      extractedFields: {
        ...editedProposal.extractedFields,
        [field]: value,
      },
    });
  };

  const updateTransactionField = (field: string, value: any) => {
    if (!editedProposal) return;
    if (!editedProposal?.suggestedActions?.createTransaction) {
      ensureTransactionAction();
      return;
    }
    setEditedProposal({
      ...editedProposal,
      suggestedActions: {
        ...editedProposal.suggestedActions,
        createTransaction: {
          ...editedProposal.suggestedActions.createTransaction,
          [field]: value,
        },
      },
    });
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge className="bg-green-500">Alta ({Math.round(confidence * 100)}%)</Badge>;
    if (confidence >= 0.5) return <Badge className="bg-yellow-500">Media ({Math.round(confidence * 100)}%)</Badge>;
    return <Badge className="bg-red-500">Baja ({Math.round(confidence * 100)}%)</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Análisis de Documento con IA
          </DialogTitle>
          <DialogDescription>
            {documents.length > 1 
              ? `Documento ${currentDocIndex + 1} de ${documents.length}`
              : `Analizando: ${currentDoc.name}`
            }
          </DialogDescription>
        </DialogHeader>

        {/* Document tabs for multiple documents */}
        {documents.length > 1 && (
          <div className="flex items-center gap-2 py-2 border-b overflow-x-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              disabled={currentDocIndex === 0}
              onClick={() => setCurrentDocIndex(prev => Math.max(0, prev - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-1 flex-1 overflow-x-auto">
              {documents.map((doc, idx) => {
                const docState = docStates.get(doc.id);
                const isApplied = docState?.applied;
                const hasError = docState?.error && !docState?.isAnalyzing;
                const isActive = idx === currentDocIndex;
                
                return (
                  <Button
                    key={doc.id}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className={`flex-shrink-0 max-w-[120px] truncate text-xs ${
                      isApplied ? 'border-green-500 bg-green-50 dark:bg-green-950' : 
                      hasError ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''
                    }`}
                    onClick={() => setCurrentDocIndex(idx)}
                  >
                    <FileText className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{doc.name.slice(0, 15)}{doc.name.length > 15 ? '...' : ''}</span>
                    {isApplied && <Check className="h-3 w-3 ml-1 text-green-500" />}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              disabled={currentDocIndex === documents.length - 1}
              onClick={() => setCurrentDocIndex(prev => Math.min(documents.length - 1, prev + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Current document name */}
        {documents.length > 1 && (
          <div className="text-sm font-medium text-center py-2 border-b bg-muted/30">
            <FileText className="h-4 w-4 inline mr-2" />
            {currentDoc.name}
          </div>
        )}

        <ScrollArea className="max-h-[60vh] pr-4">
          {(isAnalyzing || (error && currentStep > 0)) && (
            <div className="py-6 space-y-4">
              <div className="text-center mb-6">
                {isAnalyzing ? (
                  <Loader2 className="h-10 w-10 animate-spin text-purple-500 mx-auto mb-2" />
                ) : (
                  <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-2" />
                )}
                <p className="font-medium">
                  {isAnalyzing ? 'Analizando documento...' : 'Error en el análisis'}
                </p>
              </div>
              
              {/* Step Progress */}
              <div className="space-y-2 max-w-md mx-auto">
                {steps.map((step) => {
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;
                  const isFailed = !isAnalyzing && currentStep === step.id;
                  
                  return (
                    <div 
                      key={step.id}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        isActive ? 'bg-purple-500/10 border border-purple-500/30' : 
                        isFailed ? 'bg-destructive/10 border border-destructive/30' :
                        isCompleted ? 'bg-green-500/10' : 'bg-muted/30'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        isFailed ? 'bg-destructive text-destructive-foreground' :
                        isCompleted ? 'bg-green-500 text-white' :
                        isActive ? 'bg-purple-500 text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        {isFailed ? '✕' : isCompleted ? '✓' : step.id}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          isFailed ? 'text-destructive' :
                          isActive ? 'text-purple-500' : 
                          isCompleted ? 'text-green-600' : 'text-muted-foreground'
                        }`}>
                          {step.name}
                        </p>
                        {isFailed && stepError && (
                          <p className="text-xs text-destructive mt-0.5">{stepError}</p>
                        )}
                      </div>
                      {isActive && isAnalyzing && (
                        <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                      )}
                    </div>
                  );
                })}
              </div>
              
              {error && !isAnalyzing && (
                <div className="text-center mt-4">
                  <Button variant="outline" onClick={analyzeDocument}>
                    Reintentar
                  </Button>
                </div>
              )}
            </div>
          )}

          {error && !isAnalyzing && currentStep === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-destructive font-medium">Error en el análisis</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <Button variant="outline" className="mt-4" onClick={analyzeDocument}>
                Reintentar
              </Button>
            </div>
          )}

          {editedProposal && !isAnalyzing && !error && (
            <div className="space-y-4 py-4">
              {/* Document Classification */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Clasificación del Documento</Label>
                  {getConfidenceBadge(editedProposal.confidence)}
                </div>
                <Input
                  value={editedProposal.documentType}
                  onChange={(e) => setEditedProposal({ ...editedProposal, documentType: e.target.value })}
                  disabled={!isEditing}
                  className="flex-1"
                />
              </div>

              <Separator />

              {/* ═══════════════════════════════════════════════════════════════════════
                  SISTEMA DINÁMICO AUTO-ADAPTABLE - MUESTRA TODOS LOS CAMPOS ENCONTRADOS
              ═══════════════════════════════════════════════════════════════════════ */}
              
              {(() => {
                const raw = editedProposal.rawExtracted || {};
                
                // Configuración de etiquetas profesionales en español
                const FIELD_LABELS: Record<string, string> = {
                  // CFDI Identificación
                  cfdi_version: 'Versión CFDI',
                  cfdi_tipo_comprobante_clave: 'Tipo Comprobante (Clave)',
                  cfdi_tipo_comprobante_descripcion: 'Tipo Comprobante',
                  cfdi_serie: 'Serie',
                  cfdi_folio: 'Folio Interno',
                  cfdi_fecha_emision: 'Fecha de Emisión',
                  cfdi_hora_emision: 'Hora de Emisión',
                  cfdi_lugar_expedicion_cp: 'Lugar Expedición (CP)',
                  cfdi_exportacion_clave: 'Exportación (Clave)',
                  cfdi_exportacion_descripcion: 'Exportación',
                  cfdi_confirmacion: 'Confirmación',
                  cfdi_no_certificado: 'No. Certificado Emisor',
                  cfdi_sello: 'Sello Digital CFDI',
                  cfdi_leyenda_sat: 'Leyenda SAT',
                  // Importes
                  cfdi_subtotal: 'Subtotal',
                  cfdi_descuento: 'Descuento Global',
                  cfdi_total: 'Total',
                  cfdi_moneda_clave: 'Moneda (Clave)',
                  cfdi_moneda_descripcion: 'Moneda',
                  cfdi_tipo_cambio: 'Tipo de Cambio',
                  cfdi_total_letra: 'Total en Letra',
                  cfdi_condiciones_pago: 'Condiciones de Pago',
                  cfdi_leyenda: 'Leyenda',
                  // Emisor
                  emisor_rfc: 'RFC Emisor',
                  emisor_nombre: 'Nombre Emisor',
                  emisor_regimen_fiscal_clave: 'Régimen Fiscal (Clave)',
                  emisor_regimen_fiscal_descripcion: 'Régimen Fiscal',
                  emisor_domicilio_fiscal_cp: 'CP Fiscal Emisor',
                  emisor_residencia_fiscal: 'Residencia Fiscal',
                  emisor_num_reg_id_trib: 'ID Tributario',
                  emisor_tipo_persona: 'Tipo Persona',
                  // Receptor
                  receptor_rfc: 'RFC Receptor',
                  receptor_nombre: 'Nombre Receptor',
                  receptor_domicilio_fiscal_cp: 'CP Fiscal Receptor',
                  receptor_domicilio_completo: 'Domicilio Completo',
                  receptor_regimen_fiscal_clave: 'Régimen Fiscal (Clave)',
                  receptor_regimen_fiscal_descripcion: 'Régimen Fiscal',
                  receptor_uso_cfdi_clave: 'Uso CFDI (Clave)',
                  receptor_uso_cfdi_descripcion: 'Uso CFDI',
                  receptor_residencia_fiscal: 'Residencia Fiscal',
                  receptor_num_reg_id_trib: 'ID Tributario',
                  receptor_tipo_persona: 'Tipo Persona',
                  // Pago
                  pago_forma_clave: 'Forma de Pago (Clave)',
                  pago_forma_descripcion: 'Forma de Pago',
                  pago_metodo_clave: 'Método de Pago (Clave)',
                  pago_metodo_descripcion: 'Método de Pago',
                  pago_fecha: 'Fecha de Pago',
                  pago_moneda: 'Moneda del Pago',
                  pago_tipo_cambio: 'Tipo de Cambio Pago',
                  pago_monto: 'Monto Pagado',
                  // Impuestos
                  impuesto_trasladado_base: 'Base Gravable',
                  impuesto_trasladado_impuesto_clave: 'Impuesto (Clave)',
                  impuesto_trasladado_tipo_factor: 'Tipo Factor',
                  impuesto_trasladado_tasa_o_cuota: 'Tasa/Cuota',
                  impuesto_trasladado_importe: 'Importe Trasladado',
                  impuesto_retenido_impuesto_clave: 'Retención (Clave)',
                  impuesto_retenido_importe: 'Importe Retenido',
                  total_impuestos_trasladados: 'Total Impuestos Trasladados',
                  total_impuestos_retenidos: 'Total Impuestos Retenidos',
                  // CFDI Relacionados
                  cfdi_relacion_tipo_clave: 'Tipo Relación',
                  cfdi_relacion_tipo_descripcion: 'Descripción Relación',
                  cfdi_relacion_uuid: 'UUID Relacionado',
                  // Timbrado
                  timbre_uuid: 'UUID (Folio Fiscal)',
                  timbre_fecha_timbrado: 'Fecha Timbrado',
                  timbre_rfc_proveedor_certificacion: 'RFC PAC',
                  timbre_no_certificado_sat: 'No. Certificado SAT',
                  timbre_sello_cfdi: 'Sello CFDI',
                  timbre_sello_sat: 'Sello SAT',
                  timbre_cadena_original: 'Cadena Original',
                  // Legacy/Document AI
                  supplierName: 'Proveedor',
                  supplierTaxId: 'RFC Proveedor',
                  supplierAddress: 'Dirección Proveedor',
                  receiverName: 'Cliente',
                  receiverTaxId: 'RFC Cliente',
                  invoiceId: 'ID Factura/UUID',
                  date: 'Fecha',
                  dueDate: 'Fecha Vencimiento',
                  totalAmount: 'Monto Total',
                  netAmount: 'Monto Neto',
                  totalTaxAmount: 'Impuestos',
                  currency: 'Moneda',
                  primaryAmount: 'Monto Principal',
                  paymentTerms: 'Términos de Pago',
                  paymentType: 'Tipo de Pago',
                  purchaseOrder: 'Orden de Compra',
                  fullText: 'Texto Completo',
                };

                // Categorías para agrupar campos
                const CATEGORIES: Record<string, { title: string; icon: string; fields: string[] }> = {
                  identificacion: {
                    title: '📋 Identificación del Documento',
                    icon: '📋',
                    fields: ['cfdi_version', 'cfdi_tipo_comprobante_clave', 'cfdi_tipo_comprobante_descripcion', 'cfdi_serie', 'cfdi_folio', 'cfdi_fecha_emision', 'cfdi_hora_emision', 'cfdi_lugar_expedicion_cp', 'cfdi_exportacion_clave', 'cfdi_exportacion_descripcion', 'cfdi_confirmacion', 'cfdi_no_certificado', 'invoiceId', 'date', 'dueDate']
                  },
                  importes: {
                    title: '💰 Importes y Totales',
                    icon: '💰',
                    fields: ['cfdi_subtotal', 'cfdi_descuento', 'cfdi_total', 'cfdi_moneda_clave', 'cfdi_moneda_descripcion', 'cfdi_tipo_cambio', 'cfdi_total_letra', 'cfdi_condiciones_pago', 'totalAmount', 'netAmount', 'primaryAmount', 'currency']
                  },
                  emisor: {
                    title: '🏢 Emisor (Proveedor)',
                    icon: '🏢',
                    fields: ['emisor_nombre', 'emisor_rfc', 'emisor_regimen_fiscal_clave', 'emisor_regimen_fiscal_descripcion', 'emisor_domicilio_fiscal_cp', 'emisor_residencia_fiscal', 'emisor_num_reg_id_trib', 'emisor_tipo_persona', 'supplierName', 'supplierTaxId', 'supplierAddress']
                  },
                  receptor: {
                    title: '👤 Receptor (Cliente)',
                    icon: '👤',
                    fields: ['receptor_nombre', 'receptor_rfc', 'receptor_domicilio_fiscal_cp', 'receptor_domicilio_completo', 'receptor_regimen_fiscal_clave', 'receptor_regimen_fiscal_descripcion', 'receptor_uso_cfdi_clave', 'receptor_uso_cfdi_descripcion', 'receptor_residencia_fiscal', 'receptor_num_reg_id_trib', 'receptor_tipo_persona', 'receiverName', 'receiverTaxId']
                  },
                  pago: {
                    title: '💳 Información de Pago',
                    icon: '💳',
                    fields: ['pago_forma_clave', 'pago_forma_descripcion', 'pago_metodo_clave', 'pago_metodo_descripcion', 'pago_fecha', 'pago_moneda', 'pago_tipo_cambio', 'pago_monto', 'paymentTerms', 'paymentType', 'purchaseOrder']
                  },
                  impuestos: {
                    title: '📊 Impuestos',
                    icon: '📊',
                    fields: ['impuesto_trasladado_base', 'impuesto_trasladado_impuesto_clave', 'impuesto_trasladado_tipo_factor', 'impuesto_trasladado_tasa_o_cuota', 'impuesto_trasladado_importe', 'impuesto_retenido_impuesto_clave', 'impuesto_retenido_importe', 'total_impuestos_trasladados', 'total_impuestos_retenidos', 'totalTaxAmount']
                  },
                  relacionados: {
                    title: '🔗 CFDI Relacionados',
                    icon: '🔗',
                    fields: ['cfdi_relacion_tipo_clave', 'cfdi_relacion_tipo_descripcion', 'cfdi_relacion_uuid']
                  },
                  timbrado: {
                    title: '✅ Timbrado Fiscal (SAT)',
                    icon: '✅',
                    fields: ['timbre_uuid', 'timbre_fecha_timbrado', 'timbre_rfc_proveedor_certificacion', 'timbre_no_certificado_sat', 'timbre_sello_cfdi', 'timbre_sello_sat', 'timbre_cadena_original', 'cfdi_sello', 'cfdi_leyenda_sat']
                  }
                };

                // Función para formatear valores
                const formatValue = (key: string, value: any): string => {
                  if (value === null || value === undefined || value === '') return '';
                  if (typeof value === 'number') {
                    if (key.includes('tasa') || key.includes('cuota')) return `${(value * 100).toFixed(2)}%`;
                    if (key.includes('total') || key.includes('subtotal') || key.includes('importe') || key.includes('monto') || key.includes('Amount') || key.includes('descuento') || key.includes('base')) {
                      return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
                    }
                    return value.toString();
                  }
                  if (typeof value === 'string' && value.length > 100) return value.substring(0, 80) + '...';
                  return String(value);
                };

                // Renderizar categoría
                const renderCategory = (catKey: string, cat: typeof CATEGORIES[string]) => {
                  const fieldsWithValues = cat.fields.filter(f => {
                    const val = raw[f];
                    return val !== null && val !== undefined && val !== '' && val !== 0;
                  });
                  if (fieldsWithValues.length === 0) return null;

                  return (
                    <div key={catKey} className="space-y-2">
                      <Label className="text-sm font-semibold text-primary flex items-center gap-2">
                        {cat.title}
                        <Badge variant="secondary" className="text-xs">{fieldsWithValues.length} campos</Badge>
                      </Label>
                      <div className="grid grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg text-sm">
                        {fieldsWithValues.map(field => {
                          const value = raw[field];
                          const formatted = formatValue(field, value);
                          if (!formatted) return null;
                          const isLong = formatted.length > 40 || field.includes('sello') || field.includes('uuid') || field.includes('cadena');
                          return (
                            <div key={field} className={isLong ? 'col-span-2' : ''}>
                              <span className="text-muted-foreground">{FIELD_LABELS[field] || field}:</span>{' '}
                              <span className={field.includes('sello') || field.includes('uuid') || field.includes('certificado') ? 'font-mono text-xs' : field.includes('nombre') || field.includes('total') ? 'font-bold' : ''}>
                                {field.includes('sello') && formatted.length > 20 ? '✓ Presente' : formatted}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                };

                // Campos ya procesados
                const processedFields = new Set(Object.values(CATEGORIES).flatMap(c => c.fields));
                
                // Campos adicionales no categorizados (captura TODO)
                const uncategorizedFields = Object.keys(raw).filter(k => 
                  !processedFields.has(k) && 
                  !['conceptos', 'conceptos_count', 'lineItems', 'lineItemsCount', 'rawEntities', 'totalEntitiesFound', 'fullText'].includes(k) &&
                  raw[k] !== null && raw[k] !== undefined && raw[k] !== ''
                );

                return (
                  <>
                    {/* Renderizar todas las categorías */}
                    {Object.entries(CATEGORIES).map(([key, cat]) => renderCategory(key, cat))}

                    {/* CONCEPTOS - Sección especial */}
                    {raw.conceptos && raw.conceptos.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-primary flex items-center gap-2">
                          📦 Conceptos Facturados
                          <Badge variant="secondary" className="text-xs">{raw.conceptos.length} items</Badge>
                        </Label>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {raw.conceptos.map((c: any, i: number) => (
                            <div key={i} className="p-3 bg-muted/30 rounded text-xs border-l-4 border-primary">
                              <div className="font-bold text-sm mb-2">{c.concepto_descripcion || 'Sin descripción'}</div>
                              <div className="grid grid-cols-3 gap-2">
                                {Object.entries(c).filter(([k, v]) => v !== null && v !== undefined && v !== '' && k !== 'concepto_descripcion' && k !== 'concepto_numero_linea').map(([k, v]) => (
                                  <div key={k} className={String(v).length > 20 ? 'col-span-2' : ''}>
                                    <span className="text-muted-foreground">{FIELD_LABELS[k] || k.replace('concepto_', '').replace(/_/g, ' ')}:</span>{' '}
                                    <span className={k.includes('importe') || k.includes('valor') ? 'font-bold' : ''}>
                                      {typeof v === 'number' && (k.includes('importe') || k.includes('valor') || k.includes('descuento')) 
                                        ? `$${(v as number).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` 
                                        : String(v)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Campos adicionales no categorizados */}
                    {uncategorizedFields.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-primary flex items-center gap-2">
                          📄 Otros Datos Extraídos
                          <Badge variant="secondary" className="text-xs">{uncategorizedFields.length} campos</Badge>
                        </Label>
                        <div className="grid grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg text-sm">
                          {uncategorizedFields.map(field => (
                            <div key={field} className={String(raw[field]).length > 40 ? 'col-span-2' : ''}>
                              <span className="text-muted-foreground">{FIELD_LABELS[field] || field}:</span>{' '}
                              <span>{formatValue(field, raw[field])}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contador total de campos */}
                    <div className="text-center text-xs text-muted-foreground pt-2 border-t">
                      ✨ {Object.keys(raw).filter(k => raw[k] !== null && raw[k] !== undefined && raw[k] !== '').length} campos extraídos automáticamente
                    </div>
                  </>
                );
              })()}

              <Separator />

              {/* CAMPOS EDITABLES BÁSICOS */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Campos Editables</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Proveedor/Emisor</Label>
                    <Input
                      value={editedProposal.extractedFields.vendorName || ''}
                      onChange={(e) => updateExtractedField('vendorName', e.target.value)}
                      disabled={!isEditing}
                      placeholder="No detectado"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Fecha</Label>
                    <Input
                      value={editedProposal.extractedFields.invoiceDate || ''}
                      onChange={(e) => updateExtractedField('invoiceDate', e.target.value)}
                      disabled={!isEditing}
                      placeholder="No detectada"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Monto Total</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editedProposal.extractedFields.totalAmount || ''}
                      onChange={(e) => updateExtractedField('totalAmount', parseFloat(e.target.value) || 0)}
                      disabled={!isEditing}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Moneda</Label>
                    <Select
                      value={['MXN', 'USD', 'EUR'].includes(editedProposal.extractedFields.currency || '') 
                        ? editedProposal.extractedFields.currency 
                        : 'MXN'}
                      defaultValue="MXN"
                      onValueChange={(v) => updateExtractedField('currency', v)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {editedProposal.extractedFields.currency || 'MXN'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                        <SelectItem value="USD">USD - Dólar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Número de factura - mostrar si existe */}
                  {editedProposal.extractedFields.invoiceNumber && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Número de Factura</Label>
                      <Input
                        value={editedProposal.extractedFields.invoiceNumber || ''}
                        onChange={(e) => updateExtractedField('invoiceNumber', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  )}
                  
                  {/* Fecha vencimiento - mostrar si existe */}
                  {editedProposal.extractedFields.dueDate && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Fecha de Vencimiento</Label>
                      <Input
                        value={editedProposal.extractedFields.dueDate || ''}
                        onChange={(e) => updateExtractedField('dueDate', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  )}
                  
                  {/* Subtotal - mostrar si existe */}
                  {editedProposal.extractedFields.subtotal && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Subtotal</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editedProposal.extractedFields.subtotal || ''}
                        onChange={(e) => updateExtractedField('subtotal', parseFloat(e.target.value))}
                        disabled={!isEditing}
                      />
                    </div>
                  )}
                  
                  {/* Impuestos - mostrar si existe */}
                  {editedProposal.extractedFields.taxAmount && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Impuestos (IVA)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editedProposal.extractedFields.taxAmount || ''}
                        onChange={(e) => updateExtractedField('taxAmount', parseFloat(e.target.value))}
                        disabled={!isEditing}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════════════
                  ASOCIACIONES AUTOMÁTICAS - Proveedor y Cliente
              ═══════════════════════════════════════════════════════════════════════ */}
              {(editedProposal.associations?.supplier || editedProposal.associations?.client) && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      🔗 Asociaciones Detectadas
                      <Badge variant="outline" className="text-xs">Automático</Badge>
                    </Label>

                    {/* Proveedor (Emisor) */}
                    {editedProposal.associations?.supplier && (
                      <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🏢</span>
                            <Label className="font-medium">Proveedor (Emisor)</Label>
                            {editedProposal.associations.supplier.matched ? (
                              <Badge className="bg-green-500 text-xs">
                                Encontrado por {editedProposal.associations.supplier.matchType === 'rfc' ? 'RFC' : 'Nombre'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-orange-500 border-orange-500">
                                No registrado
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Aplicar</Label>
                            <Switch checked={applySupplierAssociation} onCheckedChange={setApplySupplierAssociation} />
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <strong>{editedProposal.associations.supplier.name}</strong>
                          {editedProposal.associations.supplier.rfc && (
                            <span className="ml-2 font-mono">({editedProposal.associations.supplier.rfc})</span>
                          )}
                        </div>

                        {applySupplierAssociation && (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Asociar con:</Label>
                            <Select
                              value={createNewSupplier ? '__new__' : (selectedSupplierId || '__new__')}
                              onValueChange={(v) => {
                                if (v === '__new__') {
                                  setSelectedSupplierId(null);
                                  setCreateNewSupplier(true);
                                } else {
                                  setSelectedSupplierId(v);
                                  setCreateNewSupplier(false);
                                }
                              }}
                              disabled={!isEditing}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar proveedor" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__new__">
                                  ➕ Crear nuevo proveedor: {editedProposal.associations.supplier.name}
                                </SelectItem>
                                {editedProposal.associations.availableSuppliers?.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.name} {s.rfc ? `(${s.rfc})` : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Cliente (Receptor) */}
                    {editedProposal.associations?.client && (
                      <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">👤</span>
                            <Label className="font-medium">Cliente (Receptor)</Label>
                            {editedProposal.associations.client.matched ? (
                              <Badge className="bg-green-500 text-xs">
                                Encontrado por {editedProposal.associations.client.matchType === 'rfc' ? 'RFC' : 'Nombre'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-orange-500 border-orange-500">
                                No registrado
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Aplicar</Label>
                            <Switch checked={applyClientAssociation} onCheckedChange={setApplyClientAssociation} />
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <strong>{editedProposal.associations.client.name}</strong>
                          {editedProposal.associations.client.rfc && (
                            <span className="ml-2 font-mono">({editedProposal.associations.client.rfc})</span>
                          )}
                        </div>

                        {applyClientAssociation && (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Asociar con:</Label>
                            <Select
                              value={createNewClient ? '__new__' : (selectedClientId || '__new__')}
                              onValueChange={(v) => {
                                if (v === '__new__') {
                                  setSelectedClientId(null);
                                  setCreateNewClient(true);
                                } else {
                                  setSelectedClientId(v);
                                  setCreateNewClient(false);
                                }
                              }}
                              disabled={!isEditing}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar cliente" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__new__">
                                  ➕ Crear nuevo cliente: {editedProposal.associations.client.name}
                                </SelectItem>
                                {editedProposal.associations.availableClients?.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.name} {c.rfc ? `(${c.rfc})` : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Suggested Transaction - siempre mostrar */}
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-base font-semibold">Transacción Sugerida</Label>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Aplicar</Label>
                    <Switch
                      checked={applySuggestedTransaction}
                      onCheckedChange={(v) => {
                        setApplySuggestedTransaction(v);
                        if (v) ensureTransactionAction();
                      }}
                    />
                  </div>
                </div>
                <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">Tipo</Label>
                      <Select
                        value={editedProposal.suggestedActions?.createTransaction?.type || 'expense'}
                        onValueChange={(v) => {
                          if (!applySuggestedTransaction) return;
                          if (!editedProposal.suggestedActions) {
                            setEditedProposal({
                              ...editedProposal,
                              suggestedActions: {
                                createTransaction: {
                                  type: v as 'income' | 'expense',
                                  amount: editedProposal.extractedFields.totalAmount || 0,
                                  description: editedProposal.extractedFields.vendorName || '',
                                }
                              }
                            });
                          } else {
                            updateTransactionField('type', v);
                          }
                        }}
                        disabled={!isEditing || !applySuggestedTransaction}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Ingreso</SelectItem>
                          <SelectItem value="expense">Egreso</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">Monto</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editedProposal.suggestedActions?.createTransaction?.amount || editedProposal.extractedFields.totalAmount || ''}
                        onChange={(e) => updateTransactionField('amount', parseFloat(e.target.value) || 0)}
                        disabled={!isEditing || !applySuggestedTransaction}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Descripción</Label>
                    <Input
                      value={editedProposal.suggestedActions?.createTransaction?.description || ''}
                      onChange={(e) => updateTransactionField('description', e.target.value)}
                      disabled={!isEditing || !applySuggestedTransaction}
                      placeholder="Descripción de la transacción"
                    />
                  </div>
                </div>
              </div>

              {/* Suggested Task */}
              {editedProposal.suggestedActions?.createTask && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <Label className="text-base font-semibold">Tarea Sugerida</Label>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Aplicar</Label>
                        <Switch checked={applySuggestedTask} onCheckedChange={setApplySuggestedTask} />
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Cliente</Label>
                        <Select
                          value={editedProposal.suggestedActions.createTask.clientId || '__none__'}
                          onValueChange={(v) => updateTaskField('clientId', v === '__none__' ? undefined : v)}
                          disabled={!isEditing || !applySuggestedTask}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Sin cliente</SelectItem>
                            {clients.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Título</Label>
                        <Input
                          value={editedProposal.suggestedActions.createTask.title}
                          disabled={!isEditing || !applySuggestedTask}
                          onChange={(e) => {
                            updateTaskField('title', e.target.value);
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Descripción</Label>
                        <Input
                          value={editedProposal.suggestedActions.createTask.description || ''}
                          disabled={!isEditing || !applySuggestedTask}
                          onChange={(e) => {
                            updateTaskField('description', e.target.value);
                          }}
                          placeholder="Descripción de la tarea"
                        />
                      </div>
                      {editedProposal.suggestedActions.createTask.dueDate && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Fecha Límite</Label>
                          <Input
                            type="date"
                            value={editedProposal.suggestedActions.createTask.dueDate}
                            disabled={!isEditing || !applySuggestedTask}
                            onChange={(e) => updateTaskField('dueDate', e.target.value)}
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Hora (Opcional)</Label>
                          <Input
                            type="time"
                            value={editedProposal.suggestedActions.createTask.dueTime || ''}
                            disabled={!isEditing || !applySuggestedTask}
                            onChange={(e) => updateTaskField('dueTime', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Ubicación (Opcional)</Label>
                          <Input
                            value={editedProposal.suggestedActions.createTask.location || ''}
                            disabled={!isEditing || !applySuggestedTask}
                            onChange={(e) => updateTaskField('location', e.target.value)}
                            placeholder="Ubicación"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </ScrollArea>

        {editedProposal && !isAnalyzing && !error && (
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
            <div className="flex gap-2 flex-1">
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                disabled={isApplying}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {isEditing ? 'Terminar Edición' : 'Editar'}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleReject} disabled={isApplying}>
                <X className="h-4 w-4 mr-2" />
                Rechazar
              </Button>
              <Button onClick={applyProposal} disabled={isApplying}>
                {isApplying ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Aplicar
              </Button>
            </div>
          </DialogFooter>
        )}

        {(isAnalyzing || error) && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
