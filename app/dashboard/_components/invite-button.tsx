import { Plus, X } from "lucide-react";
import { OrganizationProfile } from "@clerk/nextjs";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const InviteButton = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Invite members
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="p-0 bg-transparent border-none ring-0 shadow-none max-w-[min(calc(100vw-2rem),1100px)] overflow-visible"
      >
        <DialogTitle className="sr-only">
          Organization profile
        </DialogTitle>
        <div className="relative mx-auto w-fit max-w-full">
          <OrganizationProfile
            routing="hash"
            appearance={{
              elements: {
                rootBox: "mx-auto",
                cardBox: "max-w-[calc(100vw-2rem)]",
              },
            }}
          />
          <DialogClose className="absolute right-3 top-3 z-10 rounded-md p-1.5 opacity-70 transition hover:bg-black/5 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};
