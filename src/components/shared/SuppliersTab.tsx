
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Edit3, Trash2, Loader2 } from "lucide-react";
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AddSupplierDialog } from './AddSupplierDialog';
import { useToast } from '@/hooks/use-toast';

type Supplier = {
  id: string;
  name: string;
  contact: string;
  service: string;
};

interface SuppliersTabProps {
    suppliers: Supplier[];
    setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
    showActions?: boolean;
}

export function SuppliersTab({ suppliers, setSuppliers, showActions = false }: SuppliersTabProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');

  const [editDialogState, setEditDialogState] = useState<{ open: boolean; supplier: Supplier | null }>({ open: false, supplier: null });
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const services = useMemo(() => {
    const allServices = suppliers.map(s => s.service);
    return [...new Set(allServices)];
  }, [suppliers]);

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
  }, [suppliers, searchTerm, serviceFilter]);

  const handleEditClick = useCallback((supplier: Supplier) => {
    setEditDialogState({ open: true, supplier });
  }, []);

  const openDeleteConfirmation = useCallback((supplier: Supplier) => {
    setSupplierToDelete(supplier);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!supplierToDelete) return;
    setIsDeleting(true);
    // Simulate API call
    setTimeout(() => {
      setSuppliers(prev => prev.filter(s => s.id !== supplierToDelete.id));
      toast({ title: "Proveedor eliminado", description: `El proveedor "${supplierToDelete.name}" ha sido eliminado.` });
      setIsDeleting(false);
      setSupplierToDelete(null);
    }, 500);
  }, [supplierToDelete, setSuppliers, toast]);

  const handleEditSave = (updatedSupplier: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
    setEditDialogState({ open: false, supplier: null });
  };

  return (
    <>
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
                          {showActions && <TableHead className="text-right">Acciones</TableHead>}
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {filteredSuppliers.map((supplier) => (
                          <TableRow key={supplier.id}>
                              <TableCell className="font-medium">{supplier.name}</TableCell>
                              <TableCell>{supplier.contact}</TableCell>
                              <TableCell>{supplier.service}</TableCell>
                              {showActions && (
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(supplier)}>
                                        <Edit3 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirmation(supplier)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                              )}
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

      {editDialogState.open && (
        <AddSupplierDialog
          isOpen={editDialogState.open}
          onClose={() => setEditDialogState({ open: false, supplier: null })}
          supplier={editDialogState.supplier}
          onSave={handleEditSave}
        />
      )}

      <AlertDialog open={!!supplierToDelete} onOpenChange={(open) => !open && setSupplierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. ¿Está seguro de que desea eliminar al proveedor "{supplierToDelete?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSupplierToDelete(null)} disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...</> : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
