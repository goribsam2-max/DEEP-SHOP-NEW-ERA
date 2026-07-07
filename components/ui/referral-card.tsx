import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Copy, Check, Link2, Sparkles } from "lucide-react";
import { StatusBadge } from "./status-badge";

interface Step {
  icon: React.ReactNode;
  text: React.ReactNode;
}

export interface ReferralCardProps {
  badgeText: string;
  title: string;
  description: string;
  steps: Step[];
  referralLink: string;
  buttonText?: string;
  onButtonClick?: () => void;
  className?: string;
}

export const ReferralCard = ({
  badgeText,
  title,
  description,
  steps,
  referralLink,
  buttonText,
  onButtonClick,
  className,
}: ReferralCardProps) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className={cn(
        "relative w-full overflow-hidden rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-10 shadow-xl",
        className
      )}
    >
      <div className="relative z-10">
        <motion.div variants={itemVariants} className="mb-6">
          <StatusBadge leftIcon={Sparkles} leftLabel={badgeText} status="default" />
        </motion.div>

        <motion.h2
          variants={itemVariants}
          className="mb-2 text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
        >
          {title}
        </motion.h2>
        <motion.p variants={itemVariants} className="mb-8 text-base text-zinc-600 dark:text-zinc-400 font-medium max-w-sm">
          {description}
        </motion.p>

        <div className="mb-8">
          <motion.h3 variants={itemVariants} className="mb-5 font-bold uppercase tracking-wider text-xs text-zinc-400">
            How it works
          </motion.h3>
          <motion.ul
            className="space-y-4"
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.2, delayChildren: 0.3 }}
          >
            {steps.map((step, index) => (
              <motion.li key={index} variants={itemVariants} className="flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                  {step.icon}
                </span>
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 max-w-xs">{step.text}</span>
              </motion.li>
            ))}
          </motion.ul>
        </div>

        {referralLink ? (
            <div>
            <motion.h3 variants={itemVariants} className="mb-3 font-bold uppercase tracking-wider text-xs text-zinc-400">
                Your invite link
            </motion.h3>
            <motion.div
                variants={itemVariants}
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2 max-w-md"
            >
                <div className="flex h-12 flex-grow items-center gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-4">
                <Link2 className="h-5 w-5 text-zinc-400" />
                <p className="truncate text-sm font-medium text-zinc-700 dark:text-zinc-300">{referralLink}</p>
                </div>
                <Button onClick={handleCopy} className="h-12 w-full rounded-2xl shrink-0 sm:w-auto bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold px-8" variant="default">
                <AnimatePresence mode="wait" initial={false}>
                    {copied ? (
                    <motion.span
                        key="copied"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex items-center gap-2"
                    >
                        <Check className="h-5 w-5" /> Copied!
                    </motion.span>
                    ) : (
                    <motion.span
                        key="copy"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex items-center gap-2"
                    >
                        <Copy className="h-5 w-5" /> Copy Link
                    </motion.span>
                    )}
                </AnimatePresence>
                </Button>
            </motion.div>
            </div>
        ) : (
            <motion.div variants={itemVariants}>
                <Button onClick={onButtonClick} className="h-12 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold px-10 text-base" variant="default">
                    {buttonText || "Get Started"}
                </Button>
            </motion.div>
        )}
      </div>
    </motion.div>
  );
};
