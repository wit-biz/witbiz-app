
"use client";

import React, { useState, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, History, Download, MessageSquare, Briefcase, PlusCircle, Calendar, CheckCircle, XCircle, FolderArchive, FileText, Trash2, UploadCloud, Eye, Search, Shield, Lock, Filter, SortAsc, X } from "lucide-react";
import { DateRangeChartsTab } from "@/components/shared/DateRangeChartsTab";
import { useCRMData } from "@/contexts/CRMDataContext";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRangeFilter } from '@/components/shared/DateRangeFilter';
import { Transaction, Log, LogAction, Document, DocumentCategory } from '@/lib/types';
import { Input } from "@/components/ui/input";
import { useDialogs } from "@/contexts/DialogsContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


const LOG_ACTION_DETAILS: Partial<Record<LogAction, { text: string; icon: React.ElementType }>> = {
    client_created: { text: "Cliente Creado", icon: Briefcase },
    client_updated: { text: "Cliente Actualizado", icon: Briefcase },
    client_archived: { text: "Cliente Archivado", icon: Briefcase },
    task_created: { text: "Tarea Creada", icon: PlusCircle },
    task_completed: { text: "Tarea Completada", icon: PlusCircle },
    task_updated: { text: "Tarea Actualizada", icon: PlusCircle },
    document_uploaded: { text: "Documento Subido", icon: PlusCircle },
    note_created: { text: "Nota Creada", icon: MessageSquare },
    transaction_created: { text: "Transacción Registrada", icon: PlusCircle },
    user_invited: { text: "Usuario Invitado", icon: PlusCircle },
    timeoff_requested: { text: "Tiempo Libre Solicitado", icon: Calendar },
    timeoff_approved: { text: "Tiempo Libre Aprobado", icon: CheckCircle },
    timeoff_rejected: { text: "Tiempo Libre Rechazado", icon: XCircle },
    timeoff_cancelled: { text: "Tiempo Libre Cancelado", icon: XCircle },
    timeoff_auto_approved: { text: "Tiempo Libre Auto-Aprobado", icon: Calendar },
};


export default function IntelligenceCenterPage() {
  const { clients, transactions, logs, documents, promoters, suppliers, serviceWorkflows, isLoadingClients, isLoadingTransactions, isLoadingLogs, isLoadingDocuments, deleteDocument, updateDocument, currentUser } = useCRMData();
  const { setIsSmartUploadDialogOpen } = useDialogs();
  const { toast } = useToast();
  
  // Storage filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all'); // 'all', 'none', 'client', 'supplier', 'promoter', 'service'
  const [selectedEntityId, setSelectedEntityId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [storageTab, setStorageTab] = useState<'general' | 'caja_fuerte'>('general');
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  const [docToMove, setDocToMove] = useState<Document | null>(null);
  
  // Get ALL active documents
  const allDocuments = useMemo(() => {
    if (!documents) return [];
    return documents.filter(doc => doc.status !== 'Archivado');
  }, [documents]);

  // Separate by category (Caja Fuerte vs General)
  const generalDocs = useMemo(() => 
    allDocuments.filter(doc => doc.category !== 'caja_fuerte'), 
    [allDocuments]
  );
  
  const cajaFuerteDocs = useMemo(() => 
    allDocuments.filter(doc => doc.category === 'caja_fuerte'), 
    [allDocuments]
  );

  // Get unique document types for filter
  const documentTypes = useMemo(() => {
    const types = new Set(allDocuments.map(d => d.type).filter(Boolean));
    return Array.from(types);
  }, [allDocuments]);

  // Helper to get entity name
  const getEntityInfo = (doc: Document) => {
    if (doc.clientId) {
      const client = clients?.find(c => c.id === doc.clientId);
      return { type: 'Cliente', name: client?.name || 'Cliente eliminado', id: doc.clientId };
    }
    if (doc.supplierId) {
      const supplier = suppliers?.find(s => s.id === doc.supplierId);
      return { type: 'Proveedor', name: supplier?.name || 'Proveedor eliminado', id: doc.supplierId };
    }
    if (doc.promoterId) {
      const promoter = promoters?.find(p => p.id === doc.promoterId);
      return { type: 'Promotor', name: promoter?.name || 'Promotor eliminado', id: doc.promoterId };
    }
    if (doc.serviceId) {
      const service = serviceWorkflows?.find(s => s.id === doc.serviceId);
      return { type: 'Servicio', name: service?.name || 'Servicio eliminado', id: doc.serviceId };
    }
    return { type: 'Sin asociar', name: 'General', id: null };
  };

  // Get entities for filter dropdown based on entityFilter
  const availableEntities = useMemo(() => {
    if (entityFilter === 'client') return clients?.map(c => ({ id: c.id, name: c.name })) || [];
    if (entityFilter === 'supplier') return suppliers?.map(s => ({ id: s.id, name: s.name })) || [];
    if (entityFilter === 'promoter') return promoters?.map(p => ({ id: p.id, name: p.name })) || [];
    if (entityFilter === 'service') return serviceWorkflows?.filter(s => s.status !== 'Archivado').map(s => ({ id: s.id, name: s.name })) || [];
    return [];
  }, [entityFilter, clients, suppliers, promoters, serviceWorkflows]);

  // Apply filters
  const filteredDocs = useMemo(() => {
    const docsToFilter = storageTab === 'caja_fuerte' ? cajaFuerteDocs : generalDocs;
    
    let filtered = docsToFilter;
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(doc => {
        const entityInfo = getEntityInfo(doc);
        return doc.name.toLowerCase().includes(term) ||
          doc.type?.toLowerCase().includes(term) ||
          doc.description?.toLowerCase().includes(term) ||
          entityInfo.name.toLowerCase().includes(term);
      });
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(doc => doc.type === typeFilter);
    }
    
    // Entity type filter
    if (entityFilter !== 'all') {
      if (entityFilter === 'none') {
        filtered = filtered.filter(doc => !doc.clientId && !doc.supplierId && !doc.promoterId && !doc.serviceId);
      } else if (entityFilter === 'client') {
        filtered = filtered.filter(doc => doc.clientId);
        if (selectedEntityId !== 'all') {
          filtered = filtered.filter(doc => doc.clientId === selectedEntityId);
        }
      } else if (entityFilter === 'supplier') {
        filtered = filtered.filter(doc => doc.supplierId);
        if (selectedEntityId !== 'all') {
          filtered = filtered.filter(doc => doc.supplierId === selectedEntityId);
        }
      } else if (entityFilter === 'promoter') {
        filtered = filtered.filter(doc => doc.promoterId);
        if (selectedEntityId !== 'all') {
          filtered = filtered.filter(doc => doc.promoterId === selectedEntityId);
        }
      } else if (entityFilter === 'service') {
        filtered = filtered.filter(doc => doc.serviceId);
        if (selectedEntityId !== 'all') {
          filtered = filtered.filter(doc => doc.serviceId === selectedEntityId);
        }
      }
    }
    
    // Sort
    return filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      // By date (newest first)
      const dateA = a.uploadedAt?.toDate?.() || new Date(a.uploadedAt || 0);
      const dateB = b.uploadedAt?.toDate?.() || new Date(b.uploadedAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [storageTab, generalDocs, cajaFuerteDocs, searchTerm, typeFilter, entityFilter, selectedEntityId, sortBy, clients, suppliers, promoters, serviceWorkflows]);

  const canManageStorage = currentUser?.role === 'Director' || currentUser?.role === 'Administrador';
  const canAccessCajaFuerte = currentUser?.role === 'Director';

  // Reset selected entity when entity filter changes
  const handleEntityFilterChange = (value: string) => {
    setEntityFilter(value);
    setSelectedEntityId('all');
  };

  const handleOpenDocument = (doc: Document) => {
    if (doc.downloadURL) {
      window.open(doc.downloadURL, '_blank');
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Este documento no tiene una URL de descarga válida.'
      });
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    await deleteDocument(docToDelete.id, true);
    toast({
      title: 'Documento eliminado',
      description: 'El documento ha sido eliminado permanentemente.'
    });
    setDocToDelete(null);
  };

  const handleMoveDocument = async () => {
    if (!docToMove) return;
    const newCategory: DocumentCategory = docToMove.category === 'caja_fuerte' ? 'general' : 'caja_fuerte';
    await updateDocument(docToMove.id, { category: newCategory });
    toast({
      title: newCategory === 'caja_fuerte' ? 'Movido a Caja Fuerte' : 'Movido a General',
      description: `El documento "${docToMove.name}" ha sido movido.`
    });
    setDocToMove(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setEntityFilter('all');
    setSelectedEntityId('all');
    setSortBy('date');
  };

  const hasActiveFilters = searchTerm || typeFilter !== 'all' || entityFilter !== 'all';

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  })
  const [selectedClientId, setSelectedClientId] = React.useState<string>("all");

  const chartClients = (clients || []).map(c => ({ id: c.id, name: c.name }));

  const filteredTransactions = useMemo(() => {
    if (isLoadingTransactions || !transactions) return [];
    
    return transactions.filter(item => {
        const itemDate = new Date(item.date);
        const isDateInRange = date?.from && date.to ? isWithinInterval(itemDate, { start: startOfDay(date.from), end: endOfDay(date.to) }) : true;
        
        let clientMatch = selectedClientId === 'all';
        if (!clientMatch) {
            clientMatch = item.clientId === selectedClientId;
        }
        
        return isDateInRange && clientMatch;
    });
  }, [date, selectedClientId, transactions, isLoadingTransactions]);


  const filteredLogs = useMemo(() => {
     if (isLoadingLogs || !logs) return [];
     return logs.filter(item => {
        if (!item.createdAt) return false;
        const itemDate = item.createdAt.toDate();
        const isDateInRange = date?.from && date.to ? isWithinInterval(itemDate, { start: startOfDay(date.from), end: endOfDay(date.to) }) : true;
        const isClientMatch = selectedClientId === 'all' || item.entityType === 'client' && item.entityId === selectedClientId;
        
        return isDateInRange && isClientMatch;
    }).sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  }, [date, selectedClientId, logs, isLoadingLogs]);


  const handleDownload = (section: string) => {
      const clientName = clients?.find(c => c.id === selectedClientId)?.name || "Todos";

      let description = `Iniciando descarga de "${section}". Filtros aplicados: Cliente - ${clientName}.`;
      if (date?.from && date.to) {
          description += ` Rango: ${format(date.from, "dd/MM/yy")} a ${format(date.to, "dd/MM/yy")}.`;
      }
      
      toast({
          title: "Descarga Simulada",
          description: description
      });
  };
  
  const handleClearFilters = () => {
    setDate({ from: subDays(new Date(), 29), to: new Date() });
    setSelectedClientId("all");
  };

  const isLoading = isLoadingClients || isLoadingTransactions || isLoadingLogs;

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Centro de inteligencia"
        description="Análisis de desempeño y bitácora de actividades de la plataforma."
      >
        <Button onClick={() => handleDownload('Todo')}>
          <Download className="mr-2 h-4 w-4" />
          Descarga General
        </Button>
      </Header>
      <main className="flex-1 p-4 md:p-8 space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Filtros de Análisis</CardTitle>
                <CardDescription>
                    Seleccione un rango de fechas y filtre por cliente para analizar los datos. Los filtros se aplicarán a todas las pestañas.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DateRangeFilter 
                    date={date}
                    setDate={setDate}
                    selectedClientId={selectedClientId}
                    setSelectedClientId={setSelectedClientId}
                    clients={chartClients}
                    onClearFilters={handleClearFilters}
                />
            </CardContent>
        </Card>


        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis">
              <BarChart className="mr-2 h-4 w-4" />
              Análisis
            </TabsTrigger>
            <TabsTrigger value="logs">
              <History className="mr-2 h-4 w-4" />
              Bitácora
            </TabsTrigger>
            <TabsTrigger value="storage">
              <FolderArchive className="mr-2 h-4 w-4" />
              Almacén
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="mt-6">
             <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle>Dashboard de Desempeño</CardTitle>
                        <CardDescription>
                            Visualización de datos clave según los filtros aplicados.
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDownload('Dashboard de Desempeño')}>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar
                    </Button>
                </CardHeader>
                <CardContent>
                 {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                 ) : (
                    <DateRangeChartsTab 
                        transactions={filteredTransactions}
                    />
                 )}
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                 <div>
                    <CardTitle>Bitácora de Actividades</CardTitle>
                    <CardDescription>
                      Registro de todas las acciones importantes guardadas en la plataforma.
                    </CardDescription>
                 </div>
                <Button variant="outline" size="sm" onClick={() => handleDownload('Bitácoras')}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingLogs ? (
                     <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Acción</TableHead>
                            <TableHead>Detalle</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLogs.length > 0 ? filteredLogs.map((log) => {
                            const logDetails = LOG_ACTION_DETAILS[log.action] || { text: log.action, icon: History };
                            const Icon = logDetails.icon;
                            return (
                            <TableRow key={log.id}>
                                <TableCell>{log.createdAt ? format(log.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : 'N/A'}</TableCell>
                                <TableCell className="font-medium">{log.authorName}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="flex items-center gap-1.5">
                                      <Icon className="h-3 w-3" />
                                      {logDetails.text}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{log.entityName}</TableCell>
                            </TableRow>
                        )}) : (
                           <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    No hay actividades que mostrar para los filtros seleccionados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="storage" className="mt-6 space-y-6">
            {/* Storage Sub-tabs */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-2">
                <Button 
                  variant={storageTab === 'general' ? 'default' : 'outline'}
                  onClick={() => setStorageTab('general')}
                  className="gap-2"
                >
                  <FolderArchive className="h-4 w-4" />
                  Documentos Generales
                  <Badge variant="secondary" className="ml-1">{generalDocs.length}</Badge>
                </Button>
                {canAccessCajaFuerte && (
                  <Button 
                    variant={storageTab === 'caja_fuerte' ? 'default' : 'outline'}
                    onClick={() => setStorageTab('caja_fuerte')}
                    className="gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Caja Fuerte
                    <Badge variant="secondary" className="ml-1">{cajaFuerteDocs.length}</Badge>
                  </Button>
                )}
              </div>
              {canManageStorage && (
                <Button onClick={() => setIsSmartUploadDialogOpen(true)}>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Subir Documento
                </Button>
              )}
            </div>

            <Card className={storageTab === 'caja_fuerte' ? 'border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/20' : ''}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {storageTab === 'caja_fuerte' ? (
                        <>
                          <Shield className="h-5 w-5 text-amber-500" />
                          <span>Caja Fuerte - Documentos Importantes</span>
                          <Lock className="h-4 w-4 text-amber-500" />
                        </>
                      ) : (
                        <>
                          <FolderArchive className="h-5 w-5" />
                          <span>Documentos Generales</span>
                        </>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {storageTab === 'caja_fuerte' 
                        ? 'Documentos críticos y confidenciales de WitBiz. Solo acceso de Director.'
                        : 'Repositorio centralizado de documentos administrativos de la empresa.'
                      }
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters Row 1 - Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, descripción o entidad..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Filters Row 2 - Dropdowns */}
                <div className="flex flex-wrap gap-3">
                  <Select value={entityFilter} onValueChange={handleEntityFilterChange}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Asociación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las entidades</SelectItem>
                      <SelectItem value="none">Sin asociar</SelectItem>
                      <SelectItem value="client">Clientes</SelectItem>
                      <SelectItem value="supplier">Proveedores</SelectItem>
                      <SelectItem value="promoter">Promotores</SelectItem>
                      <SelectItem value="service">Servicios</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {entityFilter !== 'all' && entityFilter !== 'none' && availableEntities.length > 0 && (
                    <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder={`Seleccionar ${entityFilter === 'client' ? 'cliente' : entityFilter === 'supplier' ? 'proveedor' : entityFilter === 'promoter' ? 'promotor' : 'servicio'}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {availableEntities.map(entity => (
                          <SelectItem key={entity.id} value={entity.id}>{entity.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      {documentTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'name')}>
                    <SelectTrigger className="w-[140px]">
                      <SortAsc className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Ordenar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Más recientes</SelectItem>
                      <SelectItem value="name">Por nombre</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                      <X className="h-4 w-4" />
                      Limpiar
                    </Button>
                  )}
                </div>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Filtros:</span>
                    {searchTerm && (
                      <Badge variant="secondary" className="gap-1">
                        "{searchTerm}"
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm('')} />
                      </Badge>
                    )}
                    {entityFilter !== 'all' && (
                      <Badge variant="secondary" className="gap-1">
                        {entityFilter === 'none' ? 'Sin asociar' : 
                         entityFilter === 'client' ? 'Clientes' :
                         entityFilter === 'supplier' ? 'Proveedores' :
                         entityFilter === 'promoter' ? 'Promotores' : 'Servicios'}
                        {selectedEntityId !== 'all' && `: ${availableEntities.find(e => e.id === selectedEntityId)?.name}`}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleEntityFilterChange('all')} />
                      </Badge>
                    )}
                    {typeFilter !== 'all' && (
                      <Badge variant="secondary" className="gap-1">
                        {typeFilter}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setTypeFilter('all')} />
                      </Badge>
                    )}
                  </div>
                )}

                {/* Document List */}
                {isLoadingDocuments ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredDocs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {storageTab === 'caja_fuerte' ? (
                      <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    ) : (
                      <FolderArchive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    )}
                    <p className="font-medium">
                      {searchTerm || typeFilter !== 'all' 
                        ? 'No se encontraron documentos con los filtros aplicados' 
                        : storageTab === 'caja_fuerte'
                          ? 'No hay documentos en la Caja Fuerte'
                          : 'No hay documentos generales'
                      }
                    </p>
                    <p className="text-sm mt-1">
                      {searchTerm || typeFilter !== 'all'
                        ? 'Intenta con otros filtros o limpia la búsqueda'
                        : canManageStorage 
                          ? 'Sube documentos usando el botón de arriba'
                          : 'Contacta a un administrador para subir documentos'
                      }
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {filteredDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
                            storageTab === 'caja_fuerte' ? 'border-amber-200 dark:border-amber-800' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {storageTab === 'caja_fuerte' ? (
                              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                                <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                              </div>
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{doc.name}</p>
                              {doc.description && (
                                <p className="text-xs text-muted-foreground truncate">{doc.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <Badge variant="outline" className="text-xs">
                                  {doc.type || 'Documento'}
                                </Badge>
                                {(() => {
                                  const entityInfo = getEntityInfo(doc);
                                  if (entityInfo.type !== 'Sin asociar') {
                                    return (
                                      <Badge variant="secondary" className="text-xs">
                                        {entityInfo.type}: {entityInfo.name}
                                      </Badge>
                                    );
                                  }
                                  return null;
                                })()}
                                {doc.uploadedAt && (
                                  <span>
                                    {format(doc.uploadedAt.toDate?.() || new Date(doc.uploadedAt), 'dd MMM yyyy', { locale: es })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDocument(doc)}
                              title="Ver documento"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (doc.downloadURL) {
                                  const a = document.createElement('a');
                                  a.href = doc.downloadURL;
                                  a.download = doc.name;
                                  a.click();
                                }
                              }}
                              title="Descargar"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {canManageStorage && canAccessCajaFuerte && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDocToMove(doc)}
                                title={doc.category === 'caja_fuerte' ? 'Mover a General' : 'Mover a Caja Fuerte'}
                              >
                                {doc.category === 'caja_fuerte' ? (
                                  <FolderArchive className="h-4 w-4" />
                                ) : (
                                  <Shield className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            {canManageStorage && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDocToDelete(doc)}
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {/* Stats Footer */}
                <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
                  <span>
                    {filteredDocs.length} de {storageTab === 'caja_fuerte' ? cajaFuerteDocs.length : generalDocs.length} documento(s)
                  </span>
                  {!canManageStorage && (
                    <span className="text-xs">Solo lectura - Contacta a un administrador para gestionar documentos</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!docToDelete} onOpenChange={() => setDocToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente "{docToDelete?.name}". Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteDocument} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Move Confirmation Dialog */}
        <AlertDialog open={!!docToMove} onOpenChange={() => setDocToMove(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {docToMove?.category === 'caja_fuerte' 
                  ? '¿Mover a Documentos Generales?' 
                  : '¿Mover a Caja Fuerte?'
                }
              </AlertDialogTitle>
              <AlertDialogDescription>
                {docToMove?.category === 'caja_fuerte' 
                  ? `El documento "${docToMove?.name}" será movido a la sección de Documentos Generales y estará visible para Administradores.`
                  : `El documento "${docToMove?.name}" será movido a la Caja Fuerte. Solo los Directores tendrán acceso.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleMoveDocument}>
                {docToMove?.category === 'caja_fuerte' ? 'Mover a General' : 'Mover a Caja Fuerte'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
