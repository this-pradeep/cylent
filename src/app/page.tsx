import { Hero } from "@/components/sections/Hero";
import { Problem } from "@/components/sections/Problem";
import { Philosophy } from "@/components/sections/Philosophy";
import { Pillars } from "@/components/sections/Pillars";
import { Process } from "@/components/sections/Process";
import { Proof } from "@/components/sections/Proof";
import { AttentionToDetail } from "@/components/sections/AttentionToDetail";
import { Future } from "@/components/sections/Future";
import { CallToAction } from "@/components/sections/CallToAction";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Problem />
      <Philosophy />
      <Pillars />
      <Process />
      <Proof />
      <AttentionToDetail />
      <Future />
      <CallToAction />
    </main>
  );
}
