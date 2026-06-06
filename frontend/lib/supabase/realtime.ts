import type {
  RealtimeChannel,
  SupabaseClient,
} from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type CoupleRealtimeHandlers = {
  onChange?: () => void;
};

export function subscribeToCoupleRealtime(
  supabase: SupabaseClient<Database>,
  coupleId: string,
  handlers: CoupleRealtimeHandlers = {},
): RealtimeChannel {
  return supabase
    .channel(`couple:${coupleId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        filter: `couple_id=eq.${coupleId}`,
      },
      () => {
        handlers.onChange?.();
      },
    )
    .subscribe();
}
