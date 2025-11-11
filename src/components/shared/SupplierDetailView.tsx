

"use client";

import React, { useMemo } from "react";
import { type Supplier } from "@/lib/types";
import { useCRMData } from "@/contexts/CRMDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Truck, UserCheck, Briefcase, Phone, Mail } from "lucide-react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "../ui/badge";

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
    const { promoters } = useCRMData();

    const promoterName = useMemo(() => {
        if (!supplier?.promoterId) return undefined;
        return promoters.find(p => p.id === supplier.promoterId)?.name;
    }, [supplier, promoters]);

    if (!supplier) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-background">
                <Truck className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground">Seleccione un Proveedor</h3>
                <p className="text-sm text-muted-foreground">Cargando detalles del proveedor...</p>
            </div>
        );
    }

    return (
        <>
            <div className="relative bg-background max-h-[80vh] overflow-y-auto p-1">
                <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-7 w-7" onClick={onClose}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Cerrar</span>
                </Button>
                
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{supplier.name}</DialogTitle>
                    <div className="pt-1">
                        <Badge variant={supplier.status === 'Activo' ? 'default' : 'secondary'}>{supplier.status}</Badge>
                    </div>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    <Card>
                        <CardHeader><CardTitle>Información del Proveedor</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4">
                            <DetailItem icon={Mail} label="Email de Contacto" value={supplier.email} href={`mailto:${supplier.email}`} />
                            <DetailItem icon={Phone} label="Teléfono de Contacto" value={supplier.phone} href={`tel:${supplier.phone}`} />
                            <DetailItem icon={Briefcase} label="Servicio / Producto" value={supplier.service} />
                            <DetailItem icon={UserCheck} label="Referido por (Promotor)" value={promoterName} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

    