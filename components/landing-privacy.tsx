import { ShieldCheck, AudioLines, Users, FileText, Lock } from "lucide-react";

export function LandingPrivacy() {
  return (
    <section className="relative overflow-hidden px-6 py-24">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/5 blur-[120px] rounded-full -z-10" />

      <div className="mx-auto max-w-5xl text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 text-sm font-medium">
          <Lock className="w-4 h-4" />
          Enterprise-Grade Security
        </div>
        
        <h2 className="text-4xl font-medium leading-tight tracking-tight md:text-6xl">
          We value your privacy and <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-700">never use your</span>
          <br />
          research data to train our AI models
        </h2>

        <p className="mx-auto mt-8 max-w-3xl text-xl leading-relaxed text-muted-foreground">
          Your documents, reports, PDFs, and research materials remain entirely private.
          Techsodh keeps your workspace secure with end-to-end encryption. Your data is 
          never used for model training without your explicit permission.
        </p>

        <button className="mt-8 text-lg font-medium text-green-600 hover:text-green-700 hover:underline transition-colors">
          Learn more about privacy &rarr;
        </button>
      </div>

      {/* Visual */}
      <div className="relative mx-auto mt-24 flex h-[450px] max-w-4xl items-center justify-center">
        {/* Glass Card Container */}
        <div className="absolute inset-0 rounded-[3rem] border border-white/20 bg-white/5 backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(34,197,94,0.1)] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5" />
        </div>

        {/* Animated Outer Rings */}
        <div className="absolute h-[520px] w-[520px] rounded-full border border-green-500/10 animate-[spin_60s_linear_infinite]" />
        <div className="absolute h-[420px] w-[420px] rounded-full border border-green-500/20 animate-[spin_40s_linear_infinite_reverse]" />
        <div className="absolute h-[320px] w-[320px] rounded-full border border-green-500/30 animate-[spin_20s_linear_infinite]" />

        {/* Center Glow */}
        <div className="absolute h-44 w-44 rounded-full bg-green-400/20 blur-3xl animate-pulse" />

        {/* Center Shield - 3D Effect */}
        <div className="relative z-10 flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-white to-green-50 border border-white shadow-2xl shadow-green-500/20">
          <div className="absolute inset-2 rounded-full border border-green-100 bg-white" />
          <ShieldCheck className="relative z-20 h-20 w-20 text-green-600 drop-shadow-sm" />
        </div>

        {/* Floating Icons - Glassmorphic */}
        <div className="absolute bottom-24 left-32 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/40 bg-white/60 shadow-xl backdrop-blur-md hover:-translate-y-2 transition-transform duration-300">
          <AudioLines className="h-8 w-8 text-green-700" />
        </div>

        <div className="absolute bottom-16 right-1/4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/40 bg-white/60 shadow-xl backdrop-blur-md hover:-translate-y-2 transition-transform duration-300">
          <Users className="h-8 w-8 text-green-700" />
        </div>

        <div className="absolute right-32 top-32 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/40 bg-white/60 shadow-xl backdrop-blur-md hover:-translate-y-2 transition-transform duration-300">
          <FileText className="h-8 w-8 text-green-700" />
        </div>
      </div>
    </section>
  );
}
