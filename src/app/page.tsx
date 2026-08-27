import { Hero } from "@/components/sections/Hero";
// import { Problem } from "@/components/sections/Problem";
import { About } from "@/components/sections/About";
import { Work } from "@/components/sections/Work";
import { Future } from "@/components/sections/Future";

export default function HomePage() {
  return (
    <main>
      <Hero />
      {/* <Problem /> */}
      <About />
      <Work />
      <Future />
    </main>
  );
}
