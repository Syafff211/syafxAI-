import { ChatWorkspace } from "@/components/chat/ChatWorkspace";
import { getSessionUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Root chat experience. Guests can try chat with limited features; signed-in
 * users get history, folders, pin/favorite, and sharing.
 */
export default async function Home() {
  const { user } = await getSessionUser();
  const profile = user
    ? { email: user.email ?? undefined, name: (user.user_metadata?.name as string) ?? undefined }
    : null;
  return <ChatWorkspace user={profile} />;
}
