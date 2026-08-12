"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function sendMessage(recipientId: string, formData: FormData) {
  const body = (formData.get("body") as string)?.trim();
  if (!body) return { error: "Message cannot be empty." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("messages").insert({
    sender_id: user.id,
    recipient_id: recipientId,
    body,
  });

  if (error) return { error: error.message };
  revalidatePath(`/patient/messages/${recipientId}`);
  return { success: true };
}
