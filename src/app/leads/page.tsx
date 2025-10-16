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
import { contacts, leads } from '@/lib/data';
import { PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const stageColors = {
  New: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
  Contacted: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border-cyan-500/30',
  Proposal: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  Negotiation: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30',
  Won: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
  Lost: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
};

export default function LeadsPage() {
  const getContact = (contactId: string) => {
    return contacts.find((c) => c.id === contactId);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Leads">
        <Button>
          <PlusCircle className="mr-2" />
          Add Lead
        </Button>
      </Header>
      <main className="flex-1 p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Sales Pipeline</CardTitle>
            <CardDescription>
              Track and manage your leads through the sales process.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => {
                  const contact = getContact(lead.contactId);
                  return (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {lead.company}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('font-medium', stageColors[lead.stage])}
                        >
                          {lead.stage}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(lead.value)}
                      </TableCell>
                      <TableCell>
                        {contact && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <Image
                                src={contact.avatarUrl}
                                alt={contact.name}
                                width={32}
                                height={32}
                                data-ai-hint="person face"
                              />
                              <AvatarFallback>
                                {contact.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{contact.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {contact.email}
                              </div>
                            </div>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
