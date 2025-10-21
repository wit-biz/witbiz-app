
"use client";

import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Presentation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const resources = [
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

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Recursos"
        description="Descargue presentaciones, documentos y otros materiales de la empresa."
      />
      <main className="flex-1 p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => {
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
      </main>
    </div>
  );
}
