import AssetViewPage from "@/components/assets/AssetViewPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AssetViewPage assetId={id} />;
}
