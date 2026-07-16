"use client";

import { useEffect, useRef, useState } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import { GyroscopePlugin } from "@photo-sphere-viewer/gyroscope-plugin";
import "@photo-sphere-viewer/core/index.css";
import { Loader2, RotateCw } from "lucide-react";
import { TOUR_SCENES, TOUR_START_SCENE_ID, TOUR_QUICK_AREAS } from "@/lib/tour/scenes";

export function TourViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSceneId, setCurrentSceneId] = useState(TOUR_START_SCENE_ID);

  const currentScene =
    TOUR_SCENES.find((s) => s.id === currentSceneId) ?? TOUR_SCENES[0];

  // Create the viewer once, at the start scene. Scene switches afterwards
  // are handled imperatively by goToScene (see below), not by an effect —
  // an effect reacting to state doesn't survive React 18 dev Strict Mode's
  // double-invoke cleanly (the "skip on first run" guard gets consumed by
  // the throwaway first pass), which raced two loads of the same panorama
  // and left the viewer stuck showing its loading spinner forever.
  useEffect(() => {
    if (!containerRef.current || TOUR_SCENES.length === 0) return;

    const startScene =
      TOUR_SCENES.find((s) => s.id === TOUR_START_SCENE_ID) ?? TOUR_SCENES[0];

    const viewer = new Viewer({
      container: containerRef.current,
      navbar: ["zoom", "fullscreen"],
      plugins: [[GyroscopePlugin, {}]],
    });

    viewerRef.current = viewer;
    viewer.addEventListener("click", (e) => {
      if (process.env.NODE_ENV !== "development") return;
      const { yaw, pitch } = e.data;
      const toDeg = (rad: number) => `${((rad * 180) / Math.PI).toFixed(1)}deg`;
      // eslint-disable-next-line no-console
      console.log(`[tour] yaw: ${toDeg(yaw)}, pitch: ${toDeg(pitch)}`);
    });

    // Defer the actual panorama fetch by a frame so the Strict-Mode
    // throwaway first mount never starts a real image load.
    let cancelled = false;
    const rafId = requestAnimationFrame(() => {
      if (cancelled) return;
      viewer
        .setPanorama(startScene.panorama, {
          position: {
            yaw: startScene.initialView.yaw,
            pitch: startScene.initialView.pitch,
          },
          transition: false,
        })
        .then(() => {
          if (!cancelled) setLoading(false);
        });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      viewer.destroy();
      viewerRef.current = null;
    };
  }, []);

  function goToScene(sceneId: string) {
    const viewer = viewerRef.current;
    const scene = TOUR_SCENES.find((s) => s.id === sceneId);
    if (!viewer || !scene || sceneId === currentSceneId) return;
    setLoading(true);
    viewer
      .setPanorama(scene.panorama, {
        position: { yaw: scene.initialView.yaw, pitch: scene.initialView.pitch },
        transition: true,
      })
      .then(() => {
        setCurrentSceneId(sceneId);
        setLoading(false);
      });
  }

  if (TOUR_SCENES.length === 0) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center rounded-lg border bg-muted/30 text-center">
        <p className="max-w-md px-6 text-sm text-muted-foreground">
          No tour scenes have been added yet. Add panorama photos to{" "}
          <code className="rounded bg-muted px-1 py-0.5">public/images/tour</code> and
          define them in{" "}
          <code className="rounded bg-muted px-1 py-0.5">lib/tour/scenes.ts</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative h-[70vh] w-full overflow-hidden rounded-lg border">
        <div ref={containerRef} className="h-full w-full" />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        )}

        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-1.5 rounded-md bg-background/80 px-3 py-1.5 text-sm font-medium text-brand-dark shadow">
          <RotateCw className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{currentScene.name}</span>
          <span className="hidden text-muted-foreground sm:inline">
            — drag to look around, it&apos;s a 360° photo
          </span>
        </div>

        {currentScene.links.length > 0 && (
          <div className="absolute inset-x-0 bottom-4 flex flex-wrap justify-center gap-2 px-4">
            {currentScene.links.map((link) => {
              const target = TOUR_SCENES.find((s) => s.id === link.targetSceneId);
              return (
                <button
                  key={link.targetSceneId}
                  type="button"
                  onClick={() => goToScene(link.targetSceneId)}
                  className="rounded-full bg-background/90 px-4 py-2 text-sm font-medium text-brand-dark shadow transition-colors hover:bg-brand hover:text-white"
                >
                  {link.label ?? target?.name ?? link.targetSceneId}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-brand-dark">Look at other areas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Jump straight to a space — you can still explore in 360° once you&apos;re there.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TOUR_QUICK_AREAS.map((area) => (
            <button
              key={area.sceneId}
              type="button"
              onClick={() => goToScene(area.sceneId)}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                area.sceneId === currentSceneId
                  ? "border-brand bg-brand text-white"
                  : "border-brand-dark/10 bg-white text-brand-dark hover:border-brand/40 hover:bg-brand/5"
              }`}
            >
              {area.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
