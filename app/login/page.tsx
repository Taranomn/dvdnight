import Link from "next/link";
import { loginAction, signInWithGoogleAction } from "@/lib/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; redirectTo?: string }> }) {
  const { error, redirectTo = "/dashboard" } = await searchParams;
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4">
      <div className="glass w-full rounded-[2rem] p-6">
        <h1 className="text-3xl font-black">Welcome back</h1>
        <p className="mt-2 text-sm text-zinc-400">Log in to sync Watch List and compare with friends.</p>
        {error ? <p className="mt-4 rounded-2xl bg-[#ff4b4b]/10 p-3 text-sm text-[#ff4b4b]">{error}</p> : null}
        <form action={loginAction} className="mt-6 space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <input name="email" type="email" required placeholder="Email" className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 outline-none focus:border-[#ff3b5c]" />
          <input name="password" type="password" required placeholder="Password" className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 outline-none focus:border-[#ff3b5c]" />
          <button className="primary-button h-12 w-full">Log In</button>
        </form>
        <form action={signInWithGoogleAction} className="mt-3">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <button className="secondary-button h-12 w-full">Continue with Google</button>
        </form>
        <p className="mt-5 text-center text-sm text-zinc-400">
          New here? <Link href={`/signup?redirectTo=${encodeURIComponent(redirectTo)}`} className="text-[#ff3b5c]">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
