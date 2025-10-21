
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { format, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    return [
        { id: 'com1', clientName: 'Global Tech Inc.', amount: 250.00, date: format(new Date(currentYear, currentMonth, 2), 'yyyy-MM-dd'), status: 'Pagada' },
        { id: 'com2', clientName: 'Innovate Solutions', amount: 300.50, date: format(new Date(currentYear, currentMonth, 5), 'yyyy-MM-dd'), status: 'Pendiente' },
        { id: 'com3', clientName: 'Quantum Industries', amount: 150.75, date: format(new Date(currentYear, currentMonth -1, 18), 'yyyy-MM-dd'), status: 'Pagada' },
        { id: 'com4', clientName: 'Synergy Group', amount: 450.00, date: format(new Date(currentYear, currentMonth, 12), 'yyyy-MM-dd'), status: 'Pendiente' },
        { id: 'com5', clientName: 'Global Tech Inc.', amount: 275.00, date: format(new Date(currentYear, currentMonth, 15), 'yyyy-MM-dd'), status: 'Pendiente' },
        { id: 'com6', clientName: 'Eco Builders', amount: 500.25, date: format(new Date(currentYear, currentMonth -2, 22), 'yyyy-MM-dd'), status: 'Pagada' },
    ];
};

const commissions = generateCommissions();

const resources = [
    { id: 'res1', title: 'Kit de Bienvenida para Promotores', description: 'Todo lo que necesitas para empezar a referir clientes.' },
    { id: 'res2', title: 'Manual de Marca y Logos', description: 'Guías de estilo y logos oficiales de WitBiz.' },
    { id: 'res3', title: 'Presentación de Servicios', description: 'Deck actualizado de todos nuestros servicios.' },
];

// --- Components for each view ---

function ClientsView() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

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
                                <TableCell>{isClient && client.joinDate ? format(parseDateString(client.joinDate)!, 'dd/MM/yyyy') : '-'}</TableCell>
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

function CommissionsView() {
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
            const commissionDate = parseDateString(c.date);
            if (commissionDate) {
                if (c.status === 'Pagada') {
                    paidDays.push(commissionDate);
                } else {
                    pendingDays.push(commissionDate);
                }
            }
        });
        return { paid: paidDays, pending: pendingDays };
    }, []);

    const dayModifiersClassNames = {
        paid: 'day-paid',
        pending: 'day-pending',
    };

    const filteredCommissions = useMemo(() => {
        const filterByDate = (c: typeof commissions[0]) => {
            const commissionDate = parseDateString(c.date);
            if (!commissionDate) return false;
            
            if (dateRange?.from && dateRange?.to) {
                return isWithinInterval(commissionDate, { start: dateRange.from, end: dateRange.to });
            }
            if (selectedDay) {
                return format(commissionDate, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd');
            }
            return true; 
        };
        return commissions.filter(filterByDate);
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Calendario de Comisiones</CardTitle>
                        <CardDescription className="flex flex-col gap-1.5 text-xs">
                          <span>Seleccione día o rango.</span>
                          <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500/80"></span>Pagadas</span>
                          <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-slate-400/80"></span>Pendientes</span>
                        </CardDescription>
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
                                <p className="text-2xl font-bold text-blue-600">${totalPaid.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Pendiente</p>
                                <p className="text-2xl font-bold text-slate-500">${totalPending.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="mt-4 max-h-48 overflow-y-auto">
                            {filteredCommissions.length > 0 ? (
                                <ul className="space-y-2">
                                {filteredCommissions.map(c => (
                                    <li key={c.id} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                                        <div>
                                            <p className="font-semibold">{c.clientName}</p>
                                            <p className="text-xs text-muted-foreground">{isClient && c.date ? format(parseDateString(c.date)!, 'PPP', { locale: es }) : '-'}</p>
                                        </div>
                                        <div className="text-right">
                                             <p className="font-semibold">${c.amount.toFixed(2)}</p>
                                             <Badge variant={c.status === 'Pagada' ? 'default' : 'secondary'} className={cn(c.status === 'Pagada' ? 'bg-blue-600 text-white' : 'bg-slate-500 text-white')}>{c.status}</Badge>
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
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Historial de Comisiones</CardTitle>
                            <CardDescription>
                                Mostrando {filteredCommissions.length} de {commissions.length} registros. 
                            </CardDescription>
                        </div>
                         {(dateRange || selectedDay) && <Button variant="outline" size="sm" onClick={() => { setDateRange(undefined); setSelectedDay(undefined); }}>Limpiar selección</Button>}
                    </div>
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
                                    <TableCell>{isClient && c.date ? format(parseDateString(c.date)!, 'PPP', { locale: es }) : '-'}</TableCell>
                                    <TableCell>${c.amount.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={c.status === 'Pagada' ? 'default' : 'secondary'} className={cn(c.status === 'Pagada' ? 'bg-blue-600 text-white' : 'bg-slate-500 text-white')}>{c.status}</Badge>
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

function ResourcesView() {
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

const navItems = [
    { id: 'clients', label: 'Clientes', icon: Users, component: ClientsView },
    { id: 'commissions', label: 'Comisiones', icon: CircleDollarSign, component: CommissionsView },
    { id: 'charts', label: 'Gráficos', icon: BarChart, component: ChartsTab },
    { id: 'resources', label: 'Recursos', icon: BookText, component: ResourcesView },
];

export default function PromoterPage() {
    const router = useRouter();
    const [activeView, setActiveView] = useState('clients');
    
    const handleLogout = () => {
        router.push('/promoter-login');
    };

    const ActiveComponent = navItems.find(item => item.id === activeView)?.component || (() => null);

    return (
        <div className="flex min-h-screen bg-muted/40">
             <aside className="w-64 flex-shrink-0 border-r bg-background p-4 flex flex-col">
                <div className="flex justify-center mb-6">
                    <Logo />
                </div>
                <nav className="flex flex-col gap-2">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        return (
                            <Button
                                key={item.id}
                                variant={activeView === item.id ? 'default' : 'ghost'}
                                className="justify-start gap-2"
                                onClick={() => setActiveView(item.id)}
                            >
                                <Icon className="h-4 w-4"/>
                                {item.label}
                            </Button>
                        )
                    })}
                </nav>
                 <div className="mt-auto">
                    <Button onClick={handleLogout} variant="outline" size="sm" className="w-full">
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar Sesión
                    </Button>
                </div>
            </aside>
            <div className="flex-1 flex flex-col">
                <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                    <h1 className="text-xl font-semibold">
                        {navItems.find(item => item.id === activeView)?.label || 'Panel de Promotor'}
                    </h1>
                </header>
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <ActiveComponent />
                </main>
            </div>
        </div>
    );
}

    




    

    

