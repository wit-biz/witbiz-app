
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UploadCloud, File as FileIcon, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useCRMData } from '@/contexts/CRMDataContext';
import { useToast } from '@/hooks/use-toast';
import type { Client, Document as AppDocument, DocumentType } from '@/lib/types';
import { AIProposalModal } from './AIProposalModal';
import { Checkbox } from '@/components/ui/checkbox';

const documentTypes: DocumentType[] = ["Contrato", "Factura", "Propuesta", "Informe", "Otro"];

interface SmartDocumentUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDocumentUploaded?: (docId: string) => void;
  onClientAdded?: (client: Client) => void;
  preselectedClientId?: string;
  preselectedServiceId?: string; 
  preselectedPromoterId?: string;
  preselectedSupplierId?: string;
}

export function SmartDocumentUploadDialog({
  isOpen,
  onOpenChange,
  onDocumentUploaded,
  onClientAdded,
  preselectedClientId,
  preselectedServiceId,
  preselectedPromoterId,
  preselectedSupplierId,
}: SmartDocumentUploadDialogProps) {
  const { clients, serviceWorkflows, promoters, suppliers, addClient, addDocument } = useCRMData();
  const { toast } = useToast();

  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Removed manual association options - AI will handle associations
  
  // AI Analysis state
  const [enableAIAnalysis, setEnableAIAnalysis] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<Array<{ id: string; name: string }>>([]);
  
  // Upload progress tracking
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; uploading: boolean }>({ current: 0, total: 0, uploading: false });
  
  const isServiceResourceMode = !!preselectedServiceId;

  const resetState = useCallback(() => {
    setFiles([]);
    setIsSubmitting(false);
    setUploadedDocs([]);
    setUploadProgress({ current: 0, total: 0, uploading: false });
  }, []);

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };
  
  useEffect(() => {
      if (isOpen) {
          setEnableAIAnalysis(true); // Default to AI analysis enabled
      }
  }, [isOpen]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFiles(prev => [...prev, ...acceptedFiles]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'application/pdf': ['.pdf'], 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 
      'image/*': [],
      'application/xml': ['.xml'],
      'text/xml': ['.xml'],
    },
    multiple: true,
  });
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (files.length === 0) {
      toast({ variant: "destructive", title: 'Faltan datos', description: 'Por favor, suba al menos un archivo.' });
      return;
    }
    
    setIsSubmitting(true);
    
    // Upload all files without any manual associations
    const uploadedDocsTemp: Array<{ id: string; name: string }> = [];
    setUploadProgress({ current: 0, total: files.length, uploading: true });
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(prev => ({ ...prev, current: i + 1 }));
      
      const newDocData: Omit<AppDocument, 'id' | 'uploadedAt' | 'downloadURL'> = {
          name: file.name,
          type: 'Otro' as DocumentType, // Default type, AI will suggest better classification
      };

      const newDoc = await addDocument(newDocData, file);
      if (newDoc) {
          onDocumentUploaded?.(newDoc.id);
          // Add to AI analysis if enabled
          if (enableAIAnalysis) {
            uploadedDocsTemp.push({ id: newDoc.id, name: file.name });
          }
      }
    }
    
    setUploadProgress(prev => ({ ...prev, uploading: false }));
    
    toast({ 
      title: 'Documentos subidos', 
      description: `${files.length} archivo(s) subido(s) correctamente.` 
    });
    
    // If AI analysis is enabled and we have documents to analyze
    if (enableAIAnalysis && uploadedDocsTemp.length > 0) {
        setUploadedDocs(uploadedDocsTemp);
        setShowAIModal(true);
    } else {
        handleDialogChange(false);
    }

    setIsSubmitting(false);
  };
  
  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UploadCloud className="h-5 w-5 text-accent"/>Subir Nuevo Documento</DialogTitle>
            <DialogDescription>
              {isServiceResourceMode ? 'Seleccione un archivo para añadirlo como recurso descargable a este servicio.' : 'Arrastre un documento para subirlo y clasificarlo.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Dropzone - always visible to allow adding more files */}
            <div {...getRootProps()} className={`w-full ${files.length > 0 ? 'h-24' : 'h-40'} border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
              <input {...getInputProps()} />
              <UploadCloud className={`${files.length > 0 ? 'h-6 w-6' : 'h-10 w-10'} text-muted-foreground mb-2`} />
              <p className="text-sm text-muted-foreground">{isDragActive ? 'Suelte los archivos aquí...' : 'Arrastre archivos o haga clic para seleccionar'}</p>
              <p className="text-xs text-muted-foreground/80">PDF, DOCX, XML, JPG, PNG</p>
            </div>
            
            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="p-2 border rounded-md bg-secondary/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileIcon className="h-4 w-4 text-accent flex-shrink-0" />
                      <span className="truncate font-medium text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(index)} disabled={isSubmitting}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Upload progress */}
            {uploadProgress.uploading && (
              <div className="p-3 border rounded-md bg-blue-50 dark:bg-blue-950 flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <span className="text-sm">Subiendo {uploadProgress.current} de {uploadProgress.total}...</span>
              </div>
            )}
            
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button>
            </DialogClose>
            <Button 
              type="button" 
              variant="secondary"
              disabled={files.length === 0 || isSubmitting}
              onClick={() => { setEnableAIAnalysis(false); handleSubmit(); }}
            >
              {isSubmitting && !enableAIAnalysis ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
              Subir sin analizar
            </Button>
            <Button 
              type="button"
              disabled={files.length === 0 || isSubmitting}
              onClick={() => { setEnableAIAnalysis(true); handleSubmit(); }}
            >
              {isSubmitting && enableAIAnalysis ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
              Analizar con IA
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
      
      {/* AI Proposal Modal - supports multiple documents */}
      {uploadedDocs.length > 0 && (
        <AIProposalModal
          isOpen={showAIModal}
          onOpenChange={(open) => {
            setShowAIModal(open);
            if (!open) {
              handleDialogChange(false);
              setUploadedDocs([]);
            }
          }}
          documents={uploadedDocs}
          clients={clients}
          onProposalApplied={() => {
            handleDialogChange(false);
            setUploadedDocs([]);
          }}
        />
      )}
    </>
  );
}

