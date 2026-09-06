import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Work } from "@/components/sections/Work";
import { Process } from "@/components/sections/Process";
import { Future } from "@/components/sections/Future";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <About />
      <Work />
      <Process />
      <Future />
    </main>
  );
}
