import type { Ticket } from "@app/shared";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";

const STATUS_LABEL: Record<Ticket["status"], string> = {
  open: "Open",
  pending: "Pending",
  resolved: "Resolved",
  closed: "Closed",
};

const PRIORITY_LABEL: Record<Ticket["priority"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

interface TicketDetailSheetProps {
  ticket: Ticket | null;
  onOpenChange: (open: boolean) => void;
}

function TicketDetailBody({ ticket }: { ticket: Ticket }) {
  return (
    <dl className="grid grid-cols-2 gap-4 px-4 pb-4 text-sm">
      <div>
        <dt className="text-muted-foreground">Status</dt>
        <dd className="mt-1">{STATUS_LABEL[ticket.status]}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Priority</dt>
        <dd className="mt-1">{PRIORITY_LABEL[ticket.priority]}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Requester</dt>
        <dd className="mt-1">{ticket.requester}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Created</dt>
        <dd className="mt-1">{new Date(ticket.createdAt).toLocaleString()}</dd>
      </div>
      <div className="col-span-2">
        <dt className="text-muted-foreground">Description</dt>
        <dd className="mt-1 whitespace-pre-wrap">{ticket.description}</dd>
      </div>
    </dl>
  );
}

export function TicketDetailSheet({ ticket, onOpenChange }: TicketDetailSheetProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const open = ticket !== null;

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{ticket?.id}</SheetTitle>
            <SheetDescription>{ticket?.subject}</SheetDescription>
          </SheetHeader>
          {ticket && <TicketDetailBody ticket={ticket} />}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{ticket?.id}</DrawerTitle>
          <DrawerDescription>{ticket?.subject}</DrawerDescription>
        </DrawerHeader>
        {ticket && <TicketDetailBody ticket={ticket} />}
      </DrawerContent>
    </Drawer>
  );
}
