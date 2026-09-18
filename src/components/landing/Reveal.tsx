"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/*
 * Petit embolcall client per animar l'aparició d'un element quan entra
 * a la pantalla en fer scroll (fos + lleuger desplaçament amunt).
 * S'usa només a la landing: la resta de l'aplicació no necessita
 * animació, així que no s'ha de carregar framer-motion enlloc més.
 */
interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, className }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
