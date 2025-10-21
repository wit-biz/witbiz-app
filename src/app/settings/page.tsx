
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  Lock,
  Edit,
  Trash2,
  PlusCircle,
  Landmark,
  Receipt,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const teamMembers = [
    { name: "Admin User", email: "admin@witbiz.com", role: "Administrador", status: "Activo" },
    { name: "Cajero 1", email: "cajero1@witbiz.com", role: "Colaborador", status: "Activo" },
    { name: "Cajero 2", email: "cajero2@witbiz.com", role: "Colaborador", status: "Activo" },
];

const recentExpenses = [
    { id: 'exp1', description: 'Renta de Oficina - Junio', amount: 2500, date: '2024-06-01' },
    { id: 'exp2', description: 'Pago de nómina', amount: 12000, date: '2024-05-31' },
    { id: 'exp3', description: 'Servicio de Internet y Telefonía', amount: 350, date: '2024-05-28' },
];


export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Administración"
        description="Gestiona la configuración interna y los recursos del sistema."
      />
      <main className="flex-1 p-4 md:p-8">
        <Tabs defaultValue="team" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6">
            <TabsTrigger value="team">
              <Users className="mr-2 h-4 w-4" />
              Miembros del Equipo
            </TabsTrigger>
             <TabsTrigger value="finances">
              <Landmark className="mr-2 h-4 w-4" />
              Finanzas
            </TabsTrigger>
            <TabsTrigger value="permissions">
              <Lock className="mr-2 h-4 w-4" />
              Permisos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="team">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-accent" /> Miembros del Equipo</CardTitle>
                        <CardDescription>Gestiona los miembros de tu equipo y sus roles.</CardDescription>
                    </div>
                    <Button><PlusCircle className="mr-2 h-4 w-4" /> Añadir Miembro</Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Correo Electrónico</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teamMembers.map((member, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell>{member.email}</TableCell>
                                    <TableCell><Badge variant="outline">{member.role}</Badge></TableCell>
                                    <TableCell><Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">{member.status}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </TabsContent>
           <TabsContent value="finances">
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5 text-accent"/>Gestión de Bancos e Ingresos</CardTitle>
                        <CardDescription>Asigne los ingresos de los clientes a sus cuentas bancarias.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 border rounded-lg bg-muted/50">
                            <p className="text-sm text-muted-foreground">Total de Ingresos Pendientes</p>
                            <p className="text-3xl font-bold">$15,750.00</p>
                        </div>
                        <div>
                            <Label htmlFor="bank-select">Asignar a Banco</Label>
                            <Select>
                                <SelectTrigger id="bank-select">
                                    <SelectValue placeholder="Seleccione un banco..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bank-a">Banco Principal (**** 1234)</SelectItem>
                                    <SelectItem value="bank-b">Cuenta de Ahorros (**** 5678)</SelectItem>
                                    <SelectItem value="bank-c">Cuenta de Inversión (**** 9012)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="w-full"><ArrowRight className="mr-2"/>Asignar Ingresos</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-accent"/>Registro de Gastos</CardTitle>
                        <CardDescription>Registre los gastos operativos del negocio.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                             <Label htmlFor="expense-description">Descripción del Gasto</Label>
                             <Input id="expense-description" placeholder="Ej. Renta, Salarios, Luz" />
                         </div>
                         <div className="space-y-2">
                             <Label htmlFor="expense-amount">Monto</Label>
                             <div className="relative">
                                 <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                 <Input id="expense-amount" type="number" placeholder="0.00" className="pl-8" />
                             </div>
                         </div>
                         <Button variant="outline" className="w-full"><PlusCircle className="mr-2" />Registrar Gasto</Button>
                         <div className="space-y-2 pt-4">
                            <h4 className="text-sm font-medium">Gastos Recientes</h4>
                            <div className="border rounded-md p-2 space-y-2 max-h-32 overflow-y-auto">
                                {recentExpenses.map(exp => (
                                     <div key={exp.id} className="text-xs flex justify-between items-center p-1 bg-background rounded">
                                        <p className="text-muted-foreground">{exp.description}</p>
                                        <p className="font-semibold">${exp.amount.toFixed(2)}</p>
                                     </div>
                                ))}
                            </div>
                         </div>
                    </CardContent>
                </Card>
            </div>
          </TabsContent>
          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle>Permisos</CardTitle>
                <CardDescription>
                  Configura los roles y permisos de tu equipo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Aquí podrás definir qué acciones puede realizar cada rol.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
