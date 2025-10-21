
'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2, Users, CircleDollarSign, Download, CalendarDays, HardDriveDownload, Presentation, Image as ImageIcon, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Logo } from '@/components/shared/logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"


// Mock Data
const referredClients = [
    { id: 'c1', name: 'Innovate Inc.', joinDate: '2024-05-15', status: 'Activo' },
    { id: 'c2', name: 'Synergy Corp.', joinDate: '2024-05-20', status: 'Activo' },
    { id: 'c3', name: 'Solutions LLC', joinDate: '2024-06-01', status: 'En Proceso' },
    { id: 'c4', name: 'Global Net', joinDate: '2024-06-10', status: 'Activo' },
];

const commissions = [
    { id: 'com1', clientName: 'Innovate Inc.', saleAmount: 500, commission: 50, paymentDate: '2024-06-02', status: 'Pagada' },
    { id: 'com2', clientName: 'Synergy Corp.', saleAmount: 1200, commission: 120, paymentDate: '2024-06-16', status: 'Pagada' },
    { id: 'com3', clientName: 'Global Net', saleAmount: 800, commission: 80, paymentDate: '2024-07-02', status: 'Pendiente' },
    { id: 'com4', clientName: 'Innovate Inc.', saleAmount: 300, commission: 30, paymentDate: '2024-07-02', status: 'Pendiente' },
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
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    const paymentDays = commissions.filter(c => c.status === 'Pagada').map(c => new Date(c.paymentDate));
    const pendingPaymentDays = commissions.filter(c => c.status === 'Pendiente').map(c => new Date(c.paymentDate));

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
                <div className="mx-auto max-w-6xl">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight">Panel de Promotor</h1>
                        <p className="text-muted-foreground">Bienvenido a tu centro de operaciones. Aquí puedes seguir tu progreso.</p>
                    </div>
                    
                    <Tabs defaultValue="clients">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
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
                                            {referredClients.map(client => (
                                                <TableRow key={client.id}>
                                                    <TableCell className="font-medium">{client.name}</TableCell>
                                                    <TableCell>{isClient ? new Date(client.joinDate).toLocaleDateString() : ''}</TableCell>
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

                        <TabsContent value="commissions">
                             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2">
                                     <Card>
                                        <CardHeader>
                                            <CardTitle>Historial de Comisiones</CardTitle>
                                            <CardDescription>Detalle de las comisiones generadas por tus clientes.</CardDescription>
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
                                                    {commissions.map(com => (
                                                        <TableRow key={com.id}>
                                                            <TableCell className="font-medium">{com.clientName}</TableCell>
                                                            <TableCell>${com.saleAmount.toFixed(2)}</TableCell>
                                                            <TableCell className="font-semibold text-green-600">${com.commission.toFixed(2)}</TableCell>
                                                            <TableCell>{isClient ? new Date(com.paymentDate).toLocaleDateString() : ''}</TableCell>
                                                            <TableCell className="text-right">
                                                                <Badge variant={com.status === 'Pagada' ? 'default' : 'outline'}>{com.status}</Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </div>
                                <div className="lg:col-span-1">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-accent"/>Calendario de Pagos</CardTitle>
                                            <CardDescription>Pagos realizados (verde) y pendientes (amarillo).</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex justify-center">
                                             {isClient ? (
                                                <Calendar
                                                    mode="single"
                                                    selected={date}
                                                    onSelect={setDate}
                                                    className="rounded-md border"
                                                    modifiers={{ paid: paymentDays, pending: pendingPaymentDays }}
                                                    modifiersClassNames={{
                                                        paid: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
                                                        pending: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                                                    }}
                                                />
                                             ) : (
                                                <div className="p-3 rounded-md border w-[280px] h-[321px] flex items-center justify-center">
                                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                </div>
                                             )}
                                        </CardContent>
                                    </Card>
                                </div>
                             </div>
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
