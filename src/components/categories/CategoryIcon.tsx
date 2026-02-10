import {
  Building2,
  Hammer,
  DoorOpen,
  Trees,
  Wrench,
  Paintbrush,
  Zap,
  Star,
  Briefcase,
  ArrowUpRight,
  HelpCircle,
  Sun,
  Thermometer,
  Home,
  Droplets,
  Construction,
  Cpu,
  LucideIcon
} from "lucide-react";

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  "building-2": Building2,
  "hammer": Hammer,
  "door-open": DoorOpen,
  "DoorOpen": DoorOpen,
  "trees": Trees,
  "wrench": Wrench,
  "paintbrush": Paintbrush,
  "zap": Zap,
  "star": Star,
  "briefcase": Briefcase,
  "arrow-up-right": ArrowUpRight,
  "Sun": Sun,
  "Thermometer": Thermometer,
  "home": Home,
  "droplets": Droplets,
  "construction": Construction,
  "cpu": Cpu,
  "Cpu": Cpu,
};

interface CategoryIconProps {
  iconName: string | null;
  className?: string;
  size?: number;
}

export const CategoryIcon = ({ iconName, className = "", size = 24 }: CategoryIconProps) => {
  const Icon = iconName ? (iconMap[iconName] || HelpCircle) : HelpCircle;
  return <Icon className={className} size={size} />;
};

export const getCategoryIcon = (iconName: string | null): LucideIcon => {
  return iconName ? (iconMap[iconName] || HelpCircle) : HelpCircle;
};

export default CategoryIcon;
