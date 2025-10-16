
"use client";

import React, { useState, useCallback, useMemo, type ChangeEvent } from 'react';
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
import { Loader2, UploadCloud, File, AlertTriangle, Wand2, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useCRMData, type DocumentType, type Client } from '@/contexts/CRMDataContext';
import { useGlobalNotification } from '@/contexts/NotificationContext';

const documentTypes: DocumentType[] = ["Contrato", "Factura", "Propuesta", "Informe", "Otro"];

interface SmartDocumentUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentUploaded?: (docId: string) => void;
  onClientAdded?: (client: Client) => void;
  preselectedClientId?: string;
  preselectedClientName?: string;
}

export function SmartDocumentUploadDialog({
  isOpen,
  onOpenChange,
  onDocumentUploaded,
  onClientAdded,
  preselectedClientId,
  preselectedClientName,
}: SmartDocumentUploadDialogProps) {
  const { clients, addClient, addDocument } = useCRMData();
  const { showNotification } = useGlobalNotification();

  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ clientName?: string; documentType?: DocumentType; rawText?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [documentType, setDocumentType] = useState<DocumentType | 'Otro'>('Otro');
  const [customDocumentType, setCustomDocumentType] = useState('');
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');


  const resetState = useCallback(() => {
    setFile(null);
    setIsAnalyzing(false);
    setAnalysisResult({});
    setIsSubmitting(false);
    setSelectedClientId(preselectedClientId || '');
    setDocumentType('Otro');
    setCustomDocumentType('');
    setIsNewClient(false);
    setNewClientName('');
  }, [preselectedClientId]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };
  
  useEffect(() => {
      if (isOpen && preselectedClientId) {
          setSelectedClientId(preselectedClientId);
      }
  }, [isOpen, preselectedClientId]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const droppedFile = acceptedFiles[0];
    if (droppedFile) {
      setFile(droppedFile);
      setIsAnalyzing(true);
      setAnalysisResult({}); // Reset previous results

      // Simulate AI analysis
      setTimeout(() => {
        // Mock analysis result
        const mockResult = {
          clientName: 'Innovate Inc.',
          documentType: 'Propuesta' as DocumentType,
          rawText: 'This is a mock analysis of the document content...'
        };
        
        setAnalysisResult(mockResult);

        // Auto-select client if found
        const foundClient = clients.find(c => c.name.toLowerCase() === mockResult.clientName?.toLowerCase());
        if (foundClient) {
          setSelectedClientId(foundClient.id);
          setIsNewClient(false);
        } else {
            setSelectedClientId('new');
            setIsNewClient(true);
            setNewClientName(mockResult.clientName || '');
        }

        // Auto-select document type
        if (mockResult.documentType && documentTypes.includes(mockResult.documentType)) {
          setDocumentType(mockResult.documentType);
        } else {
            setDocumentType('Otro');
            setCustomDocumentType(mockResult.documentType || '');
        }

        setIsAnalyzing(false);
      }, 1500);
    }
  }, [clients]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
  });
  
  const finalDocumentType = documentType === 'Otro' ? customDocumentType : documentType;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || (!selectedClientId && !isNewClient) || (isNewClient && !newClientName.trim()) || !finalDocumentType.trim()) {
      showNotification('error', 'Faltan datos', 'Por favor, complete todos los campos requeridos.');
      return;
    }

    setIsSubmitting(true);
    let finalClientId = selectedClientId;
    
    if (isNewClient) {
        const newClient = await addClient({
            name: newClientName.trim(),
            owner: 'Auto-Asignado (IA)',
            category: 'General',
            // Omit other fields, they can be filled later
        });
        if (newClient && typeof newClient !== 'boolean') {
            finalClientId = newClient.id;
            onClientAdded?.(newClient);
        } else {
            showNotification('error', 'Error al crear usuario', 'No se pudo crear el nuevo usuario.');
            setIsSubmitting(false);
            return;
        }
    }
    
    if (finalClientId) {
        const newDoc = await addDocument({
            name: file.name,
            type: finalDocumentType as DocumentType,
            clientId: finalClientId,
            // uploadDate will be handled by the context/backend
        }, file);
        if (newDoc) {
            onDocumentUploaded?.(newDoc.id);
            handleOpenChange(false);
        }
    }

    setIsSubmitting(false);
  };
  
  const handleClientSelection = (value: string) => {
      if (value === 'new') {
          setIsNewClient(true);
          setSelectedClientId('new');
      } else {
          setIsNewClient(false);
          setSelectedClientId(value);
      }
  };

  const hasAnalysis = Object.keys(analysisResult).length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-accent"/>Subida Inteligente de Documentos</DialogTitle>
            <DialogDescription>
              Arrastre un documento PDF o DOCX. La IA intentará analizarlo para pre-rellenar los campos.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {!file ? (
              <div {...getRootProps()} className={`w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                <input {...getInputProps()} />
                <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{isDragActive ? 'Suelte el archivo aquí...' : 'Arrastre un archivo o haga clic para seleccionar'}</p>
                <p className="text-xs text-muted-foreground/80">PDF, DOCX (Máx 1)</p>
              </div>
            ) : (
              <div className="p-3 border rounded-md bg-secondary/50 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <File className="h-5 w-5 text-accent flex-shrink-0" />
                  <span className="truncate font-medium text-sm">{file.name}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFile(null)}><X className="h-4 w-4" /></Button>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analizando documento...
              </div>
            )}
            
            {hasAnalysis && (
                <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md text-xs text-green-800 dark:text-green-300">
                    <p className="font-semibold">Análisis de IA completado. Por favor, verifique los datos sugeridos.</p>
                </div>
            )}

            {file && !isAnalyzing && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <Label htmlFor="client-selector">Asociar a Usuario</Label>
                  <Select value={selectedClientId} onValueChange={handleClientSelection} required disabled={isSubmitting}>
                    <SelectTrigger id="client-selector">
                      <SelectValue placeholder="Seleccione un usuario..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">-- Crear Nuevo Usuario --</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isNewClient && (
                  <div className="pl-4 border-l-2 ml-2">
                    <Label htmlFor="new-client-name">Nombre del Nuevo Usuario</Label>
                    <Input
                      id="new-client-name"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Ej. Acme Corp."
                      required
                      disabled={isSubmitting}
                      className="mt-1"
                    />
                  </div>
                )}
                
                <div>
                    <Label htmlFor="doc-type-selector">Tipo de Documento</Label>
                    <Select value={documentType} onValueChange={(value) => setDocumentType(value as DocumentType | 'Otro')} required disabled={isSubmitting}>
                        <SelectTrigger id="doc-type-selector">
                            <SelectValue placeholder="Seleccione un tipo"/>
                        </SelectTrigger>
                        <SelectContent>
                            {documentTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                {documentType === 'Otro' && (
                    <div className="pl-4 border-l-2 ml-2">
                        <Label htmlFor="custom-doc-type">Especifique el Tipo de Documento</Label>
                        <Input
                            id="custom-doc-type"
                            value={customDocumentType}
                            onChange={(e) => setCustomDocumentType(e.target.value)}
                            placeholder="Ej. Acuerdo de Confidencialidad"
                            required
                            disabled={isSubmitting}
                            className="mt-1"
                        />
                    </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={!file || isAnalyzing || isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
              Subir y Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

