import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import { Minus, Plus, ThumbsUp } from "lucide-react";

import { NoteLayer, VotingSession } from "@/types/canvas";
import { cn, colorToCss, getContrastingTextColor } from "@/lib/utils";
import { useMutation, useSelf, useStorage } from "@/liveblocks.config";

const calculateFontSize = (width: number, height: number) => {
  const maxFontSize = 96;
  const scaleFactor = 0.15;
  const fontSizeBasedOnHeight = height * scaleFactor;
  const fontSizeBasedOnWidth = width * scaleFactor;

  return Math.min(
    fontSizeBasedOnHeight, 
    fontSizeBasedOnWidth, 
    maxFontSize
  );
}

interface NoteProps {
  id: string;
  layer: NoteLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
};

export const Note = ({
  layer,
  onPointerDown,
  id,
  selectionColor,
}: NoteProps) => {
  const { x, y, width, height, fill, value } = layer;
  const activeVote = useStorage((root) => (
    root.voting.active as VotingSession | null
  ));
  const voteControlsPadding = activeVote?.status === "active" ? 40 : 0;
  const me = useSelf((self) => ({
    id: self.id ?? String(self.connectionId),
    name: self.info?.name ?? "Anonymous",
  }));

  const myVotesForNote = activeVote?.votes[id]?.[me.id]?.count ?? 0;
  const totalVotesForNote = activeVote
    ? Object.values(activeVote.votes[id] ?? {}).reduce((total, vote) => {
        return total + vote.count;
      }, 0)
    : 0;
  const myTotalVotes = activeVote
    ? Object.values(activeVote.votes).reduce((total, layerVotes) => {
        return total + (layerVotes[me.id]?.count ?? 0);
      }, 0)
    : 0;
  const isDoneVoting = !!activeVote?.done[me.id];
  const canVote = activeVote?.status === "active" && !isDoneVoting;

  const updateValue = useMutation((
    { storage },
    newValue: string,
  ) => {
    const liveLayers = storage.get("layers");

    liveLayers.get(id)?.set("value", newValue);
  }, []);

  const handleContentChange = (e: ContentEditableEvent) => {
    updateValue(e.target.value);
  };

  const updateVote = useMutation((
    { storage, self },
    delta: number,
    layerId: string,
  ) => {
    const voting = storage.get("voting");
    const current = voting.get("active");

    if (!current || current.status !== "active") {
      return;
    }

    const userId = self.id ?? String(self.connectionId);

    if (current.done[userId]) {
      return;
    }

    const totalVotes = Object.values(current.votes).reduce((total, layerVotes) => {
      return total + (layerVotes[userId]?.count ?? 0);
    }, 0);
    const currentLayerVotes = current.votes[layerId] ?? {};
    const currentVote = currentLayerVotes[userId]?.count ?? 0;
    const nextVote = Math.max(0, currentVote + delta);

    if (delta > 0 && totalVotes >= current.maxVotes) {
      return;
    }

    if (nextVote === currentVote) {
      return;
    }

    const nextLayerVotes = { ...currentLayerVotes };

    if (nextVote === 0) {
      delete nextLayerVotes[userId];
    } else {
      nextLayerVotes[userId] = {
        name: self.info?.name ?? "Anonymous",
        count: nextVote,
      };
    }

    const nextVotes = {
      ...current.votes,
      [layerId]: nextLayerVotes,
    };

    if (Object.keys(nextLayerVotes).length === 0) {
      delete nextVotes[layerId];
    }

    voting.set("active", {
      ...current,
      votes: nextVotes,
    });
  }, []);

  return (
    <foreignObject
      x={x - voteControlsPadding}
      y={y - voteControlsPadding}
      width={width + voteControlsPadding * 2}
      height={height + voteControlsPadding * 2}
      onPointerDown={(e) => onPointerDown(e, id)}
      className="overflow-visible"
    >
      <div className="relative h-full w-full">
        <div
          className="absolute shadow-md drop-shadow-xl"
          style={{
            left: voteControlsPadding,
            top: voteControlsPadding,
            width,
            height,
            outline: selectionColor ? `1px solid ${selectionColor}` : "none",
            backgroundColor: fill ? colorToCss(fill) : "#000",
          }}
        >
          <ContentEditable
            html={value || "Text"}
            onChange={handleContentChange}
            className={cn(
              "h-full w-full flex items-center justify-center text-center outline-none font-serif"
            )}
            style={{
              fontSize: calculateFontSize(width, height),
              color: fill ? getContrastingTextColor(fill) : "#000",
            }}
          />
        </div>
        {activeVote?.status === "active" && (
          <div
            className="absolute z-20 flex items-center justify-between text-xs font-semibold text-neutral-900"
            style={{
              left: voteControlsPadding,
              top: voteControlsPadding - 18,
              width,
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(
                "flex h-7 min-w-11 items-center justify-center gap-1 rounded-full border bg-white px-2 shadow-md",
                totalVotesForNote > 0
                  ? "border-neutral-200 text-blue-700"
                  : "border-neutral-200 text-neutral-500"
              )}
            >
              <ThumbsUp className="h-3.5 w-3.5 fill-amber-300 text-amber-500" />
              <span>{totalVotesForNote}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-md transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!canVote || myVotesForNote <= 0}
                onClick={() => updateVote(-1, id)}
                aria-label="Remove vote"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-md transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!canVote || myTotalVotes >= activeVote.maxVotes}
                onClick={() => updateVote(1, id)}
                aria-label="Add vote"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </foreignObject>
  );
};
