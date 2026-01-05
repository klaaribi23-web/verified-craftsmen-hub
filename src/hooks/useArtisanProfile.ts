import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WorkingHours {
  [key: string]: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface ArtisanProfile {
  id: string;
  user_id: string | null;
  profile_id: string | null;
  business_name: string;
  description: string | null;
  city: string;
  department: string | null;
  region: string | null;
  address: string | null;
  postal_code: string | null;
  photo_url: string | null;
  siret: string | null;
  insurance_number: string | null;
  hourly_rate: number | null;
  experience_years: number | null;
  website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  category_id: string | null;
  status: string;
  working_hours: WorkingHours | null;
}

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
}

export const useArtisanProfile = () => {
  const [artisan, setArtisan] = useState<ArtisanProfile | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No user found");
        setIsLoading(false);
        return;
      }

      console.log("Fetching profile for user:", user.id);

      // Fetch user profile first
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw profileError;
      }

      console.log("Profile data:", profileData);

      // Fetch artisan profile with retry logic for newly claimed profiles
      let artisanData = null;
      let artisanError = null;
      
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await supabase
          .from("artisans")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        
        artisanData = data;
        artisanError = error;
        
        if (artisanData || artisanError) {
          console.log(`Artisan data found on attempt ${attempt + 1}:`, artisanData);
          break;
        }
        
        // Attendre avant de réessayer (utile pour les profils fraîchement revendiqués)
        if (attempt < 2) {
          console.log(`Artisan not found, retrying in 1s... (attempt ${attempt + 1}/3)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (artisanError) {
        console.error("Artisan fetch error:", artisanError);
        throw artisanError;
      }

      console.log("Final artisan data:", artisanData);

      setArtisan(artisanData);
      setProfile(profileData);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Erreur lors du chargement du profil");
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    description?: string;
    city?: string;
    department?: string;
    region?: string;
    address?: string;
    postalCode?: string;
    siret?: string;
    experienceYears?: number;
    websiteUrl?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    linkedinUrl?: string;
    categoryId?: string;
  }) => {
    console.log("updateProfile called with:", updates);
    console.log("Current artisan:", artisan);
    console.log("Current profile:", profile);

    if (!artisan || !profile) {
      console.error("Cannot update: artisan or profile is null", { artisan, profile });
      toast.error("Profil non chargé. Veuillez rafraîchir la page.");
      return false;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Update profiles table
      if (updates.firstName !== undefined || updates.lastName !== undefined || updates.phone !== undefined) {
        const profileUpdates: Record<string, any> = {};
        if (updates.firstName !== undefined) profileUpdates.first_name = updates.firstName;
        if (updates.lastName !== undefined) profileUpdates.last_name = updates.lastName;
        if (updates.phone !== undefined) profileUpdates.phone = updates.phone;

        const { error: profileError } = await supabase
          .from("profiles")
          .update(profileUpdates)
          .eq("user_id", user.id);

        if (profileError) throw profileError;

        setProfile(prev => prev ? { ...prev, ...profileUpdates } : null);
      }

      // Update artisans table
      const artisanUpdates: Record<string, any> = {};
      if (updates.description !== undefined) artisanUpdates.description = updates.description;
      if (updates.city !== undefined) artisanUpdates.city = updates.city;
      if (updates.department !== undefined) artisanUpdates.department = updates.department;
      if (updates.region !== undefined) artisanUpdates.region = updates.region;
      if (updates.address !== undefined) artisanUpdates.address = updates.address;
      if (updates.postalCode !== undefined) artisanUpdates.postal_code = updates.postalCode;
      if (updates.siret !== undefined) artisanUpdates.siret = updates.siret;
      if (updates.experienceYears !== undefined) artisanUpdates.experience_years = updates.experienceYears;
      if (updates.websiteUrl !== undefined) artisanUpdates.website_url = updates.websiteUrl;
      if (updates.facebookUrl !== undefined) artisanUpdates.facebook_url = updates.facebookUrl;
      if (updates.instagramUrl !== undefined) artisanUpdates.instagram_url = updates.instagramUrl;
      if (updates.linkedinUrl !== undefined) artisanUpdates.linkedin_url = updates.linkedinUrl;
      if (updates.categoryId !== undefined) artisanUpdates.category_id = updates.categoryId;

      // Also update business_name if names changed
      if (updates.firstName !== undefined || updates.lastName !== undefined) {
        const newFirstName = updates.firstName ?? profile.first_name ?? "";
        const newLastName = updates.lastName ?? profile.last_name ?? "";
        artisanUpdates.business_name = `${newFirstName} ${newLastName}`.trim() || "Non renseigné";
      }

      if (Object.keys(artisanUpdates).length > 0) {
        const { error: artisanError } = await supabase
          .from("artisans")
          .update(artisanUpdates)
          .eq("user_id", user.id);

        if (artisanError) throw artisanError;

        setArtisan(prev => prev ? { ...prev, ...artisanUpdates } : null);
      }

      toast.success("Profil mis à jour avec succès");
      return true;
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Erreur lors de la mise à jour du profil");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateProfilePhoto = async (file: File) => {
    if (!artisan) return false;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("artisan-portfolios")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("artisan-portfolios")
        .getPublicUrl(fileName);

      // Update artisan photo_url
      const { error: updateError } = await supabase
        .from("artisans")
        .update({ photo_url: urlData.publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setArtisan(prev => prev ? { ...prev, photo_url: urlData.publicUrl } : null);
      toast.success("Photo de profil mise à jour");
      return true;
    } catch (error: any) {
      console.error("Error updating photo:", error);
      toast.error("Erreur lors de la mise à jour de la photo");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateWorkingHours = async (workingHours: WorkingHours) => {
    if (!artisan) return false;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from("artisans")
        .update({ working_hours: workingHours })
        .eq("user_id", user.id);

      if (error) throw error;

      setArtisan(prev => prev ? { ...prev, working_hours: workingHours } : null);
      toast.success("Horaires mis à jour avec succès");
      return true;
    } catch (error: any) {
      console.error("Error updating working hours:", error);
      toast.error("Erreur lors de la mise à jour des horaires");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    artisan,
    profile,
    isLoading,
    isSaving,
    updateProfile,
    updateProfilePhoto,
    updateWorkingHours,
    refetch: fetchProfile,
  };
};
