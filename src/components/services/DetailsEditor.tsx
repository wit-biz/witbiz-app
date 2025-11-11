
"use client";

import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ServiceDetailsEditorProps {
    description: string;
    clientRequirements: string;
    onUpdate: (field: 'description' | 'clientRequirements', value: string) => void;
    canEdit: boolean;
}

export function ServiceDetailsEditor({ description, clientRequirements, onUpdate, canEdit }: ServiceDetailsEditorProps) {
    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="service-description" className="text-sm font-medium">Descripción del Servicio</Label>
                <Textarea
                    id="service-description"
                    value={description}
                    onChange={(e) => onUpdate('description', e.target.value)}
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
                    onChange={(e) => onUpdate('clientRequirements', e.target.value)}
                    placeholder="Liste los documentos o información que el cliente debe proporcionar..."
                    disabled={!canEdit}
                    className="mt-1"
                />
            </div>
        </div>
    );
}
