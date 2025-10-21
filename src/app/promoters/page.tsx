
'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2, Users, CircleDollarSign, Download, CalendarDays, HardDriveDownload, Presentation, Image as ImageIcon, TrendingUp, Info, CalendarIcon, X } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Logo } from '@/components/shared/logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';


// Helper to get dates for the current month
const getCurrentMonthDate = (day: number) => {
    const date = new Date();
    date.setDate(day);
    return format(date, 'yyyy-MM-dd');
};

const getLastMonthDate = (day: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    date.setDate(day);
    return format(date, 'yyyy-MM-dd');
}


// Mock Data
const commissions = [
    { id: 'com1', clientName: 'Innovate Inc.', saleAmount: 500, commission: 50, paymentDate: getLastMonthDate(28), status: 'Pagada' },
    { id: 'com2', clientName: 'Synergy Corp.', saleAmount: 1200, commission: 120, paymentDate: getCurrentMonthDate(2), status: 'Pagada' },
    { id: 'com3', clientName: 'Global Net', saleAmount: 800, commission: 80, paymentDate: getCurrentMonthDate(15), status: 'Pendiente' },
    { id: 'com4', clientName: 'Innovate Inc.', saleAmount: 300, commission: 30, paymentDate: getCurrentMonthDate(25), status: 'Pendiente' },
    { id: 'com5', clientName: 'Solutions LLC', saleAmount: 750, commission: 75, paymentDate: getCurrentMonthDate(15), status: 'Pendiente' },
];

const referredClients = [
    { id: 'c1', name: 'Innovate Inc.', joinDate: getLastMonthDate(15), status: 'Activo' },
    { id: 'c2', name: 'Synergy Corp.', joinDate: getLastMonthDate(20), status: 'Activo' },
    { id: 'c3', name: 'Solutions LLC', joinDate: getCurrentMonthDate(1), status: 'En Proceso' },
    { id: 'c4', name: 'Global Net', joinDate: getCurrentMonthDate(5), status: 'Activo' },
];


const resources = [
    { id: 'r1', name: 'Kit de Logos y Banners', type: 'Zip', icon: HardDriveDownload, description: "Paquete completo con logos en alta resolución y banners para redes sociales." },
    { id: 'r2', name: 'Presentación de Servicios', type: 'PDF', icon: Presentation, description: "Documento PDF detallado con la descripción de todos nuestros servicios." },
    { id: 'r3', name: 'Imágenes Promocionales', type: 'Imágenes', icon: ImageIcon, description: "Galería de imágenes de alta calidad para usar en tus publicaciones." },
];

const monthlyCommissionsData = [
  { month: "Ene", commissions: 186 },
  { month: "Feb", commissions: 305 },
  { month: "Mar", commissions: 237 },
  { month: "Abr", commissions: 173 },
  { month: "May", commissions: 209 },
  { month: "Jun", commissions: 214 },
  { month: "Jul", commissions: 345 },
];

const annualCommissionsData = [
  { year: "2022", commissions: 1250 },
  { year: "2023", commissions: 2430 },
  { year: "2024", commissions: 3890 },
];

const chartConfig = {
  commissions: {
    label: "Comisiones",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export default function PromoterPage() {
    const auth = useAuth();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [isClient, setIsClient] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    
    useEffect(() => {
        setIsClient(true);
        setSelectedDate(new Date());
    }, []);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut(auth);
            router.push('/promoter-login');
        } catch (error) {
            console.error("Error signing out: ", error);
            setIsLoggingOut(false);
        }
    };
    
    const dayModifiers = useMemo(() => {
        if (!isClient) return {};
        const paidDays = commissions.filter(c => c.status === 'Pagada').map(c => new Date(c.paymentDate.replace(/-/g, '/')));
        const pendingDays = commissions.filter(c => c.status === 'Pendiente').map(c => new Date(c.paymentDate.replace(/-/g, '/')));
        return {
            paid: paidDays,
            pending: pendingDays,
        }
    }, [isClient]);

    const dayModifiersClassNames = {
        paid: 'day-paid',
        pending: 'day-pending'
    };

    const commissionsForSelectedDate = useMemo(() => {
        if (!selectedDate || !isClient) return [];
        const selectedDayString = format(selectedDate, 'yyyy-MM-dd');
        return commissions.filter(c => c.paymentDate === selectedDayString);
    }, [selectedDate, isClient]);

    const filteredCommissions = useMemo(() => {
        if (!dateRange || (!dateRange.from && !dateRange.to)) {
            return commissions;
        }
        return commissions.filter(commission => {
            const paymentDate = new Date(commission.paymentDate);
            if (!isValid(paymentDate)) return false;
            
            let isInRange = true;
            if (dateRange.from) {
                isInRange = isInRange && paymentDate >= dateRange.from;
            }
            if (dateRange.to) {
                isInRange = isInRange && paymentDate <= dateRange.to;
            }
            return isInRange;
        });
    }, [dateRange]);


    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
             <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <Logo />
                <Button onClick={handleLogout} variant="outline" size="sm" disabled={isLoggingOut}>
                   {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                    Cerrar Sesión
                </Button>
            </header>
            <main className="flex-1 p-4 md:p-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight">Panel de Promotor</h1>
                        <p className="text-muted-foreground">Bienvenido a tu centro de operaciones. Aquí puedes seguir tu progreso.</p>
                    </div>
                    
                    <Tabs defaultValue="commissions">
                        <TabsList className="grid w-full grid-cols-4 mb-6">
                            <TabsTrigger value="clients"><Users className="mr-2 h-4 w-4"/>Mis Clientes</TabsTrigger>
                            <TabsTrigger value="commissions"><CircleDollarSign className="mr-2 h-4 w-4"/>Mis Comisiones</TabsTrigger>
                            <TabsTrigger value="resources"><Download className="mr-2 h-4 w-4"/>Recursos</TabsTrigger>
                            <TabsTrigger value="stats"><TrendingUp className="mr-2 h-4 w-4"/>Estadísticas</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="clients">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Mis Clientes Referidos</CardTitle>
                                    <CardDescription>Esta es la lista de clientes que has traído a WitBiz.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nombre del Cliente</TableHead>
                                                <TableHead>Fecha de Registro</TableHead>
                                                <TableHead className="text-right">Estado</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {referredClients.map((client) => (
                                                <TableRow key={client.id}>
                                                    <TableCell className="font-medium">{client.name}</TableCell>
                                                    <TableCell>{isClient ? format(new Date(client.joinDate.replace(/-/g, '/')), 'PPP', { locale: es }) : ''}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge variant={client.status === 'Activo' ? 'default' : 'secondary'}>{client.status}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="commissions" className="space-y-6">
                           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                               <div className="lg:col-span-1">
                                   <Card>
                                       <CardHeader>
                                           <CardTitle>Calendario de Pagos</CardTitle>
                                            <CardDescription className="flex items-center gap-x-2 text-xs">
                                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>Pagado</span>
                                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Pendiente</span>
                                            </CardDescription>
                                       </CardHeader>
                                       <CardContent>
                                          <style>
                                            {`
                                                .day-paid { 
                                                    background-color: hsl(var(--primary) / 0.2) !important;
                                                    font-weight: bold;
                                                }
                                                .day-pending { 
                                                    background-color: hsl(210 100% 56% / 0.2) !important; 
                                                }
                                                .rdp-day_today:not([disabled]):not(.day-paid):not(.day-pending) > .rdp-button {
                                                    font-weight: normal;
                                                    background-color: hsl(var(--accent) / 0.5);
                                                }
                                            `}
                                          </style>
                                          {!isClient ? (
                                              <div className="flex justify-center items-center p-4">
                                                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                              </div>
                                          ) : (
                                            <Calendar
                                                mode="single"
                                                selected={selectedDate}
                                                onSelect={setSelectedDate}
                                                className="rounded-md border p-0"
                                                locale={es}
                                                modifiers={dayModifiers}
                                                modifiersClassNames={dayModifiersClassNames}
                                            />
                                          )}
                                       </CardContent>
                                   </Card>
                               </div>
                               <div className="lg:col-span-2">
                                   <Card className="min-h-full">
                                       <CardHeader>
                                            <CardTitle>
                                              Detalles del {selectedDate && isClient ? format(selectedDate, 'PPP', { locale: es }) : 'día'}
                                            </CardTitle>
                                       </CardHeader>
                                       <CardContent>
                                            {commissionsForSelectedDate.length > 0 ? (
                                                <ul className="space-y-3">
                                                    {commissionsForSelectedDate.map(c => (
                                                        <li key={c.id} className="flex items-center justify-between p-3 border rounded-md">
                                                            <div>
                                                                <p className="font-semibold">{c.clientName}</p>
                                                                <p className="text-sm text-muted-foreground">${c.commission.toFixed(2)}</p>
                                                            </div>
                                                            <Badge variant={c.status === 'Pagada' ? 'default' : 'secondary'} className={cn(
                                                                c.status === 'Pagada' && 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                                                                c.status === 'Pendiente' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                                                            )}>{c.status}</Badge>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className="text-center text-muted-foreground py-10">
                                                    <CalendarDays className="mx-auto h-12 w-12 mb-4" />
                                                    <p>No hay pagos para esta fecha.</p>
                                                </div>
                                            )}
                                       </CardContent>
                                   </Card>
                               </div>
                           </div>
                           <Card>
                                <CardHeader>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <CardTitle>Historial de Comisiones</CardTitle>
                                            <CardDescription>Visualiza todas tus comisiones pagadas y pendientes.</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-[240px] justify-start text-left font-normal",
                                                            !dateRange && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {dateRange?.from ? (
                                                            dateRange.to ? (
                                                                <>
                                                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                                                    {format(dateRange.to, "LLL dd, y")}
                                                                </>
                                                            ) : (
                                                                format(dateRange.from, "LLL dd, y")
                                                            )
                                                        ) : (
                                                            <span>Seleccionar rango</span>
                                                        )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="end">
                                                    <Calendar
                                                        initialFocus
                                                        mode="range"
                                                        defaultMonth={dateRange?.from}
                                                        selected={dateRange}
                                                        onSelect={setDateRange}
                                                        numberOfMonths={2}
                                                        locale={es}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            {dateRange && (
                                                <Button variant="ghost" size="icon" onClick={() => setDateRange(undefined)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Cliente</TableHead>
                                                <TableHead>Monto Venta</TableHead>
                                                <TableHead>Comisión</TableHead>
                                                <TableHead>Fecha de Pago</TableHead>
                                                <TableHead className="text-right">Estado</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredCommissions.map(c => (
                                                <TableRow key={c.id}>
                                                    <TableCell className="font-medium">{c.clientName}</TableCell>
                                                    <TableCell>${c.saleAmount.toFixed(2)}</TableCell>
                                                    <TableCell className="font-semibold">${c.commission.toFixed(2)}</TableCell>
                                                    <TableCell>{isClient ? format(new Date(c.paymentDate.replace(/-/g, '/')), 'PPP', { locale: es }) : ''}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge variant={c.status === 'Pagada' ? 'default' : 'secondary'}  className={cn(
                                                            c.status === 'Pagada' && 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                                                            c.status === 'Pendiente' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                                                        )}>{c.status}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                     {filteredCommissions.length === 0 && (
                                        <div className="text-center text-muted-foreground py-10">
                                            <Info className="mx-auto h-12 w-12 mb-4" />
                                            <p>No se encontraron comisiones en el rango de fechas seleccionado.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="resources">
                             <Card>
                                <CardHeader>
                                    <CardTitle>Recursos para Promotores</CardTitle>
                                    <CardDescription>Material de marketing y recursos para ayudarte a atraer más clientes.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                   {resources.map(resource => (
                                        <div key={resource.id} className="p-4 border rounded-lg flex flex-col items-start gap-3">
                                            <resource.icon className="h-8 w-8 text-accent"/>
                                            <h3 className="font-semibold">{resource.name}</h3>
                                            <p className="text-xs text-muted-foreground flex-grow">{resource.description}</p>
                                            <Button variant="outline" size="sm" className="w-full mt-2">
                                                <Download className="mr-2 h-4 w-4"/>
                                                Descargar ({resource.type})
                                            </Button>
                                        </div>
                                   ))}
                                </CardContent>
                            </Card>
                        </TabsContent>

                         <TabsContent value="stats" className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                               <Card>
                                    <CardHeader>
                                        <CardTitle>Comisiones (Mes Actual)</CardTitle>
                                        <CardDescription>Total de comisiones generadas este mes.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-4xl font-bold">$455.00</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Comisiones (Total Anual)</CardTitle>
                                        <CardDescription>Total de comisiones generadas en 2024.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-4xl font-bold">$3,890.00</p>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="grid gap-6 lg:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Comisiones Mensuales (2024)</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ChartContainer config={chartConfig} className="w-full h-[250px]">
                                            <BarChart accessibilityLayer data={monthlyCommissionsData}>
                                                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                                                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                                <ChartTooltip
                                                    cursor={false}
                                                    content={<ChartTooltipContent indicator="dot" />}
                                                />
                                                <Bar dataKey="commissions" fill="var(--color-commissions)" radius={4} />
                                            </BarChart>
                                        </ChartContainer>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Ganancias Anuales</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ChartContainer config={chartConfig} className="w-full h-[250px]">
                                            <BarChart accessibilityLayer data={annualCommissionsData}>
                                                 <XAxis dataKey="year" tickLine={false} tickMargin={10} axisLine={false} />
                                                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                                                <ChartTooltip
                                                    cursor={false}
                                                    content={<ChartTooltipContent indicator="dot" />}
                                                />
                                                <Bar dataKey="commissions" fill="var(--color-commissions)" radius={4} />
                                            </BarChart>
                                        </ChartContainer>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                    </Tabs>
                </div>
            </main>
        </div>
    );
}
