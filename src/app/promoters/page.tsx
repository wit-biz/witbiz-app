'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DateRange } from 'react-day-picker';
import { format, isWithinInterval, startOfDay, endOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { LogOut, Users, CircleDollarSign, BookText, Download, BarChart, User, Save, KeyRound, PanelLeft, Loader2, TrendingUp, DollarSign, UserCheck, Home, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/shared/logo';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCRMData } from '@/contexts/CRMDataContext';
import { type Document, type Promoter, type Client, type Transaction } from '@/lib/types';

// --- Helper to calculate promoter commissions from transactions ---
function usePromoterData(promoterId: string) {
    const { getClientsByPromoterId, transactions, serviceWorkflows } = useCRMData();
    
    const referredClients = getClientsByPromoterId(promoterId);
    const clientIds = referredClients.map(c => c.id);
    
    // Get all transactions related to this promoter's clients
    const promoterTransactions = useMemo(() => {
        if (!transactions) return [];
        return transactions.filter(t => 
            t.clientId && clientIds.includes(t.clientId) && t.type === 'income'
        );
    }, [transactions, clientIds]);
    
    // Calculate commissions (assuming 10% default commission rate)
    const commissions = useMemo(() => {
        return promoterTransactions.map(t => {
            const client = referredClients.find(c => c.id === t.clientId);
            const promoterRef = client?.promoters?.find(p => p.promoterId === promoterId);
            const commissionRate = promoterRef?.percentage || 10;
            const commissionAmount = (t.amount * commissionRate) / 100;
            
            return {
                id: t.id,
                date: t.date,
                clientId: t.clientId,
                clientName: t.clientName || client?.name || 'Cliente',
                transactionAmount: t.amount,
                commissionRate,
                commissionAmount,
                description: t.description,
            };
        });
    }, [promoterTransactions, referredClients, promoterId]);
    
    const totalCommissions = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const totalTransactions = promoterTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    return {
        referredClients,
        commissions,
        totalCommissions,
        totalTransactions,
        clientCount: referredClients.length,
        activeClientCount: referredClients.filter(c => c.status === 'Activo').length,
    };
}

// --- Dashboard View ---
function DashboardView({ promoterId, promoterName }: { promoterId: string; promoterName: string }) {
    const { referredClients, commissions, totalCommissions, totalTransactions, clientCount, activeClientCount } = usePromoterData(promoterId);
    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
        setIsClient(true);
    }, []);
    
    // Recent commissions (last 5)
    const recentCommissions = commissions.slice(0, 5);
    
    // This month stats
    const thisMonth = new Date();
    const thisMonthCommissions = commissions.filter(c => {
        const date = new Date(c.date);
        return date.getMonth() === thisMonth.getMonth() && date.getFullYear() === thisMonth.getFullYear();
    });
    const thisMonthTotal = thisMonthCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">¡Bienvenido, {promoterName}!</h2>
                            <p className="text-muted-foreground">Aquí está el resumen de tu actividad como promotor.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Clientes Referidos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{clientCount}</div>
                        <p className="text-xs text-muted-foreground">{activeClientCount} activos</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Comisiones Totales</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">${totalCommissions.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">De ${totalTransactions.toLocaleString('es-MX')} en ventas</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">${thisMonthTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">{thisMonthCommissions.length} transacciones</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Tasa Promedio</CardTitle>
                        <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {commissions.length > 0 
                                ? (commissions.reduce((sum, c) => sum + c.commissionRate, 0) / commissions.length).toFixed(1)
                                : '10'}%
                        </div>
                        <p className="text-xs text-muted-foreground">Comisión por venta</p>
                    </CardContent>
                </Card>
            </div>
            
            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Actividad Reciente</CardTitle>
                    <CardDescription>Últimas comisiones generadas</CardDescription>
                </CardHeader>
                <CardContent>
                    {recentCommissions.length > 0 ? (
                        <div className="space-y-3">
                            {recentCommissions.map(c => (
                                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <div>
                                        <p className="font-medium">{c.clientName}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {isClient ? format(new Date(c.date), 'dd MMM yyyy', { locale: es }) : '-'} • {c.description}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">+${c.commissionAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                                        <p className="text-xs text-muted-foreground">{c.commissionRate}% de ${c.transactionAmount.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <CircleDollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Aún no tienes comisiones registradas.</p>
                            <p className="text-sm">¡Refiere clientes para empezar a ganar!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// --- Clients View ---
function ClientsView({ promoterId }: { promoterId: string }) {
    const { referredClients } = usePromoterData(promoterId);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Mis Clientes Referidos
                </CardTitle>
                <CardDescription>
                    Tienes {referredClients.length} cliente{referredClients.length !== 1 ? 's' : ''} referido{referredClients.length !== 1 ? 's' : ''}.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative w-full overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Fecha de Ingreso</TableHead>
                                <TableHead>Servicios</TableHead>
                                <TableHead>Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {referredClients.length > 0 ? referredClients.map(client => (
                                <TableRow key={client.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <UserCheck className="h-4 w-4 text-primary" />
                                            </div>
                                            <span className="font-medium">{client.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{isClient && client.createdAt ? format(client.createdAt.toDate(), 'dd/MM/yyyy') : '-'}</TableCell>
                                    <TableCell>{client.subscribedServiceIds?.length || 0} servicio(s)</TableCell>
                                    <TableCell>
                                        <Badge variant={client.status === 'Activo' ? 'default' : 'secondary'}>{client.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        <div className="text-muted-foreground">
                                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p>Aún no tienes clientes referidos.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

function CommissionsView({ promoterId }: { promoterId: string }) {
    const { commissions, totalCommissions } = usePromoterData(promoterId);
    const [isClient, setIsClient] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Filter commissions by date range
    const filteredCommissions = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) return commissions;
        return commissions.filter(c => {
            const date = new Date(c.date);
            return isWithinInterval(date, { 
                start: startOfDay(dateRange.from!), 
                end: endOfDay(dateRange.to!) 
            });
        });
    }, [commissions, dateRange]);

    const filteredTotal = filteredCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);

    // Group by month for summary
    const monthlyData = useMemo(() => {
        const grouped: { [key: string]: number } = {};
        commissions.forEach(c => {
            const monthKey = format(new Date(c.date), 'yyyy-MM');
            grouped[monthKey] = (grouped[monthKey] || 0) + c.commissionAmount;
        });
        return Object.entries(grouped)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 6)
            .map(([month, total]) => ({
                month: format(new Date(month + '-01'), 'MMM yyyy', { locale: es }),
                total,
            }));
    }, [commissions]);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Histórico</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            ${totalCommissions.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">{commissions.length} comisiones</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Período Seleccionado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            ${filteredTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">{filteredCommissions.length} comisiones</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Promedio por Comisión</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${commissions.length > 0 
                                ? (totalCommissions / commissions.length).toLocaleString('es-MX', { minimumFractionDigits: 2 })
                                : '0.00'}
                        </div>
                        <p className="text-xs text-muted-foreground">Por transacción</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar Filter */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Filtrar por Fecha</CardTitle>
                        <CardDescription>Selecciona un rango de fechas</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        {isClient && (
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={setDateRange}
                                className="rounded-md border"
                                locale={es}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Monthly Summary */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Resumen Mensual</CardTitle>
                        <CardDescription>Últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {monthlyData.length > 0 ? (
                            <div className="space-y-3">
                                {monthlyData.map((m, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <span className="text-sm font-medium capitalize">{m.month}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-green-500 rounded-full"
                                                    style={{ width: `${Math.min((m.total / (monthlyData[0]?.total || 1)) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-bold w-24 text-right">
                                                ${m.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">Sin datos</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Table */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Detalle de Comisiones</CardTitle>
                            <CardDescription>
                                {filteredCommissions.length} registro{filteredCommissions.length !== 1 ? 's' : ''} en el período
                            </CardDescription>
                        </div>
                        {dateRange && (
                            <Button variant="outline" size="sm" onClick={() => setDateRange(undefined)}>
                                Ver todo
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Venta</TableHead>
                                    <TableHead>Tasa</TableHead>
                                    <TableHead className="text-right">Comisión</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCommissions.length > 0 ? filteredCommissions.map(c => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-medium">{c.clientName}</TableCell>
                                        <TableCell>{isClient ? format(new Date(c.date), 'dd/MM/yyyy') : '-'}</TableCell>
                                        <TableCell>${c.transactionAmount.toLocaleString('es-MX')}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{c.commissionRate}%</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-green-600">
                                            +${c.commissionAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            <div className="text-muted-foreground">
                                                <CircleDollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p>No hay comisiones en este período.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function ResourcesView({ promoterId }: { promoterId: string }) {
    const { getDocumentsByPromoterId } = useCRMData();
    const { toast } = useToast();

    const resources = getDocumentsByPromoterId(promoterId);

    const handleDownload = (doc: Document) => {
        if (doc.downloadURL) {
            window.open(doc.downloadURL, '_blank');
        } else {
             toast({
                variant: "destructive",
                title: "Error",
                description: "Este documento no tiene una URL de descarga válida."
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookText className="h-5 w-5" />
                    Recursos y Materiales
                </CardTitle>
                <CardDescription>Material de apoyo exclusivo para promotores.</CardDescription>
            </CardHeader>
            <CardContent>
                {resources.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {resources.map(resource => (
                            <Card key={resource.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleDownload(resource)}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <BookText className="h-4 w-4 text-primary"/>
                                        {resource.name}
                                    </CardTitle>
                                    <CardDescription className="text-xs">{resource.type}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button size="sm" className="w-full">
                                        <Download className="mr-2 h-4 w-4" />
                                        Descargar
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <BookText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No hay recursos disponibles en este momento.</p>
                        <p className="text-sm">Pronto agregaremos materiales de apoyo.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function ProfileView({ promoter, onUpdateCode }: { promoter: Promoter; onUpdateCode: (newCode: string) => Promise<boolean> }) {
    const { toast } = useToast();
    // Use promoter data directly from props (no auth required)
    const clientCount = promoter.referredClients || 0;
    const totalCommissions = promoter.totalCommissions || 0;
    
    const [currentCode, setCurrentCode] = useState('');
    const [newCode, setNewCode] = useState('');
    const [confirmCode, setConfirmCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCurrentCode, setShowCurrentCode] = useState(false);
    const [showNewCode, setShowNewCode] = useState(false);

    const handleCodeChange = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (currentCode !== promoter.accessCode) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "El código actual no es correcto.",
            });
            return;
        }
        
        if (newCode.length !== 6 || !/^\d+$/.test(newCode)) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "El nuevo código debe ser de 6 dígitos numéricos.",
            });
            return;
        }
        
        if (newCode !== confirmCode) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Los códigos nuevos no coinciden.",
            });
            return;
        }
        
        setIsSubmitting(true);
        const success = await onUpdateCode(newCode);
        
        if (success) {
            toast({
                title: "Código Actualizado",
                description: "Tu código de acceso ha sido cambiado exitosamente.",
            });
            setCurrentCode('');
            setNewCode('');
            setConfirmCode('');
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo actualizar el código. Intenta de nuevo.",
            });
        }
        setIsSubmitting(false);
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Profile Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Mi Perfil
                    </CardTitle>
                    <CardDescription>
                        Información de tu cuenta como promotor.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">{promoter.name}</h3>
                            <p className="text-sm text-muted-foreground">Promotor desde {promoter.createdAt ? format(typeof promoter.createdAt.toDate === 'function' ? promoter.createdAt.toDate() : new Date(promoter.createdAt._seconds * 1000), 'MMMM yyyy', { locale: es }) : 'N/A'}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nombre Completo</Label>
                            <Input value={promoter.name} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Estado</Label>
                            <Input value={promoter.status} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Correo Electrónico</Label>
                            <Input value={promoter.email || 'No especificado'} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Teléfono</Label>
                            <Input value={promoter.phone || 'No especificado'} disabled />
                        </div>
                    </div>
                    
                    {/* Stats Summary */}
                    <Separator className="my-4" />
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold text-primary">{clientCount}</p>
                            <p className="text-xs text-muted-foreground">Clientes Referidos</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">${totalCommissions.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</p>
                            <p className="text-xs text-muted-foreground">Comisiones Totales</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{promoter.status === 'Activo' ? '✓' : '✗'}</p>
                            <p className="text-xs text-muted-foreground">Cuenta Activa</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* Change Access Code Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-primary" />
                        Cambiar Código de Acceso
                    </CardTitle>
                    <CardDescription>
                        Tu código de acceso es de 6 dígitos. Úsalo para iniciar sesión en el portal de promotores.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCodeChange} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentCode">Código Actual</Label>
                            <div className="relative">
                                <Input 
                                    id="currentCode" 
                                    type={showCurrentCode ? "text" : "password"}
                                    placeholder="••••••"
                                    value={currentCode}
                                    onChange={(e) => setCurrentCode(e.target.value)}
                                    maxLength={6}
                                    disabled={isSubmitting}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full"
                                    onClick={() => setShowCurrentCode(!showCurrentCode)}
                                >
                                    {showCurrentCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newCode">Nuevo Código (6 dígitos)</Label>
                            <div className="relative">
                                <Input 
                                    id="newCode" 
                                    type={showNewCode ? "text" : "password"}
                                    placeholder="••••••"
                                    value={newCode}
                                    onChange={(e) => setNewCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    maxLength={6}
                                    disabled={isSubmitting}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full"
                                    onClick={() => setShowNewCode(!showNewCode)}
                                >
                                    {showNewCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmCode">Confirmar Nuevo Código</Label>
                            <Input 
                                id="confirmCode" 
                                type="password"
                                placeholder="••••••"
                                value={confirmCode}
                                onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength={6}
                                disabled={isSubmitting}
                            />
                        </div>
                        <Button type="submit" disabled={isSubmitting || !currentCode || !newCode || !confirmCode}>
                            {isSubmitting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Guardar Nuevo Código
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}


function PromoterPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [activeView, setActiveView] = useState('dashboard');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isValidPromoter, setIsValidPromoter] = useState<boolean | null>(null);
    const [currentPromoter, setCurrentPromoter] = useState<Promoter | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const promoterId = searchParams.get('promoterId');
    
    // Fetch promoter data via API (no auth required)
    useEffect(() => {
        const fetchPromoter = async () => {
            if (!promoterId) {
                setIsValidPromoter(false);
                setIsLoading(false);
                return;
            }
            
            try {
                const response = await fetch(`/api/promoter-data?id=${promoterId}`);
                const data = await response.json();
                
                if (data.success && data.promoter) {
                    setCurrentPromoter(data.promoter);
                    setIsValidPromoter(true);
                } else {
                    setIsValidPromoter(false);
                }
            } catch (error) {
                console.error('Error fetching promoter:', error);
                setIsValidPromoter(false);
            }
            setIsLoading(false);
        };
        
        fetchPromoter();
    }, [promoterId]);
    
    useEffect(() => {
        if (!isLoading && isValidPromoter === false) {
            toast({
                variant: 'destructive',
                title: 'Acceso Denegado',
                description: 'ID de promotor inválido o inactivo.',
            });
            router.replace('/promoter-login');
        }
    }, [isValidPromoter, isLoading, router, toast]);

    const handleLogout = () => {
        router.push('/promoter-login');
    };
    
    const handleUpdateCode = async (newCode: string): Promise<boolean> => {
        if (!currentPromoter) return false;
        try {
            const response = await fetch('/api/promoter-data', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ promoterId: currentPromoter.id, accessCode: newCode }),
            });
            const data = await response.json();
            if (data.success) {
                setCurrentPromoter(prev => prev ? { ...prev, accessCode: newCode } : null);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating code:', error);
            return false;
        }
    };
    
    if (isValidPromoter === null || !currentPromoter) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const navItems = [
        { id: 'dashboard', label: 'Inicio', icon: Home, component: () => <DashboardView promoterId={currentPromoter.id} promoterName={currentPromoter.name} /> },
        { id: 'clients', label: 'Clientes', icon: Users, component: () => <ClientsView promoterId={currentPromoter.id} /> },
        { id: 'commissions', label: 'Comisiones', icon: CircleDollarSign, component: () => <CommissionsView promoterId={currentPromoter.id} /> },
        { id: 'resources', label: 'Recursos', icon: BookText, component: () => <ResourcesView promoterId={currentPromoter.id} /> },
    ];
    const profileNavItem = { id: 'profile', label: 'Perfil', icon: User, component: () => <ProfileView promoter={currentPromoter} onUpdateCode={handleUpdateCode} /> };

    const ActiveComponent = [...navItems, profileNavItem].find(item => item.id === activeView)?.component;
    
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
                    {ActiveComponent && <ActiveComponent />}
                </main>
            </div>
        </div>
    );
}

export default function PromoterPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <PromoterPageContent />
        </Suspense>
    );
}

    
