
"use client";

import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, FileText, Presentation, Package, File, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const individualResources = [
  {
    id: "pres-witbiz",
    title: "Presentación de WitBiz",
    description: "Deck de presentación oficial con nuestros servicios y propuesta de valor.",
    icon: Presentation,
    fileUrl: "/api/download/presentacion-witbiz.pdf", // Dummy URL
  },
  {
    id: "manual-marca",
    title: "Manual de Marca",
    description: "Guía de uso de la marca, logos, y paleta de colores de WitBiz.",
    icon: FileText,
    fileUrl: "/api/download/manual-marca.pdf",
  },
  {
    id: "terminos-cond",
    title: "Términos y Condiciones",
    description: "Documento legal con los términos de servicio para clientes.",
    icon: FileText,
    fileUrl: "/api/download/terminos-y-condiciones.pdf",
  },
    {
    id: "contrato-serv",
    title: "Contrato de Servicios",
    description: "Plantilla del contrato maestro de prestación de servicios.",
    icon: FileText,
    fileUrl: "/api/download/contrato-servicios.pdf",
  },
];

const serviceKits = [
  {
    id: 'kit-credito',
    serviceName: 'Asesoría de Crédito',
    description: 'Documentos esenciales para iniciar y gestionar una asesoría de crédito empresarial.',
    resources: [
      { id: "pres-witbiz", title: "Presentación de WitBiz", fileUrl: "/api/download/presentacion-witbiz.pdf" },
      { id: "contrato-serv", title: "Contrato de Servicios", fileUrl: "/api/download/contrato-servicios.pdf" },
      { id: "terminos-cond", title: "Términos y Condiciones", fileUrl: "/api/download/terminos-y-condiciones.pdf" },
    ]
  },
  {
    id: 'kit-patrimonial',
    serviceName: 'Gestión Patrimonial',
    description: 'Conjunto de documentos para la gestión de patrimonio e inversiones de clientes.',
    resources: [
      { id: "pres-witbiz", title: "Presentación de WitBiz", fileUrl: "/api/download/presentacion-witbiz.pdf" },
      { id: "contrato-serv", title: "Contrato de Servicios Específico", fileUrl: "/api/download/contrato-patrimonial.pdf" },
    ]
  }
];

export default function ResourcesPage() {
  const { toast } = useToast();

  const handleDownload = (fileName: string) => {
    // In a real app, this would trigger a file download.
    // Here, we just simulate it with a toast.
    toast({
      title: "Descarga iniciada (simulación)",
      description: `El archivo "${fileName}" ha comenzado a descargarse.`,
    });
  };
  
  const handleDownloadKit = (kitName: string) => {
    toast({
      title: "Descarga de Kit iniciada (simulación)",
      description: `El kit "${kitName}" se está descargando como un archivo ZIP.`,
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Recursos"
        description="Descargue presentaciones, documentos y otros materiales de la empresa."
      />
      <main className="flex-1 p-4 md:p-8">
        <Tabs defaultValue="kits" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="kits">
                    <Package className="mr-2 h-4 w-4" />
                    Kits de Servicio
                </TabsTrigger>
                <TabsTrigger value="individual">
                    <List className="mr-2 h-4 w-4" />
                    Recursos Individuales
                </TabsTrigger>
            </TabsList>
            <TabsContent value="kits" className="mt-6">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {serviceKits.map(kit => (
                      <Card key={kit.id} className="flex flex-col">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-accent"/>Kit: {kit.serviceName}</CardTitle>
                          <CardDescription>{kit.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <h4 className="text-sm font-semibold mb-2">Contenido del kit:</h4>
                          <ul className="space-y-2">
                            {kit.resources.map(res => (
                              <li key={`${kit.id}-${res.id}`} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FileText className="h-4 w-4 flex-shrink-0" />
                                <span>{res.title}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                        <CardFooter>
                           <Button className="w-full" onClick={() => handleDownloadKit(kit.serviceName)}>
                              <Download className="mr-2 h-4 w-4"/>
                              Descargar Kit Completo (.zip)
                            </Button>
                        </CardFooter>
                      </Card>
                    ))}
                 </div>
            </TabsContent>
            <TabsContent value="individual" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {individualResources.map((resource) => {
                    const Icon = resource.icon;
                    return (
                      <Card key={resource.id}>
                        <CardHeader className="flex flex-row items-start gap-4">
                          <div className="bg-muted p-3 rounded-lg">
                            <Icon className="h-6 w-6 text-accent" />
                          </div>
                          <div>
                            <CardTitle>{resource.title}</CardTitle>
                            <CardDescription>{resource.description}</CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => handleDownload(resource.title)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Descargar
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

