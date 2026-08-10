type Tone = "yellow" | "green" | "red" | "gray" | "blue";

const toneClasses: Record<Tone, string> = {
  yellow: "bg-primary-100 text-primary-800",
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
  gray: "bg-gray-100 text-gray-700",
  blue: "bg-blue-100 text-blue-800",
};

export function Badge({ tone = "gray", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={["inline-block rounded-full px-2.5 py-1 text-xs font-semibold", toneClasses[tone]].join(" ")}>
      {children}
    </span>
  );
}
