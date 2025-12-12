import { Suspense } from "react";
import { LoginForm } from "./form";
import { Loader2, Leaf } from "lucide-react";

function LoginSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#1B4332] rounded-lg flex items-center justify-center">
          <Leaf className="w-6 h-6 text-[#D4A853]" />
        </div>
        <span className="text-2xl font-bold text-[#1B4332]">ABFI</span>
      </div>

      <Suspense fallback={<LoginSkeleton />}>
        <LoginForm />
      </Suspense>
    </>
  );
}
