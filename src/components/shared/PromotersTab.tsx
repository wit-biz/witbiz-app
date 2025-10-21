
"use client";

import React from 'react';
import { UserCheck, CircleDollarSign, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Mock Data for Promoters
const promoters = [
    { id: 'p1', name: 'Mariana Fernandez', referredClients: 5, totalCommissions: 1250.50, status: 'Activo' },
    { id: 'p2', name: 'Juan Carlos Bodoque', referredClients: 3, totalCommissions: 850.00, status: 'Activo' },
    { id: 'p3', name: 'Sofía Rodriguez', referredClients: 8, totalCommissions: 2100.75, status: 'Activo' },
    { id: 'p4', name: 'Pedro Pascal', referredClients: 1, totalCommissions: 150.00, status: 'Inactivo' },
];


export function PromotersTab() {

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
            </CardContent>
        </Card>
    );
}
