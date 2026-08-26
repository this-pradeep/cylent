import { Hero } from "@/components/sections/Hero";
// import { Problem } from "@/components/sections/Problem";
import { About } from "@/components/sections/About";
import { Work } from "@/components/sections/Work";
import { Process } from "@/components/sections/Process";
import { AttentionToDetail } from "@/components/sections/AttentionToDetail";
import { Future } from "@/components/sections/Future";

export default function HomePage() {
  return (
    <main>
      <Hero />
      {/* <Problem /> */}
      <About />
      <Work />
      <Process />
      <AttentionToDetail />
      <Future />
    </main>
  );
}
