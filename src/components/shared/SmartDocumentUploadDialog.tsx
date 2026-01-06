
"use client";

import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import { Loader2, UploadCloud, File as FileIcon, X, Sparkles, CheckCircle2, CreditCard, FileSpreadsheet } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useCRMData } from '@/contexts/CRMDataContext';
import { useToast } from '@/hooks/use-toast';
import type { Client, Document as AppDocument, DocumentType, RevenueDistribution, TPVReport, TPVConfig, TPVReportFormat } from '@/lib/types';
import { TPV_CONFIG_DEFAULTS } from '@/lib/types';
import { AIProposalModal } from './AIProposalModal';
import { Checkbox } from '@/components/ui/checkbox';
import { detectBillpocketCSV, processTPVReport, type ProcessingConfig, type PromoterInfo, getEffectiveTPVConfig } from '@/lib/tpvProcessor';
import { TPVReportView } from '../tpv/TPVReportView';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useStorage } from '@/firebase';

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
  const { clients, serviceWorkflows, promoters, suppliers, addClient, addDocument, addTPVReport, updateClient, currentUser } = useCRMData();
  const storage = useStorage();
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
  
  // TPV Processing state
  const [detectedTPVFile, setDetectedTPVFile] = useState<{ file: File; content: string } | null>(null);
  const [tpvProcessingStep, setTpvProcessingStep] = useState<'none' | 'config' | 'preview'>('none');
  const [tpvClientId, setTpvClientId] = useState<string>(preselectedClientId || '');
  const [tpvServiceId, setTpvServiceId] = useState<string>('');
  const [tpvCommissionRate, setTpvCommissionRate] = useState<number>(10);
  const [saveCommissionToClient, setSaveCommissionToClient] = useState<boolean>(false);
  const [commissionSource, setCommissionSource] = useState<'client' | 'service' | 'manual'>('manual');
  const [processedTPVReport, setProcessedTPVReport] = useState<Omit<TPVReport, 'id' | 'createdAt' | 'processedAt'> | null>(null);
  const [isProcessingTPV, setIsProcessingTPV] = useState(false);
  
  // New client creation state
  const [isCreatingNewClient, setIsCreatingNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState<string>('');
  const [newClientTPVFormat, setNewClientTPVFormat] = useState<TPVReportFormat>('formato2');
  
  const isServiceResourceMode = !!preselectedServiceId;
  
  // Get active clients and terminal services
  const activeClients = useMemo(() => clients.filter(c => c.status === 'Activo'), [clients]);
  const terminalServices = useMemo(() => {
    return serviceWorkflows.filter(s => 
      s.status !== 'Archivado' && (
        s.name.toLowerCase().includes('terminal') || 
        s.name.toLowerCase().includes('tpv') ||
        s.name.toLowerCase().includes('billpocket') ||
        (s.linkedSupplierIds?.length ?? 0) > 0
      )
    );
  }, [serviceWorkflows]);
  
  const allActiveServices = useMemo(() => 
    serviceWorkflows.filter(s => s.status !== 'Archivado'), 
  [serviceWorkflows]);
  
  // Get commission rate based on client custom > service default > 10%
  const getCommissionRate = useCallback((clientId: string, serviceId: string): { rate: number; source: 'client' | 'service' | 'manual' } => {
    const client = clients.find(c => c.id === clientId);
    const service = serviceWorkflows.find(s => s.id === serviceId);
    
    // Check client custom commission first
    if (client?.customCommissions) {
      const customComm = client.customCommissions.find(cc => cc.serviceId === serviceId);
      if (customComm) {
        return { rate: customComm.rate, source: 'client' };
      }
    }
    
    // Check service default commission
    if (service?.defaultCommissionRate !== undefined) {
      return { rate: service.defaultCommissionRate, source: 'service' };
    }
    
    // Default fallback
    return { rate: 10, source: 'manual' };
  }, [clients, serviceWorkflows]);
  
  // Update commission rate when client or service changes
  useEffect(() => {
    if (tpvClientId && tpvServiceId) {
      const { rate, source } = getCommissionRate(tpvClientId, tpvServiceId);
      setTpvCommissionRate(rate);
      setCommissionSource(source);
      // If client doesn't have custom commission, suggest saving it
      setSaveCommissionToClient(source !== 'client');
    }
  }, [tpvClientId, tpvServiceId, getCommissionRate]);

  const resetState = useCallback(() => {
    setFiles([]);
    setIsSubmitting(false);
    setUploadedDocs([]);
    setUploadProgress({ current: 0, total: 0, uploading: false });
    setDetectedTPVFile(null);
    setTpvProcessingStep('none');
    setTpvClientId(preselectedClientId || '');
    setTpvServiceId('');
    setTpvCommissionRate(10);
    setSaveCommissionToClient(false);
    setCommissionSource('manual');
    setProcessedTPVReport(null);
    setIsProcessingTPV(false);
    setIsCreatingNewClient(false);
    setNewClientName('');
  }, [preselectedClientId]);

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
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    multiple: true,
  });
  
  // Helper to extract client name from Billpocket filename
  const extractClientFromFilename = useCallback((filename: string): string | null => {
    // Pattern: "Billpocket <ClientName>.csv" or "<ClientName> Billpocket.csv"
    const lower = filename.toLowerCase();
    let clientName = filename.replace(/\.csv$/i, '');
    
    // Remove "Billpocket" prefix/suffix and clean up
    clientName = clientName.replace(/^billpocket\s*/i, '').replace(/\s*billpocket$/i, '').trim();
    
    return clientName || null;
  }, []);

  // Helper to find matching client (fuzzy) - returns best match with score
  const findMatchingClient = useCallback((searchName: string): Client | null => {
    if (!searchName) return null;
    const searchLower = searchName.toLowerCase().trim();
    const searchWords = searchLower.split(/\s+/).filter(w => w.length > 2);
    
    // Score each client
    const scored = activeClients.map(client => {
      const clientLower = client.name.toLowerCase();
      const clientWords = clientLower.split(/\s+/);
      let score = 0;
      
      // Exact match = 100
      if (clientLower === searchLower) {
        score = 100;
      }
      // Contains full search = 50
      else if (clientLower.includes(searchLower) || searchLower.includes(clientLower)) {
        score = 50;
      }
      // Word matches
      else {
        for (const sw of searchWords) {
          for (const cw of clientWords) {
            // Exact word match
            if (cw === sw) {
              score += 20;
            }
            // Word starts with search word (e.g., "monkey" matches "monkeys")
            else if (cw.startsWith(sw) || sw.startsWith(cw)) {
              score += 15;
            }
            // Partial word match
            else if (cw.includes(sw) || sw.includes(cw)) {
              score += 10;
            }
          }
        }
      }
      
      return { client, score };
    });
    
    // Find best match with score > 0
    const best = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score)[0];
    return best?.client || null;
  }, [activeClients]);

  // Check for TPV CSV when files change
  useEffect(() => {
    const checkForTPV = async () => {
      for (const file of files) {
        if (file.name.toLowerCase().endsWith('.csv')) {
          const content = await file.text();
          if (detectBillpocketCSV(content)) {
            setDetectedTPVFile({ file, content });
            setTpvProcessingStep('config');
            
            // Auto-detect client from filename
            const extractedName = extractClientFromFilename(file.name);
            if (extractedName) {
              const matchedClient = findMatchingClient(extractedName);
              if (matchedClient) {
                setTpvClientId(matchedClient.id);
                toast({
                  title: '📊 Reporte TPV detectado',
                  description: `Cliente "${matchedClient.name}" detectado automáticamente.`,
                });
              } else {
                // Suggest creating new client with extracted name
                setNewClientName(extractedName);
                setIsCreatingNewClient(true);
                toast({
                  title: '📊 Reporte TPV detectado',
                  description: `Cliente "${extractedName}" no encontrado. Se creará automáticamente.`,
                });
              }
            } else {
              toast({
                title: '📊 Reporte TPV detectado',
                description: 'Seleccione el cliente para procesar.',
              });
            }
            
            // Auto-select Terminales service
            if (terminalServices.length > 0) {
              setTpvServiceId(terminalServices[0].id);
            }
            
            return;
          }
        }
      }
    };
    if (files.length > 0) {
      checkForTPV();
    }
  }, [files, toast, extractClientFromFilename, findMatchingClient, terminalServices]);
  
  // Process TPV Report
  const handleProcessTPV = async () => {
    if (!detectedTPVFile || !tpvServiceId || !currentUser || !storage) return;
    if (!tpvClientId && !newClientName.trim()) return;
    
    setIsProcessingTPV(true);
    try {
      let client = clients.find(c => c.id === tpvClientId);
      const service = serviceWorkflows.find(s => s.id === tpvServiceId);
      if (!service) throw new Error('Servicio no encontrado');
      
      // Create new client if needed
      if (isCreatingNewClient && newClientName.trim()) {
        const newClient = await addClient({
          name: newClientName.trim(),
          status: 'Activo',
          owner: currentUser.displayName || currentUser.email || '',
          category: 'TPV',
          subscribedServiceIds: [tpvServiceId],
          customCommissions: saveCommissionToClient ? [{ serviceId: tpvServiceId, commissionId: 'tpv-rate', rate: tpvCommissionRate }] : [],
          // Auto-configure TPV with selected format
          tpvConfig: TPV_CONFIG_DEFAULTS[newClientTPVFormat],
        });
        if (!newClient) throw new Error('Error al crear el cliente');
        client = newClient;
        setTpvClientId(newClient.id);
        toast({ title: '✅ Cliente creado', description: `Cliente "${newClientName}" creado con formato ${newClientTPVFormat === 'formato1' ? '1' : '2'}.` });
      }
      
      if (!client) throw new Error('Cliente no encontrado');
      
      const supplier = service.primarySupplierId ? suppliers.find(s => s.id === service.primarySupplierId) : null;
      const revenueDistribution: RevenueDistribution = service.revenueDistribution || {
        supplierPercentage: 0,
        witbizPercentage: 100,
        witbizDistribution: []
      };
      
      // Get effective TPV config (client > service > default)
      const effectiveTPVConfig = getEffectiveTPVConfig(
        client.tpvConfig,
        service.tpvConfig,
        'formato2'
      );
      
      // Get promoter info for commission calculation
      const promoterInfoList: PromoterInfo[] = [];
      if (client.promoters && client.promoters.length > 0) {
        for (const ref of client.promoters) {
          const promoter = promoters.find(p => p.id === ref.promoterId);
          if (promoter) {
            promoterInfoList.push({
              promoterId: promoter.id,
              promoterName: promoter.name,
              percentage: ref.percentage,
            });
          }
        }
      }
      
      const config: ProcessingConfig = {
        clientId: client.id,
        clientName: client.name,
        serviceId: service.id,
        serviceName: service.name,
        supplierId: supplier?.id,
        supplierName: supplier?.name,
        revenueDistribution,
        witbizCommissionRate: tpvCommissionRate,
        tpvConfig: effectiveTPVConfig,
        promoters: promoterInfoList.length > 0 ? promoterInfoList : undefined,
      };
      
      // Upload original file
      const fileRef = ref(storage, `tpv-reports/${client.id}/${Date.now()}_${detectedTPVFile.file.name}`);
      await uploadBytes(fileRef, detectedTPVFile.file);
      const originalFileURL = await getDownloadURL(fileRef);
      
      // Process
      const report = processTPVReport(
        detectedTPVFile.content,
        config,
        detectedTPVFile.file.name,
        originalFileURL,
        currentUser.displayName || currentUser.email || 'Sistema'
      );
      
      setProcessedTPVReport(report);
      setTpvProcessingStep('preview');
      
      toast({
        title: '✅ Reporte procesado',
        description: `${report.summary.totalTransactions} transacciones. Total: $${report.summary.totalAmount.toLocaleString()}`,
      });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsProcessingTPV(false);
    }
  };
  
  // Save TPV Report
  const handleSaveTPVReport = async () => {
    if (!processedTPVReport) return;
    setIsProcessingTPV(true);
    try {
      // Save commission to client if checkbox is checked
      if (saveCommissionToClient && tpvClientId && tpvServiceId) {
        const client = clients.find(c => c.id === tpvClientId);
        if (client) {
          const existingCommissions = client.customCommissions || [];
          const filteredCommissions = existingCommissions.filter(cc => cc.serviceId !== tpvServiceId);
          const newCommission = { serviceId: tpvServiceId, commissionId: 'tpv-rate', rate: tpvCommissionRate };
          await updateClient(tpvClientId, { 
            customCommissions: [...filteredCommissions, newCommission] 
          });
          toast({ title: '✅ Comisión guardada', description: `Comisión de ${tpvCommissionRate}% guardada para este cliente.` });
        }
      }
      
      await addTPVReport(processedTPVReport);
      toast({ title: '💾 Guardado', description: 'Reporte TPV guardado exitosamente.' });
      handleDialogChange(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsProcessingTPV(false);
    }
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (withAIAnalysis: boolean = false) => {
    if (files.length === 0) {
      toast({ variant: "destructive", title: 'Faltan datos', description: 'Por favor, suba al menos un archivo.' });
      return;
    }
    
    setIsSubmitting(true);
    setEnableAIAnalysis(withAIAnalysis);
    
    // Upload all files without any manual associations
    const uploadedDocsTemp: Array<{ id: string; name: string }> = [];
    setUploadProgress({ current: 0, total: files.length, uploading: true });
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(prev => ({ ...prev, current: i + 1 }));
      
      const newDocData: Omit<AppDocument, 'id' | 'uploadedAt' | 'downloadURL'> = {
          name: file.name,
          type: isServiceResourceMode ? 'Descargable' as DocumentType : 'Otro' as DocumentType,
          ...(preselectedServiceId && { serviceId: preselectedServiceId }),
          ...(preselectedClientId && { clientId: preselectedClientId }),
          ...(preselectedPromoterId && { promoterId: preselectedPromoterId }),
          ...(preselectedSupplierId && { supplierId: preselectedSupplierId }),
      };

      const newDoc = await addDocument(newDocData, file);
      if (newDoc) {
          onDocumentUploaded?.(newDoc.id);
          // Add to AI analysis only if withAIAnalysis is true
          if (withAIAnalysis) {
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
    if (withAIAnalysis && uploadedDocsTemp.length > 0) {
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
      <DialogContent className={tpvProcessingStep === 'preview' ? "sm:max-w-5xl max-h-[90vh] overflow-y-auto" : "sm:max-w-xl w-[95vw] max-w-[95vw]"}>
        
        {/* TPV Preview Mode */}
        {tpvProcessingStep === 'preview' && processedTPVReport ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary"/>
                Reporte TPV Procesado
              </DialogTitle>
              <DialogDescription>
                Revisa los resultados y guarda el reporte.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[60vh] overflow-y-auto">
              <TPVReportView 
                report={{ ...processedTPVReport, id: 'preview', createdAt: new Date(), processedAt: new Date() } as TPVReport} 
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setTpvProcessingStep('config')}>
                Modificar
              </Button>
              <Button onClick={handleSaveTPVReport} disabled={isProcessingTPV}>
                {isProcessingTPV ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle2 className="mr-2 h-4 w-4"/>}
                Guardar Reporte
              </Button>
            </DialogFooter>
          </>
        ) : tpvProcessingStep === 'config' && detectedTPVFile ? (
          /* TPV Config Mode */
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary"/>
                Configurar Reporte TPV
              </DialogTitle>
              <DialogDescription>
                Se detectó un archivo de Billpocket. Configura el procesamiento.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="p-3 border rounded-md bg-green-50 dark:bg-green-950 flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-sm">{detectedTPVFile.file.name}</p>
                  <p className="text-xs text-muted-foreground">Reporte de Billpocket detectado automáticamente</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Cliente</Label>
                {isCreatingNewClient ? (
                  <div className="space-y-3">
                    <Input
                      placeholder="Nombre del nuevo cliente..."
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      autoFocus
                    />
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Formato de Reporte</Label>
                      <Select value={newClientTPVFormat} onValueChange={(v) => setNewClientTPVFormat(v as TPVReportFormat)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="formato1">Formato 1 - Comisiones Separadas</SelectItem>
                          <SelectItem value="formato2">Formato 2 - Comisión Única (recomendado)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => { setIsCreatingNewClient(false); setNewClientName(''); }}
                    >
                      ← Seleccionar cliente existente
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Select value={tpvClientId} onValueChange={setTpvClientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente..." />
                      </SelectTrigger>
                      <SelectContent>
                        {activeClients.map(client => (
                          <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => { setIsCreatingNewClient(true); setTpvClientId(''); }}
                    >
                      + Crear nuevo cliente
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Servicio</Label>
                <Select value={tpvServiceId} onValueChange={setTpvServiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar servicio..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(terminalServices.length > 0 ? terminalServices : allActiveServices).map(service => (
                      <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* TPV Configuration Display */}
              {tpvClientId && tpvServiceId && (() => {
                const selectedClient = clients.find(c => c.id === tpvClientId);
                const selectedService = serviceWorkflows.find(s => s.id === tpvServiceId);
                const config = getEffectiveTPVConfig(selectedClient?.tpvConfig, selectedService?.tpvConfig, 'formato2');
                const hasClientConfig = !!selectedClient?.tpvConfig;
                return (
                  <div className="p-3 border rounded-md bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Configuración TPV</Label>
                      <span className={`text-xs px-2 py-0.5 rounded ${config.reportFormat === 'formato1' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {config.reportFormat === 'formato1' ? 'F1 - Separadas' : 'F2 - Única'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">BP Nacional:</span>
                        <span className="ml-1 font-medium">{config.billpocketNacional}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">BP Int:</span>
                        <span className="ml-1 font-medium">{config.billpocketInternacional}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">WitBiz:</span>
                        <span className="ml-1 font-medium">{config.witbizComision}%</span>
                      </div>
                    </div>
                    <p className={`text-xs ${hasClientConfig ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {hasClientConfig ? '✓ Configuración personalizada del cliente' : 'Usando configuración del servicio'}
                    </p>
                  </div>
                );
              })()}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setDetectedTPVFile(null); setTpvProcessingStep('none'); setIsCreatingNewClient(false); setNewClientName(''); }}>
                Cancelar
              </Button>
              <Button 
                onClick={handleProcessTPV} 
                disabled={(!tpvClientId && !newClientName.trim()) || !tpvServiceId || isProcessingTPV}
              >
                {isProcessingTPV ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CreditCard className="mr-2 h-4 w-4"/>}
                {isCreatingNewClient ? 'Crear Cliente y Procesar' : 'Procesar Reporte'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* Normal Upload Mode */
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(enableAIAnalysis); }} className="overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><UploadCloud className="h-5 w-5 text-accent"/>Subir Nuevo Documento</DialogTitle>
              <DialogDescription>
                {isServiceResourceMode ? 'Seleccione un archivo para añadirlo como recurso descargable a este servicio.' : 'Arrastre un documento o CSV de Billpocket para procesarlo automáticamente.'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {/* Dropzone - always visible to allow adding more files */}
              <div {...getRootProps()} className={`w-full ${files.length > 0 ? 'h-24' : 'h-40'} border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                <input {...getInputProps()} />
                <UploadCloud className={`${files.length > 0 ? 'h-6 w-6' : 'h-10 w-10'} text-muted-foreground mb-2`} />
                <p className="text-sm text-muted-foreground">{isDragActive ? 'Suelte los archivos aquí...' : 'Arrastre archivos o haga clic para seleccionar'}</p>
                <p className="text-xs text-muted-foreground/80">PDF, DOCX, XML, JPG, PNG, CSV</p>
              </div>
              
              {/* File list */}
              {files.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="p-2 border rounded-md bg-secondary/50 flex items-center gap-2">
                      <FileIcon className="h-4 w-4 text-accent shrink-0" />
                      <div className="flex-1" style={{ minWidth: 0, maxWidth: 'calc(100% - 3rem)' }}>
                        <p className="font-medium text-sm overflow-hidden text-ellipsis whitespace-nowrap" title={file.name}>{file.name}</p>
                        <p className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeFile(index)} disabled={isSubmitting}>
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
                onClick={() => handleSubmit(false)}
              >
                {isSubmitting && !enableAIAnalysis ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                Subir sin analizar
              </Button>
              <Button 
                type="button"
                disabled={files.length === 0 || isSubmitting}
                onClick={() => handleSubmit(true)}
              >
                {isSubmitting && enableAIAnalysis ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                Analizar con IA
              </Button>
            </DialogFooter>
          </form>
        )}
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

