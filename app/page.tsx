import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Testimonials from "@/components/testimonials";
import { LandingHero } from "@/components/landing-hero";
import { LandingFeatures } from "@/components/landing-features";
import { LandingUseCases } from "@/components/landing-use-cases";
import { LandingPrivacy } from "@/components/landing-privacy";

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground pt-16">
      <Navbar />

      <LandingHero />
      <LandingFeatures />
      <LandingUseCases />

      <section id="testimonials" className="py-32 bg-muted/30">
        <h2 className="mb-20 text-center text-4xl font-semibold tracking-tight md:text-5xl">
          What people are saying
        </h2>
        <Testimonials />
      </section>

      <LandingPrivacy />

      <Footer />
    </main>
  );
}
