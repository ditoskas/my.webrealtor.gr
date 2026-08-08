import LandDetail from "@/components/lands/LandDetail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LandDetail mode="edit" landId={id} />;
}
