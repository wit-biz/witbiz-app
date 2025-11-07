
"use client";

import React, { useState, useMemo } from 'react';
import { UserCheck, CircleDollarSign, Loader2, Search, FilterX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Promoter } from '@/lib/types';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';


interface PromotersTabProps {
    promoters: Promoter[];
    isLoading: boolean;
}

export function PromotersTab({ promoters, isLoading }: PromotersTabProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name-asc');
    
    const filteredAndSortedPromoters = useMemo(() => {
        let filtered = promoters;

        if (searchTerm) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(p => p.status === statusFilter);
        }

        switch (sortBy) {
            case 'commissions-desc':
                return filtered.sort((a, b) => b.totalCommissions - a.totalCommissions);
            case 'clients-desc':
                return filtered.sort((a, b) => b.referredClients - a.referredClients);
            case 'name-asc':
            default:
                return filtered.sort((a, b) => a.name.localeCompare(b.name));
        }

    }, [promoters, searchTerm, statusFilter, sortBy]);

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setSortBy('name-asc');
    };

    return (
        <TooltipProvider>
            <Card>
                <CardHeader>
                    <CardTitle>Listado de Promotores</CardTitle>
                    <CardDescription>
                       Personas que generan comisiones al referir clientes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full sm:w-[220px]">
                                <SelectValue placeholder="Ordenar por..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
                                <SelectItem value="commissions-desc">Mayor Comisión</SelectItem>
                                <SelectItem value="clients-desc">Más Clientes Referidos</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filtrar por estado..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Estados</SelectItem>
                                <SelectItem value="Activo">Activo</SelectItem>
                                <SelectItem value="Inactivo">Inactivo</SelectItem>
                            </SelectContent>
                        </Select>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={clearFilters}>
                                    <FilterX className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Limpiar filtros</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre del Promotor</TableHead>
                                        <TableHead className="text-center">Clientes Referidos</TableHead>
                                        <TableHead>Comisiones Generadas</TableHead>
                                        <TableHead>Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAndSortedPromoters.map((promoter) => (
                                        <TableRow key={promoter.id}>
                                            <TableCell className="font-medium">{promoter.name}</TableCell>
                                            <TableCell className="text-center">{promoter.referredClients}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <CircleDollarSign className="h-4 w-4 mr-2 text-green-500"/>
                                                    <span>${promoter.totalCommissions.toFixed(2)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={promoter.status === 'Activo' ? 'default' : 'secondary'}>{promoter.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                     {filteredAndSortedPromoters.length === 0 && !isLoading && (
                        <div className="text-center py-10 text-muted-foreground">
                            No se encontraron promotores que coincidan con los filtros.
                        </div>
                    )}
                </CardContent>
            </Card>
        </TooltipProvider>
    );
}
