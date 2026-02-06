import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Send, CheckCircle, Lock, Unlock, Phone, Mail, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface DemoMessagingProps {
  /** "client" shows the share button, "artisan" shows masked/revealed contacts */
  viewAs: "client" | "artisan";
  /** External state: whether contacts have been shared */
  contactsShared?: boolean;
  /** Callback when contacts are shared (for syncing between views) */
  onShareContacts?: () => void;
}

const demoMessages = [
  {
    id: "1",
    sender: "artisan",
    senderName: "Durand Plomberie",
    content: "Bonjour ! J'ai bien reçu votre demande pour la rénovation de salle de bain. Je suis disponible mardi prochain pour un premier diagnostic. Ça vous conviendrait ?",
    time: "14:32",
    date: "Aujourd'hui",
  },
  {
    id: "2",
    sender: "client",
    senderName: "Marie D.",
    content: "Bonjour ! Oui mardi c'est parfait. Pouvez-vous me donner une fourchette de prix avant de vous déplacer ?",
    time: "14:45",
    date: "Aujourd'hui",
  },
  {
    id: "3",
    sender: "artisan",
    senderName: "Durand Plomberie",
    content: "Bien sûr. Pour une rénovation complète (douche italienne + meuble vasque + carrelage), comptez entre 4 500€ et 7 000€ selon les finitions. Je pourrai affiner sur place.",
    time: "14:52",
    date: "Aujourd'hui",
  },
  {
    id: "4",
    sender: "client",
    senderName: "Marie D.",
    content: "Super, c'est dans mon budget. Je vous partage mes coordonnées pour qu'on puisse en discuter au téléphone et fixer l'heure du rendez-vous.",
    time: "15:01",
    date: "Aujourd'hui",
  },
];

const clientContact = {
  name: "Marie Dupont",
  phone: "06 12 34 56 78",
  email: "marie.dupont@email.fr",
};

export const DemoMessaging = ({ viewAs, contactsShared = false, onShareContacts }: DemoMessagingProps) => {
  const [shared, setShared] = useState(contactsShared);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleShare = () => {
    setShared(true);
    setShowConfirmation(true);
    onShareContacts?.();
    toast.success("Vos coordonnées ont été transmises à l'artisan !");
    setTimeout(() => setShowConfirmation(false), 4000);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className={`px-4 py-3 border-b flex items-center justify-between ${
          viewAs === "client" 
            ? "bg-teal-50 border-teal-200" 
            : "bg-navy/5 border-navy/10"
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              viewAs === "client" ? "bg-teal-500" : "bg-navy"
            }`}>
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">
                {viewAs === "client" ? "Durand Plomberie" : "Marie D."}
              </p>
              <p className="text-xs text-muted-foreground">
                Rénovation Salle de Bain
              </p>
            </div>
          </div>
          {viewAs === "client" && (
            <Badge className="bg-teal-500/15 text-teal-700 border-0 text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Anonymat actif
            </Badge>
          )}
          {viewAs === "artisan" && (
            <AnimatePresence>
              {shared ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Badge className="bg-success/15 text-success border-0 text-xs animate-glow-pulse">
                    <Unlock className="w-3 h-3 mr-1" />
                    Coordonnées débloquées
                  </Badge>
                </motion.div>
              ) : (
                <Badge className="bg-muted text-muted-foreground border-0 text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  Coordonnées masquées
                </Badge>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Contact Card (artisan view only, shown when shared) */}
        {viewAs === "artisan" && (
          <AnimatePresence>
            {shared && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mx-4 mt-3 p-3 rounded-lg bg-success/5 border border-success/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm font-semibold text-success">Coordonnées du client</span>
                  </div>
                  <div className="space-y-1.5 ml-6">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{clientContact.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium text-navy">{clientContact.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium text-navy">{clientContact.email}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Messages */}
        <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
          {demoMessages.map((msg, i) => {
            const isOwn = (viewAs === "client" && msg.sender === "client") || 
                          (viewAs === "artisan" && msg.sender === "artisan");
            
            // Mask contact info for artisan if not shared
            let content = msg.content;
            if (viewAs === "artisan" && !shared) {
              content = content
                .replace(/06\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}/g, "[Coordonnées masquées - Discutez d'abord ici]")
                .replace(/[\w.-]+@[\w.-]+\.\w+/g, "[Email masqué]");
            }

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  isOwn 
                    ? viewAs === "client" 
                      ? "bg-teal-500 text-white rounded-br-md" 
                      : "bg-navy text-white rounded-br-md"
                    : "bg-muted rounded-bl-md"
                }`}>
                  <p className="text-sm leading-relaxed">{content}</p>
                  <p className={`text-[10px] mt-1 ${isOwn ? "text-white/60" : "text-muted-foreground"}`}>
                    {msg.time}
                  </p>
                </div>
              </motion.div>
            );
          })}

          {/* System message when shared */}
          <AnimatePresence>
            {shared && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-center"
              >
                <div className="bg-success/10 text-success text-xs font-medium px-4 py-2 rounded-full flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {viewAs === "client" 
                    ? "Vos coordonnées ont été transmises à l'artisan"
                    : "Le client a partagé ses coordonnées"
                  }
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input / Action Bar */}
        <div className="border-t border-border p-3">
          {viewAs === "client" && !shared ? (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center gap-2 flex-1 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-teal-500 shrink-0" />
                <span>Vos coordonnées sont masquées. Partagez-les quand vous êtes prêt.</span>
              </div>
              <Button 
                onClick={handleShare}
                className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white"
                size="sm"
              >
                <Unlock className="w-4 h-4 mr-1.5" />
                Partager mes coordonnées
              </Button>
            </div>
          ) : viewAs === "client" && shared ? (
            <div className="flex items-center gap-3">
              <input 
                type="text" 
                placeholder="Écrire un message..." 
                className="flex-1 px-4 py-2 rounded-full bg-muted text-sm border-0 focus:outline-none focus:ring-2 focus:ring-teal-500"
                disabled
              />
              <Button size="icon" className="rounded-full bg-teal-500 hover:bg-teal-600 h-9 w-9" disabled>
                <Send className="w-4 h-4 text-white" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <input 
                type="text" 
                placeholder="Écrire un message..." 
                className="flex-1 px-4 py-2 rounded-full bg-muted text-sm border-0 focus:outline-none focus:ring-2 focus:ring-navy"
                disabled
              />
              <Button size="icon" className="rounded-full bg-navy hover:bg-navy-light h-9 w-9" disabled>
                <Send className="w-4 h-4 text-white" />
              </Button>
            </div>
          )}
        </div>

        {/* Confirmation overlay for client */}
        <AnimatePresence>
          {showConfirmation && viewAs === "client" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-success text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 z-10"
            >
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">Vos coordonnées ont été transmises !</span>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
