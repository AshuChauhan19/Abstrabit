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
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Smart Bookmarks
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Save and organize your favorite bookmarks with real-time sync across all your devices
        </p>
        <div className="space-y-4">
          <p className="text-gray-700">Sign in with Google to get started</p>
          <p className="text-sm text-gray-500">
            Your bookmarks are private and only visible to you
          </p>
        </div>
      </div>
    </div>
  );
}
