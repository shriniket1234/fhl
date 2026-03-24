const COLORS = [
  "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
];

function colorFor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

interface Props {
  initials: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-[22px] h-[22px] text-[9px]",
  md: "w-7 h-7 text-[10px]",
  lg: "w-8 h-8 text-[11px]",
};

export default function Avatar({ initials, size = "sm" }: Props) {
  return (
    <span
      className={`rounded-full flex items-center justify-center font-medium flex-shrink-0 ${sizes[size]} ${colorFor(initials)}`}
    >
      {initials}
    </span>
  );
}
