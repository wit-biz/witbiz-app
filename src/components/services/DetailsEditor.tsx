
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ServiceWorkflow, type ClientRequirement, type TPVConfig, type TPVReportFormat, TPV_CONFIG_DEFAULTS } from '@/lib/types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { PlusCircle, Trash2, CreditCard } from 'lucide-react';
import { useCRMData } from '@/contexts/CRMDataContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ServiceDetailsEditorProps {
    service: ServiceWorkflow;
    onUpdate: (updates: Partial<ServiceWorkflow>) => void;
    canEdit: boolean;
}

export function ServiceDetailsEditor({ service, onUpdate, canEdit }: ServiceDetailsEditorProps) {
    const { serviceWorkflows } = useCRMData();
    const [description, setDescription] = useState(service.description || '');
    const [localRequirements, setLocalRequirements] = useState<ClientRequirement[]>(service.clientRequirements || []);
    const [tpvConfig, setTpvConfig] = useState<TPVConfig>(
        service.tpvConfig || TPV_CONFIG_DEFAULTS['formato2']
    );

    // Check if this is a TPV/Terminales service
    const isTPVService = service.name?.toLowerCase().includes('terminal') || 
                         service.name?.toLowerCase().includes('tpv') ||
                         service.name?.toLowerCase().includes('pos');

    useEffect(() => {
        setDescription(service.description || '');
        setLocalRequirements(service.clientRequirements || []);
        setTpvConfig(service.tpvConfig || TPV_CONFIG_DEFAULTS['formato2']);
    }, [service]);
    
    const allRequirementTexts = useMemo(() => {
        const texts = new Set<string>();
        serviceWorkflows.forEach(wf => {
            wf.clientRequirements?.forEach(req => texts.add(req.text));
        });
        return Array.from(texts);
    }, [serviceWorkflows]);

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDescription(e.target.value);
        onUpdate({ description: e.target.value });
    };

    const handleRequirementChange = (index: number, value: string) => {
        const updated = [...localRequirements];
        updated[index] = { ...updated[index], text: value };
        setLocalRequirements(updated);
        onUpdate({ clientRequirements: updated });
    };

    const handleAddRequirement = () => {
        const newRequirement: ClientRequirement = {
            id: `req-${Date.now()}`,
            text: '',
        };
        const updated = [...localRequirements, newRequirement];
        setLocalRequirements(updated);
        onUpdate({ clientRequirements: updated });
    };

    const handleDeleteRequirement = (index: number) => {
        const updated = localRequirements.filter((_, i) => i !== index);
        setLocalRequirements(updated);
        onUpdate({ clientRequirements: updated });
    };

    // TPV Configuration handlers
    const handleFormatChange = (format: TPVReportFormat) => {
        const defaults = TPV_CONFIG_DEFAULTS[format];
        const newConfig = { ...defaults };
        setTpvConfig(newConfig);
        onUpdate({ tpvConfig: newConfig });
    };

    const handleTPVConfigChange = (field: keyof TPVConfig, value: number) => {
        const newConfig = { ...tpvConfig, [field]: value };
        setTpvConfig(newConfig);
        onUpdate({ tpvConfig: newConfig });
    };

    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="service-description" className="text-sm font-medium">Descripción del Servicio</Label>
                <Textarea
                    id="service-description"
                    value={description}
                    onChange={handleDescriptionChange}
                    placeholder="Describa en qué consiste el servicio..."
                    disabled={!canEdit}
                    className="mt-1"
                />
            </div>
            <div>
                <Label className="text-sm font-medium">Requisitos del Cliente</Label>
                 <div className="space-y-2 mt-1">
                    {localRequirements.map((req, index) => (
                        <div key={req.id || index} className="flex items-center gap-2">
                            <Input
                                value={req.text}
                                onChange={(e) => handleRequirementChange(index, e.target.value)}
                                placeholder={`Requisito #${index + 1}`}
                                disabled={!canEdit}
                                list="requirement-suggestions"
                            />
                            {canEdit && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteRequirement(index)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            )}
                        </div>
                    ))}
                     <datalist id="requirement-suggestions">
                        {allRequirementTexts.map(text => <option key={text} value={text} />)}
                    </datalist>
                    {canEdit && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddRequirement}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Requisito
                        </Button>
                    )}
                </div>
            </div>

            {/* TPV Configuration - Only show for TPV/Terminales services */}
            {isTPVService && (
                <Card className="mt-6">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Configuración TPV
                        </CardTitle>
                        <CardDescription>
                            Configura las comisiones por defecto para este servicio. Los clientes pueden personalizar estos valores.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Report Format */}
                        <div className="space-y-2">
                            <Label>Formato de Reporte</Label>
                            <Select
                                value={tpvConfig.reportFormat}
                                onValueChange={(value) => handleFormatChange(value as TPVReportFormat)}
                                disabled={!canEdit}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="formato1">
                                        <div className="flex flex-col">
                                            <span>Formato 1 - Comisiones Separadas</span>
                                            <span className="text-xs text-muted-foreground">Billpocket + WitBiz por separado</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="formato2">
                                        <div className="flex flex-col">
                                            <span>Formato 2 - Comisión Única</span>
                                            <span className="text-xs text-muted-foreground">WitBiz absorbe Billpocket</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Billpocket Commissions */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Billpocket Nacional (%)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={tpvConfig.billpocketNacional}
                                    onChange={(e) => handleTPVConfigChange('billpocketNacional', parseFloat(e.target.value) || 0)}
                                    disabled={!canEdit}
                                />
                                <p className="text-xs text-muted-foreground">Débito y Crédito nacional</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Billpocket Internacional (%)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={tpvConfig.billpocketInternacional}
                                    onChange={(e) => handleTPVConfigChange('billpocketInternacional', parseFloat(e.target.value) || 0)}
                                    disabled={!canEdit}
                                />
                                <p className="text-xs text-muted-foreground">Tarjetas internacionales</p>
                            </div>
                        </div>

                        {/* WitBiz Commission */}
                        <div className="space-y-2">
                            <Label>Comisión WitBiz (%)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={tpvConfig.witbizComision}
                                onChange={(e) => handleTPVConfigChange('witbizComision', parseFloat(e.target.value) || 0)}
                                disabled={!canEdit}
                            />
                            <p className="text-xs text-muted-foreground">
                                {tpvConfig.reportFormat === 'formato1' 
                                    ? 'Se suma a la comisión de Billpocket' 
                                    : 'Incluye la comisión de Billpocket'}
                            </p>
                        </div>

                        {/* Summary */}
                        <div className="bg-muted/50 p-3 rounded-lg text-sm">
                            <p className="font-medium mb-2">Resumen de Comisiones:</p>
                            {tpvConfig.reportFormat === 'formato1' ? (
                                <ul className="space-y-1 text-muted-foreground">
                                    <li>• Nacional: {tpvConfig.billpocketNacional}% (Billpocket) + {tpvConfig.witbizComision}% (WitBiz) = <strong>{(tpvConfig.billpocketNacional + tpvConfig.witbizComision).toFixed(1)}%</strong></li>
                                    <li>• Internacional: {tpvConfig.billpocketInternacional}% (Billpocket) + {tpvConfig.witbizComision}% (WitBiz) = <strong>{(tpvConfig.billpocketInternacional + tpvConfig.witbizComision).toFixed(1)}%</strong></li>
                                </ul>
                            ) : (
                                <ul className="space-y-1 text-muted-foreground">
                                    <li>• Comisión total: <strong>{tpvConfig.witbizComision}%</strong> (WitBiz absorbe Billpocket)</li>
                                    <li>• Billpocket Nacional ({tpvConfig.billpocketNacional}%) y Internacional ({tpvConfig.billpocketInternacional}%) incluidos</li>
                                </ul>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
