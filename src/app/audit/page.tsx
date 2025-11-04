
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay, isWithinInterval, endOfMonth } from 'date-fns';
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
import { LineChart, History, BarChart, Download, ArrowUpCircle, ArrowDownCircle, Users, Briefcase } from "lucide-react";
import { DateRangeChartsTab } from "@/components/shared/DateRangeChartsTab";
import { useCRMData } from "@/contexts/CRMDataContext";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRangeFilter } from '@/components/shared/DateRangeFilter';


// Mock Data for Reports (Transactions)
const reportData = [
  { id: 'rep1', date: new Date(), description: 'Comisión por Cierre - Synergy Corp.', amount: 2500, type: 'income', clientName: 'Synergy Corp.', serviceName: 'Asesoría de Crédito Empresarial' },
  { id: 'rep2', date: subDays(new Date(), 2), description: 'Pago de Software de Análisis', amount: -150, type: 'expense', clientName: null, serviceName: null },
  { id: 'rep3', date: subDays(new Date(), 5), description: 'Adelanto de Asesoría - Global Net', amount: 1000, type: 'income', clientName: 'Global Net', serviceName: 'Gestión Patrimonial'},
  { id: 'rep4', date: subDays(new Date(), 10), description: 'Gastos de Representación', amount: -200, type: 'expense', clientName: null, serviceName: null},
  { id: 'rep5', date: subDays(new Date(), 32), description: 'Comisión por Firma - Innovate Inc.', amount: 5000, type: 'income', clientName: 'Innovate Inc.', serviceName: 'Operaciones de Divisas' },
];

// Mock Data for Logs (Activities)
const logData = [
  { id: 'log1', date: new Date(), user: 'Andrea Admin', action: 'Tarea Completada', details: 'Tarea "Preparar contrato de Synergy Corp." marcada como completada.', clientId: '2', serviceId: 'service-1' },
  { id: 'log2', date: subDays(new Date(), 1), user: 'Carla Collaborator', action: 'Cliente Creado', details: 'Nuevo cliente "Futura Dynamics" fue añadido a la base de datos.', clientId: null, serviceId: null },
  { id: 'log3', date: subDays(new Date(), 3), user: 'Admin User', action: 'Permisos Modificados', details: 'El rol "Colaborador" fue actualizado.', clientId: null, serviceId: null },
  { id: 'log4', date: subDays(new Date(), 8), user: 'Andrea Admin', action: 'Documento Subido', details: 'Se subió el documento "Propuesta_Final.pdf" para el cliente "Global Net".', clientId: '4', serviceId: 'service-1' },
  { id: 'log5', date: subDays(new Date(), 40), user: 'Carla Collaborator', action: 'Inicio de Sesión', details: 'El usuario ha iniciado sesión en la plataforma.', clientId: null, serviceId: null },
];


export default function AuditPage() {
  const { clients, serviceWorkflows, isLoadingClients, isLoadingWorkflows } = useCRMData();
  const { toast } = useToast();

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  })
  const [selectedClientId, setSelectedClientId] = React.useState<string>("all");
  const [selectedServiceId, setSelectedServiceId] = React.useState<string>("all");
  const [isComparativeView, setIsComparativeView] = useState(false);

  useEffect(() => {
    // If a specific client or service is selected, comparative view doesn't make sense.
    if (selectedClientId !== 'all' && selectedServiceId !== 'all') {
        if (isComparativeView) {
            setIsComparativeView(false);
        }
    }
  }, [selectedClientId, selectedServiceId, isComparativeView]);

  const chartServices = serviceWorkflows.map(s => ({ id: s.id, name: s.name }));
  const chartClients = clients.map(c => ({ id: c.id, name: c.name }));

  const filteredLogs = useMemo(() => {
     return logData.filter(item => {
        const itemDate = new Date(item.date);
        const isDateInRange = date?.from && date.to ? isWithinInterval(itemDate, { start: startOfDay(date.from), end: endOfDay(date.to) }) : true;
        const isClientMatch = selectedClientId === 'all' || item.clientId === selectedClientId;
        const isServiceMatch = selectedServiceId === 'all' || item.serviceId === selectedServiceId;
        
        return isDateInRange && isClientMatch && isServiceMatch;
    })
  }, [date, selectedClientId, selectedServiceId]);


  const handleDownload = (section: string) => {
      const clientName = clients.find(c => c.id === selectedClientId)?.name || "Todos";
      const serviceName = serviceWorkflows.find(s => s.id === selectedServiceId)?.name || "Todos";

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

  const canBeComparative = selectedClientId === 'all' || selectedServiceId === 'all';

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Análisis y Auditoría"
        description="Dashboard de análisis de negocio y bitácora de actividades del sistema."
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
                    canBeComparative={canBeComparative}
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
                 {isLoadingClients || isLoadingWorkflows ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                 ) : (
                    <DateRangeChartsTab 
                        date={date}
                        selectedClientId={selectedClientId}
                        selectedServiceId={selectedServiceId}
                        isComparative={isComparativeView && canBeComparative}
                        clients={chartClients}
                        services={chartServices}
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
                      Registro de todas las acciones importantes realizadas dentro de la aplicación.
                    </CardDescription>
                 </div>
                <Button variant="outline" size="sm" onClick={() => handleDownload('Bitácoras')}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar
                </Button>
              </CardHeader>
              <CardContent>
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
                        {filteredLogs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell>{format(new Date(log.date), 'dd/MM/yyyy HH:mm:ss')}</TableCell>
                                <TableCell className="font-medium">{log.user}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{log.action}</Badge>
                                </TableCell>
                                <TableCell>{log.details}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}

    