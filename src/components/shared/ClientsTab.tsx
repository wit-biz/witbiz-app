

"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, Edit3, Trash2, Loader2, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCRMData } from "@/contexts/CRMDataContext";
import type { Client } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { AddEditClientDialog } from "@/components/shared/AddEditClientDialog";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDateString } from "@/lib/utils";

interface ClientsTabProps {
    clients: Client[];
    isLoading: boolean;
    onClientSelect: (client: Client) => void;
    selectedClientId: string | null;
    showActions?: boolean;
}

export function ClientsTab({ clients, isLoading, onClientSelect, selectedClientId, showActions = false }: ClientsTabProps) {
  const { toast } = useToast();
  const { deleteClient, currentUser } = useCRMData();

  const [searchTerm, setSearchTerm] = useState('');
  const [editDialogState, setEditDialogState] = useState<{ open: boolean; client: Client | null }>({ open: false, client: null });
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    let filtered = [...clients];
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(lowerSearchTerm) ||
        (client.owner && client.owner.toLowerCase().includes(lowerSearchTerm)) ||
        (client.category && client.category.toLowerCase().includes(lowerSearchTerm))
      );
    }
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, searchTerm]);

  const handleEditClick = useCallback((e: React.MouseEvent, client: Client) => {
      e.stopPropagation();
      setEditDialogState({ open: true, client });
  }, []);
  
  const openDeleteConfirmation = useCallback((e: React.MouseEvent, client: Client) => {
      e.stopPropagation();
      setClientToDelete(client);
  }, []);

  const confirmDeleteClient = useCallback(async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    const success = await deleteClient(clientToDelete.id);
    if (success) {
        toast({ title: "Cliente eliminado", description: `El cliente "${clientToDelete.name}" ha sido eliminado.` });
    }
    setIsDeleting(false);
    setClientToDelete(null);
  }, [clientToDelete, deleteClient, toast]);

  const canEditClient = currentUser?.permissions.clients_edit ?? true;
  const canDeleteClient = currentUser?.permissions.clients_delete ?? true;

  const handleDialogClose = () => {
      setEditDialogState({ open: false, client: null });
  }

  return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Listado de Clientes</CardTitle>
            <CardDescription>Clientes registrados en el sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre, propietario o categoría..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredClients.length > 0 ? (
              <div className="relative w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden sm:table-cell">Fecha de Inicio</TableHead>
                      <TableHead className="hidden md:table-cell">Categoría</TableHead>
                      {showActions && <TableHead className="text-right">Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow
                        key={client.id}
                        onClick={() => onClientSelect(client)}
                        className={cn(showActions ? 'cursor-default' : 'cursor-pointer', selectedClientId === client.id && "bg-secondary hover:bg-secondary/90")}
                      >
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>
                          <Badge variant={client.status === 'Activo' ? 'default' : 'secondary'}>{client.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{client.createdAt ? formatDateString(client.createdAt.toDate()) : 'N/A'}</TableCell>
                        <TableCell className="hidden md:table-cell">{client.category || 'N/A'}</TableCell>
                        {showActions && (
                          <TableCell className="text-right">
                              {canEditClient && (
                                  <Button variant="ghost" size="icon" onClick={(e) => handleEditClick(e, client)}>
                                      <Edit3 className="h-4 w-4" />
                                  </Button>
                              )}
                              {canDeleteClient && (
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => openDeleteConfirmation(e, client)}>
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                              )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                <Users className="h-16 w-16 mb-4 text-gray-400" />
                <p className="text-lg font-semibold">No se encontraron clientes.</p>
                <p className="text-sm mt-1">
                    Intente ajustar su búsqueda o añada un nuevo cliente.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

      {editDialogState.open && (
           <AddEditClientDialog
              client={editDialogState.client}
              isOpen={editDialogState.open}
              onClose={handleDialogClose}
           />
      )}

      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. ¿Está seguro de que desea eliminar al cliente "{clientToDelete?.name}"?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setClientToDelete(null)} disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteClient} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Eliminando...
                  </>
                ) : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
