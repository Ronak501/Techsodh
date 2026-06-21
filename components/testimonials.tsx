"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "Techsodh is a beautiful way to explore and understand complex research.",
    author: "TechCrunch",
    avatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    quote:
      "The AI report generation feels like the next evolution of research tools.",
    author: "AI Weekly",
    avatar: "https://i.pravatar.cc/150?img=2",
  },
  {
    quote:
      "Techsodh transformed how our team studies papers and documentation.",
    author: "Research Labs",
    avatar: "https://i.pravatar.cc/150?img=3",
  },
  {
    quote: "The citation tracking and source grounding are incredibly useful.",
    author: "Data Scientist",
    avatar: "https://i.pravatar.cc/150?img=4",
  },
  {
    quote: "One of the most impressive AI research assistants we've tested.",
    author: "Product Hunt",
    avatar: "https://i.pravatar.cc/150?img=5",
  },
];

export default function Testimonials() {
  return (
    <div className="relative overflow-hidden">
      <motion.div
        className="flex gap-8"
        animate={{
          x: ["0%", "-50%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {[...testimonials, ...testimonials].map((item, index) => (
          <div
            key={index}
            className="flex flex-col justify-between w-[320px] shrink-0 rounded-2xl border border-border/50 bg-background/50 p-6 shadow-sm"
          >
            <p className="text-lg leading-relaxed text-muted-foreground text-balance">"{item.quote}"</p>
            <div className="mt-8 flex items-center gap-3">
              <img src={item.avatar} alt={item.author} className="h-10 w-10 rounded-full" />
              <p className="font-medium text-foreground">{item.author}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
