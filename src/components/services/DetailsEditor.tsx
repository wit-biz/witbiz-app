
"use client";

import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ServiceWorkflow } from '@/lib/types';

interface ServiceDetailsEditorProps {
    service: ServiceWorkflow;
    onUpdate: (updates: Partial<ServiceWorkflow>) => void;
    canEdit: boolean;
}

export function ServiceDetailsEditor({ service, onUpdate, canEdit }: ServiceDetailsEditorProps) {
    const [description, setDescription] = useState(service.description || '');
    const [clientRequirements, setClientRequirements] = useState(
        service.clientRequirements?.map(r => r.text).join('\n') || ''
    );

    useEffect(() => {
        setDescription(service.description || '');
        setClientRequirements(service.clientRequirements?.map(r => r.text).join('\n') || '');
    }, [service]);

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDescription(e.target.value);
        onUpdate({ description: e.target.value });
    };

    const handleRequirementsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setClientRequirements(e.target.value);
        const requirements = e.target.value.split('\n').map(text => ({ id: `req-${Date.now()}-${Math.random()}`, text }));
        onUpdate({ clientRequirements: requirements });
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
                <Label htmlFor="service-requirements" className="text-sm font-medium">Requisitos del Cliente</Label>
                <Textarea
                    id="service-requirements"
                    value={clientRequirements}
                    onChange={handleRequirementsChange}
                    placeholder="Liste los documentos o información que el cliente debe proporcionar..."
                    disabled={!canEdit}
                    className="mt-1"
                />
            </div>
        </div>
    );
}
