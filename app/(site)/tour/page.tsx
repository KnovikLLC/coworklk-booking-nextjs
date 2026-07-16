import { TourViewer } from "@/components/tour/TourViewer";

export const metadata = {
  title: "Cowork Tour | Cowork.lk",
  description: "Take a 360° virtual tour of Cowork.lk's workspace in Pannipitiya — explore the space from wherever you are.",
  alternates: { canonical: "/tour" },
  openGraph: {
    siteName: "Cowork.lk",
    title: "Cowork Tour | Cowork.lk",
    description: "Take a 360° virtual tour of Cowork.lk's workspace in Pannipitiya — explore the space from wherever you are.",
    url: "/tour",
    images: ["/opengraph-image"],
  },
};

export default function TourPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 md:py-20">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
            Cowork Tour
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Drag to look around — every photo is a full 360° view. Tap a location below the photo to jump there.
          </p>
        </div>
        <TourViewer />
      </div>
    </main>
  );
}
