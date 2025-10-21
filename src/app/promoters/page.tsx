
'use client';

import React, { useState, useMemo, useEffect, type FormEvent } from 'react';
import { DateRange } from 'react-day-picker';
import { format, isWithinInterval, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { LogOut, Users, CircleDollarSign, BookText, Download, BarChart, User, Save, Lock, Mail, UserCircle, PanelLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/shared/logo';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ChartsTab } from '@/components/shared/ChartsTab';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/shared/PasswordInput';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

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
    
    const createDate = (day: number, monthOffset = 0) => {
        const date = new Date(currentYear, currentMonth + monthOffset, day);
        date.setHours(0, 0, 0, 0); // Normalize to start of the day
        return date;
    };

    return [
        { id: 'com1', clientName: 'Global Tech Inc.', amount: 250.00, date: createDate(2), status: 'Pagada' },
        { id: 'com2', clientName: 'Innovate Solutions', amount: 300.50, date: createDate(5), status: 'Pendiente' },
        { id: 'com3', clientName: 'Quantum Industries', amount: 150.75, date: createDate(18, -1), status: 'Pagada' },
        { id: 'com4', clientName: 'Synergy Group', amount: 450.00, date: createDate(12), status: 'Pendiente' },
        { id: 'com5', clientName: 'Global Tech Inc.', amount: 275.00, date: createDate(15), status: 'Pendiente' },
        { id: 'com6', clientName: 'Eco Builders', amount: 500.25, date: createDate(22, -2), status: 'Pagada' },
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
                <div className="relative w-full overflow-auto">
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
                                    <TableCell>{isClient ? format(new Date(client.joinDate), 'dd/MM/yyyy') : '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={client.status === 'Activo' ? 'default' : 'secondary'}>{client.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
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
            const commissionDate = startOfDay(c.date);
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
        const filterByDate = (c: typeof commissions[0]) => {
            const commissionDate = startOfDay(c.date);

            if (dateRange?.from && dateRange?.to) {
                return isWithinInterval(commissionDate, { start: startOfDay(dateRange.from), end: startOfDay(dateRange.to) });
            }
            if (selectedDay) {
                return commissionDate.getTime() === startOfDay(selectedDay).getTime();
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
                        <div className="mt-4 max-h-80 overflow-y-auto">
                            {filteredCommissions.length > 0 ? (
                                <ul className="space-y-2">
                                {filteredCommissions.map(c => (
                                    <li key={c.id} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                                        <div>
                                            <p className="font-semibold">{c.clientName}</p>
                                            <p className="text-xs text-muted-foreground">{isClient ? format(c.date, 'PPP', { locale: es }) : '-'}</p>
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
                    <div className="relative w-full overflow-auto">
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
                                        <TableCell>{isClient ? format(c.date, 'PPP', { locale: es }) : '-'}</TableCell>
                                        <TableCell>${c.amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant={c.status === 'Pagada' ? 'default' : 'secondary'} className={cn(c.status === 'Pagada' ? 'bg-blue-600 text-white' : 'bg-slate-500 text-white')}>{c.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
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

function ProfileView() {
    const { toast } = useToast();

    const handlePasswordChange = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        toast({
            title: "Contraseña Actualizada",
            description: "Tu contraseña ha sido cambiada exitosamente (simulación).",
        });
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Mi Perfil de Promotor</CardTitle>
                <CardDescription>
                    Información de tu cuenta y gestión de seguridad.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label>Nombre Completo</Label>
                    <Input value="Mariana Fernandez" disabled />
                </div>
                 <div className="space-y-2">
                    <Label>Rol</Label>
                    <Input value="Promotor" disabled />
                </div>
                 <div className="space-y-2">
                    <Label>Correo Electrónico</Label>
                    <Input value="mariana.f@email.com" disabled />
                </div>
            </CardContent>
            <Separator />
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-accent" /> Cambiar Contraseña
                </CardTitle>
                <CardDescription>
                    Para mayor seguridad, te recomendamos usar una contraseña única.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <Label htmlFor="currentPassword">Contraseña Actual</Label>
                        <PasswordInput id="currentPassword" placeholder="••••••••" />
                    </div>
                    <div>
                        <Label htmlFor="newPassword">Nueva Contraseña</Label>
                        <PasswordInput id="newPassword" placeholder="••••••••" />
                    </div>
                    <div>
                        <Label htmlFor="confirmNewPassword">Confirmar Nueva Contraseña</Label>
                        <PasswordInput id="confirmNewPassword" placeholder="••••••••" />
                    </div>
                    <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Cambios
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

const navItems = [
    { id: 'clients', label: 'Clientes', icon: Users, component: ClientsView },
    { id: 'commissions', label: 'Comisiones', icon: CircleDollarSign, component: CommissionsView },
    { id: 'charts', label: 'Gráficos', icon: BarChart, component: ChartsTab },
    { id: 'resources', label: 'Recursos', icon: BookText, component: ResourcesView },
];

const profileNavItem = { id: 'profile', label: 'Perfil', icon: User, component: ProfileView };


export default function PromoterPage() {
    const router = useRouter();
    const [activeView, setActiveView] = useState('clients');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const handleLogout = () => {
        router.push('/promoter-login');
    };

    const ActiveComponent = [...navItems, profileNavItem].find(item => item.id === activeView)?.component || ClientsView;
    
    const SidebarContent = () => (
      <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-center border-b">
              <Logo />
          </div>
          <nav className="flex flex-col gap-2 p-4">
              {navItems.map(item => {
                  const Icon = item.icon;
                  return (
                      <Button
                          key={item.id}
                          variant={activeView === item.id ? 'default' : 'ghost'}
                          className="justify-start gap-2"
                          onClick={() => { setActiveView(item.id); setIsMenuOpen(false); }}
                      >
                          <Icon className="h-4 w-4"/>
                          {item.label}
                      </Button>
                  )
              })}
          </nav>
          <div className="mt-auto p-4 border-t">
              <Button
                  key={profileNavItem.id}
                  variant={activeView === profileNavItem.id ? 'default' : 'ghost'}
                  className="justify-start gap-2 w-full mb-2"
                  onClick={() => { setActiveView(profileNavItem.id); setIsMenuOpen(false); }}
              >
                  <User className="h-4 w-4"/>
                  {profileNavItem.label}
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm" className="w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
              </Button>
          </div>
      </div>
    );

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
             <aside className="fixed inset-y-0 left-0 z-10 hidden w-56 flex-col border-r bg-background sm:flex shrink-0">
                <SidebarContent />
            </aside>
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-56">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                        <SheetTrigger asChild>
                            <Button size="icon" variant="outline" className="sm:hidden">
                                <PanelLeft className="h-5 w-5" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="sm:max-w-xs p-0">
                           <SheetTitle className="sr-only">Menú</SheetTitle>
                            <SidebarContent />
                        </SheetContent>
                    </Sheet>
                     <h1 className="text-xl font-semibold md:text-2xl">
                        {([...navItems, profileNavItem].find(item => item.id === activeView)?.label || 'Panel de Promotor')}
                    </h1>
                </header>
                <main className="grid items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 overflow-x-auto">
                    <ActiveComponent />
                </main>
            </div>
        </div>
    );
}

    
