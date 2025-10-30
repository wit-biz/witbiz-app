
"use client";

import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, History, BarChart } from "lucide-react";
import { DateRangeChartsTab } from "@/components/shared/DateRangeChartsTab";

export default function AuditPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Auditoría"
        description="Analice los reportes de negocio y revise la bitácora de actividades."
      />
      <main className="flex-1 p-4 md:p-8">
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reports">
              <LineChart className="mr-2 h-4 w-4" />
              Reportes
            </TabsTrigger>
            <TabsTrigger value="logs">
              <History className="mr-2 h-4 w-4" />
              Bitácoras
            </TabsTrigger>
             <TabsTrigger value="charts">
              <BarChart className="mr-2 h-4 w-4" />
              Gráficos
            </TabsTrigger>
          </TabsList>
          <TabsContent value="reports" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Reportes de Desempeño</CardTitle>
                <CardDescription>
                  Visualización de métricas clave, KPIs y números internos del negocio.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-12">
                  <LineChart className="mx-auto h-16 w-16 mb-4 text-gray-400" />
                  <p className="text-lg font-semibold">
                    Los reportes y gráficos se mostrarán aquí.
                  </p>
                  <p className="text-sm mt-1">
                    Esta sección contendrá análisis visuales de los datos de su negocio.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="logs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Bitácora de Actividades</CardTitle>
                <CardDescription>
                  Registro de todas las acciones importantes realizadas dentro de la aplicación.
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="text-center text-muted-foreground py-12">
                  <History className="mx-auto h-16 w-16 mb-4 text-gray-400" />
                  <p className="text-lg font-semibold">
                    La bitácora de acciones del sistema aparecerá aquí.
                  </p>
                  <p className="text-sm mt-1">
                    Se registrarán eventos como creación de clientes, actualización de tareas, etc.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
           <TabsContent value="charts" className="mt-6">
            <DateRangeChartsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
