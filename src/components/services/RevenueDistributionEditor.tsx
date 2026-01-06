"use client";

import React, { useMemo } from 'react';
import { type RevenueDistribution, type CommissionRecipient } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, Percent, Building2, Users, UserCheck, AlertTriangle, Info, DollarSign, ArrowRight, Briefcase } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useCRMData } from '@/contexts/CRMDataContext';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';

interface RevenueDistributionEditorProps {
    distribution?: RevenueDistribution;
    linkedSupplierIds?: string[];
    primarySupplierId?: string;
    onUpdateDistribution: (distribution: RevenueDistribution) => void;
    onUpdateSuppliers: (linkedIds: string[], primaryId?: string) => void;
    canEdit: boolean;
}

export function RevenueDistributionEditor({ 
    distribution, 
    linkedSupplierIds = [],
    primarySupplierId,
    onUpdateDistribution, 
    onUpdateSuppliers,
    canEdit 
}: RevenueDistributionEditorProps) {
    const { suppliers, teamMembers, promoters } = useCRMData();
    
    const activeSuppliers = useMemo(() => 
        (suppliers || []).filter(s => s.status === 'Activo'), 
        [suppliers]
    );

    const activePromoters = useMemo(() => 
        (promoters || []).filter(p => p.status === 'Activo'), 
        [promoters]
    );

    // Use props directly, local state only for UI interactions
    const currentDistribution: RevenueDistribution = distribution || { 
        supplierPercentage: 0, 
        witbizPercentage: 100, 
        witbizDistribution: [] 
    };
    const currentLinkedSuppliers = linkedSupplierIds || [];
    const currentPrimarySupplier = primarySupplierId;

    const handleSupplierPercentageChange = (value: number[]) => {
        const supplierPct = value[0];
        const updated: RevenueDistribution = {
            ...currentDistribution,
            supplierPercentage: supplierPct,
            witbizPercentage: 100 - supplierPct,
        };
        onUpdateDistribution(updated);
    };

    const handleAddRecipient = () => {
        const newRecipient: CommissionRecipient = {
            id: `recipient-${Date.now()}`,
            type: 'team_member',
            name: 'Nuevo Beneficiario',
            percentage: 0,
        };
        const updated: RevenueDistribution = {
            ...currentDistribution,
            witbizDistribution: [...(currentDistribution.witbizDistribution || []), newRecipient],
        };
        onUpdateDistribution(updated);
    };

    const handleRecipientChange = (index: number, updates: Partial<CommissionRecipient>) => {
        const recipients = [...(currentDistribution.witbizDistribution || [])];
        recipients[index] = { ...recipients[index], ...updates };
        const updated: RevenueDistribution = { ...currentDistribution, witbizDistribution: recipients };
        onUpdateDistribution(updated);
    };

    const handleDeleteRecipient = (index: number) => {
        const recipients = (currentDistribution.witbizDistribution || []).filter((_, i) => i !== index);
        const updated: RevenueDistribution = { ...currentDistribution, witbizDistribution: recipients };
        onUpdateDistribution(updated);
    };

    const handleToggleSupplier = (supplierId: string) => {
        let newLinked: string[];
        let newPrimary = currentPrimarySupplier;
        
        if (currentLinkedSuppliers.includes(supplierId)) {
            newLinked = currentLinkedSuppliers.filter(id => id !== supplierId);
            if (newPrimary === supplierId) {
                newPrimary = newLinked[0] || undefined;
            }
        } else {
            newLinked = [...currentLinkedSuppliers, supplierId];
            if (!newPrimary) {
                newPrimary = supplierId;
            }
        }
        
        onUpdateSuppliers(newLinked, newPrimary);
    };

    const handleSetPrimarySupplier = (supplierId: string) => {
        onUpdateSuppliers(currentLinkedSuppliers, supplierId);
    };

    const witbizDistributionTotal = useMemo(() => {
        return (currentDistribution.witbizDistribution || []).reduce((sum, r) => sum + r.percentage, 0);
    }, [currentDistribution.witbizDistribution]);

    const isDistributionValid = witbizDistributionTotal === 100 || (currentDistribution.witbizDistribution || []).length === 0;

    const primarySupplierName = useMemo(() => {
        if (!currentPrimarySupplier) return null;
        return activeSuppliers.find(s => s.id === currentPrimarySupplier)?.name;
    }, [currentPrimarySupplier, activeSuppliers]);

    return (
        <div className="space-y-6">
            {/* Suppliers Section */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Proveedores del Servicio
                    </CardTitle>
                    <CardDescription>Vincula los proveedores que ofrecen este servicio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {activeSuppliers.length > 0 ? (
                        <div className="space-y-2">
                            {activeSuppliers.map(supplier => {
                                const isLinked = currentLinkedSuppliers.includes(supplier.id);
                                const isPrimary = currentPrimarySupplier === supplier.id;
                                return (
                                    <div
                                        key={supplier.id}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer",
                                            isLinked 
                                                ? "bg-primary/5 border-primary/30" 
                                                : "hover:bg-muted/50",
                                            !canEdit && "cursor-default"
                                        )}
                                        onClick={() => canEdit && handleToggleSupplier(supplier.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors",
                                                isLinked ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"
                                            )}>
                                                {isLinked && (
                                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{supplier.name}</p>
                                                {supplier.service && (
                                                    <p className="text-xs text-muted-foreground">{supplier.service}</p>
                                                )}
                                            </div>
                                        </div>
                                        {isLinked && (
                                            <div className="flex items-center gap-2">
                                                {isPrimary ? (
                                                    <Badge variant="default" className="text-xs">Principal</Badge>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-xs h-7"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSetPrimarySupplier(supplier.id);
                                                        }}
                                                        disabled={!canEdit}
                                                    >
                                                        Hacer principal
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No hay proveedores activos. Crea proveedores en la sección de Proveedores.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Revenue Distribution Section */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Distribución de Ingresos
                    </CardTitle>
                    <CardDescription>Configura cómo se reparte el ingreso entre proveedor y WitBiz</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* First Level: Supplier vs WitBiz split */}
                    <div className="space-y-4">
                        <Label className="text-sm font-medium">División Proveedor / WitBiz</Label>
                        
                        {/* Visual representation */}
                        <div className="flex items-center gap-2 text-sm">
                            <div className="flex items-center gap-1">
                                <Building2 className="h-4 w-4 text-orange-500" />
                                <span className="font-medium">{primarySupplierName || 'Proveedor'}</span>
                            </div>
                            <span className="text-2xl font-bold text-orange-500">{currentDistribution.supplierPercentage}%</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
                            <div className="flex items-center gap-1">
                                <Briefcase className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">WitBiz</span>
                            </div>
                            <span className="text-2xl font-bold text-blue-500">{currentDistribution.witbizPercentage}%</span>
                        </div>

                        {/* Slider */}
                        {canEdit && (
                            <div className="space-y-2">
                                <Slider
                                    value={[currentDistribution.supplierPercentage]}
                                    onValueChange={handleSupplierPercentageChange}
                                    max={100}
                                    step={1}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>0% Proveedor</span>
                                    <span>100% Proveedor</span>
                                </div>
                            </div>
                        )}

                        {/* Visual bar */}
                        <div className="h-4 rounded-full overflow-hidden flex">
                            <div 
                                className="bg-orange-500 transition-all duration-200"
                                style={{ width: `${currentDistribution.supplierPercentage}%` }}
                            />
                            <div 
                                className="bg-blue-500 transition-all duration-200"
                                style={{ width: `${currentDistribution.witbizPercentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Second Level: WitBiz internal distribution */}
                    {currentDistribution.witbizPercentage > 0 && (
                        <div className="border-t pt-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-sm font-medium">Distribución Interna de WitBiz</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Reparte el {currentDistribution.witbizPercentage}% de WitBiz entre los miembros
                                    </p>
                                </div>
                                {canEdit && (
                                    <Button variant="outline" size="sm" onClick={handleAddRecipient}>
                                        <PlusCircle className="h-4 w-4 mr-1" />
                                        Añadir
                                    </Button>
                                )}
                            </div>

                            {(currentDistribution.witbizDistribution || []).length > 0 ? (
                                <div className="space-y-3">
                                    {(currentDistribution.witbizDistribution || []).map((recipient, index) => (
                                        <div key={recipient.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                                            <Select
                                                value={recipient.type}
                                                onValueChange={(value: CommissionRecipient['type']) => 
                                                    handleRecipientChange(index, { type: value })
                                                }
                                                disabled={!canEdit}
                                            >
                                                <SelectTrigger className="w-[140px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="team_member">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-3 w-3" />
                                                            <span>Miembro</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="witbiz">
                                                        <div className="flex items-center gap-2">
                                                            <Briefcase className="h-3 w-3" />
                                                            <span>WitBiz</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="promoter">
                                                        <div className="flex items-center gap-2">
                                                            <UserCheck className="h-3 w-3" />
                                                            <span>Promotor</span>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>

                                            {/* Selection based on type */}
                                            {recipient.type === 'team_member' && (
                                                <Select
                                                    value={recipient.entityId || ''}
                                                    onValueChange={(value) => {
                                                        const member = (teamMembers || []).find(m => m.id === value);
                                                        handleRecipientChange(index, { 
                                                            entityId: value,
                                                            name: member?.name || ''
                                                        });
                                                    }}
                                                    disabled={!canEdit}
                                                >
                                                    <SelectTrigger className="flex-1">
                                                        <SelectValue placeholder="Seleccionar miembro..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(teamMembers || []).map(member => (
                                                            <SelectItem key={member.id} value={member.id}>
                                                                {member.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}

                                            {recipient.type === 'promoter' && (
                                                <Select
                                                    value={recipient.entityId || ''}
                                                    onValueChange={(value) => {
                                                        const promoter = activePromoters.find(p => p.id === value);
                                                        handleRecipientChange(index, { 
                                                            entityId: value,
                                                            name: promoter?.name || ''
                                                        });
                                                    }}
                                                    disabled={!canEdit}
                                                >
                                                    <SelectTrigger className="flex-1">
                                                        <SelectValue placeholder="Seleccionar promotor..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {activePromoters.length > 0 ? (
                                                            activePromoters.map(promoter => (
                                                                <SelectItem key={promoter.id} value={promoter.id}>
                                                                    {promoter.name}
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <div className="p-2 text-sm text-muted-foreground text-center">
                                                                No hay promotores activos
                                                            </div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            )}

                                            {recipient.type === 'witbiz' && (
                                                <div className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-medium">
                                                    WitBiz (Caja General)
                                                </div>
                                            )}

                                            <div className="flex items-center gap-1">
                                                <Input
                                                    type="number"
                                                    value={recipient.percentage}
                                                    onChange={(e) => handleRecipientChange(index, { percentage: Number(e.target.value) })}
                                                    className="w-20 text-center"
                                                    min={0}
                                                    max={100}
                                                    disabled={!canEdit}
                                                />
                                                <Percent className="h-4 w-4 text-muted-foreground" />
                                            </div>

                                            {canEdit && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive"
                                                    onClick={() => handleDeleteRecipient(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}

                                    {/* Validation */}
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                        <span className="text-sm font-medium">Total distribuido:</span>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "text-lg font-bold",
                                                isDistributionValid ? "text-green-600" : "text-amber-600"
                                            )}>
                                                {witbizDistributionTotal}%
                                            </span>
                                            {!isDistributionValid && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>El total debe sumar 100%</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                            {isDistributionValid && witbizDistributionTotal === 100 && (
                                                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
                                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Sin distribución interna configurada</p>
                                    <p className="text-xs">El 100% del {currentDistribution.witbizPercentage}% va a la caja general de WitBiz</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Summary */}
            {(currentDistribution.supplierPercentage > 0 || (currentDistribution.witbizDistribution || []).length > 0) && (
                <Card className="bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-950/30 dark:to-orange-950/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Resumen de Distribución
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm space-y-1">
                            <p>Por cada <span className="font-bold">$100</span> que paga el cliente:</p>
                            <ul className="ml-4 space-y-1 mt-2">
                                {currentDistribution.supplierPercentage > 0 && (
                                    <li className="flex items-center gap-2">
                                        <Building2 className="h-3 w-3 text-orange-500" />
                                        <span><strong>${currentDistribution.supplierPercentage}</strong> → {primarySupplierName || 'Proveedor'}</span>
                                    </li>
                                )}
                                {currentDistribution.witbizPercentage > 0 && (
                                    <>
                                        {(currentDistribution.witbizDistribution || []).length === 0 ? (
                                            <li className="flex items-center gap-2">
                                                <Briefcase className="h-3 w-3 text-blue-500" />
                                                <span><strong>${currentDistribution.witbizPercentage}</strong> → WitBiz (caja general)</span>
                                            </li>
                                        ) : (
                                            (currentDistribution.witbizDistribution || []).map(r => (
                                                <li key={r.id} className="flex items-center gap-2">
                                                    {r.type === 'team_member' && <Users className="h-3 w-3 text-blue-500" />}
                                                    {r.type === 'witbiz' && <Briefcase className="h-3 w-3 text-blue-500" />}
                                                    {r.type === 'promoter' && <UserCheck className="h-3 w-3 text-blue-500" />}
                                                    <span>
                                                        <strong>${((currentDistribution.witbizPercentage * r.percentage) / 100).toFixed(2)}</strong> → {r.name}
                                                        <span className="text-muted-foreground text-xs ml-1">({r.percentage}% de WitBiz)</span>
                                                    </span>
                                                </li>
                                            ))
                                        )}
                                    </>
                                )}
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
