import PropertyViewPage from "@/components/properties/PropertyViewPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PropertyViewPage propertyId={id} />;
}
