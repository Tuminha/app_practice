import Hero from "@/components/Hero";
import Features from "@/components/Features";
import CodeExample from "@/components/CodeExample";
import Pricing from "@/components/Pricing";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <Features />
      <CodeExample />
      <Pricing />
    </main>
  );
};

export default Index;
