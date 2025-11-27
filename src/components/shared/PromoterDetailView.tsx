

"use client";

import React, { useState, useMemo } from "react";
import { type Client, type Promoter, type Document } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, UserCheck, Users, CircleDollarSign, Mail, Phone, UploadCloud, FileText, Download, Info, CalendarDays } from "lucide-react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "../ui/badge";
import { useCRMData } from "@/contexts/CRMDataContext";
import { useDialogs } from "@/contexts/DialogsContext";
import { useToast } from "@/hooks/use-toast";
import { formatDateString } from "@/lib/utils";

interface PromoterDetailViewProps {
  promoter: Promoter | null;
  onClose: () => void;
}

const DetailItem = ({ icon: Icon, label, value, href }: { icon: React.ElementType; label: string; value?: string | number; href?: string }) => {
    if (!value && value !== 0) return null;
    return (
         <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">{label}</span>
                {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">{value}</a>
                ) : (
                    <p className="text-sm font-medium">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                )}
            </div>
        </div>
    );
};

export function PromoterDetailView({ promoter, onClose }: PromoterDetailViewProps) {
    const { getDocumentsByPromoterId, getClientsByPromoterId } = useCRMData();
    const { setIsSmartUploadDialogOpen } = useDialogs();
    const { toast } = useToast();
    
    if (!promoter) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-background">
                <UserCheck className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground">Seleccione un Promotor</h3>
                <p className="text-sm text-muted-foreground">Cargando detalles del promotor...</p>
            </div>
        );
    }
    
    const promoterDocuments = getDocumentsByPromoterId(promoter.id);
    const referredClients = getClientsByPromoterId(promoter.id);
    
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
        // This functionality is not fully implemented yet in the dialogs context for promoters
        toast({
            title: "Próximamente",
            description: "La carga de documentos para promotores estará disponible pronto."
        })
    }

    return (
        <>
            <div className="relative bg-background max-h-[80vh] overflow-y-auto p-1">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{promoter.name}</DialogTitle>
                    <div className="pt-1">
                        <Badge variant={promoter.status === 'Activo' ? 'default' : 'secondary'}>{promoter.status}</Badge>
                    </div>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                     <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleOpenUpload}><UploadCloud className="mr-2 h-4 w-4"/>Subir Documento</Button>
                    </div>
                    <Card>
                        <CardHeader><CardTitle>Información de Contacto</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4">
                            <DetailItem icon={Mail} label="Email" value={promoter.email} href={`mailto:${promoter.email}`} />
                            <DetailItem icon={Phone} label="Teléfono" value={promoter.phone} href={`tel:${promoter.phone}`} />
                            {promoter.createdAt && (
                                <div className="flex items-start gap-3">
                                    <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground">Fecha de Inicio</span>
                                        <p className="text-sm font-medium">{formatDateString(promoter.createdAt.toDate())}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Resumen de Actividad</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailItem icon={Users} label="Clientes Referidos" value={referredClients.length} />
                            <DetailItem icon={CircleDollarSign} label="Comisiones Totales" value={`$${promoter.totalCommissions.toFixed(2)}`} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Clientes Referidos</CardTitle>
                        </CardHeader>
                        <CardContent>
                             {referredClients.length > 0 ? (
                                <ul className="space-y-2">
                                    {referredClients.map(client => (
                                        <li key={client.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/30">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Users className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                                <p className="text-sm font-medium truncate" title={client.name}>{client.name}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center text-muted-foreground py-6">
                                    <Info className="mx-auto h-8 w-8 mb-2" />
                                    <p className="text-sm">Este promotor aún no ha referido clientes.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Documentos Adjuntos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {promoterDocuments.length > 0 ? (
                                <ul className="space-y-2">
                                    {promoterDocuments.map(doc => (
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
                                    <p className="text-sm">No hay documentos para este promotor.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
