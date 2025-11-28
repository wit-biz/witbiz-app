
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
import { BarChart, History, Download, MessageSquare } from "lucide-react";
import { DateRangeChartsTab } from "@/components/shared/DateRangeChartsTab";
import { useCRMData } from "@/contexts/CRMDataContext";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRangeFilter } from '@/components/shared/DateRangeFilter';
import { Transaction } from '@/lib/types';


export default function IntelligenceCenterPage() {
  const { clients, serviceWorkflows, transactions, notes, isLoadingClients, isLoadingWorkflows, isLoadingTransactions, isLoadingNotes } = useCRMData();
  const { toast } = useToast();

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  })
  const [selectedClientId, setSelectedClientId] = React.useState<string>("all");
  const [selectedServiceId, setSelectedServiceId] = React.useState<string>("all");
  const [isComparativeView, setIsComparativeView] = useState(false);

  const chartServices = serviceWorkflows ? serviceWorkflows.map(s => ({ id: s.id, name: s.name })) : [];
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
        
        const isServiceMatch = selectedServiceId === 'all'; // Simplified for now

        return isDateInRange && clientMatch && isServiceMatch;
    });
  }, [date, selectedClientId, selectedServiceId, transactions, isLoadingTransactions]);


  const filteredLogs = useMemo(() => {
     if (isLoadingNotes || !notes) return [];
     return notes.filter(item => {
        if (!item.createdAt) return false;
        const itemDate = item.createdAt.toDate();
        const isDateInRange = date?.from && date.to ? isWithinInterval(itemDate, { start: startOfDay(date.from), end: endOfDay(date.to) }) : true;
        const isClientMatch = selectedClientId === 'all' || item.clientId === selectedClientId;
        
        // No service filter for notes for now
        // const isServiceMatch = selectedServiceId === 'all';
        
        return isDateInRange && isClientMatch;
    }).sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  }, [date, selectedClientId, notes, isLoadingNotes]);


  const handleDownload = (section: string) => {
      const clientName = clients?.find(c => c.id === selectedClientId)?.name || "Todos";
      const serviceName = serviceWorkflows?.find(s => s.id === selectedServiceId)?.name || "Todos";

      let description = `Iniciando descarga de "${section}". Filtros aplicados: Cliente - ${clientName}, Servicio - ${serviceName}.`;
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
    setSelectedServiceId("all");
    setIsComparativeView(false);
  };

  const isLoading = isLoadingClients || isLoadingWorkflows || isLoadingTransactions || isLoadingNotes;

  const getClientName = (clientId?: string) => {
      if (!clientId) return 'N/A';
      return clients.find(c => c.id === clientId)?.name || 'Cliente Desconocido';
  }

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
                    Seleccione un rango de fechas y filtre por cliente o servicio para analizar los datos. Los filtros se aplicarán a todas las pestañas.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DateRangeFilter 
                    date={date}
                    setDate={setDate}
                    selectedClientId={selectedClientId}
                    setSelectedClientId={setSelectedClientId}
                    selectedServiceId={selectedServiceId}
                    setSelectedServiceId={setSelectedServiceId}
                    clients={chartClients}
                    services={chartServices}
                    onClearFilters={handleClearFilters}
                    isComparative={isComparativeView}
                    setIsComparative={setIsComparativeView}
                    canBeComparative={false} // Disabled for now
                />
            </CardContent>
        </Card>


        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analysis">
              <BarChart className="mr-2 h-4 w-4" />
              Análisis de Desempeño
            </TabsTrigger>
            <TabsTrigger value="logs">
              <History className="mr-2 h-4 w-4" />
              Bitácora de Actividades
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
                      Registro de todas las notas y acuerdos guardados en la plataforma.
                    </CardDescription>
                 </div>
                <Button variant="outline" size="sm" onClick={() => handleDownload('Bitácoras')}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingNotes ? (
                     <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Acción</TableHead>
                            <TableHead>Detalle</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell>{log.createdAt ? format(log.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : 'N/A'}</TableCell>
                                <TableCell className="font-medium">{getClientName(log.clientId)}</TableCell>
                                <TableCell className="font-medium">{log.authorName}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="flex items-center gap-1.5">
                                      <MessageSquare className="h-3 w-3" />
                                      Nota Creada
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{log.text}</TableCell>
                            </TableRow>
                        )) : (
                           <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    No hay notas que mostrar para los filtros seleccionados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
