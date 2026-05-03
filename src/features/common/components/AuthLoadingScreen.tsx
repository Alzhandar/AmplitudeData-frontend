import Image from "next/image";
import { Spinner } from "./ui/Spinner";

type AuthLoadingScreenProps = {
  message?: string;
};

export function AuthLoadingScreen({ message = "Проверка доступа..." }: AuthLoadingScreenProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#edf1f8]">
      <Image src="/logo-new.svg" alt="Avatariya" width={140} height={36} priority />
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" className="text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">{message}</p>
      </div>
    </main>
  );
}
