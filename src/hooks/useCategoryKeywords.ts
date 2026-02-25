import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CategoryKeywordRow {
  id: string;
  category_id: string;
  keywords: string[];
  category: {
    id: string;
    name: string;
    icon: string | null;
    parent_id: string | null;
  } | null;
}

export interface KeywordSuggestion {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  parentId: string | null;
  matchedKeyword: string;
}

export const useCategoryKeywords = () => {
  return useQuery({
    queryKey: ["category-keywords"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("category_keywords")
        .select(`
          id,
          category_id,
          keywords,
          category:categories(id, name, icon, parent_id)
        `);

      if (error) throw error;
      return (data as unknown as CategoryKeywordRow[]) || [];
    },
    staleTime: 1000 * 60 * 30, // 30 min cache
  });
};

export const searchKeywords = (
  query: string,
  keywordsData: CategoryKeywordRow[] | undefined,
  maxResults = 5
): KeywordSuggestion[] => {
  if (!query || query.length < 3 || !keywordsData) return [];

  const normalizedQuery = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const results: KeywordSuggestion[] = [];
  const seenCategories = new Set<string>();

  for (const row of keywordsData) {
    if (seenCategories.has(row.category_id) || !row.category) continue;

    // Check category name itself
    const catNameNorm = row.category.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    
    if (catNameNorm.includes(normalizedQuery)) {
      results.push({
        categoryId: row.category_id,
        categoryName: row.category.name,
        categoryIcon: row.category.icon,
        parentId: row.category.parent_id,
        matchedKeyword: row.category.name,
      });
      seenCategories.add(row.category_id);
      if (results.length >= maxResults) break;
      continue;
    }

    // Check keywords
    for (const kw of row.keywords) {
      const kwNorm = kw
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (kwNorm.includes(normalizedQuery) || normalizedQuery.includes(kwNorm)) {
        results.push({
          categoryId: row.category_id,
          categoryName: row.category.name,
          categoryIcon: row.category.icon,
          parentId: row.category.parent_id,
          matchedKeyword: kw,
        });
        seenCategories.add(row.category_id);
        break;
      }
    }

    if (results.length >= maxResults) break;
  }

  return results;
};
