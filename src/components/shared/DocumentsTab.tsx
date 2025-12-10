
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Download, FileText, Edit3, Trash2 } from "lucide-react";
import { type Document } from "@/lib/types";
import { useCRMData } from "@/contexts/CRMDataContext";
import { useToast } from "@/hooks/use-toast";
import { formatDateString } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EditDocumentDialog } from './EditDocumentDialog';


interface DocumentsTabProps {
    documents: Document[];
    isLoading: boolean;
}

export function DocumentsTab({ documents, isLoading }: DocumentsTabProps) {
    const { clients, promoters, suppliers, serviceWorkflows, deleteDocument: archiveDocument } = useCRMData();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    const [documentToEdit, setDocumentToEdit] = useState<Document | null>(null);
    const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const documentTypes = useMemo(() => {
        if (!documents) return [];
        const types = new Set(documents.map(d => d.type));
        return Array.from(types);
    }, [documents]);

    const getAssociationName = (doc: Document): { name: string, type: string } => {
        if (doc.clientId) {
            return { name: clients.find(c => c.id === doc.clientId)?.name || 'Cliente desconocido', type: 'Cliente' };
        }
        if (doc.promoterId) {
            return { name: promoters.find(p => p.id === doc.promoterId)?.name || 'Promotor desconocido', type: 'Promotor' };
        }
        if (doc.supplierId) {
            return { name: suppliers.find(s => s.id === doc.supplierId)?.name || 'Proveedor desconocido', type: 'Proveedor' };
        }
        if (doc.serviceId) {
            return { name: serviceWorkflows.find(s => s.id === doc.serviceId)?.name || 'Servicio desconocido', type: 'Servicio' };
        }
        return { name: 'Sin asociar', type: 'General' };
    };

    const filteredDocuments = useMemo(() => {
        if (!documents) return [];
        let filtered = documents.filter(doc => doc.status !== 'Archivado');

        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(doc =>
                doc.name.toLowerCase().includes(lowerSearchTerm) ||
                getAssociationName(doc).name.toLowerCase().includes(lowerSearchTerm)
            );
        }

        if (typeFilter !== 'all') {
            filtered = filtered.filter(doc => doc.type === typeFilter);
        }

        return filtered.sort((a, b) => (b.uploadedAt?.toMillis() || 0) - (a.uploadedAt?.toMillis() || 0));
    }, [documents, searchTerm, typeFilter, clients, promoters, suppliers, serviceWorkflows]);

    const handleDownload = (doc: Document) => {
        if (doc.downloadURL) {
            window.open(doc.downloadURL, '_blank');
        } else {
            toast({
                variant: "destructive",
                title: "Sin URL",
                description: "No se pudo encontrar la URL de descarga para este archivo."
            });
        }
    };
    
    const confirmDelete = async () => {
        if (!documentToDelete) return;
        setIsProcessing(true);
        const success = await archiveDocument(documentToDelete.id);
        if (success) {
            toast({ title: 'Documento Archivado', description: `El documento "${documentToDelete.name}" ha sido enviado a la papelera.` });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo archivar el documento.' });
        }
        setDocumentToDelete(null);
        setIsProcessing(false);
    };

    return (
        <>
        <Card>
            <CardHeader>
                <CardTitle>Todos los Documentos</CardTitle>
                <CardDescription>Explora y gestiona todos los documentos de la plataforma.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre de archivo o entidad..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-full sm:w-[220px]">
                            <SelectValue placeholder="Filtrar por tipo..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los Tipos</SelectItem>
                            {documentTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
                                    <TableHead>Nombre del Archivo</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Asociado a</TableHead>
                                    <TableHead>Fecha de Subida</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDocuments.length > 0 ? filteredDocuments.map((doc) => {
                                    const association = getAssociationName(doc);
                                    return (
                                        <TableRow key={doc.id}>
                                            <TableCell className="font-medium">{doc.name}</TableCell>
                                            <TableCell><Badge variant="secondary">{doc.type}</Badge></TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{association.name}</span>
                                                    <span className="text-xs text-muted-foreground">{association.type}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{doc.uploadedAt ? formatDateString(doc.uploadedAt.toDate()) : 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)}>
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setDocumentToEdit(doc)}>
                                                    <Edit3 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDocumentToDelete(doc)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No se encontraron documentos.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
        
        {documentToEdit && (
            <EditDocumentDialog
                isOpen={!!documentToEdit}
                onOpenChange={(open) => !open && setDocumentToEdit(null)}
                document={documentToEdit}
            />
        )}
        
        <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Archivar Documento?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción enviará el documento "{documentToDelete?.name}" a la papelera. Podrá ser restaurado más tarde.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDocumentToDelete(null)} disabled={isProcessing}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} disabled={isProcessing} className="bg-destructive hover:bg-destructive/90">
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Archivar'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
