import { useState } from "react";
import { ChevronDown, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useCategoriesHierarchy, Category, CategoryWithChildren } from "@/hooks/useCategories";
import { CategoryIcon } from "./CategoryIcon";

interface CategorySelectProps {
  value: string;
  onValueChange: (value: string, categoryName: string) => void;
  placeholder?: string;
  allowParentSelection?: boolean;
  className?: string;
}

export const CategorySelect = ({
  value,
  onValueChange,
  placeholder = "Sélectionner une catégorie",
  allowParentSelection = false,
  className
}: CategorySelectProps) => {
  const [open, setOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const { data: categories, isLoading } = useCategoriesHierarchy();

  const toggleExpanded = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleSelect = (category: Category) => {
    onValueChange(category.id, category.name);
    setOpen(false);
  };

  const getSelectedCategoryName = (): string => {
    if (!value || !categories) return "";
    
    for (const parent of categories) {
      if (parent.id === value) return parent.name;
      const child = parent.children.find(c => c.id === value);
      if (child) return child.name;
    }
    return "";
  };

  const selectedName = getSelectedCategoryName();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {selectedName || placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 bg-white z-50" align="start">
        <ScrollArea className="h-[300px]">
          <div className="p-2">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                Chargement...
              </div>
            ) : (
              <>
                {/* Option to clear selection */}
                <button
                  onClick={() => {
                    onValueChange("", "");
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
                >
                  <span className="text-muted-foreground">Toutes les catégories</span>
                </button>

                {categories?.map((parent) => (
                  <div key={parent.id} className="mt-1">
                    {/* Parent category */}
                    <div className="flex items-center">
                      <button
                        onClick={(e) => toggleExpanded(parent.id, e)}
                        className="p-1 hover:bg-muted rounded"
                      >
                        {expandedCategories.has(parent.id) ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={() => allowParentSelection && handleSelect(parent)}
                        className={cn(
                          "flex-1 flex items-center gap-2 px-2 py-2 text-sm rounded-md transition-colors text-left font-medium",
                          allowParentSelection ? "hover:bg-muted cursor-pointer" : "cursor-default",
                          value === parent.id && "bg-primary/10 text-primary"
                        )}
                      >
                        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                          <CategoryIcon iconName={parent.icon} size={14} className="text-primary" />
                        </div>
                        <span>{parent.name}</span>
                        {value === parent.id && (
                          <Check className="ml-auto h-4 w-4 text-primary" />
                        )}
                      </button>
                    </div>

                    {/* Subcategories */}
                    {expandedCategories.has(parent.id) && parent.children.length > 0 && (
                      <div className="ml-6 pl-2 border-l border-border">
                        {parent.children.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => handleSelect(child)}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left",
                              value === child.id && "bg-primary/10 text-primary"
                            )}
                          >
                            <CategoryIcon iconName={child.icon} size={12} className="text-muted-foreground" />
                            <span>{child.name}</span>
                            {value === child.id && (
                              <Check className="ml-auto h-4 w-4 text-primary" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default CategorySelect;
