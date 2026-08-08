import PropertyDetail from "@/components/properties/PropertyDetail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PropertyDetail mode="edit" propertyId={id} />;
}
