import type { Profile } from "@/types/user";

export function MessengerAvatar({ profile, size = "md" }: { profile: Profile; size?: "sm" | "md" | "lg" }) {
  const classes = {
    sm: "h-10 w-10 text-sm",
    md: "h-14 w-14 text-lg",
    lg: "h-20 w-20 text-2xl",
  };
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#ff3b5c] to-[#7c5cff] font-black ${classes[size]}`}>
      {profile.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          {(profile.display_name || profile.username || "M").slice(0, 1).toUpperCase()}
        </div>
      )}
      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#05050a] bg-[#20df75]" />
    </div>
  );
}
