"use client";

import { Plus, X } from "lucide-react";
import { CreateOrganization } from "@clerk/nextjs";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Hint } from "@/components/hint";

export const NewButton = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="aspect-square">
          <Hint
            label="Create organization"
            side="right"
            align="start"
            sideOffset={18}
          >
            <button className="bg-white/25 h-full w-full rounded-md flex items-center justify-center opacity-60 hover:opacity-100 transition">
              <Plus className="text-white" />
            </button>
          </Hint>
        </div>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="p-0 bg-transparent border-none ring-0 shadow-none max-w-[min(calc(100vw-2rem),560px)] overflow-visible"
      >
        <DialogTitle className="sr-only">
          Create organization
        </DialogTitle>
        <div className="relative mx-auto w-fit max-w-full">
          <CreateOrganization
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
