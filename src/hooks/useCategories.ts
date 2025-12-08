import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
  display_order: number;
  created_at: string;
}

export interface CategoryWithChildren extends Category {
  children: Category[];
}

// Fetch all categories (flat)
export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
  });
};

// Fetch parent categories only
export const useParentCategories = () => {
  return useQuery({
    queryKey: ["parent-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .is("parent_id", null)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
  });
};

// Fetch subcategories for a specific parent
export const useSubcategories = (parentId: string | null) => {
  return useQuery({
    queryKey: ["subcategories", parentId],
    queryFn: async () => {
      if (!parentId) return [];
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("parent_id", parentId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
    enabled: !!parentId,
  });
};

// Fetch categories with their children (hierarchical structure)
export const useCategoriesHierarchy = () => {
  return useQuery({
    queryKey: ["categories-hierarchy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;

      const categories = data as Category[];
      const parentCategories = categories.filter(c => c.parent_id === null);
      
      return parentCategories.map(parent => ({
        ...parent,
        children: categories.filter(c => c.parent_id === parent.id)
      })) as CategoryWithChildren[];
    },
  });
};

// Fetch categories with artisan count (for display purposes)
export const useCategoriesWithCount = () => {
  return useQuery({
    queryKey: ["categories-with-count"],
    queryFn: async () => {
      // Fetch all categories
      const { data: categories, error: catError } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (catError) throw catError;

      // Fetch artisan count per category (subcategories only)
      const { data: artisans, error: artError } = await supabase
        .from("artisans")
        .select("category_id")
        .eq("status", "active");

      if (artError) throw artError;

      // Count artisans per category
      const countMap: Record<string, number> = {};
      artisans?.forEach((a) => {
        if (a.category_id) {
          countMap[a.category_id] = (countMap[a.category_id] || 0) + 1;
        }
      });

      const allCategories = (categories as Category[]).map((cat) => ({
        ...cat,
        count: countMap[cat.id] || 0,
      }));

      // Build hierarchy with counts
      const parentCategories = allCategories.filter(c => c.parent_id === null);
      
      return parentCategories.map(parent => {
        const children = allCategories.filter(c => c.parent_id === parent.id);
        const totalCount = children.reduce((acc, child) => acc + child.count, 0);
        return {
          ...parent,
          count: totalCount,
          children
        };
      });
    },
  });
};

// Get category by ID
export const useCategoryById = (id: string | null) => {
  return useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Category | null;
    },
    enabled: !!id,
  });
};

// Get parent category for a subcategory
export const useParentCategory = (category: Category | null) => {
  return useQuery({
    queryKey: ["parent-category", category?.parent_id],
    queryFn: async () => {
      if (!category?.parent_id) return null;
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", category.parent_id)
        .maybeSingle();

      if (error) throw error;
      return data as Category | null;
    },
    enabled: !!category?.parent_id,
  });
};
