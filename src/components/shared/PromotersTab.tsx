

"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { UserCheck, CircleDollarSign, Loader2, Search, FilterX, Edit3, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Promoter } from '@/lib/types';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AddPromoterDialog } from './AddPromoterDialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDateString } from '@/lib/utils';

interface PromotersTabProps {
    promoters: Promoter[];
    isLoading: boolean;
    showActions?: boolean;
    onUpdate?: (promoter: Promoter) => Promise<void>;
    onDelete?: (promoterId: string) => Promise<boolean>;
    onPromoterSelect?: (promoter: Promoter) => void;
    selectedPromoterId?: string | null;
}

export function PromotersTab({ 
    promoters, 
    isLoading, 
    showActions = false, 
    onUpdate, 
    onDelete,
    onPromoterSelect,
    selectedPromoterId
}: PromotersTabProps) {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name-asc');
    
    const [editDialogState, setEditDialogState] = useState<{ open: boolean; promoter: Promoter | null }>({ open: false, promoter: null });
    const [promoterToDelete, setPromoterToDelete] = useState<Promoter | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const handleEditClick = useCallback((e: React.MouseEvent, promoter: Promoter) => {
        e.stopPropagation();
        setEditDialogState({ open: true, promoter });
    }, []);

    const openDeleteConfirmation = useCallback((e: React.MouseEvent, promoter: Promoter) => {
        e.stopPropagation();
        setPromoterToDelete(promoter);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!promoterToDelete || !onDelete) return;
        setIsDeleting(true);
        const success = await onDelete(promoterToDelete.id);
        if (success) {
            toast({ title: "Promotor eliminado", description: `El promotor "${promoterToDelete.name}" ha sido eliminado.` });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar al promotor.' });
        }
        setIsDeleting(false);
        setPromoterToDelete(null);
    }, [promoterToDelete, onDelete, toast]);

    const handleEditSave = async (updatedPromoter: Promoter) => {
        if (!onUpdate) return;
        await onUpdate(updatedPromoter);
        setEditDialogState({ open: false, promoter: null });
    };
    
    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setSortBy('name-asc');
    };
    
    const handleRowClick = (promoter: Promoter) => {
        if (onPromoterSelect) {
            onPromoterSelect(promoter);
        }
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
                                        <TableHead>Fecha de Inicio</TableHead>
                                        <TableHead>Estado</TableHead>
                                        {showActions && <TableHead className="text-right">Acciones</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAndSortedPromoters.length > 0 ? filteredAndSortedPromoters.map((promoter) => (
                                        <TableRow 
                                            key={promoter.id}
                                            onClick={() => handleRowClick(promoter)}
                                            className={cn(
                                                onPromoterSelect ? 'cursor-pointer' : 'cursor-default',
                                                selectedPromoterId === promoter.id && "bg-secondary hover:bg-secondary/90"
                                            )}
                                        >
                                            <TableCell className="font-medium">{promoter.name}</TableCell>
                                            <TableCell>{promoter.createdAt ? formatDateString(promoter.createdAt.toDate()) : 'N/A'}</TableCell>
                                            <TableCell>
                                                <Badge variant={promoter.status === 'Activo' ? 'default' : 'secondary'}>{promoter.status}</Badge>
                                            </TableCell>
                                            {showActions && (
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={(e) => handleEditClick(e, promoter)}>
                                                        <Edit3 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => openDeleteConfirmation(e, promoter)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={showActions ? 4 : 3} className="text-center h-24">
                                                No hay promotores que mostrar.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                     {filteredAndSortedPromoters.length === 0 && !isLoading && (searchTerm || statusFilter !== 'all') && (
                        <div className="text-center py-10 text-muted-foreground">
                            No se encontraron promotores que coincidan con la búsqueda.
                        </div>
                    )}
                </CardContent>
            </Card>

             {editDialogState.open && (
                <AddPromoterDialog
                    isOpen={editDialogState.open}
                    onClose={() => setEditDialogState({ open: false, promoter: null })}
                    promoter={editDialogState.promoter}
                    onSave={handleEditSave}
                />
            )}

            <AlertDialog open={!!promoterToDelete} onOpenChange={(open) => !open && setPromoterToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. ¿Está seguro de que desea eliminar al promotor "{promoterToDelete?.name}"?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPromoterToDelete(null)} disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                            {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...</> : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </TooltipProvider>
    );
}
