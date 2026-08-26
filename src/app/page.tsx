import { Hero } from "@/components/sections/Hero";
// import { Problem } from "@/components/sections/Problem";
import { About } from "@/components/sections/About";
import { Pillars } from "@/components/sections/Pillars";
import { Process } from "@/components/sections/Process";
import { Proof } from "@/components/sections/Proof";
import { AttentionToDetail } from "@/components/sections/AttentionToDetail";
import { Future } from "@/components/sections/Future";

export default function HomePage() {
  return (
    <main>
      <Hero />
      {/* <Problem /> */}
      <About />
      <Pillars />
      <Process />
      <Proof />
      <AttentionToDetail />
      <Future />
    </main>
  );
}
