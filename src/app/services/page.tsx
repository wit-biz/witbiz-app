

"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCRMData, type ServiceWorkflow, type ClientRequirement, type Commission } from "@/contexts/CRMDataContext";
import { Edit, Save, Trash2, Plus, Loader2, FileText, UploadCloud, Workflow as WorkflowIcon, ArrowLeft, Download, Briefcase, Percent, GripVertical } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDialogs } from "@/contexts/DialogsContext";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


function ServiceDocuments({ serviceId }: { serviceId: string }) {
  const { getDocumentsByServiceId, deleteDocument } = useCRMData();
  const { setIsSmartUploadDialogOpen, setPreselectedServiceId } = useDialogs();
  const documents = getDocumentsByServiceId(serviceId);
  const { toast } = useToast();

  const handleOpenUploadDialog = () => {
    setPreselectedServiceId(serviceId);
    setIsSmartUploadDialogOpen(true);
  };
  
  const handleDownload = (doc: Document) => {
    toast({
        title: "Descarga Simulada",
        description: `Se ha iniciado la descarga de "${doc.name}".`
    });
  };

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm">Documentos del Servicio</h4>
      {documents.length > 0 ? (
        <ul className="space-y-2">
          {documents.map(doc => (
            <li key={doc.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded-md">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <p className="font-medium truncate text-sm" title={doc.name}>{doc.name}</p>
              </div>
              <div className="flex items-center">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(doc)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteDocument(doc.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">No hay documentos para este servicio.</p>
      )}
      <Button variant="outline" size="sm" onClick={handleOpenUploadDialog}>
          <UploadCloud className="mr-2 h-4 w-4" />
          Subir Documento
      </Button>
    </div>
  );
}


export default function ServicesPage() {
  const { serviceWorkflows, isLoadingWorkflows, updateService, currentUser } = useCRMData();
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editableFields, setEditableFields] = useState<{ description: string; clientRequirements: ClientRequirement[], commissions: Commission[] }>({ description: '', clientRequirements: [], commissions: [] });
  const [openAccordionItem, setOpenAccordionItem] = useState<string | undefined>(undefined);

  const canEditWorkflow = currentUser?.permissions.crm_edit ?? true;
  
  const sortedWorkflows = useMemo(() => {
    if (!serviceWorkflows) return [];
    return [...serviceWorkflows].sort((a,b) => (a.order || 0) - (b.order || 0));
  }, [serviceWorkflows]);

  const handleStartEdit = (service: ServiceWorkflow) => {
    setEditingServiceId(service.id);
    setEditableFields({
      description: service.description || '',
      clientRequirements: service.clientRequirements ? JSON.parse(JSON.stringify(service.clientRequirements)) : [],
      commissions: service.commissions ? JSON.parse(JSON.stringify(service.commissions)) : [],
    });
  };

  const handleCancelEdit = () => {
    setEditingServiceId(null);
  };

  const handleSave = async (serviceId: string) => {
    await updateService(serviceId, {
      description: editableFields.description,
      clientRequirements: editableFields.clientRequirements,
      commissions: editableFields.commissions,
    });
    setEditingServiceId(null);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditableFields(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRequirementChange = (index: number, value: string) => {
    const newRequirements = [...editableFields.clientRequirements];
    newRequirements[index].text = value;
    setEditableFields(prev => ({ ...prev, clientRequirements: newRequirements }));
  };

  const handleAddRequirement = () => {
    const newRequirement: ClientRequirement = { id: `req-${Date.now()}`, text: '' };
    setEditableFields(prev => ({ ...prev, clientRequirements: [...prev.clientRequirements, newRequirement] }));
  };
  
  const handleRemoveRequirement = (index: number) => {
    const newRequirements = editableFields.clientRequirements.filter((_, i) => i !== index);
    setEditableFields(prev => ({ ...prev, clientRequirements: newRequirements }));
  };

  const handleCommissionChange = (index: number, field: 'name' | 'rate', value: string | number) => {
    const newCommissions = [...editableFields.commissions];
    newCommissions[index][field] = field === 'rate' ? Number(value) || 0 : value as string;
    setEditableFields(prev => ({ ...prev, commissions: newCommissions }));
  };

  const handleAddCommission = () => {
    const newCommission: Commission = { id: `com-${Date.now()}`, name: '', rate: 0 };
    setEditableFields(prev => ({ ...prev, commissions: [...prev.commissions, newCommission] }));
  };
  
  const handleRemoveCommission = (index: number) => {
    const newCommissions = editableFields.commissions.filter((_, i) => i !== index);
    setEditableFields(prev => ({ ...prev, commissions: newCommissions }));
  };

  if (isLoadingWorkflows) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="Servicios" description="Gestione los servicios que ofrece su empresa.">
            <Button asChild>
                <Link href="/workflows"><WorkflowIcon className="mr-2 h-4 w-4" />Configurar Flujos de Trabajo</Link>
            </Button>
        </Header>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Servicios" description="Gestione los servicios y la documentación asociada.">
        <Button asChild>
            <Link href="/workflows"><WorkflowIcon className="mr-2 h-4 w-4" />Configurar Flujos de Trabajo</Link>
        </Button>
      </Header>
      <main className="flex-1 p-4 md:p-8">
        {sortedWorkflows && sortedWorkflows.length > 0 ? (
            <Accordion type="single" collapsible className="w-full space-y-4" value={openAccordionItem} onValueChange={setOpenAccordionItem}>
              {sortedWorkflows.map((service) => {
                const isEditing = editingServiceId === service.id;
                return (
                  <AccordionItem value={service.id} key={service.id} asChild>
                     <Card>
                        <AccordionTrigger className="w-full p-0 [&_svg]:ml-auto [&_svg]:mr-4">
                            <CardHeader className="flex-1 text-left">
                                <CardTitle className="text-lg">
                                    {service.name}
                                </CardTitle>
                            </CardHeader>
                        </AccordionTrigger>
                        <AccordionContent className="p-6 pt-0">
                            <div className="space-y-6">
                                {isEditing ? (
                                      <div className="space-y-6">
                                          <div>
                                              <Label htmlFor="description">Descripción del Servicio</Label>
                                              <Textarea id="description" name="description" value={editableFields.description} onChange={handleDescriptionChange} placeholder="Describa en qué consiste el servicio..." />
                                          </div>
                                          
                                          <ServiceDocuments serviceId={service.id} />
                                          
                                          <div>
                                            <Label>Requisitos del Cliente</Label>
                                            <div className="space-y-2">
                                              {editableFields.clientRequirements.map((req, index) => (
                                                <div key={req.id} className="flex items-center gap-2">
                                                  <Input value={req.text} onChange={(e) => handleRequirementChange(index, e.target.value)} placeholder={`Requisito ${index + 1}`}/>
                                                  <Button variant="ghost" size="icon" onClick={() => handleRemoveRequirement(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </div>
                                              ))}
                                              <Button variant="outline" size="sm" onClick={handleAddRequirement}><Plus className="h-4 w-4 mr-2" />Añadir Requisito</Button>
                                            </div>
                                          </div>

                                          <div>
                                            <Label>Tarifas de Comisión</Label>
                                            <div className="space-y-2">
                                              {editableFields.commissions.map((com, index) => (
                                                <div key={com.id} className="grid grid-cols-[1fr_100px_auto] items-center gap-2">
                                                  <Input value={com.name} onChange={(e) => handleCommissionChange(index, 'name', e.target.value)} placeholder="Tipo de comisión (ej. Amex)"/>
                                                   <div className="relative">
                                                      <Input type="number" value={com.rate} onChange={(e) => handleCommissionChange(index, 'rate', e.target.value)} placeholder="Tasa" className="pr-6"/>
                                                      <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                  </div>
                                                  <Button variant="ghost" size="icon" onClick={() => handleRemoveCommission(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </div>
                                              ))}
                                              <Button variant="outline" size="sm" onClick={handleAddCommission}><Plus className="h-4 w-4 mr-2" />Añadir Comisión</Button>
                                            </div>
                                          </div>
                                      </div>
                                ) : (
                                    <>
                                        <div>
                                            <h4 className="font-semibold text-sm">Descripción</h4>
                                            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{service.description || 'No hay descripción.'}</p>
                                        </div>
                                        
                                        <ServiceDocuments serviceId={service.id} />

                                        <div>
                                            <h4 className="font-semibold text-sm">Requisitos del Cliente</h4>
                                            {service.clientRequirements && service.clientRequirements.length > 0 ? (
                                                <ul className="list-disc list-inside space-y-1 mt-1 text-sm text-muted-foreground">
                                                    {service.clientRequirements.map(req => <li key={req.id}>{req.text}</li>)}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-muted-foreground mt-1">No hay requisitos especificados.</p>
                                            )}
                                        </div>
                                        
                                        <div>
                                          <h4 className="font-semibold text-sm">Tarifas de Comisión</h4>
                                          {service.commissions && service.commissions.length > 0 ? (
                                            <ul className="list-disc list-inside space-y-1 mt-1 text-sm text-muted-foreground">
                                              {service.commissions.map(com => <li key={com.id}>{com.name}: {com.rate}%</li>)}
                                            </ul>
                                          ) : (
                                            <p className="text-sm text-muted-foreground mt-1">No hay comisiones especificadas.</p>
                                          )}
                                        </div>
                                    </>
                                )}

                                {canEditWorkflow && (
                                    <div className="flex flex-col sm:flex-row gap-2 mt-4">
                                        {isEditing ? (
                                            <>
                                                <Button onClick={() => handleSave(service.id)}><Save className="mr-2 h-4 w-4"/>Guardar</Button>
                                                <Button variant="outline" onClick={handleCancelEdit}>Cancelar</Button>
                                            </>
                                        ) : (
                                          <>
                                            <Button variant="outline" onClick={() => handleStartEdit(service)}><Edit className="mr-2 h-4 w-4"/>Editar</Button>
                                          </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </AccordionContent>
                    </Card>
                  </AccordionItem>
                )
              })}
            </Accordion>
        ) : (
          <div className="col-span-full text-center text-muted-foreground py-16 border border-dashed rounded-lg">
            <Briefcase className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold">No hay servicios configurados</h3>
            <p className="text-sm mt-1">Vaya a la sección de configuración para añadir un nuevo servicio.</p>
          </div>
        )}
      </main>
    </div>
  );
}
