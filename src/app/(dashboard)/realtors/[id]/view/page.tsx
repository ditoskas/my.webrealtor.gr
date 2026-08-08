import RealtorViewPage from "@/components/realtors/RealtorViewPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RealtorViewPage realtorId={id} />;
}
