import RealtorMessageFormsPage from "@/components/realtors/RealtorMessageFormsPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RealtorMessageFormsPage realtorId={id} />;
}
