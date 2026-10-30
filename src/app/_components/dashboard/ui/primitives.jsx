export const CARD = "rounded-2xl bg-surface text-surface-foreground shadow-[0_4px_10px_rgba(15,23,42,0.05)]";

export function SectionHeading({ id, small = false, children }) {
  return (
    <h2
      id={id}
      className={`font-semibold text-foreground ${small ? "text-xl leading-7" : "text-2xl leading-8 tracking-[-0.01em]"}`}
    >
      {children}
    </h2>
  );
}
