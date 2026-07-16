export interface TourHotspotLink {
  targetSceneId: string;
  /** Degree string (e.g. "45deg") or radians as a number. */
  yaw: number | string;
  /** Degree string (e.g. "-10deg") or radians as a number. */
  pitch: number | string;
  label?: string;
}

export interface TourScene {
  id: string;
  name: string;
  /** Path under /public, e.g. "/images/tour/door.jpg". */
  panorama: string;
  initialView: {
    yaw: number | string;
    pitch: number | string;
    fov?: number;
  };
  links: TourHotspotLink[];
}
