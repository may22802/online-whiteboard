"use client";

import { nanoid } from "nanoid";
import { useCallback, useMemo, useState, useEffect } from "react";
import { LiveObject } from "@liveblocks/client";
import { toast } from "sonner";
import { useQuery } from "convex/react";

import { 
  useHistory, 
  useCanUndo, 
  useCanRedo,
  useMutation,
  useStorage,
  useOthersMapped,
  useSelf,
} from "@/liveblocks.config";
import { 
  colorToCss,
  connectionIdToColor, 
  findIntersectingLayersWithRectangle, 
  getStrokePath,
  penPointsToPathLayer, 
  pointerEventToCanvasPoint, 
  resizeBounds,
} from "@/lib/utils";
import { 
  Camera, 
  CanvasMode, 
  CanvasState, 
  Color,
  Layer,
  LayerType,
  Point,
  Side,
  VotingSession,
  XYWH,
} from "@/types/canvas";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useDisableScrollBounce } from "@/hooks/use-disable-scroll-bounce";
import { useDeleteLayers } from "@/hooks/use-delete-layers";

import { Info } from "./info";
import { Path } from "./path";
import { Toolbar } from "./toolbar";
import { Button } from "@/components/ui/button";
import { Participants } from "./participants";
import { LayerPreview } from "./layer-preview";
import { SelectionBox } from "./selection-box";
import { SelectionTools } from "./selection-tools";
import { CursorsPresence } from "./cursors-presence";
import { VotingPanel } from "./voting-panel";

const MAX_LAYERS = 100;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.1;

const clampZoom = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const stripHtml = (value?: string) =>
  (value || "").replace(/<[^>]*>/g, "").trim();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "whiteboard";

interface CanvasProps {
  boardId: string;
};

export const Canvas = ({
  boardId,
}: CanvasProps) => {
  const layerIds = useStorage((root) => root.layerIds);
  const activeVotingSession = useStorage((root) => (
    root.voting.active as VotingSession | null
  ));
  const layers = useStorage((root) => (
    root.layers as unknown as Record<string, Layer>
  ));
  const board = useQuery(api.board.get, {
    id: boardId as Id<"boards">,
  });

  const pencilDraft = useSelf((me) => me.presence.pencilDraft);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 0,
    g: 0,
    b: 0,
  });
  const [isVotingOpen, setIsVotingOpen] = useState(false);

 

  useDisableScrollBounce();
  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const insertLayer = useMutation((
    { storage, setMyPresence },
    layerType: LayerType.Ellipse | LayerType.Rectangle | LayerType.Text | LayerType.Note,
    position: Point,
  ) => {
    const liveLayers = storage.get("layers");
    if (liveLayers.size >= MAX_LAYERS) {
      return;
    }

    const liveLayerIds = storage.get("layerIds");
    const layerId = nanoid();
    const isNote = layerType === LayerType.Note;
    const layer = new LiveObject({
      type: layerType,
      x: position.x,
      y: position.y,
      height: isNote ? 130 : 100,
      width: isNote ? 150 : 100,
      fill: lastUsedColor,
    });

    liveLayerIds.push(layerId);
    liveLayers.set(layerId, layer);

    setMyPresence({ selection: [layerId] }, { addToHistory: true });
    setCanvasState({ mode: CanvasMode.None });
  }, [lastUsedColor]);

  const translateSelectedLayers = useMutation((
    { storage, self },
    point: Point,
  ) => {
    if (canvasState.mode !== CanvasMode.Translating) {
      return;
    }

    const offset = {
      x: point.x - canvasState.current.x,
      y: point.y - canvasState.current.y,
    };

    const liveLayers = storage.get("layers");

    for (const id of self.presence.selection) {
      const layer = liveLayers.get(id);

      if (layer) {
        layer.update({
          x: layer.get("x") + offset.x,
          y: layer.get("y") + offset.y,
        });
      }
    }

    setCanvasState({ mode: CanvasMode.Translating, current: point });
  }, 
  [
    canvasState,
  ]);

  const unselectLayers = useMutation((
    { self, setMyPresence }
  ) => {
    if (self.presence.selection.length > 0) {
      setMyPresence({ selection: [] }, { addToHistory: true });
    }
  }, []);

  const updateSelectionNet = useMutation((
    { storage, setMyPresence },
    current: Point,
    origin: Point,
  ) => {
    const layers = storage.get("layers");
    setCanvasState({
      mode: CanvasMode.SelectionNet,
      origin,
      current,
    });

    const ids = findIntersectingLayersWithRectangle(
      layerIds,
      layers,
      origin,
      current,
    );

    setMyPresence({ selection: ids });
  }, [layerIds]);

  const startMultiSelection = useCallback((
    current: Point,
    origin: Point,
  ) => {
    if (
      Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) > 5
    ) {
      setCanvasState({
        mode: CanvasMode.SelectionNet,
        origin,
        current,
      });
    }
  }, []);

  const continueDrawing = useMutation((
    { self, setMyPresence },
    point: Point,
    e: React.PointerEvent,
  ) => {
    const { pencilDraft } = self.presence;

    if (
      canvasState.mode !== CanvasMode.Pencil ||
      e.buttons !== 1 ||
      pencilDraft == null
    ) {
      return;
    }

    setMyPresence({
      cursor: point,
      pencilDraft:
        pencilDraft.length === 1 &&
        pencilDraft[0][0] === point.x &&
        pencilDraft[0][1] === point.y
          ? pencilDraft
          : [...pencilDraft, [point.x, point.y, e.pressure]],
    });
  }, [canvasState.mode]);

  const insertPath = useMutation((
    { storage, self, setMyPresence }
  ) => {
    const liveLayers = storage.get("layers");
    const { pencilDraft } = self.presence;

    if (
      pencilDraft == null ||
      pencilDraft.length < 2 ||
      liveLayers.size >= MAX_LAYERS
    ) {
      setMyPresence({ pencilDraft: null });
      return;
    }

    const id = nanoid();
    liveLayers.set(
      id,
      new LiveObject(penPointsToPathLayer(
        pencilDraft,
        lastUsedColor,
      )),
    );

    const liveLayerIds = storage.get("layerIds");
    liveLayerIds.push(id);

    setMyPresence({ pencilDraft: null });
    setCanvasState({ mode: CanvasMode.Pencil });
  }, [lastUsedColor]);

  const startDrawing = useMutation((
    { setMyPresence },
    point: Point,
    pressure: number,
  ) => {
    setMyPresence({
      pencilDraft: [[point.x, point.y, pressure]],
      penColor: lastUsedColor,
    })
  }, [lastUsedColor]);

  const resizeSelectedLayer = useMutation((
    { storage, self },
    point: Point,
  ) => {
    if (canvasState.mode !== CanvasMode.Resizing) {
      return;
    }

    const bounds = resizeBounds(
      canvasState.initialBounds,
      canvasState.corner,
      point,
    );

    const liveLayers = storage.get("layers");
    const layer = liveLayers.get(self.presence.selection[0]);

    if (layer) {
      layer.update(bounds);
    };
  }, [canvasState]);

  const onResizeHandlePointerDown = useCallback((
    corner: Side,
    initialBounds: XYWH,
  ) => {
    history.pause();
    setCanvasState({
      mode: CanvasMode.Resizing,
      initialBounds,
      corner,
    });
  }, [history]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      const point = {
        x: e.clientX,
        y: e.clientY,
      };

      setCamera((camera) => {
        const nextZoom = clampZoom(camera.zoom - e.deltaY * 0.005);
        const zoomRatio = nextZoom / camera.zoom;

        return {
          zoom: nextZoom,
          x: point.x - (point.x - camera.x) * zoomRatio,
          y: point.y - (point.y - camera.y) * zoomRatio,
        };
      });

      return;
    }

    setCamera((camera) => ({
      ...camera,
      x: camera.x - e.deltaX,
      y: camera.y - e.deltaY,
    }));
  }, []);

  const zoomCanvas = useCallback((delta: number) => {
    setCamera((camera) => {
      const center = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };
      const nextZoom = clampZoom(camera.zoom + delta);
      const zoomRatio = nextZoom / camera.zoom;

      return {
        zoom: nextZoom,
        x: center.x - (center.x - camera.x) * zoomRatio,
        y: center.y - (center.y - camera.y) * zoomRatio,
      };
    });
  }, []);

  const resetZoom = useCallback(() => {
    setCamera((camera) => ({
      ...camera,
      zoom: 1,
    }));
  }, []);

  const exportAsSvg = useCallback(() => {
    const drawableLayers = layerIds
      .map((layerId) => ({ id: layerId, layer: layers[layerId] }))
      .filter((entry): entry is { id: string; layer: Layer } => !!entry.layer);

    if (drawableLayers.length === 0) {
      toast.error("Nothing to export");
      return;
    }

    const padding = 48;
    const minX = Math.min(...drawableLayers.map(({ layer }) => layer.x)) - padding;
    const minY = Math.min(...drawableLayers.map(({ layer }) => layer.y)) - padding;
    const maxX = Math.max(...drawableLayers.map(({ layer }) => layer.x + layer.width)) + padding;
    const maxY = Math.max(...drawableLayers.map(({ layer }) => layer.y + layer.height)) + padding;
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);

    const layerMarkup = drawableLayers.map(({ layer }) => {
      const fill = layer.fill ? colorToCss(layer.fill) : "#000000";

      switch (layer.type) {
        case LayerType.Rectangle:
          return `<rect x="${layer.x}" y="${layer.y}" width="${layer.width}" height="${layer.height}" fill="${fill}" />`;
        case LayerType.Ellipse:
          return `<ellipse cx="${layer.x + layer.width / 2}" cy="${layer.y + layer.height / 2}" rx="${layer.width / 2}" ry="${layer.height / 2}" fill="${fill}" />`;
        case LayerType.Path:
          return `<path d="${getStrokePath(layer.points)}" transform="translate(${layer.x} ${layer.y})" fill="${fill}" />`;
        case LayerType.Text: {
          const text = escapeXml(stripHtml(layer.value) || "Text");
          return `<text x="${layer.x + layer.width / 2}" y="${layer.y + layer.height / 2}" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="${Math.min(layer.height * 0.5, layer.width * 0.5, 96)}" fill="${fill}">${text}</text>`;
        }
        case LayerType.Note: {
          const text = escapeXml(stripHtml(layer.value) || "Text");
          const textColor = layer.fill
            ? ((layer.fill.r * 299 + layer.fill.g * 587 + layer.fill.b * 114) / 1000 > 125 ? "black" : "white")
            : "black";

          return [
            `<rect x="${layer.x}" y="${layer.y}" width="${layer.width}" height="${layer.height}" fill="${fill}" />`,
            `<text x="${layer.x + layer.width / 2}" y="${layer.y + layer.height / 2}" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="${Math.min(layer.height * 0.15, layer.width * 0.15, 96)}" fill="${textColor}">${text}</text>`,
          ].join("");
        }
        default:
          return "";
      }
    }).join("");

    const svg = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}">`,
      `<rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#f5f5f5" />`,
      layerMarkup,
      `</svg>`,
    ].join("");

    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slugify(board?.title ?? "whiteboard")}.svg`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast.success("Board exported");
  }, [board?.title, layerIds, layers]);

  const onPointerMove = useMutation((
    { setMyPresence }, 
    e: React.PointerEvent
  ) => {
    e.preventDefault();

    const current = pointerEventToCanvasPoint(e, camera);

    if (canvasState.mode === CanvasMode.Pressing) {
      startMultiSelection(current, canvasState.origin);
    } else if (canvasState.mode === CanvasMode.SelectionNet) {
      updateSelectionNet(current, canvasState.origin);
    } else if (canvasState.mode === CanvasMode.Translating) {
      translateSelectedLayers(current);
    } else if (canvasState.mode === CanvasMode.Resizing) {
      resizeSelectedLayer(current);
    } else if (canvasState.mode === CanvasMode.Pencil) {
      continueDrawing(current, e);
    }

    setMyPresence({ cursor: current });
  }, 
  [
    continueDrawing,
    camera,
    canvasState,
    resizeSelectedLayer,
    translateSelectedLayers,
    startMultiSelection,
    updateSelectionNet,
  ]);

  const onPointerLeave = useMutation(({ setMyPresence }) => {
    setMyPresence({ cursor: null });
  }, []);

  const onPointerDown = useCallback((
    e: React.PointerEvent,
  ) => {
    const point = pointerEventToCanvasPoint(e, camera);

    if (canvasState.mode === CanvasMode.Inserting) {
      return;
    }

    if (canvasState.mode === CanvasMode.Pencil) {
      startDrawing(point, e.pressure);
      return;
    }

    setCanvasState({ origin: point, mode: CanvasMode.Pressing });
  }, [camera, canvasState.mode, setCanvasState, startDrawing]);

  const onPointerUp = useMutation((
    {},
    e
  ) => {
    const point = pointerEventToCanvasPoint(e, camera);

    if (
      canvasState.mode === CanvasMode.None ||
      canvasState.mode === CanvasMode.Pressing
    ) {
      unselectLayers();
      setCanvasState({
        mode: CanvasMode.None,
      });
    } else if (canvasState.mode === CanvasMode.Pencil) {
      insertPath();
    } else if (canvasState.mode === CanvasMode.Inserting) {
      insertLayer(canvasState.layerType, point);
    } else {
      setCanvasState({
        mode: CanvasMode.None,
      });
    }

    history.resume();
  }, 
  [
    setCanvasState,
    camera,
    canvasState,
    history,
    insertLayer,
    unselectLayers,
    insertPath
  ]);

  const selections = useOthersMapped((other) => other.presence.selection);

  const onLayerPointerDown = useMutation((
    { self, setMyPresence },
    e: React.PointerEvent,
    layerId: string,
  ) => {
    if (
      canvasState.mode === CanvasMode.Pencil ||
      canvasState.mode === CanvasMode.Inserting
    ) {
      return;
    }

    history.pause();
    e.stopPropagation();

    const point = pointerEventToCanvasPoint(e, camera);

    if (!self.presence.selection.includes(layerId)) {
      setMyPresence({ selection: [layerId] }, { addToHistory: true });
    }
    setCanvasState({ mode: CanvasMode.Translating, current: point });
  }, 
  [
    setCanvasState,
    camera,
    history,
    canvasState.mode,
  ]);

  const layerIdsToColorSelection = useMemo(() => {
    const layerIdsToColorSelection: Record<string, string> = {};

    for (const user of selections) {
      const [connectionId, selection] = user;

      for (const layerId of selection) {
        layerIdsToColorSelection[layerId] = connectionIdToColor(connectionId)
      }
    }

    return layerIdsToColorSelection;
  }, [selections]);

  const deleteLayers = useDeleteLayers();

  useEffect(() => {
    if (activeVotingSession) {
      setIsVotingOpen(true);
    }
  }, [activeVotingSession?.id, activeVotingSession?.status]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        // case "Backspace":
        //   deleteLayers();
        //   break;
        case "z": {
          if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey) {
              history.redo();
            } else {
              history.undo();
            }
            break;
          }
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [deleteLayers, history]);

  return (
    <main
      className="h-full w-full relative bg-neutral-100 touch-none"
    >
      <Info boardId={boardId} />
      <Participants />
      <Toolbar
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        canRedo={canRedo}
        canUndo={canUndo}
        undo={history.undo}
        redo={history.redo}
        isVotingOpen={isVotingOpen}
        onToggleVoting={() => setIsVotingOpen((current) => !current)}
        onExport={exportAsSvg}
      />
      {isVotingOpen && (
        <VotingPanel onClose={() => setIsVotingOpen(false)} />
      )}
      <SelectionTools
        camera={camera}
        setLastUsedColor={setLastUsedColor}
      />
      <svg
        className="h-[100vh] w-[100vw]"
        onWheel={onWheel}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <g
          style={{
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {layerIds.map((layerId) => (
            <LayerPreview
              key={layerId}
              id={layerId}
              onLayerPointerDown={onLayerPointerDown}
              selectionColor={layerIdsToColorSelection[layerId]}
            />
          ))}
          <SelectionBox
            onResizeHandlePointerDown={onResizeHandlePointerDown}
          />
          {canvasState.mode === CanvasMode.SelectionNet && canvasState.current != null && (
            <rect
              className="fill-blue-500/5 stroke-blue-500 stroke-1"
              x={Math.min(canvasState.origin.x, canvasState.current.x)}
              y={Math.min(canvasState.origin.y, canvasState.current.y)}
              width={Math.abs(canvasState.origin.x - canvasState.current.x)}
              height={Math.abs(canvasState.origin.y - canvasState.current.y)}
            />
          )}
          <CursorsPresence />
          {pencilDraft != null && pencilDraft.length > 0 && (
            <Path
              points={pencilDraft}
              fill={colorToCss(lastUsedColor)}
              x={0}
              y={0}
            />
          )}
        </g>
      </svg>
      <div className="absolute bottom-4 right-4 flex items-center rounded-md border bg-white p-1 shadow-md">
        <Button
          variant="board"
          size="icon-sm"
          onClick={() => zoomCanvas(-ZOOM_STEP)}
          disabled={camera.zoom <= MIN_ZOOM}
        >
          -
        </Button>
        <button
          className="min-w-16 px-2 text-center text-xs font-medium text-neutral-700"
          onClick={resetZoom}
        >
          {Math.round(camera.zoom * 100)}%
        </button>
        <Button
          variant="board"
          size="icon-sm"
          onClick={() => zoomCanvas(ZOOM_STEP)}
          disabled={camera.zoom >= MAX_ZOOM}
        >
          +
        </Button>
      </div>
    </main>
  );
};
