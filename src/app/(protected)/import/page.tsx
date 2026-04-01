import { createClient } from "@/lib/supabase/server";
import { ImportForm } from "@/components/import/import-form";

export default async function ImportPage() {
  const allowedEmail = process.env.IMPORT_ALLOWED_EMAIL;

  if (!allowedEmail) {
    return <Unauthorized reason="Import není povolen (IMPORT_ALLOWED_EMAIL není nastaven)." />;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== allowedEmail) {
    return <Unauthorized reason="Nemáš oprávnění k této stránce." />;
  }

  return <ImportForm />;
}

function Unauthorized({ reason }: { reason: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-zinc-500 text-sm">{reason}</p>
    </div>
  );
}
