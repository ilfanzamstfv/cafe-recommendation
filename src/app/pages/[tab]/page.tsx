import { notFound } from "next/navigation";

const pages = ["discover", "saved", "history", "profile"];

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const { tab } = await params;
  if (!pages.includes(tab)) notFound();

  return null;
}
