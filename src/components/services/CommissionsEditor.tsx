
"use client";

import React, { useState, useEffect } from 'react';
import { type Commission } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, Percent } from "lucide-react";

interface ServiceCommissionsEditorProps {
    initialCommissions: Commission[];
    onUpdate: (commissions: Commission[]) => void;
    canEdit: boolean;
}

export function ServiceCommissionsEditor({ initialCommissions, onUpdate, canEdit }: ServiceCommissionsEditorProps) {
    const [localCommissions, setLocalCommissions] = useState(initialCommissions);

    useEffect(() => {
        setLocalCommissions(initialCommissions);
    }, [initialCommissions]);

    const handleAddCommission = () => {
        const newCommission: Commission = {
            id: `comm-${Date.now()}`,
            name: '',
            rate: 0,
        };
        const updated = [...localCommissions, newCommission];
        setLocalCommissions(updated);
        onUpdate(updated);
    };

    const handleCommissionChange = (index: number, field: keyof Commission, value: string | number) => {
        const updated = [...localCommissions];
        const commissionToUpdate = { ...updated[index] };

        if (field === 'rate') {
            commissionToUpdate[field] = Number(value);
        } else {
            commissionToUpdate[field] = value as string;
        }
        updated[index] = commissionToUpdate;
        setLocalCommissions(updated);
        onUpdate(updated);
    };

    const handleDeleteCommission = (index: number) => {
        const updated = localCommissions.filter((_, i) => i !== index);
        setLocalCommissions(updated);
        onUpdate(updated);
    };

    return (
        <div className="space-y-3">
            <Label className="text-sm font-medium">Tarifas de Comisión</Label>
            <div className="space-y-3">
                {localCommissions.map((commission, index) => (
                    <div key={commission.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-md border bg-background">
                        <div className="flex-grow grid grid-cols-2 gap-2">
                             <Input
                                value={commission.name}
                                onChange={(e) => handleCommissionChange(index, 'name', e.target.value)}
                                placeholder="Nombre de la comisión"
                                className="text-sm"
                                disabled={!canEdit}
                            />
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={commission.rate}
                                    onChange={(e) => handleCommissionChange(index, 'rate', e.target.value)}
                                    placeholder="Tasa"
                                    className="text-sm pr-6"
                                    disabled={!canEdit}
                                />
                                <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            </div>
                        </div>

                        {canEdit && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleDeleteCommission(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>
            {canEdit && (
                <Button variant="outline" size="sm" onClick={handleAddCommission}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Añadir Comisión
                </Button>
            )}
        </div>
    );
}
