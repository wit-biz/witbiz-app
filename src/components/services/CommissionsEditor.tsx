
"use client";

import React, { useState, useEffect } from 'react';
import { type Commission, type SubCommission } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, Percent, AlertTriangle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

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
            name: 'Nueva Comisión',
            rate: 0,
            subCommissions: [],
        };
        const updated = [...localCommissions, newCommission];
        setLocalCommissions(updated);
        onUpdate(updated);
    };

    const handleCommissionChange = (index: number, field: 'name' | 'rate', value: string | number) => {
        const updated = [...localCommissions];
        const commissionToUpdate = { ...updated[index] };

        if (field === 'rate') {
            commissionToUpdate.rate = Number(value);
        } else {
            commissionToUpdate.name = String(value);
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

    const handleAddSubCommission = (commissionIndex: number) => {
        const newSub: SubCommission = {
            id: `subcomm-${Date.now()}`,
            name: '',
            rate: 0,
        };
        const updated = [...localCommissions];
        const commission = updated[commissionIndex];
        commission.subCommissions = [...(commission.subCommissions || []), newSub];
        setLocalCommissions(updated);
        onUpdate(updated);
    };
    
    const handleSubCommissionChange = (commissionIndex: number, subIndex: number, field: keyof SubCommission, value: string | number) => {
        const updated = [...localCommissions];
        const commission = updated[commissionIndex];
        if (!commission.subCommissions) return;

        const subToUpdate = { ...commission.subCommissions[subIndex] };
         if (field === 'rate') {
            subToUpdate[field] = Number(value);
        } else {
            subToUpdate[field] = value as string;
        }
        commission.subCommissions[subIndex] = subToUpdate;
        setLocalCommissions(updated);
        onUpdate(updated);
    };

    const handleDeleteSubCommission = (commissionIndex: number, subIndex: number) => {
        const updated = [...localCommissions];
        const commission = updated[commissionIndex];
        if (!commission.subCommissions) return;
        commission.subCommissions = commission.subCommissions.filter((_, i) => i !== subIndex);
        setLocalCommissions(updated);
        onUpdate(updated);
    };

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Tarifas de Comisión</Label>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                            <p className="text-sm">
                                <strong>Sub-comisiones:</strong> Permiten dividir una comisión principal entre diferentes conceptos o participantes. 
                                Por ejemplo, en Estímulos Fiscales puede usarse para distribuir el porcentaje entre promotor, gestor y empresa.
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                <div className="space-y-3">
                {localCommissions.map((commission, index) => {
                    const totalSubRate = commission.subCommissions?.reduce((sum, sub) => sum + sub.rate, 0) || 0;
                    const remainingRate = commission.rate - totalSubRate;
                    const isInvalid = totalSubRate > commission.rate;

                    return (
                        <Card key={commission.id}>
                             <div className="flex items-center p-3">
                                 <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value={commission.id} className="border-none">
                                        <AccordionTrigger className="hover:no-underline [&_svg]:ml-auto p-0">
                                            <div className="flex-grow grid grid-cols-2 gap-2 items-center">
                                                <Input
                                                    value={commission.name}
                                                    onClick={e => e.stopPropagation()}
                                                    onChange={(e) => handleCommissionChange(index, 'name', e.target.value)}
                                                    placeholder="Nombre de la comisión"
                                                    className="text-sm font-medium"
                                                    disabled={!canEdit}
                                                />
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        value={commission.rate}
                                                        onClick={e => e.stopPropagation()}
                                                        onChange={(e) => handleCommissionChange(index, 'rate', e.target.value)}
                                                        placeholder="Tasa Total"
                                                        className="text-sm pr-6"
                                                        disabled={!canEdit}
                                                    />
                                                    <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                         <AccordionContent className="pt-4 space-y-3">
                                             {commission.subCommissions?.map((sub, subIndex) => (
                                                 <div key={sub.id} className="flex items-center gap-2 pl-4">
                                                     <div className="flex-grow grid grid-cols-2 gap-2">
                                                        <Input
                                                            value={sub.name}
                                                            onChange={(e) => handleSubCommissionChange(index, subIndex, 'name', e.target.value)}
                                                            placeholder="Nombre sub-comisión"
                                                            className="text-xs"
                                                            disabled={!canEdit}
                                                        />
                                                        <div className="relative">
                                                            <Input
                                                                type="number"
                                                                value={sub.rate}
                                                                onChange={(e) => handleSubCommissionChange(index, subIndex, 'rate', e.target.value)}
                                                                placeholder="Tasa"
                                                                className="text-xs pr-6"
                                                                disabled={!canEdit}
                                                            />
                                                             <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                                        </div>
                                                     </div>
                                                     {canEdit && (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleDeleteSubCommission(index, subIndex)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                     )}
                                                 </div>
                                             ))}
                                            {canEdit && (
                                                <div className="pl-4">
                                                    <Button variant="outline" size="sm" onClick={() => handleAddSubCommission(index)}>
                                                        <PlusCircle className="h-3 w-3 mr-1.5" /> Añadir Sub-comisión
                                                    </Button>
                                                </div>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                 </Accordion>

                                 {canEdit && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleDeleteCommission(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                 )}
                             </div>
                             <CardFooter className={cn("p-3 text-xs", isInvalid ? 'text-destructive' : 'text-muted-foreground')}>
                                 {isInvalid ? (
                                    <div className="flex items-center gap-1.5 font-semibold">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        La suma de sub-comisiones ({totalSubRate}%) excede el total ({commission.rate}%).
                                    </div>
                                 ) : (
                                    <span>Porcentaje restante por asignar: {remainingRate.toFixed(2)}%</span>
                                 )}
                             </CardFooter>
                        </Card>
                    )
                })}
                </div>
                {canEdit && (
                    <Button variant="outline" size="sm" onClick={handleAddCommission}>
                        <PlusCircle className="h-4 w-4 mr-2" /> Añadir Comisión Principal
                    </Button>
                )}
            </div>
        </TooltipProvider>
    );
}
