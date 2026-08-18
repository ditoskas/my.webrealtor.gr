import AssetMediaPage from "@/components/assets/AssetMediaPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AssetMediaPage assetId={id} />;
}
