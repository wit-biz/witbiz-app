
"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, Edit3, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCRMData } from "@/contexts/CRMDataContext";
import type { Client } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { AddEditClientDialog } from "@/components/shared/AddEditClientDialog";

export function UsersTab() {
  const { toast } = useToast();

  const {
      clients, isLoadingClients, deleteClient, currentUser
  } = useCRMData();

  const [dialogState, setDialogState] = useState<{ open: boolean; client: Client | null }>({ open: false, client: null });
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sortedClients = useMemo(() => {
    if (!clients) return [];
    return [...clients].sort((a, b) => a.name.localeCompare(b.name));
  }, [clients]);

  const handleRowClick = useCallback((client: Client) => {
    setDialogState({ open: true, client: client });
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
        toast({ title: "Usuario eliminado", description: `El usuario "${clientToDelete.name}" ha sido eliminado.` });
    }
    setIsDeleting(false);
    setClientToDelete(null);
  }, [clientToDelete, deleteClient, toast]);

  const canCreateClient = currentUser?.permissions.clients_create ?? true;
  const canEditClient = currentUser?.permissions.clients_edit ?? true;
  const canDeleteClient = currentUser?.permissions.clients_delete ?? true;

  const handleDialogClose = () => {
      setDialogState({ open: false, client: null });
  }

  return (
      <>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Listado de Usuarios</CardTitle>
              <CardDescription>
                {isLoadingClients
                  ? "Cargando usuarios..."
                  : `${sortedClients.length} usuario(s) encontrado(s).`}
              </CardDescription>
            </div>
            {canCreateClient && (
              <Button onClick={() => setDialogState({ open: true, client: null })} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Nuevo Usuario
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoadingClients ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : sortedClients.length > 0 ? (
              <div className="relative w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="hidden sm:table-cell">Propietario</TableHead>
                      <TableHead className="hidden md:table-cell">Categoría</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedClients.map((client) => (
                      <TableRow
                        key={client.id}
                      >
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell className="hidden sm:table-cell">{client.owner || 'N/A'}</TableCell>
                        <TableCell className="hidden md:table-cell">{client.category || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                            {canEditClient && (
                                <Button variant="ghost" size="icon" onClick={() => handleRowClick(client)}>
                                    <Edit3 className="h-4 w-4" />
                                </Button>
                            )}
                            {canDeleteClient && (
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => openDeleteConfirmation(e, client)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                <Users className="h-16 w-16 mb-4 text-gray-400" />
                <p className="text-lg font-semibold">No se encontraron usuarios.</p>
                {canCreateClient && (
                  <p className="text-sm mt-1">
                    Intente añadir un nuevo usuario utilizando el botón de arriba.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      {dialogState.open && (
           <AddEditClientDialog
              client={dialogState.client}
              isOpen={dialogState.open}
              onClose={handleDialogClose}
           />
      )}

      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. ¿Está seguro de que desea eliminar al usuario "{clientToDelete?.name}"?
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
