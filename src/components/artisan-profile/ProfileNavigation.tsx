import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
  MessageSquare, 
  Award, 
  Wrench, 
  Image, 
  Video, 
  Clock, 
  Star,
  Users
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: "description", label: "Description", icon: <MessageSquare className="h-4 w-4" /> },
  { id: "competences", label: "Compétences", icon: <Award className="h-4 w-4" /> },
  { id: "prestations", label: "Prestations", icon: <Wrench className="h-4 w-4" /> },
  { id: "realisations", label: "Réalisations", icon: <Image className="h-4 w-4" /> },
  { id: "videos", label: "Vidéos", icon: <Video className="h-4 w-4" /> },
  { id: "horaires", label: "Horaires", icon: <Clock className="h-4 w-4" /> },
  { id: "avis", label: "Avis clients", icon: <Star className="h-4 w-4" /> },
  { id: "recommandations", label: "Recommandations", icon: <Users className="h-4 w-4" /> },
];

interface ProfileNavigationProps {
  visibleSections?: string[];
}

const ProfileNavigation = ({ visibleSections }: ProfileNavigationProps) => {
  const [activeSection, setActiveSection] = useState<string>("");

  // Filter nav items based on visible sections
  const filteredNavItems = visibleSections 
    ? navItems.filter(item => visibleSections.includes(item.id))
    : navItems;

  useEffect(() => {
    const handleScroll = () => {
      const sections = filteredNavItems.map(item => ({
        id: item.id,
        element: document.getElementById(item.id)
      })).filter(s => s.element);

      const scrollPosition = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.element && section.element.offsetTop <= scrollPosition) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [filteredNavItems]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  if (filteredNavItems.length === 0) return null;

  return (
    <div className="sticky top-20 z-20 bg-background/95 backdrop-blur-sm border rounded-lg shadow-sm">
      <div className="px-2 md:px-4">
        <nav className="flex items-center justify-center gap-4 md:gap-6 overflow-x-auto py-3 scrollbar-hide">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                activeSection === item.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default ProfileNavigation;
