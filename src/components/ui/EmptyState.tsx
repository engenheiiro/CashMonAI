import React from "react";
import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
        <Icon className="h-10 w-10 text-zinc-400 dark:text-zinc-500" />
      </div>
      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{title}</h3>
      <p className="text-zinc-500 dark:text-zinc-400 max-w-xs mb-8">{description}</p>
      {action}
    </motion.div>
  );
}
