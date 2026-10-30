import { ICONS } from "@/lib/dashboard-data";


export default function SearchBar() {
  return (
    // Plain GET form: opens /doctors?q=... (change the action to your search route)
    <form action="/doctors" role="search" className="relative">
      <label htmlFor="dashboard-search" className="sr-only">
        Search doctors, specialties, or symptoms
      </label>
      <ICONS.search className="pointer-events-none absolute start-[19px] top-1/2 -translate-y-1/2 text-muted" />
      <input
        id="dashboard-search"
        name="q"
        type="search"
        placeholder="Search doctors, specialties, or symptoms"
        className="h-14 w-full rounded-full border border-border bg-surface pe-[17px] ps-[49px] text-base text-surface-foreground shadow-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/20"
      />
    </form>
  );
}
