import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/bookmarks");
  }

  return (
    <div className="flex items-center justify-center home-background py-12 min-h-[55vh]">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Welcome to Smart Bookmarks
        </h1>
        <p className="text-lg md:text-xl text-muted mb-4">
          Save and organize your favorite bookmarks with real-time sync across all your devices
        </p>
        <div className="space-y-2">
          <p className="text-muted">Sign in with Google to get started</p>
          <p className="text-sm text-muted">
            Your bookmarks are private and only visible to you
          </p>
        </div>
      </div>
    </div>
  )
}
