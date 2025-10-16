'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { clients, tasks, documents, notes } from '@/lib/data';
import { Client } from '@/lib/types';
import {
  PlusCircle,
  MoreHorizontal,
  Edit,
  Trash,
  CheckCircle,
  Upload,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function ClientDetailsDialog({
  client,
  isOpen,
  onOpenChange,
}: {
  client: Client | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (!client) return null;

  const clientTasks = tasks.filter((task) => task.clientId === client.id);
  const clientDocs = documents.filter((doc) => doc.clientId === client.id);
  const clientNotes = notes.filter((note) => note.clientId === client.id);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-5/6 flex flex-col">
        <DialogHeader>
          <DialogTitle>{client.name}</DialogTitle>
          <DialogDescription>
            Manage all information related to {client.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          <Tabs defaultValue="details" className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Client Information</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" defaultValue={client.name} readOnly={!isEditing} />
                  </div>
                   <div>
                    <Label htmlFor="owner">Assigned Owner</Label>
                    <Input id="owner" defaultValue={client.owner} readOnly={!isEditing} />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" defaultValue={client.category} readOnly={!isEditing} />
                  </div>
                </div>
                <div className="space-y-2">
                   <h4 className="font-semibold">Workflow</h4>
                   <p>Stage: {client.stage}</p>
                   <p>Objective: {client.currentObjective}</p>
                   <Button size="sm"><CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed</Button>
                </div>

                {isEditing && (
                  <DialogFooter>
                    <Button onClick={() => setIsEditing(false)}>
                      Save Changes
                    </Button>
                  </DialogFooter>
                )}
              </div>
            </TabsContent>
            <TabsContent value="documents" className="p-4">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-semibold">Documents</h3>
                 <Button size="sm"><Upload className="mr-2 h-4 w-4" /> Upload Document</Button>
               </div>
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Uploaded At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientDocs.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell>{doc.name}</TableCell>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell>{doc.uploadedAt.toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
               </Table>
            </TabsContent>
            <TabsContent value="tasks" className="p-4">
               <h3 className="text-lg font-semibold mb-4">Assigned Tasks</h3>
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientTasks.map(task => (
                    <TableRow key={task.id}>
                      <TableCell>{task.title}</TableCell>
                      <TableCell>{task.dueDate.toLocaleDateString()}</TableCell>
                      <TableCell>{task.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
               </Table>
            </TabsContent>
            <TabsContent value="notes" className="p-4">
              <h3 className="text-lg font-semibold mb-4">Notes History</h3>
               <div className="space-y-4">
                 {clientNotes.map(note => (
                    <div key={note.id} className="p-3 bg-muted rounded-md">
                      <p className="text-sm">{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">{note.createdAt.toLocaleString()}</p>
                    </div>
                 ))}
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ContactsPage() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleRowClick = (client: Client) => {
    setSelectedClient(client);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Clients">
        <Button>
          <PlusCircle className="mr-2" />
          Add New Client
        </Button>
      </Header>
      <main className="flex-1 p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Client Management</CardTitle>
            <CardDescription>View and manage your clients.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Assigned Owner</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow
                    key={client.id}
                    onClick={() => handleRowClick(client)}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.owner}</TableCell>
                    <TableCell>{client.category}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem
                            onClick={() => handleRowClick(client)}
                          >
                            <Edit className="mr-2 h-4 w-4" /> View/Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
      <ClientDetailsDialog
        client={selectedClient}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
