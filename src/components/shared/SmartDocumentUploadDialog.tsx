

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

  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [associationType, setAssociationType] = useState<'client' | 'service' | 'promoter' | 'supplier' | 'none'>('client');
  const [selectedId, setSelectedId] = useState<string>('');
  const [documentType, setDocumentType] = useState<DocumentType | 'Otro' | 'Descargable'>('Otro');
  const [customDocumentType, setCustomDocumentType] = useState('');
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  
  const isServiceResourceMode = !!preselectedServiceId;

  const resetState = useCallback(() => {
    setFile(null);
    setIsSubmitting(false);
    setAssociationType(preselectedServiceId ? 'service' : 'client');
    setSelectedId(preselectedClientId || preselectedServiceId || preselectedPromoterId || preselectedSupplierId || '');
    setDocumentType(preselectedServiceId ? 'Descargable' : 'Otro');
    setCustomDocumentType('');
    setIsNewClient(false);
    setNewClientName('');
  }, [preselectedClientId, preselectedServiceId, preselectedPromoterId, preselectedSupplierId]);

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
              setSelectedId(preselectedClientId);
          } else if (preselectedServiceId) {
              setAssociationType('service');
              setSelectedId(preselectedServiceId);
              setDocumentType('Descargable');
          } else if (preselectedPromoterId) {
              setAssociationType('promoter');
              setSelectedId(preselectedPromoterId);
          } else if (preselectedSupplierId) {
              setAssociationType('supplier');
              setSelectedId(preselectedSupplierId);
          } else {
              setAssociationType('client'); // Default
          }
      }
  }, [isOpen, preselectedClientId, preselectedServiceId, preselectedPromoterId, preselectedSupplierId]);

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
    let finalPromoterId: string | undefined = undefined;
    let finalSupplierId: string | undefined = undefined;

    if (associationType === 'client' && !isServiceResourceMode) {
        if (!selectedId && !isNewClient) {
            toast({ variant: "destructive", title: 'Faltan datos', description: 'Por favor, asocie el documento a un cliente.' });
            return;
        }
        finalClientId = selectedId;
    } else if (associationType === 'service') {
        if (!selectedId) {
            toast({ variant: "destructive", title: 'Faltan datos', description: 'Por favor, asocie el documento a un servicio.' });
            return;
        }
        finalServiceId = selectedId;
    } else if (associationType === 'promoter') {
        if (!selectedId) {
             toast({ variant: "destructive", title: 'Faltan datos', description: 'Por favor, asocie el documento a un promotor.' });
            return;
        }
        finalPromoterId = selectedId;
    } else if (associationType === 'supplier') {
         if (!selectedId) {
             toast({ variant: "destructive", title: 'Faltan datos', description: 'Por favor, asocie el documento a un proveedor.' });
            return;
        }
        finalSupplierId = selectedId;
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
            status: 'Activo',
            subscribedServiceIds: [],
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
        promoterId: finalPromoterId,
        supplierId: finalSupplierId,
    };

    const newDoc = await addDocument(newDocData, file);
    if (newDoc) {
        toast({ title: 'Documento subido', description: `${file.name} ha sido subido correctamente.` });
        onDocumentUploaded?.(newDoc.id);
        handleDialogChange(false);
    } else {
        // Error toast is handled inside addDocument
    }

    setIsSubmitting(false);
  };
  
  const handleClientSelection = (value: string) => {
      if (value === 'new') {
          setIsNewClient(true);
          setSelectedId('new');
      } else {
          setIsNewClient(false);
          setSelectedId(value);
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
                  <Select value={associationType} onValueChange={(v) => setAssociationType(v as any)} required disabled={isSubmitting}>
                      <SelectTrigger id="association-type">
                          <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="client">Cliente</SelectItem>
                          <SelectItem value="service">Servicio</SelectItem>
                          <SelectItem value="promoter">Promotor</SelectItem>
                          <SelectItem value="supplier">Proveedor</SelectItem>
                      </SelectContent>
                  </Select>
                </div>

                <div className="pl-4 border-l-2 ml-2">
                  <Label htmlFor="entity-selector">Seleccionar Entidad</Label>
                  {associationType === 'client' && (
                    <>
                      <Select value={selectedId} onValueChange={handleClientSelection} required disabled={isSubmitting}>
                        <SelectTrigger id="entity-selector"><SelectValue placeholder="Seleccione un cliente..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">-- Crear Nuevo Cliente --</SelectItem>
                          {clients.filter(c => c.status !== 'Archivado').map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {isNewClient && (
                        <div className="pt-2">
                            <Label htmlFor="new-client-name" className="text-xs">Nombre del Nuevo Cliente</Label>
                            <Input id="new-client-name" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="Ej. Acme Corp." required disabled={isSubmitting} className="mt-1"/>
                        </div>
                      )}
                    </>
                  )}
                  {associationType === 'service' && (
                    <Select value={selectedId} onValueChange={setSelectedId} required disabled={isSubmitting}>
                      <SelectTrigger id="entity-selector"><SelectValue placeholder="Seleccione un servicio..." /></SelectTrigger>
                      <SelectContent>{serviceWorkflows.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                  {associationType === 'promoter' && (
                    <Select value={selectedId} onValueChange={setSelectedId} required disabled={isSubmitting}>
                      <SelectTrigger id="entity-selector"><SelectValue placeholder="Seleccione un promotor..." /></SelectTrigger>
                      <SelectContent>{promoters.filter(p => p.status !== 'Archivado').map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                  {associationType === 'supplier' && (
                    <Select value={selectedId} onValueChange={setSelectedId} required disabled={isSubmitting}>
                      <SelectTrigger id="entity-selector"><SelectValue placeholder="Seleccione un proveedor..." /></SelectTrigger>
                      <SelectContent>{suppliers.filter(s => s.status !== 'Archivado').map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                </div>
                
                <div>
                    <Label htmlFor="doc-type-selector">Tipo de Documento</Label>
                    <Select value={documentType} onValueChange={(value) => setDocumentType(value as DocumentType | 'Otro')} required disabled={isSubmitting}>
                        <SelectTrigger id="doc-type-selector"><SelectValue placeholder="Seleccione un tipo"/></SelectTrigger>
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
