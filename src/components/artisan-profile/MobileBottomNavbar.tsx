import { MessageSquare, Phone, FileText, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavbarProps {
  showClaim: boolean;
  onClaimClick: () => void;
  onQuoteClick: () => void;
  onPhoneClick: () => void;
  onChatClick: () => void;
  phoneNumber?: string | null;
  chatOpen?: boolean;
}

const MobileBottomNavbar = ({
  showClaim,
  onClaimClick,
  onQuoteClick,
  onPhoneClick,
  onChatClick,
  phoneNumber,
  chatOpen = false,
}: MobileBottomNavbarProps) => {
  const navItems = [
    ...(showClaim
      ? [
          {
            id: "claim",
            label: "Revendiquer",
            icon: <UserPlus className="h-5 w-5" />,
            onClick: onClaimClick,
            className: "text-amber-600",
          },
        ]
      : []),
    {
      id: "quote",
      label: "Devis",
      icon: <FileText className="h-5 w-5" />,
      onClick: onQuoteClick,
      className: "text-primary",
    },
    {
      id: "phone",
      label: "Téléphone",
      icon: <Phone className="h-5 w-5" />,
      onClick: onPhoneClick,
      className: "text-emerald-600",
    },
    {
      id: "chat",
      label: chatOpen ? "Fermer" : "Tchat",
      icon: chatOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />,
      onClick: onChatClick,
      className: chatOpen ? "text-red-600" : "text-blue-600",
    },
  ];

  return (
    <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-[60] bg-background border-t shadow-lg">
      <div className="flex items-center justify-around py-2 px-2 safe-area-pb">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-all active:scale-95",
              "hover:bg-muted",
              item.className,
              item.id === "chat" && chatOpen && "bg-red-100 ring-2 ring-red-500"
            )}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomNavbar;
