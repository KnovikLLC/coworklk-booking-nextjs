import type { TourScene } from "./types";

/**
 * The virtual tour's scene graph, built from the founder's floor-plan sketch
 * and the 16 panoramas in /public/images/tour. Room adjacency (`links`) and
 * yaw/pitch values were derived by loading each panorama and sampling the
 * real doorway/opening directions with the viewer's own coordinate API —
 * they should be close, but nudge them further if anything still looks off:
 * run `npm run dev`, open /tour, open the browser console, and click the
 * spot in the panorama where a hotspot should sit — the console logs the
 * exact yaw/pitch in degrees for that click.
 */
export const TOUR_START_SCENE_ID = "1";

export const TOUR_SCENES: TourScene[] = [
  {
    id: "1",
    name: "Entrance",
    panorama: "/images/tour/1-enterance.jpg",
    initialView: { yaw: "0deg", pitch: "0deg" },
    links: [
      { targetSceneId: "2", yaw: "210deg", pitch: "0deg", label: "Reception" },
      { targetSceneId: "14", yaw: "270deg", pitch: "0deg", label: "Coffee Area" },
      { targetSceneId: "10", yaw: "90deg", pitch: "0deg", label: "Meeting Room 1" },
    ],
  },
  {
    id: "2",
    name: "Reception & Workspace Entrance",
    panorama: "/images/tour/2-reception-and-workspace-enterance.jpg",
    initialView: { yaw: "0deg", pitch: "0deg" },
    links: [
      { targetSceneId: "1", yaw: "30deg", pitch: "0deg", label: "Back to Entrance" },
      { targetSceneId: "3", yaw: "180deg", pitch: "-5deg", label: "Workspaces" },
      { targetSceneId: "8", yaw: "120deg", pitch: "0deg", label: "Lobby" },
    ],
  },
  {
    id: "3",
    name: "Workspaces",
    panorama: "/images/tour/3-workspaces.jpg",
    initialView: { yaw: "0deg", pitch: "0deg" },
    links: [
      { targetSceneId: "2", yaw: "0deg", pitch: "0deg", label: "Reception" },
      { targetSceneId: "4", yaw: "265deg", pitch: "0deg", label: "Meeting Room 2" },
      { targetSceneId: "6", yaw: "285deg", pitch: "0deg", label: "Meeting Room 3" },
    ],
  },
  {
    id: "4",
    name: "Meeting Room 2 (5-Seater)",
    panorama: "/images/tour/4-meeting-room2-5seater.jpg",
    initialView: { yaw: "0deg", pitch: "0deg" },
    links: [
      { targetSceneId: "3", yaw: "180deg", pitch: "0deg", label: "Back to Workspaces" },
      { targetSceneId: "5", yaw: "70.3deg", pitch: "-7.9deg", label: "Look Inside" },
    ],
  },
  {
    id: "5",
    name: "Meeting Room 2 (5-Seater) — Inside",
    panorama: "/images/tour/5-meeting-room2-5seater-inside.jpg",
    initialView: { yaw: "40deg", pitch: "0deg" },
    links: [
      { targetSceneId: "4", yaw: "26.1deg", pitch: "7deg", label: "Back" },
    ],
  },
  {
    id: "6",
    name: "Meeting Room 3 (Soundproof)",
    panorama: "/images/tour/6-meeting-room3-soundproof.jpg",
    initialView: { yaw: "180deg", pitch: "0deg" },
    links: [
      { targetSceneId: "3", yaw: "114deg", pitch: "-11.9deg", label: "Back to Workspaces" },
      { targetSceneId: "7", yaw: "245.9deg", pitch: "-12deg", label: "Look Inside" },
    ],
  },
  {
    id: "7",
    name: "Meeting Room 3 (Soundproof) — Inside",
    panorama: "/images/tour/7-meeting-room3-soundproof-inside.jpg",
    initialView: { yaw: "0deg", pitch: "0deg" },
    links: [
      { targetSceneId: "6", yaw: "0deg", pitch: "-10deg", label: "Back" },
    ],
  },
  {
    id: "8",
    name: "Lobby (Middle)",
    panorama: "/images/tour/8-lobby-middle.jpg",
    initialView: { yaw: "0deg", pitch: "0deg" },
    links: [
      { targetSceneId: "2", yaw: "273deg", pitch: "-10.8deg", label: "Back to Reception" },
      { targetSceneId: "9", yaw: "129.3deg", pitch: "-13.1deg", label: "Lobby End" },
    ],
  },
  {
    id: "9",
    name: "Lobby (End)",
    panorama: "/images/tour/9-lobby-end.jpg",
    initialView: { yaw: "0deg", pitch: "0deg" },
    links: [
      { targetSceneId: "8", yaw: "67.9deg", pitch: "-1.8deg", label: "Back to Lobby" },
      { targetSceneId: "13", yaw: "257.7deg", pitch: "-2.5deg", label: "Hot Desks" },
    ],
  },
  {
    id: "10",
    name: "Meeting Room 1 (4-Seater)",
    panorama: "/images/tour/10-meeting-room-1-4seater.jpg",
    initialView: { yaw: "0deg", pitch: "0deg" },
    links: [
      { targetSceneId: "1", yaw: "120.5deg", pitch: "-17.7deg", label: "Back to Entrance" },
      { targetSceneId: "12", yaw: "65.9deg", pitch: "-1.9deg", label: "Hot Desks" },
      { targetSceneId: "11", yaw: "313.8deg", pitch: "-15.9deg", label: "Look Inside" },
    ],
  },
  {
    id: "11",
    name: "Meeting Room 1 (4-Seater) — Inside",
    panorama: "/images/tour/11-meeting-room-1-4seater-inside.jpg",
    initialView: { yaw: "0deg", pitch: "0deg" },
    links: [
      { targetSceneId: "10", yaw: "42.8deg", pitch: "1.1deg", label: "Back" },
    ],
  },
  {
    id: "12",
    name: "Hot Desks (Right)",
    panorama: "/images/tour/12-hotdesks-right.jpg",
    initialView: { yaw: "150deg", pitch: "0deg" },
    links: [
      { targetSceneId: "13", yaw: "90deg", pitch: "0deg", label: "Hot Desks (Left)" },
      { targetSceneId: "10", yaw: "185.3deg", pitch: "-3.8deg", label: "Meeting Room 1" },
    ],
  },
  {
    id: "13",
    name: "Hot Desks (Left)",
    panorama: "/images/tour/13-hotdesks-left.jpg",
    initialView: { yaw: "220deg", pitch: "0deg" },
    links: [
      { targetSceneId: "9", yaw: "57.7deg", pitch: "7.5deg", label: "Back to Lobby" },
      { targetSceneId: "12", yaw: "262.8deg", pitch: "-16.7deg", label: "Hot Desks (Right)" },
    ],
  },
  {
    id: "14",
    name: "Coffee Area",
    panorama: "/images/tour/14-coffee-area.jpg",
    initialView: { yaw: "0deg", pitch: "0deg" },
    links: [
      { targetSceneId: "1", yaw: "356.7deg", pitch: "-4.7deg", label: "Back to Entrance" },
      { targetSceneId: "16", yaw: "69.5deg", pitch: "-1.6deg", label: "Washroom" },
    ],
  },
  {
    id: "15",
    name: "Kitchen & Lunch Area",
    panorama: "/images/tour/15-kitchen-and-lunch.jpg",
    initialView: { yaw: "0deg", pitch: "0deg" },
    links: [
      { targetSceneId: "16", yaw: "287.2deg", pitch: "-14.1deg", label: "Washroom" },
    ],
  },
  {
    id: "16",
    name: "Washroom",
    panorama: "/images/tour/16-washroom.jpg",
    initialView: { yaw: "180deg", pitch: "0deg" },
    links: [
      { targetSceneId: "14", yaw: "120.5deg", pitch: "-2.4deg", label: "Coffee Area" },
      { targetSceneId: "15", yaw: "90deg", pitch: "0deg", label: "Kitchen" },
    ],
  },
];

/** Quick-jump shortcuts shown in the "Look at other areas" section. */
export const TOUR_QUICK_AREAS: { label: string; sceneId: string }[] = [
  { label: "Workspace Area", sceneId: "3" },
  { label: "5 Seater Meeting Room", sceneId: "4" },
  { label: "4 Seater Soundproof Meeting Room", sceneId: "6" },
  { label: "Lobby", sceneId: "8" },
  { label: "Hot Desks", sceneId: "13" },
  { label: "4 Seater Meeting Room", sceneId: "10" },
  { label: "Kitchen", sceneId: "15" },
  { label: "Washrooms", sceneId: "16" },
];
