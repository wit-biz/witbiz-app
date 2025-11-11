
"use client";

import React from "react";
import { type Promoter } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, UserCheck, Users, CircleDollarSign } from "lucide-react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "../ui/badge";

interface PromoterDetailViewProps {
  promoter: Promoter | null;
  onClose: () => void;
}

const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number }) => {
    if (!value && value !== 0) return null;
    return (
        <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="font-medium">{typeof value === 'number' ? value.toLocaleString() : value}</span>
            </div>
        </div>
    );
};

export function PromoterDetailView({ promoter, onClose }: PromoterDetailViewProps) {
    if (!promoter) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-background">
                <UserCheck className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground">Seleccione un Promotor</h3>
                <p className="text-sm text-muted-foreground">Cargando detalles del promotor...</p>
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
                    <DialogTitle className="text-2xl font-bold">{promoter.name}</DialogTitle>
                    <div className="pt-1">
                        <Badge variant={promoter.status === 'Activo' ? 'default' : 'secondary'}>{promoter.status}</Badge>
                    </div>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    <Card>
                        <CardHeader><CardTitle>Resumen del Promotor</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailItem icon={Users} label="Clientes Referidos" value={promoter.referredClients} />
                            <DetailItem icon={CircleDollarSign} label="Comisiones Totales" value={`$${promoter.totalCommissions.toFixed(2)}`} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
