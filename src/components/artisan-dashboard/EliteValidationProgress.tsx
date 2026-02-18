import { CheckCircle, FileText, CreditCard, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface EliteValidationProgressProps {
  identityConfirmed: boolean;
  documentsUploaded: number;
  totalDocuments: number;
  isSubscribed: boolean;
}

const steps = [
  {
    key: "identity",
    label: "Identité confirmée",
    description: "Votre email a été vérifié avec succès.",
    icon: CheckCircle,
  },
  {
    key: "documents",
    label: "Pièces de confiance déposées",
    description: "KBIS, Décennale, RC Pro — requis pour activer la visibilité.",
    icon: FileText,
    link: "/artisan/documents",
    linkLabel: "Déposer mes documents",
  },
  {
    key: "subscription",
    label: "Activation du secteur",
    description: "Débloquez les 3 chantiers en attente sur votre zone.",
    icon: CreditCard,
    link: "/artisan/subscription",
    linkLabel: "Activer mon secteur",
  },
];

export const EliteValidationProgress = ({
  identityConfirmed,
  documentsUploaded,
  totalDocuments,
  isSubscribed,
}: EliteValidationProgressProps) => {
  const docsComplete = documentsUploaded >= totalDocuments;
  const stepStatuses = [identityConfirmed, docsComplete, isSubscribed];
  const completedCount = stepStatuses.filter(Boolean).length;
  const progress = (completedCount / steps.length) * 100;

  // Don't show if all complete
  if (completedCount === steps.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 md:p-7 mb-6"
      style={{
        background: "#0F1B2E",
        border: "1px solid rgba(255,184,0,0.2)",
        boxShadow: "0 0 30px rgba(255,184,0,0.05)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-black text-white tracking-wide">
          🏆 PARCOURS DE VALIDATION ÉLITE
        </h3>
        <span className="text-xs font-bold text-[#FFB800] bg-[#FFB800]/10 px-3 py-1 rounded-full">
          {completedCount}/{steps.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2.5 rounded-full bg-[#1a2940] mb-6 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #FFB800, #f0a500)",
            boxShadow: "0 0 10px rgba(255,184,0,0.4)",
          }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, i) => {
          const isComplete = stepStatuses[i];
          const isCurrent = !isComplete && (i === 0 || stepStatuses[i - 1]);
          const StepIcon = step.icon;

          return (
            <div
              key={step.key}
              className="flex items-start gap-4 rounded-xl p-4 transition-all"
              style={{
                background: isComplete
                  ? "rgba(255,184,0,0.06)"
                  : isCurrent
                  ? "rgba(255,184,0,0.03)"
                  : "transparent",
                border: `1px solid ${isComplete ? "rgba(255,184,0,0.2)" : isCurrent ? "rgba(255,184,0,0.12)" : "rgba(255,255,255,0.05)"}`,
                opacity: !isComplete && !isCurrent ? 0.4 : 1,
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: isComplete ? "rgba(255,184,0,0.2)" : "rgba(255,255,255,0.05)",
                }}
              >
                {isComplete ? (
                  <CheckCircle className="w-5 h-5 text-[#FFB800]" />
                ) : !isComplete && !isCurrent ? (
                  <Lock className="w-4 h-4 text-white/30" />
                ) : (
                  <StepIcon className="w-5 h-5 text-[#FFB800]" />
                )}
              </div>

              <div className="flex-1">
                <p className={`text-sm font-bold ${isComplete ? "text-[#FFB800]" : "text-white"}`}>
                  {isComplete ? "✅ " : ""}{step.label}
                  {step.key === "documents" && !isComplete && (
                    <span className="text-white/40 font-normal ml-2">
                      ({documentsUploaded}/{totalDocuments})
                    </span>
                  )}
                </p>
                <p className="text-xs text-white/40 mt-0.5">{step.description}</p>

                {isCurrent && step.link && (
                  <Link
                    to={step.link}
                    className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-bold text-[#0A192F] px-4 py-2 rounded-lg transition-all hover:scale-[1.02]"
                    style={{
                      background: "linear-gradient(135deg, #FFB800, #f0a500)",
                      boxShadow: "0 4px 15px rgba(255,184,0,0.25)",
                    }}
                  >
                    {step.linkLabel}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
