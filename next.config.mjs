/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Only serves our own static placeholder assets under /public — not
    // user-uploaded content, so the SVG XSS risk this guards against doesn't apply.
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
