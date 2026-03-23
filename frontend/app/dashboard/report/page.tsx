import Image from "next/image";
import { ReportClient } from "./ReportClient";

export const metadata = { title: "User Report | freightPOP" };

export default function DashboardReportPage() {
  return (
    <main className="min-h-screen bg-slate-100 flex flex-col items-center py-8 px-4">
      {/* Background image header using login-hero.jpeg */}
      <section className="w-full max-w-md overflow-hidden rounded-md bg-white shadow-md relative h-56">
        <Image
          src="/images/login-hero.jpeg"
          alt="freightPOP report background"
          fill
          className="object-cover"
          sizes="(max-width: 448px) 100vw, 448px"
          priority
        />
      </section>

      <ReportClient />
    </main>
  );
}

