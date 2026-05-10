import Image from "next/image";
import { X } from "lucide-react";
import { CreateOrganization } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const EmptyOrg = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <Image
        src="/elements.svg"
        alt="Empty"
        height={200}
        width={200}
      />
      <h2 className="text-2xl font-semibold mt-6">
        Welcome to Online whiteboard
      </h2>
      <p className="text-muted-foreground text-sm mt-2">
        Create an organization to get started
      </p>
      <div className="mt-6">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg">
              Create organization
            </Button>
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
      </div>
    </div>
  );
};
