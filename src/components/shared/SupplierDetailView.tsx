

"use client";

import React, { useMemo, useState } from "react";
import { type Supplier, type Document } from "@/lib/types";
import { useCRMData } from "@/contexts/CRMDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Truck, UserCheck, Briefcase, Phone, Mail, UploadCloud, FileText, Download, Info, CalendarDays } from "lucide-react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "../ui/badge";
import { useDialogs } from "@/contexts/DialogsContext";
import { useToast } from "@/hooks/use-toast";
import { formatDateString } from "@/lib/utils";

interface SupplierDetailViewProps {
  supplier: Supplier | null;
  onClose: () => void;
}

const DetailItem = ({ icon: Icon, label, value, href }: { icon: React.ElementType; label: string; value?: string; href?: string }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">{label}</span>
                {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">{value}</a>
                ) : (
                    <p className="text-sm font-medium">{value}</p>
                )}
            </div>
        </div>
    );
};

export function SupplierDetailView({ supplier, onClose }: SupplierDetailViewProps) {
    const { promoters, getDocumentsBySupplierId } = useCRMData();
    const { toast } = useToast();

    if (!supplier) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-background">
                <Truck className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground">Seleccione un Proveedor</h3>
                <p className="text-sm text-muted-foreground">Cargando detalles del proveedor...</p>
            </div>
        );
    }
    
    const supplierDocuments = getDocumentsBySupplierId(supplier.id);

    const handleDownload = (doc: Document) => {
        if (doc.downloadURL) {
            window.open(doc.downloadURL, '_blank');
        } else {
            toast({
                variant: "destructive",
                title: "Sin URL",
                description: "Este documento no tiene una URL de descarga válida."
            });
        }
    };

     const handleOpenUpload = () => {
        // This functionality is not fully implemented yet in the dialogs context for suppliers
        toast({
            title: "Próximamente",
            description: "La carga de documentos para proveedores estará disponible pronto."
        })
    }

    return (
        <>
            <div className="relative bg-background max-h-[80vh] overflow-y-auto p-1">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{supplier.name}</DialogTitle>
                    <div className="pt-1">
                        <Badge variant={supplier.status === 'Activo' ? 'default' : 'secondary'}>{supplier.status}</Badge>
                    </div>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                     <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleOpenUpload}><UploadCloud className="mr-2 h-4 w-4"/>Subir Documento</Button>
                    </div>
                    <Card>
                        <CardHeader><CardTitle>Información del Proveedor</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4">
                            <DetailItem icon={Mail} label="Email de Contacto" value={supplier.email} href={`mailto:${supplier.email}`} />
                            <DetailItem icon={Phone} label="Teléfono de Contacto" value={supplier.phone} href={`tel:${supplier.phone}`} />
                            <DetailItem icon={Briefcase} label="Servicio / Producto" value={supplier.service} />
                             {supplier.createdAt && (
                                <div className="flex items-start gap-3">
                                    <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground">Fecha de Inicio</span>
                                        <p className="text-sm font-medium">{formatDateString(supplier.createdAt.toDate())}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Documentos Adjuntos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {supplierDocuments.length > 0 ? (
                                <ul className="space-y-2">
                                    {supplierDocuments.map(doc => (
                                        <li key={doc.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/30">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                                <div className="truncate">
                                                    <p className="text-sm font-medium truncate" title={doc.name}>{doc.name}</p>
                                                    <p className="text-xs text-muted-foreground">{doc.type}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)}>
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center text-muted-foreground py-6">
                                    <Info className="mx-auto h-8 w-8 mb-2" />
                                    <p className="text-sm">No hay documentos para este proveedor.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
