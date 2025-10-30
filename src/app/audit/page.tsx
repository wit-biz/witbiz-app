
"use client";

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
import { LineChart, History, BarChart, Download, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { DateRangeChartsTab } from "@/components/shared/DateRangeChartsTab";
import { useCRMData } from "@/contexts/CRMDataContext";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Mock Data for Reports (Transactions)
const reportData = [
  { id: 'rep1', date: '2024-07-15T10:00:00Z', description: 'Comisión por Cierre - Synergy Corp.', amount: 2500, type: 'income', clientName: 'Synergy Corp.' },
  { id: 'rep2', date: '2024-07-14T14:30:00Z', description: 'Pago de Software de Análisis', amount: -150, type: 'expense', clientName: null },
  { id: 'rep3', date: '2024-07-12T09:00:00Z', description: 'Adelanto de Asesoría - Global Net', amount: 1000, type: 'income', clientName: 'Global Net' },
  { id: 'rep4', date: '2024-07-11T18:00:00Z', description: 'Gastos de Representación', amount: -200, type: 'expense', clientName: null },
  { id: 'rep5', date: '2024-07-10T11:00:00Z', description: 'Comisión por Firma - Innovate Inc.', amount: 5000, type: 'income', clientName: 'Innovate Inc.' },
];

// Mock Data for Logs (Activities)
const logData = [
  { id: 'log1', date: '2024-07-15T10:02:00Z', user: 'Andrea Admin', action: 'Tarea Completada', details: 'Tarea "Preparar contrato de Synergy Corp." marcada como completada.' },
  { id: 'log2', date: '2024-07-15T09:30:00Z', user: 'Carla Collaborator', action: 'Cliente Creado', details: 'Nuevo cliente "Futura Dynamics" fue añadido a la base de datos.' },
  { id: 'log3', date: '2024-07-14T16:00:00Z', user: 'Admin User', action: 'Permisos Modificados', details: 'El rol "Colaborador" fue actualizado.' },
  { id: 'log4', date: '2024-07-14T11:00:00Z', user: 'Andrea Admin', action: 'Documento Subido', details: 'Se subió el documento "Propuesta_Final.pdf" para el cliente "Global Net".' },
  { id: 'log5', date: '2024-07-13T12:00:00Z', user: 'Carla Collaborator', action: 'Inicio de Sesión', details: 'El usuario ha iniciado sesión en la plataforma.' },
];


export default function AuditPage() {
  const { clients, serviceWorkflows, isLoadingClients, isLoadingWorkflows } = useCRMData();
  const { toast } = useToast();

  const chartServices = serviceWorkflows.map(s => ({ id: s.id, name: s.name }));
  const chartClients = clients.map(c => ({ id: c.id, name: c.name }));

  const handleDownload = (section: string) => {
      toast({
          title: "Descarga Simulada",
          description: `Se ha iniciado la descarga de la sección "${section}".`
      });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Auditoría"
        description="Analice los reportes de negocio y revise la bitácora de actividades."
      />
      <main className="flex-1 p-4 md:p-8">
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reports">
              <LineChart className="mr-2 h-4 w-4" />
              Reportes
            </TabsTrigger>
            <TabsTrigger value="logs">
              <History className="mr-2 h-4 w-4" />
              Bitácoras
            </TabsTrigger>
             <TabsTrigger value="charts">
              <BarChart className="mr-2 h-4 w-4" />
              Gráficos
            </TabsTrigger>
          </TabsList>
          <TabsContent value="reports" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>Reportes de Desempeño</CardTitle>
                  <CardDescription>
                    Visualización de métricas clave, KPIs y números internos del negocio.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDownload('Reportes')}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>{format(new Date(item.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                                <TableCell className="font-medium">{item.description}</TableCell>
                                <TableCell>{item.clientName || 'N/A'}</TableCell>
                                <TableCell>
                                    <Badge variant={item.type === 'income' ? 'default' : 'destructive'} className={item.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                        {item.type === 'income' ? 'Ingreso' : 'Egreso'}
                                    </Badge>
                                </TableCell>
                                <TableCell className={`text-right font-semibold ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {item.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
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
                        {logData.map((log) => (
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
           <TabsContent value="charts" className="mt-6">
             {isLoadingClients || isLoadingWorkflows ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
             ) : (
                <DateRangeChartsTab services={chartServices} clients={chartClients} />
             )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
