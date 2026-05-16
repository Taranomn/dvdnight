import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { FriendRequestCard } from "@/components/FriendRequestCard";
import { getFriendRequests } from "@/lib/friends";
import { requireUser } from "@/lib/supabase/server";

export default async function FriendRequestsPage() {
  const user = await requireUser();
  const requests = await getFriendRequests(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-8">
      <Link href="/friends" className="text-sm text-zinc-400 hover:text-white">
        Back to friends
      </Link>
      <h1 className="mt-4 text-4xl font-black">Friend Requests</h1>
      <div className="mt-6 space-y-3">
        {requests.incoming.length ? (
          requests.incoming.map((request) => <FriendRequestCard key={request.id} request={request} />)
        ) : (
          <EmptyState title="No pending requests" message="When someone wants to match movie lists, their request will appear here." />
        )}
      </div>
      {requests.outgoing.length ? (
        <section className="mt-8">
          <h2 className="text-xl font-bold">Sent</h2>
          <div className="mt-3 space-y-2">
            {requests.outgoing.map((request) => (
              <div key={request.id} className="glass rounded-2xl p-4 text-sm text-zinc-300">
                Request sent to {request.receiver?.display_name || request.receiver?.username || "user"}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
