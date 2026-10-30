/**
 * Renders a single-color SVG file in the CURRENT text color (currentColor),
 * so icons follow the global.css tokens (e.g. className="text-primary") in light and dark themes.
 */
export function MaskIcon({ src, w, h, className = "" }) {
  const mask = {
    maskImage: `url(${src})`,
    WebkitMaskImage: `url(${src})`,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskPosition: "center",
    maskSize: "contain",
    WebkitMaskSize: "contain",
    width: w,
    height: h,
  };

  return <span aria-hidden="true" className={`inline-block shrink-0 bg-current ${className}`} style={mask} />;
}
