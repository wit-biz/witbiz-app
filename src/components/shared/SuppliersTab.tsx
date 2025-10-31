
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

type Supplier = {
  id: string;
  name: string;
  contact: string;
  service: string;
};

const suppliers: Supplier[] = [
  { id: 'sup1', name: 'OfiSupply S.A.', contact: 'info@ofisupply.com', service: 'Papelería y Oficina' },
  { id: 'sup2', name: 'Tech Solutions', contact: 'ventas@techsol.com', service: 'Soporte TI' },
  { id: 'sup3', name: 'Limpieza Express', contact: 'contacto@limpex.com', service: 'Limpieza' },
  { id: 'sup4', name: 'Café del Bueno', contact: 'pedidos@cafedelbueno.com', service: 'Cafetería' },
];

export function SuppliersTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');

  const services = useMemo(() => {
    const allServices = suppliers.map(s => s.service);
    return [...new Set(allServices)];
  }, []);

  const filteredSuppliers = useMemo(() => {
    let filtered = suppliers;

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(lowerSearchTerm) ||
        s.contact.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (serviceFilter !== 'all') {
      filtered = filtered.filter(s => s.service === serviceFilter);
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [searchTerm, serviceFilter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proveedores</CardTitle>
        <CardDescription>Lista de proveedores de bienes y servicios.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nombre o contacto..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder="Filtrar por servicio..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos los Servicios</SelectItem>
                    {services.map(service => (
                        <SelectItem key={service} value={service}>{service}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="relative w-full overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre del Proveedor</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Servicio/Producto</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredSuppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                            <TableCell className="font-medium">{supplier.name}</TableCell>
                            <TableCell>{supplier.contact}</TableCell>
                            <TableCell>{supplier.service}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
        {filteredSuppliers.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                No se encontraron proveedores que coincidan con los filtros.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
