"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "ResearchLM is a beautiful way to explore and understand complex research.",
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
      "ResearchLM transformed how our team studies papers and documentation.",
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
            className="h-[400px] w-[420px] shrink-0 rounded-[32px] bg-muted/40 p-8"
          >
            <p className="text-1xl">{item.quote}</p>
            <p className="mt-12">{item.author}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
