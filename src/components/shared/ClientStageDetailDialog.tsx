
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { type Client, type WorkflowStage } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Target, ListChecks, ArrowRight } from "lucide-react";

interface ClientStageDetailDialogProps {
  client: Client | null;
  stage: WorkflowStage | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ClientStageDetailDialog({ client, stage, isOpen, onClose }: ClientStageDetailDialogProps) {
  const router = useRouter();

  if (!client || !stage) {
    return null;
  }
  
  const handleGoToDirectory = () => {
      onClose();
      router.push(`/contacts?openClient=${client.id}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">{client.name}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 pt-1">
            <Target className="h-4 w-4 text-blue-500" />
            Estado Actual: <span className="font-semibold text-foreground">{stage.title}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold mb-2">
                <ListChecks className="h-4 w-4 text-accent" />
                Objetivos Pendientes para esta Etapa
            </h4>
            {stage.objectives && stage.objectives.length > 0 ? (
                <ul className="space-y-1 list-disc list-inside text-muted-foreground pl-2">
                    {stage.objectives.map(obj => (
                        <li key={obj.id} className="text-sm">{obj.description}</li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground">No hay objetivos definidos para esta etapa.</p>
            )}
        </div>

        <DialogFooter className="sm:justify-between flex-col-reverse sm:flex-row gap-2">
           <DialogClose asChild>
                <Button type="button" variant="outline">
                    Cerrar
                </Button>
            </DialogClose>
            <Button onClick={handleGoToDirectory}>
                Ir al Directorio del Cliente
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
