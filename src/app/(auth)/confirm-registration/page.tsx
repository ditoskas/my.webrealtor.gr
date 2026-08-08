import { Suspense } from "react";
import ConfirmRegistrationPage from "@/components/auth/ConfirmRegistrationPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ConfirmRegistrationPage />
    </Suspense>
  );
}
