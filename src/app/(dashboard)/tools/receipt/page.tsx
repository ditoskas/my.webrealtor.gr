import { Suspense } from "react";
import ReceiptPage from "@/components/tools/ReceiptPage";

export default function Page() {
  return (
    <Suspense>
      <ReceiptPage />
    </Suspense>
  );
}
