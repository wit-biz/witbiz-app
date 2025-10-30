
"use client";

import React from "react";
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Landmark } from "lucide-react";

export default function SettingsPage() {

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Contabilidad"
        description="Gestiona la configuración financiera y los recursos del sistema."
      />
      <main className="flex-1 p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-accent"/>
              Sección de Contabilidad
            </CardTitle>
            <CardDescription>
              Este espacio está listo para construir las nuevas funcionalidades de contabilidad.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* El contenido futuro de la contabilidad irá aquí */}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
