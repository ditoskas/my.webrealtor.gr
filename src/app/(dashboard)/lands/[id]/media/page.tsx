import LandMediaPage from "@/components/lands/LandMediaPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LandMediaPage landId={id} />;
}
