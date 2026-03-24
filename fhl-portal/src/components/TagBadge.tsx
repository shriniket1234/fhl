import type { Tag } from "../types";

const styles: Record<Tag, string> = {
  fix: "bg-orange-50 text-orange-800 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800/40",
  hack: "bg-violet-50 text-violet-800 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800/40",
  learn:
    "bg-teal-50 text-teal-800 border border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800/40",
};

const dots: Record<Tag, string> = {
  fix: "bg-orange-400",
  hack: "bg-violet-400",
  learn: "bg-teal-400",
};

export default function TagBadge({ tag }: { tag: Tag }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${styles[tag]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dots[tag]}`} />
      {tag}
    </span>
  );
}
