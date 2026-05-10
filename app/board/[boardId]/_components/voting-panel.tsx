"use client";

import { nanoid } from "nanoid";
import { CheckCircle2, Play, Square, Vote, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layer, LayerType, VotingSession } from "@/types/canvas";
import { useMutation, useSelf, useStorage } from "@/liveblocks.config";

interface VotingPanelProps {
  onClose: () => void;
}

const stripHtml = (value?: string) =>
  (value || "Untitled sticky note").replace(/<[^>]*>/g, "").trim() ||
  "Untitled sticky note";

export const VotingPanel = ({ onClose }: VotingPanelProps) => {
  const [name, setName] = useState("Voting session");
  const [maxVotes, setMaxVotes] = useState(3);
  const [anonymous, setAnonymous] = useState(false);

  const active = useStorage((root) => (
    root.voting.active as VotingSession | null
  ));
  const layers = useStorage((root) => (
    root.layers as unknown as Record<string, Layer>
  ));
  const me = useSelf((self) => ({
    id: self.id ?? String(self.connectionId),
    name: self.info?.name ?? "Anonymous",
  }));

  const myTotalVotes = useMemo(() => {
    if (!active) {
      return 0;
    }

    return Object.values(active.votes).reduce((total, layerVotes) => {
      return total + (layerVotes[me.id]?.count ?? 0);
    }, 0);
  }, [active, me.id]);

  const results = useMemo(() => {
    if (!active) {
      return [];
    }

    return Object.entries(active.votes)
      .map(([layerId, voters]) => {
        const total = Object.values(voters).reduce(
          (sum, vote) => sum + vote.count,
          0,
        );
        const layer = layers[layerId];

        return {
          layerId,
          title: layer?.type === LayerType.Note ? stripHtml(layer.value) : "Sticky note",
          total,
          voters: Object.values(voters).filter((vote) => vote.count > 0),
        };
      })
      .filter((result) => result.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [active, layers]);

  const startVote = useMutation(({ storage }) => {
    const voting = storage.get("voting");
    voting.set("active", {
      id: nanoid(),
      name: name.trim() || "Voting session",
      anonymous,
      maxVotes: Math.max(1, Math.min(99, maxVotes)),
      status: "active",
      createdAt: Date.now(),
      votes: {},
      done: {},
    });
  }, [anonymous, maxVotes, name]);

  const endVote = useMutation(({ storage }) => {
    const voting = storage.get("voting");
    const current = voting.get("active");

    if (!current) {
      return;
    }

    voting.set("active", {
      ...current,
      status: "ended",
      endedAt: Date.now(),
    });
  }, []);

  const toggleDone = useMutation(({ storage, self }) => {
    const voting = storage.get("voting");
    const current = voting.get("active");

    if (!current || current.status !== "active") {
      return;
    }

    const userId = self.id ?? String(self.connectionId);
    const done = { ...current.done };

    if (done[userId]) {
      delete done[userId];
    } else {
      done[userId] = {
        name: self.info?.name ?? "Anonymous",
      };
    }

    voting.set("active", {
      ...current,
      done,
    });
  }, []);

  const isDone = !!active?.done[me.id];
  const doneCount = active ? Object.keys(active.done).length : 0;

  return (
    <div className="absolute right-4 top-20 z-20 w-[320px] rounded-lg border bg-white p-4 text-sm shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <Vote className="h-4 w-4 text-blue-600" />
          Voting
        </div>
        <Button size="icon-sm" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {(!active || active.status === "ended") && (
        <div className="space-y-3">
          {active?.status === "ended" && (
            <div className="rounded-md bg-neutral-100 p-3">
              <p className="font-medium">{active.name}</p>
              <p className="text-xs text-muted-foreground">
                Voting ended. Results are shown below.
              </p>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Session name
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Votes per person
            </label>
            <Input
              type="number"
              min={1}
              max={99}
              value={maxVotes}
              onChange={(e) => setMaxVotes(Number(e.target.value))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
            />
            Anonymous results
          </label>
          <Button className="w-full" onClick={startVote}>
            <Play className="mr-2 h-4 w-4" />
            Start voting
          </Button>
        </div>
      )}

      {active?.status === "active" && (
        <div className="space-y-4">
          <div className="rounded-md bg-blue-50 p-3">
            <p className="font-medium text-blue-950">{active.name}</p>
            <p className="text-xs text-blue-800">
              {myTotalVotes} of {active.maxVotes} votes used
            </p>
            <p className="mt-1 text-xs text-blue-800">
              {doneCount} participant{doneCount === 1 ? "" : "s"} done
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Use the voting controls on sticky notes. You can place multiple
            votes on the same note until your limit is reached.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={toggleDone}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isDone ? "Resume" : "Done"}
            </Button>
            <Button variant="destructive" onClick={endVote}>
              <Square className="mr-2 h-4 w-4" />
              End
            </Button>
          </div>
        </div>
      )}

      {active && (
        <div className="mt-4 border-t pt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Results
          </h3>
          {results.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No votes yet.
            </p>
          ) : (
            <div className="max-h-[260px] space-y-2 overflow-auto pr-1">
              {results.map((result, index) => (
                <div
                  key={result.layerId}
                  className="rounded-md border bg-neutral-50 p-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 font-medium">
                      {index + 1}. {result.title}
                    </p>
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                      {result.total}
                    </span>
                  </div>
                  {!active.anonymous && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {result.voters
                        .map((vote) => `${vote.name} (${vote.count})`)
                        .join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
