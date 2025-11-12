
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ServiceWorkflow, type ClientRequirement } from '@/lib/types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useCRMData } from '@/contexts/CRMDataContext';

interface ServiceDetailsEditorProps {
    service: ServiceWorkflow;
    onUpdate: (updates: Partial<ServiceWorkflow>) => void;
    canEdit: boolean;
}

export function ServiceDetailsEditor({ service, onUpdate, canEdit }: ServiceDetailsEditorProps) {
    const { serviceWorkflows } = useCRMData();
    const [description, setDescription] = useState(service.description || '');
    const [localRequirements, setLocalRequirements] = useState<ClientRequirement[]>(service.clientRequirements || []);

    useEffect(() => {
        setDescription(service.description || '');
        setLocalRequirements(service.clientRequirements || []);
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
        </div>
    );
}
