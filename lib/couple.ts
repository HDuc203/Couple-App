import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type CurrentCouple = {
  membership: Tables<"couple_members">;
  couple: Tables<"couples">;
};

export type PartnerProfile = Tables<"profiles">;

export async function getCurrentCouple(
  userId: string,
): Promise<CurrentCouple | null> {
  const supabase = await createClient();
  const { data: membership, error: membershipError } = await supabase
    .from("couple_members")
    .select("*")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  if (!membership?.couple_id) {
    return null;
  }

  const { data: couple, error: coupleError } = await supabase
    .from("couples")
    .select("*")
    .eq("id", membership.couple_id)
    .single();

  if (coupleError) {
    throw new Error(coupleError.message);
  }

  return {
    membership,
    couple,
  };
}

export async function getPartnerProfile(
  userId: string,
  coupleId: string,
): Promise<PartnerProfile | null> {
  const supabase = await createClient();
  const { data: partnerMember, error: memberError } = await supabase
    .from("couple_members")
    .select("user_id")
    .eq("couple_id", coupleId)
    .neq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (memberError) {
    throw new Error(memberError.message);
  }

  if (!partnerMember?.user_id) {
    return null;
  }

  const { data: partnerProfile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", partnerMember.user_id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return partnerProfile;
}
