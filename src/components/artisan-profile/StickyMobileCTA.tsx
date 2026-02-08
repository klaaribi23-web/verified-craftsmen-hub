import { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StickyMobileCTAProps {
  artisanName: string;
  onRequestQuote: () => void;
}

const StickyMobileCTA = ({ artisanName, onRequestQuote }: StickyMobileCTAProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 lg:hidden",
        "bg-background/95 backdrop-blur-md border-t border-border",
        "px-4 py-3 safe-area-bottom",
        "animate-in slide-in-from-bottom-4 duration-300"
      )}
    >
      <Button
        onClick={onRequestQuote}
        size="lg"
        className="w-full h-14 text-base font-bold shadow-lg bg-gold hover:bg-gold/90 text-navy-dark"
      >
        <FileText className="w-5 h-5 mr-2" />
        Demander un devis gratuit
      </Button>
    </div>
  );
};

export default StickyMobileCTA;
