import { Plus } from "lucide-react";
import { OrganizationProfile } from "@clerk/nextjs";

import {
  Dialog,
  DialogContent,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "radix-ui";
import { DialogTitle } from "@radix-ui/react-dialog";

export const InviteButton = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Invite members
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 bg-transparent border-none max-w-[880px]">
        <VisuallyHidden.Root>
            <DialogTitle>Create Organization</DialogTitle>
        </VisuallyHidden.Root>
        <OrganizationProfile />
      </DialogContent>
    </Dialog>
  );
};