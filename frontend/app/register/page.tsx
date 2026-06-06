import { registerAction } from "@/app/actions/auth";
import { AuthCard } from "@/components/auth/AuthCard";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function RegisterPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <AuthCard
      mode="register"
      action={registerAction}
      error={getSearchValue(params, "error")}
      message={getSearchValue(params, "message")}
    />
  );
}
