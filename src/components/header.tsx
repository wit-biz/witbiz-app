import { SidebarTrigger } from '@/components/ui/sidebar';

type HeaderProps = {
  title: string;
  children?: React.ReactNode;
  description?: string;
};

export function Header({ title, description, children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-auto min-h-16 shrink-0 items-start gap-4 border-b bg-background/80 px-4 py-3 backdrop-blur-sm sm:px-6 sm:py-4">
      <SidebarTrigger className="md:hidden" />
      <div className="h-8 w-px bg-border md:hidden" />
      <div className="flex w-full flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          {children}
        </div>
      </div>
    </header>
  );
}
