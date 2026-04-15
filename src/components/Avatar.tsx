interface AvatarProps {
  initials: string;
  size?: "xs" | "sm" | "md" | "lg";
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

export default function Avatar({ initials, size = "md" }: AvatarProps) {
  return (
    <div
      className={`${sizeClasses[size]} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-semibold text-white shadow-lg shadow-indigo-500/20`}
    >
      {initials}
    </div>
  );
}
