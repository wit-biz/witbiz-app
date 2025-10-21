
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { LogOut, Users, CircleDollarSign, BookText, Download, BarChart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/shared/logo';
import { cn, parseDateString } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ChartsTab } from '@/components/shared/ChartsTab';

// --- Mock Data ---
const referredClients = [
    { id: 'c1', name: 'Global Tech Inc.', joinDate: '2024-05-15', status: 'Activo' },
    { id: 'c2', name: 'Innovate Solutions', joinDate: '2024-05-20', status: 'Activo' },
    { id: 'c3', name: 'Quantum Industries', joinDate: '2024-04-10', status: 'Inactivo' },
    { id: 'c4', name: 'Synergy Group', joinDate: '2024-06-01', status: 'Activo' },
    { id: 'c5', name: 'Eco Builders', joinDate: '2023-11-28', status: 'Activo' },
];

const generateCommissions = () => {
    const today = new Date();
    return [
        { id: 'com1', clientName: 'Global Tech Inc.', amount: 250.00, date: format(new Date(today.getFullYear(), today.getMonth(), 2), 'yyyy-MM-dd'), status: 'Pagada' },
        { id: 'com2', clientName: 'Innovate Solutions', amount: 300.50, date: format(new Date(today.getFullYear(), today.getMonth(), 5), 'yyyy-MM-dd'), status: 'Pendiente' },
        { id: 'com3', clientName: 'Quantum Industries', amount: 150.75, date: format(new Date(today.getFullYear(), today.getMonth() -1, 18), 'yyyy-MM-dd'), status: 'Pagada' },
        { id: 'com4', clientName: 'Synergy Group', amount: 450.00, date: format(new Date(today.getFullYear(), today.getMonth(), 12), 'yyyy-MM-dd'), status: 'Pendiente' },
        { id: 'com5', clientName: 'Global Tech Inc.', amount: 275.00, date: format(new Date(today.getFullYear(), today.getMonth(), 15), 'yyyy-MM-dd'), status: 'Pendiente' },
        { id: 'com6', clientName: 'Eco Builders', amount: 500.25, date: format(new Date(today.getFullYear(), today.getMonth() -2, 22), 'yyyy-MM-dd'), status: 'Pagada' },
    ];
};

const commissions = generateCommissions();

const resources = [
    { id: 'res1', title: 'Kit de Bienvenida para Promotores', description: 'Todo lo que necesitas para empezar a referir clientes.' },
    { id: 'res2', title: 'Manual de Marca y Logos', description: 'Guías de estilo y logos oficiales de WitBiz.' },
    { id: 'res3', title: 'Presentación de Servicios', description: 'Deck actualizado de todos nuestros servicios.' },
];

// --- Components ---

function ClientsTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Clientes Referidos</CardTitle>
                <CardDescription>Esta es la lista de clientes que has referido a WitBiz.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre del Cliente</TableHead>
                            <TableHead>Fecha de Ingreso</TableHead>
                            <TableHead>Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {referredClients.map(client => (
                            <TableRow key={client.id}>
                                <TableCell className="font-medium">{client.name}</TableCell>
                                <TableCell>{format(parseISO(client.joinDate), 'dd/MM/yyyy')}</TableCell>
                                <TableCell>
                                    <Badge variant={client.status === 'Activo' ? 'default' : 'secondary'}>{client.status}</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function CommissionsTab() {
    const [isClient, setIsClient] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [selectedDay, setSelectedDay] = useState<Date | undefined>();

    useEffect(() => {
        setIsClient(true);
    }, []);

    const dayModifiers = useMemo(() => {
        const paidDays: Date[] = [];
        const pendingDays: Date[] = [];
        commissions.forEach(c => {
            const commissionDate = parseISO(c.date);
            if (c.status === 'Pagada') {
                paidDays.push(commissionDate);
            } else {
                pendingDays.push(commissionDate);
            }
        });
        return { paid: paidDays, pending: pendingDays };
    }, []);

    const dayModifiersClassNames = {
        paid: 'day-paid',
        pending: 'day-pending',
    };

    const filteredCommissions = useMemo(() => {
        if (dateRange?.from && dateRange?.to) {
            return commissions.filter(c => isWithinInterval(parseISO(c.date), { start: dateRange.from!, end: dateRange.to! }));
        }
        if (selectedDay) {
            const dayString = format(selectedDay, 'yyyy-MM-dd');
            return commissions.filter(c => c.date === dayString);
        }
        return commissions;
    }, [dateRange, selectedDay]);

    const handleDayClick = (day: Date) => {
        setSelectedDay(day);
        setDateRange(undefined);
    };

    const totalSelected = useMemo(() => filteredCommissions.reduce((sum, c) => sum + c.amount, 0), [filteredCommissions]);
    const totalPaid = useMemo(() => filteredCommissions.filter(c => c.status === 'Pagada').reduce((sum, c) => sum + c.amount, 0), [filteredCommissions]);
    const totalPending = useMemo(() => filteredCommissions.filter(c => c.status === 'Pendiente').reduce((sum, c) => sum + c.amount, 0), [filteredCommissions]);

    const getSelectionTitle = () => {
        if (dateRange?.from && dateRange?.to) {
            return `Rango: ${format(dateRange.from, 'dd/MM/yy')} - ${format(dateRange.to, 'dd/MM/yy')}`;
        }
        if (selectedDay) {
            return `Día: ${format(selectedDay, 'PPP', { locale: es })}`;
        }
        return 'Historial Completo';
    };

    return (
        <div className="space-y-6">
             <style>{`
                .day-paid { background-color: rgba(34, 197, 94, 0.2); border-radius: 50%; }
                .day-pending { background-color: rgba(59, 130, 246, 0.2); border-radius: 50%; }
                .rdp-day_range_start, .rdp-day_range_end { background-color: hsl(var(--primary)) !important; color: hsl(var(--primary-foreground)) !important; }
                .rdp-day_range_middle { background-color: hsl(var(--muted)) !important; border-radius: 0 !important; }
            `}</style>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Calendario de Comisiones</CardTitle>
                        <CardDescription>Seleccione un día o un rango de fechas.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        {isClient && (
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={setDateRange}
                                onDayClick={handleDayClick}
                                modifiers={dayModifiers}
                                modifiersClassNames={dayModifiersClassNames}
                                className="rounded-md border"
                                locale={es}
                            />
                        )}
                    </CardContent>
                </Card>
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Información de Selección</CardTitle>
                        <CardDescription>{getSelectionTitle()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="text-2xl font-bold">${totalSelected.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Pagado</p>
                                <p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Pendiente</p>
                                <p className="text-2xl font-bold text-blue-600">${totalPending.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="mt-4 max-h-48 overflow-y-auto">
                            {filteredCommissions.length > 0 ? (
                                <ul className="space-y-2">
                                {filteredCommissions.map(c => (
                                    <li key={c.id} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                                        <div>
                                            <p className="font-semibold">{c.clientName}</p>
                                            <p className="text-xs text-muted-foreground">{format(parseISO(c.date), 'PPP', { locale: es })}</p>
                                        </div>
                                        <div className="text-right">
                                             <p className="font-semibold">${c.amount.toFixed(2)}</p>
                                             <Badge variant={c.status === 'Pagada' ? 'default' : 'secondary'} className={cn(c.status === 'Pagada' ? 'bg-green-600' : 'bg-blue-600', 'text-white')}>{c.status}</Badge>
                                        </div>
                                    </li>
                                ))}
                                </ul>
                            ) : (
                                <div className="text-center text-muted-foreground py-8">
                                    <p>No hay comisiones en la fecha o rango seleccionado.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Comisiones</CardTitle>
                     <CardDescription>
                        Mostrando {filteredCommissions.length} de {commissions.length} registros. 
                        {(dateRange || selectedDay) && <Button variant="link" className="p-0 h-auto ml-2" onClick={() => { setDateRange(undefined); setSelectedDay(undefined); }}>Limpiar selección</Button>}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Monto</TableHead>
                                <TableHead>Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCommissions.map(c => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-medium">{c.clientName}</TableCell>
                                    <TableCell>{format(parseISO(c.date), 'PPP', { locale: es })}</TableCell>
                                    <TableCell>${c.amount.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={c.status === 'Pagada' ? 'default' : 'secondary'} className={cn(c.status === 'Pagada' ? 'bg-green-600' : 'bg-blue-600', 'text-white')}>{c.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function ResourcesTab() {
    const { toast } = useToast();

    const handleDownload = (resourceTitle: string) => {
        toast({
            title: "Descarga Simulada",
            description: `Se ha iniciado la descarga de "${resourceTitle}".`
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map(resource => (
                <Card key={resource.id}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BookText className="h-5 w-5 text-accent"/>{resource.title}</CardTitle>
                        <CardDescription>{resource.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" onClick={() => handleDownload(resource.title)}>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function PromoterPage() {
    const router = useRouter();
    
    const handleLogout = () => {
        router.push('/promoter-login');
    };

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
             <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <Logo />
                <Button onClick={handleLogout} variant="outline" size="sm">
                   <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                </Button>
            </header>
            <main className="flex-1 p-4 md:p-8">
                 <Tabs defaultValue="commissions" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="clients"><Users className="mr-2 h-4 w-4" />Clientes</TabsTrigger>
                        <TabsTrigger value="commissions"><CircleDollarSign className="mr-2 h-4 w-4" />Comisiones</TabsTrigger>
                        <TabsTrigger value="charts"><BarChart className="mr-2 h-4 w-4" />Gráficos</TabsTrigger>
                        <TabsTrigger value="resources"><BookText className="mr-2 h-4 w-4" />Recursos</TabsTrigger>
                    </TabsList>
                    <TabsContent value="clients" className="mt-6">
                        <ClientsTab />
                    </TabsContent>
                    <TabsContent value="commissions" className="mt-6">
                        <CommissionsTab />
                    </TabsContent>
                    <TabsContent value="charts" className="mt-6">
                        <ChartsTab />
                    </TabsContent>
                    <TabsContent value="resources" className="mt-6">
                        <ResourcesTab />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
