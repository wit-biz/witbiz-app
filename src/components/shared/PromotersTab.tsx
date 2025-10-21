
"use client";

import React from 'react';
import { UserCheck, CircleDollarSign, PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type Promoter } from '@/lib/types';


interface PromotersTabProps {
    promoters: Promoter[];
    isLoading: boolean;
}

export function PromotersTab({ promoters, isLoading }: PromotersTabProps) {

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Listado de Promotores</CardTitle>
                    <CardDescription>
                       Personas que generan comisiones al referir clientes.
                    </CardDescription>
                </div>
                <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Promotor
                </Button>
            </CardHeader>
            <CardContent>
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
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {promoters.map((promoter) => (
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
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
