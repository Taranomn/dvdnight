import { EmptyState } from "@/components/EmptyState";
import { GroupCard } from "@/components/GroupCard";
import { createGroupAction } from "@/lib/actions";
import { createServerSupabaseClient, requireUser } from "@/lib/supabase/server";

export default async function GroupsPage() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const { data: groups } = supabase
    ? await supabase.from("groups").select("*").eq("owner_id", user.id).order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-8">
      <h1 className="text-4xl font-black">Groups</h1>
      <p className="mt-2 text-zinc-400">Create a group, add friends, and match movies everyone has saved.</p>
      <form action={createGroupAction} className="glass mt-6 grid gap-3 rounded-3xl p-4 sm:grid-cols-[1fr_auto]">
        <input
          name="name"
          required
          placeholder="Friday movie crew"
          className="h-12 rounded-2xl border border-white/10 bg-white/[0.055] px-4 outline-none"
        />
        <button className="primary-button px-5 py-3">Create Group</button>
      </form>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {groups?.length ? (
          groups.map((group) => <GroupCard key={group.id} id={group.id} name={group.name} />)
        ) : (
          <EmptyState
            title="No groups yet"
            message="Create a group, then add friends from the group page."
          />
        )}
      </div>
    </div>
  );
}
