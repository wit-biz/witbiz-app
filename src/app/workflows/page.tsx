'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Mock data, will be moved to lib/data later
const services = ['Sales Pipeline', 'Client Onboarding', 'Support Tickets'];
const initialStages = {
  'Sales Pipeline': [
    {
      title: 'Prospect',
      objectives: [{ id: 'o1', description: 'Initial contact', docType: '' }],
    },
    {
      title: 'Qualification',
      objectives: [
        { id: 'o2', description: 'Needs analysis', docType: 'Needs Analysis Doc' },
        { id: 'o3', description: 'Budget confirmed', docType: '' },
      ],
    },
  ],
};

export default function WorkflowsPage() {
  const [selectedService, setSelectedService] = useState(services[0]);
  const [stages, setStages] = useState(initialStages[selectedService as keyof typeof initialStages] || []);

  const handleAddStage = () => {
    setStages([...stages, { title: 'New Stage', objectives: [] }]);
  };
  
  const handleRemoveStage = (index: number) => {
    setStages(stages.filter((_, i) => i !== index));
  };
  
  const handleAddObjective = (stageIndex: number) => {
    const newStages = [...stages];
    newStages[stageIndex].objectives.push({id: `o${Date.now()}`, description: 'New Objective', docType: ''});
    setStages(newStages);
  };
  
  const handleRemoveObjective = (stageIndex: number, objIndex: number) => {
     const newStages = [...stages];
     newStages[stageIndex].objectives = newStages[stageIndex].objectives.filter((_, i) => i !== objIndex);
     setStages(newStages);
  };


  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Workflow Configuration" />
      <main className="flex-1 p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit Workflows</CardTitle>
            <CardDescription>
              Define the stages and objectives for your services.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="w-1/3">
                <Label>Select Service to Edit</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service..." />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service} value={service}>
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddStage}>
                <PlusCircle className="mr-2" /> Add Stage
              </Button>
            </div>

            <Accordion type="multiple" className="w-full">
              {stages.map((stage, stageIndex) => (
                <AccordionItem key={stageIndex} value={`stage-${stageIndex}`}>
                  <div className="flex items-center">
                    <AccordionTrigger className="flex-1">
                      <Input 
                        defaultValue={stage.title} 
                        className="text-lg font-semibold border-none focus-visible:ring-0"
                      />
                    </AccordionTrigger>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveStage(stageIndex)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                  <AccordionContent className="pl-6 pr-2 space-y-4">
                    {stage.objectives.map((obj, objIndex) => (
                      <div key={obj.id} className="p-4 bg-muted/50 rounded-md space-y-2">
                        <div className="flex items-center justify-between">
                           <Label>Objective {objIndex + 1}</Label>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveObjective(stageIndex, objIndex)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                        <Input
                          placeholder="Objective description..."
                          defaultValue={obj.description}
                        />
                        <Input
                          placeholder="Auto-complete document type (optional)"
                          defaultValue={obj.docType}
                        />
                      </div>
                    ))}
                     <Button variant="outline" size="sm" onClick={() => handleAddObjective(stageIndex)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Objective
                     </Button>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
