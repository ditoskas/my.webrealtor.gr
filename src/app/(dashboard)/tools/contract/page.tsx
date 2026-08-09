import { Suspense } from "react";
import ContractPage from "@/components/tools/ContractPage";

export default function Page() {
  return (
    <Suspense>
      <ContractPage />
    </Suspense>
  );
}
