import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { useCategoriesHierarchy, Category } from "@/hooks/useCategories";
import { CategoryIcon } from "./CategoryIcon";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryMultiSelectProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  maxDisplay?: number;
}

export const CategoryMultiSelect = ({
  selectedIds,
  onChange,
  placeholder = "Sélectionnez vos métiers...",
  maxDisplay = 3,
}: CategoryMultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: categories, isLoading } = useCategoriesHierarchy();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get all selected category names
  const getSelectedCategories = (): Category[] => {
    if (!categories) return [];
    const allCategories = categories.flatMap((parent) => [parent, ...parent.children]);
    return allCategories.filter((cat) => selectedIds.includes(cat.id));
  };

  const toggleCategory = (categoryId: string) => {
    if (selectedIds.includes(categoryId)) {
      onChange(selectedIds.filter((id) => id !== categoryId));
    } else {
      onChange([...selectedIds, categoryId]);
    }
  };

  const toggleParentExpand = (parentId: string) => {
    setExpandedParents((prev) =>
      prev.includes(parentId) ? prev.filter((id) => id !== parentId) : [...prev, parentId]
    );
  };

  const removeCategory = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter((id) => id !== categoryId));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectedCategories = getSelectedCategories();

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "min-h-[42px] cursor-pointer hover:bg-accent/50 transition-colors",
          selectedIds.length === 0 && "text-muted-foreground"
        )}
      >
        <div className="flex flex-wrap gap-1.5 flex-1 items-center">
          {selectedIds.length === 0 ? (
            <span>{placeholder}</span>
          ) : (
            <>
              {selectedCategories.slice(0, maxDisplay).map((cat) => (
                <Badge
                  key={cat.id}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-0.5 text-xs"
                >
                  <CategoryIcon iconName={cat.icon} size={12} />
                  <span className="max-w-[100px] truncate">{cat.name}</span>
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors"
                    onClick={(e) => removeCategory(cat.id, e)}
                  />
                </Badge>
              ))}
              {selectedCategories.length > maxDisplay && (
                <Badge variant="outline" className="text-xs">
                  +{selectedCategories.length - maxDisplay}
                </Badge>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2">
          {selectedIds.length > 0 && (
            <X
              className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={clearAll}
            />
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg max-h-[300px] overflow-y-auto">
          {categories?.map((parent) => (
            <div key={parent.id} className="border-b border-border last:border-b-0">
              {/* Parent category header */}
              <button
                type="button"
                onClick={() => toggleParentExpand(parent.id)}
                className="flex w-full items-center gap-2 px-3 py-2.5 hover:bg-accent/50 transition-colors"
              >
                <CategoryIcon iconName={parent.icon} size={18} className="text-primary" />
                <span className="font-medium text-sm flex-1 text-left">{parent.name}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    expandedParents.includes(parent.id) && "rotate-180"
                  )}
                />
              </button>

              {/* Subcategories */}
              {expandedParents.includes(parent.id) && parent.children.length > 0 && (
                <div className="bg-muted/30">
                  {parent.children.map((child) => {
                    const isSelected = selectedIds.includes(child.id);
                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => toggleCategory(child.id)}
                        className={cn(
                          "flex w-full items-center gap-2 px-4 pl-8 py-2 text-sm transition-colors",
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-accent/50 text-foreground"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-input"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <span className="flex-1 text-left">{child.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryMultiSelect;