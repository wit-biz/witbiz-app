

"use client";

import React from "react";
import { useCRMData } from "@/contexts/CRMDataContext";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, UploadCloud, Eye } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useDialogs } from "@/contexts/DialogsContext";
import { useToast } from "@/hooks/use-toast";
import { type Document } from "@/lib/types";

interface ServiceDocumentsEditorProps {
    serviceId: string;
    canEdit: boolean;
}

export function ServiceDocumentsEditor({ serviceId, canEdit }: ServiceDocumentsEditorProps) {
    const { getDocumentsByServiceId, deleteDocument } = useCRMData();
    const { setIsSmartUploadDialogOpen, setPreselectedServiceId } = useDialogs();
    const { toast } = useToast();
    const documents = getDocumentsByServiceId(serviceId);

    const handleOpenUpload = () => {
        setPreselectedServiceId(serviceId);
        setIsSmartUploadDialogOpen(true);
    };

    const handleDownload = (doc: Document) => {
        if (doc.downloadURL) {
            window.open(doc.downloadURL, '_blank');
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Este documento no tiene una URL de descarga válida.'
            });
        }
    };

    return (
        <div className="space-y-3">
            <Label className="text-sm font-medium">Recursos Descargables</Label>
            {documents.length > 0 ? (
                <ul className="space-y-2">
                    {documents.map(doc => (
                        <li key={doc.id} className="flex items-center justify-between p-2 bg-background rounded-md border">
                            <div className="flex items-center gap-2 min-w-0">
                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <p className="font-medium truncate text-sm" title={doc.name}>{doc.name}</p>
                            </div>
                            <div className="flex items-center">
                               <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(doc)}>
                                    <Eye className="h-4 w-4" />
                                </Button>
                                {canEdit && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteDocument(doc.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No hay documentos de recursos para este servicio.</p>
            )}
            {canEdit && (
                <Button variant="outline" size="sm" onClick={handleOpenUpload}>
                    <UploadCloud className="mr-2 h-4 w-4" /> Subir Recurso
                </Button>
            )}
        </div>
    );
}
