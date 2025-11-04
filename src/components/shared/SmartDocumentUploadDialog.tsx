
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
import { Loader2, UploadCloud, File, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useCRMData, type DocumentType, type Client } from '@/contexts/CRMDataContext';
import { useToast } from '@/hooks/use-toast';

const documentTypes: DocumentType[] = ["Contrato", "Factura", "Propuesta", "Informe", "Otro"];

interface SmartDocumentUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDocumentUploaded?: (docId: string) => void;
  onClientAdded?: (client: Client) => void;
  preselectedClientId?: string;
  preselectedServiceId?: string; 
}

export function SmartDocumentUploadDialog({
  isOpen,
  onOpenChange,
  onDocumentUploaded,
  onClientAdded,
  preselectedClientId,
  preselectedServiceId,
}: SmartDocumentUploadDialogProps) {
  const { clients, serviceWorkflows, addClient, addDocument } = useCRMData();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [associationType, setAssociationType] = useState<'client' | 'service' | 'none'>('client');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [documentType, setDocumentType] = useState<DocumentType | 'Otro' | 'Descargable'>('Otro');
  const [customDocumentType, setCustomDocumentType] = useState('');
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  
  // A new state to determine if we are in the simplified "service resource" upload mode.
  const isServiceResourceMode = !!preselectedServiceId;

  const resetState = useCallback(() => {
    setFile(null);
    setIsSubmitting(false);
    setAssociationType(preselectedServiceId ? 'service' : 'client');
    setSelectedClientId(preselectedClientId || '');
    setSelectedServiceId(preselectedServiceId || '');
    setDocumentType(preselectedServiceId ? 'Descargable' : 'Otro');
    setCustomDocumentType('');
    setIsNewClient(false);
    setNewClientName('');
  }, [preselectedClientId, preselectedServiceId]);

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };
  
  useEffect(() => {
      if (isOpen) {
          if (preselectedClientId) {
              setAssociationType('client');
              setSelectedClientId(preselectedClientId);
          } else if (preselectedServiceId) {
              setAssociationType('service');
              setSelectedServiceId(preselectedServiceId);
              setDocumentType('Descargable');
          } else {
              setAssociationType('client'); // Default
          }
      }
  }, [isOpen, preselectedClientId, preselectedServiceId]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const droppedFile = acceptedFiles[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'image/*': [] },
    maxFiles: 1,
  });
  
  const finalDocumentType = isServiceResourceMode ? 'Descargable' : (documentType === 'Otro' ? customDocumentType : documentType);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ variant: "destructive", title: 'Faltan datos', description: 'Por favor, suba un archivo.' });
      return;
    }
    if (!isServiceResourceMode && !finalDocumentType.trim()) {
      toast({ variant: "destructive", title: 'Faltan datos', description: 'Por favor, seleccione un tipo de documento.' });
      return;
    }
    
    let finalClientId: string | undefined = undefined;
    let finalServiceId: string | undefined = undefined;

    if (associationType === 'client' && !isServiceResourceMode) {
        if (!selectedClientId && !isNewClient) {
            toast({ variant: "destructive", title: 'Faltan datos', description: 'Por favor, asocie el documento a un cliente.' });
            return;
        }
        finalClientId = selectedClientId;
    } else if (associationType === 'service') {
        if (!selectedServiceId) {
            toast({ variant: "destructive", title: 'Faltan datos', description: 'Por favor, asocie el documento a un servicio.' });
            return;
        }
        finalServiceId = selectedServiceId;
    }

    setIsSubmitting(true);
    
    if (isNewClient && associationType === 'client' && !isServiceResourceMode) {
        if (!newClientName.trim()) {
             toast({ variant: "destructive", title: 'Faltan datos', description: 'Por favor, ingrese el nombre del nuevo cliente.' });
             setIsSubmitting(false);
             return;
        }
        const newClient = await addClient({
            name: newClientName.trim(),
            owner: '',
            category: 'General',
        });
        if (newClient) {
            finalClientId = newClient.id;
            onClientAdded?.(newClient);
        } else {
            toast({ variant: 'destructive', title: 'Error al crear cliente', description: 'No se pudo crear el nuevo cliente.' });
            setIsSubmitting(false);
            return;
        }
    }
    
    const newDocData: Omit<Document, 'id' | 'uploadedAt' | 'downloadURL'> = {
        name: file.name,
        type: finalDocumentType as DocumentType,
        clientId: finalClientId,
        serviceId: finalServiceId,
    };

    const newDoc = await addDocument(newDocData, file);
    if (newDoc) {
        toast({ title: 'Documento subido', description: `${file.name} ha sido subido correctamente.` });
        onDocumentUploaded?.(newDoc.id);
        handleDialogChange(false);
    } else {
        toast({ variant: 'destructive', title: 'Error al subir', description: 'No se pudo guardar el documento.' });
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


  return (
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
            {!file ? (
              <div {...getRootProps()} className={`w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                <input {...getInputProps()} />
                <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{isDragActive ? 'Suelte el archivo aquí...' : 'Arrastre un archivo o haga clic para seleccionar'}</p>
                <p className="text-xs text-muted-foreground/80">PDF, DOCX, JPG, PNG (Máx 1)</p>
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
            
            {file && !isServiceResourceMode && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <Label htmlFor="association-type">Asociar a</Label>
                  <Select value={associationType} onValueChange={(v) => setAssociationType(v as any)} required disabled={isSubmitting || !!preselectedClientId || !!preselectedServiceId}>
                      <SelectTrigger id="association-type">
                          <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="client">Cliente</SelectItem>
                          <SelectItem value="service">Servicio</SelectItem>
                      </SelectContent>
                  </Select>
                </div>

                {associationType === 'client' && (
                  <>
                    <div className="pl-4 border-l-2 ml-2">
                      <Label htmlFor="client-selector">Cliente</Label>
                      <Select value={selectedClientId} onValueChange={handleClientSelection} required disabled={isSubmitting || !!preselectedClientId}>
                        <SelectTrigger id="client-selector">
                          <SelectValue placeholder="Seleccione un cliente..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">-- Crear Nuevo Cliente --</SelectItem>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {isNewClient && (
                      <div className="pl-8 border-l-2 ml-2">
                        <Label htmlFor="new-client-name">Nombre del Nuevo Cliente</Label>
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
                  </>
                )}

                {associationType === 'service' && (
                  <div className="pl-4 border-l-2 ml-2">
                    <Label htmlFor="service-selector">Servicio</Label>
                    <Select value={selectedServiceId} onValueChange={setSelectedServiceId} required disabled={isSubmitting || !!preselectedServiceId}>
                      <SelectTrigger id="service-selector">
                        <SelectValue placeholder="Seleccione un servicio..." />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceWorkflows.map(service => (
                          <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
            <Button type="submit" disabled={!file || isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
              Subir y Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
