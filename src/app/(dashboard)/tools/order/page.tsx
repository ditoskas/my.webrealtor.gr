import { Suspense } from "react";
import OrderPage from "@/components/tools/OrderPage";

export default function Page() {
  return (
    <Suspense>
      <OrderPage />
    </Suspense>
  );
}
