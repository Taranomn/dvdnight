import { Search, UserPlus } from "lucide-react";
import { searchUsers } from "@/lib/friends";
import { sendFriendRequestAction } from "@/lib/actions";

export async function UserSearch({ query, currentUserId }: { query?: string; currentUserId: string }) {
  const users = query ? await searchUsers(query, currentUserId) : [];

  return (
    <div className="glass rounded-3xl p-5">
      <form className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by username, name, or email..."
          className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.055] pl-11 pr-4 text-sm outline-none focus:border-[#ff3b5c]/70"
        />
      </form>
      <div className="mt-4 space-y-3">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7c5cff]/30 text-sm font-bold">
              {(user.display_name || user.username || "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{user.display_name || user.username}</div>
              <div className="truncate text-sm text-zinc-500">@{user.username}</div>
            </div>
            <form action={sendFriendRequestAction.bind(null, user.id)}>
              <button className="primary-button px-3 py-2 text-sm">
                <UserPlus className="h-4 w-4" />
                Add
              </button>
            </form>
          </div>
        ))}
        {query && !users.length ? <p className="py-4 text-sm text-zinc-400">No users found.</p> : null}
      </div>
    </div>
  );
}
