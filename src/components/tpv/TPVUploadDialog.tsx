"use client";

import React, { useState, useCallback, useMemo } from 'react';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UploadCloud, FileSpreadsheet, X, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useCRMData } from '@/contexts/CRMDataContext';
import { useToast } from '@/hooks/use-toast';
import { 
  detectBillpocketCSV, 
  processTPVReport,
  type ProcessingConfig 
} from '@/lib/tpvProcessor';
import { TPVReportView } from './TPVReportView';
import type { TPVReport, Client, ServiceWorkflow, RevenueDistribution } from '@/lib/types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useStorage } from '@/firebase';

interface TPVUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  preselectedClientId?: string;
  onReportProcessed?: (report: TPVReport) => void;
}

export function TPVUploadDialog({
  isOpen,
  onOpenChange,
  preselectedClientId,
  onReportProcessed,
}: TPVUploadDialogProps) {
  const { 
    clients, 
    serviceWorkflows, 
    suppliers,
    currentUser,
    addTPVReport 
  } = useCRMData();
  const storage = useStorage();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [isValidCSV, setIsValidCSV] = useState<boolean | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>(preselectedClientId || '');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [witbizCommissionRate, setWitbizCommissionRate] = useState<number>(7);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedReport, setProcessedReport] = useState<Omit<TPVReport, 'id' | 'createdAt' | 'processedAt'> | null>(null);
  const [step, setStep] = useState<'upload' | 'config' | 'preview'>('upload');

  // Filter clients with TPV/Terminal services
  const clientsWithTPV = useMemo(() => {
    return clients.filter(c => c.status === 'Activo');
  }, [clients]);

  // Get terminal-related services
  const terminalServices = useMemo(() => {
    return serviceWorkflows.filter(s => 
      s.name.toLowerCase().includes('terminal') || 
      s.name.toLowerCase().includes('tpv') ||
      s.name.toLowerCase().includes('billpocket') ||
      (s.linkedSupplierIds?.length ?? 0) > 0
    );
  }, [serviceWorkflows]);

  // Get selected client and service
  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedService = serviceWorkflows.find(s => s.id === selectedServiceId);

  const resetState = useCallback(() => {
    setFile(null);
    setCsvContent('');
    setIsValidCSV(null);
    setSelectedClientId(preselectedClientId || '');
    setSelectedServiceId('');
    setWitbizCommissionRate(7);
    setIsProcessing(false);
    setProcessedReport(null);
    setStep('upload');
  }, [preselectedClientId]);

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const uploadedFile = acceptedFiles[0];
      setFile(uploadedFile);
      
      // Read and validate CSV
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvContent(content);
        const isValid = detectBillpocketCSV(content);
        setIsValidCSV(isValid);
        
        if (isValid) {
          toast({
            title: 'Archivo detectado',
            description: 'Se ha detectado un reporte de Billpocket válido.',
          });
          setStep('config');
        } else {
          toast({
            variant: 'destructive',
            title: 'Formato no reconocido',
            description: 'El archivo no parece ser un reporte de Billpocket. Verifique el formato.',
          });
        }
      };
      reader.readAsText(uploadedFile);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    multiple: false,
  });

  const handleProcess = async () => {
    if (!file || !csvContent || !selectedClientId || !selectedServiceId || !currentUser) {
      toast({
        variant: 'destructive',
        title: 'Faltan datos',
        description: 'Seleccione cliente y servicio antes de procesar.',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const client = clients.find(c => c.id === selectedClientId);
      const service = serviceWorkflows.find(s => s.id === selectedServiceId);
      
      if (!client || !service) {
        throw new Error('Cliente o servicio no encontrado');
      }

      // Get supplier info if available
      const supplierId = service.primarySupplierId;
      const supplier = supplierId ? suppliers.find(s => s.id === supplierId) : null;

      // Get revenue distribution from service or use defaults
      const revenueDistribution: RevenueDistribution = service.revenueDistribution || {
        supplierPercentage: 0,
        witbizPercentage: 100,
        witbizDistribution: []
      };

      const config: ProcessingConfig = {
        clientId: client.id,
        clientName: client.name,
        serviceId: service.id,
        serviceName: service.name,
        supplierId: supplier?.id,
        supplierName: supplier?.name,
        revenueDistribution,
        witbizCommissionRate,
      };

      // Upload original file to storage
      const fileRef = ref(storage, `tpv-reports/${client.id}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const originalFileURL = await getDownloadURL(fileRef);

      // Process the report
      const report = processTPVReport(
        csvContent,
        config,
        file.name,
        originalFileURL,
        currentUser.displayName || currentUser.email || 'Sistema'
      );

      setProcessedReport(report);
      setStep('preview');

      toast({
        title: 'Reporte procesado',
        description: `${report.summary.totalTransactions} transacciones procesadas correctamente.`,
      });

    } catch (error: any) {
      console.error('Error processing TPV report:', error);
      toast({
        variant: 'destructive',
        title: 'Error al procesar',
        description: error.message || 'No se pudo procesar el reporte.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveReport = async () => {
    if (!processedReport) return;

    setIsProcessing(true);
    try {
      const savedReport = await addTPVReport(processedReport);
      
      if (savedReport) {
        onReportProcessed?.(savedReport);
        toast({
          title: 'Reporte guardado',
          description: 'El reporte TPV ha sido guardado exitosamente.',
        });
        handleDialogChange(false);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: error.message || 'No se pudo guardar el reporte.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className={step === 'preview' ? "sm:max-w-4xl max-h-[90vh] overflow-y-auto" : "sm:max-w-lg"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {step === 'upload' && 'Subir Reporte TPV'}
            {step === 'config' && 'Configurar Procesamiento'}
            {step === 'preview' && 'Vista Previa del Reporte'}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Sube el archivo CSV de Billpocket para procesar las transacciones.'}
            {step === 'config' && 'Selecciona el cliente y servicio para calcular las comisiones.'}
            {step === 'preview' && 'Revisa los resultados antes de guardar.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="py-4 space-y-4">
            <div 
              {...getRootProps()} 
              className={`w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/10' : 
                isValidCSV === false ? 'border-destructive bg-destructive/10' :
                isValidCSV === true ? 'border-green-500 bg-green-500/10' :
                'border-border hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              {isValidCSV === true ? (
                <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
              ) : isValidCSV === false ? (
                <AlertCircle className="h-10 w-10 text-destructive mb-2" />
              ) : (
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-2" />
              )}
              <p className="text-sm text-muted-foreground">
                {isDragActive ? 'Suelte el archivo aquí...' : 
                 file ? file.name : 
                 'Arrastre el CSV de Billpocket o haga clic'}
              </p>
              <p className="text-xs text-muted-foreground/80">Solo archivos CSV</p>
            </div>

            {file && (
              <div className="p-3 border rounded-md bg-secondary/50 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setFile(null); setCsvContent(''); setIsValidCSV(null); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Config */}
        {step === 'config' && (
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientsWithTPV.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Servicio</Label>
              <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar servicio..." />
                </SelectTrigger>
                <SelectContent>
                  {terminalServices.length > 0 ? (
                    terminalServices.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))
                  ) : (
                    serviceWorkflows.filter(s => s.status !== 'Archivado').map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedService?.revenueDistribution && (
                <p className="text-xs text-muted-foreground">
                  Distribución configurada: {selectedService.revenueDistribution.witbizPercentage}% WitBiz
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>% Comisión WitBiz al cliente</Label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={witbizCommissionRate}
                  onChange={(e) => setWitbizCommissionRate(Number(e.target.value))}
                  className="w-20 px-3 py-2 border rounded-md text-center"
                  min={0}
                  max={100}
                  step={0.5}
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Porcentaje que WitBiz cobra al cliente sobre cada transacción
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && processedReport && (
          <div className="py-4">
            <TPVReportView 
              report={{ ...processedReport, id: 'preview', createdAt: new Date(), processedAt: new Date() } as TPVReport} 
            />
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 'upload' && (
            <>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button 
                disabled={!isValidCSV}
                onClick={() => setStep('config')}
              >
                Continuar
              </Button>
            </>
          )}

          {step === 'config' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Atrás
              </Button>
              <Button 
                disabled={!selectedClientId || !selectedServiceId || isProcessing}
                onClick={handleProcess}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Procesar Reporte
                  </>
                )}
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('config')}>
                Modificar
              </Button>
              <Button 
                disabled={isProcessing}
                onClick={handleSaveReport}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Guardar Reporte
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
