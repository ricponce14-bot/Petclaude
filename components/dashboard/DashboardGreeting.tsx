"use client";
import { motion } from "framer-motion";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
};

const EMOJIS = ["🐾", "🐕", "✂️", "🛁", "🐩"];

export default function DashboardGreeting({ dateStr }: { dateStr: string }) {
  const greeting = getGreeting();
  const emoji = EMOJIS[new Date().getDay() % EMOJIS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <h1 className="text-2xl md:text-4xl font-black text-[#1A1A1A] tracking-tight flex items-center gap-2">
        <span className="text-2xl md:text-3xl">{emoji}</span>
        {greeting}
      </h1>
      <p className="text-[#9e8a7a] font-semibold text-sm md:text-base mt-1 capitalize">
        {dateStr}
      </p>
    </motion.div>
  );
}
