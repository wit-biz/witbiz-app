import { SidebarTrigger } from '@/components/ui/sidebar';

type HeaderProps = {
  title: string;
  children?: React.ReactNode;
};

export function Header({ title, children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="h-8 w-px bg-border md:hidden" />
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </header>
  );
}
