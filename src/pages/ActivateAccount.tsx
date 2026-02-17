import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle, Shield, Eye, EyeOff, AlertCircle, UserCheck, Key, Mail } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface ExistingAccountInfo {
  exists: boolean;
  role: string | null;
  userId: string | null;
}

type ActivationPhase = "loading" | "form" | "awaiting_confirmation" | "linking" | "success" | "error" | "admin_warning" | "email_mismatch";

const ActivateAccount = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [phase, setPhase] = useState<ActivationPhase>("loading");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // New state for existing account handling
  const [existingAccount, setExistingAccount] = useState<ExistingAccountInfo | null>(null);
  
  const [artisanData, setArtisanData] = useState<{
    id: string;
    email: string;
    business_name: string;
  } | null>(null);
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  // Check if user is already authenticated (came back after email confirmation)
  useEffect(() => {
    const checkAuthAndAutoActivate = async () => {
      console.log("[ACTIVATION] 🔍 Vérification session existante...");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && token && artisanData) {
        console.log("[ACTIVATION] ✅ Session trouvée, vérification sécurité...", {
          userId: session.user.id,
          email: session.user.email,
          artisanEmail: artisanData.email,
          artisanId: artisanData.id,
        });
        
        // 🔒 SECURITY CHECK 1: Block if admin is logged in
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();
        
        if (userRole?.role === "admin") {
          console.warn("[ACTIVATION] ⛔ ADMIN connecté - activation bloquée!");
          // Log security event
          try {
            await supabase.rpc('add_security_log', {
              p_user_id: session.user.id,
              p_action: 'blocked_admin_artisan_activation',
              p_details: { artisan_id: artisanData.id, artisan_email: artisanData.email },
              p_severity: 'warning'
            });
          } catch (logErr) {
            console.error("[ACTIVATION] Erreur log sécurité:", logErr);
          }
          setPhase("admin_warning");
          return;
        }
        
        // 🔒 SECURITY CHECK 2: Email must match exactly
        if (session.user.email?.toLowerCase() !== artisanData.email.toLowerCase()) {
          console.warn("[ACTIVATION] ⛔ Email session ne correspond PAS à l'email artisan!", {
            sessionEmail: session.user.email,
            artisanEmail: artisanData.email,
          });
          setPhase("email_mismatch");
          return;
        }
        
        console.log("[ACTIVATION] ✅ Vérifications OK, auto-activation en cours...");
        setPhase("linking");
        
        try {
          await linkArtisanToUser(session.user.id, artisanData.id);
          console.log("[ACTIVATION] 🎉 Auto-activation réussie!");
          setPhase("success");
          setTimeout(() => navigate("/artisan/dashboard"), 2500);
        } catch (err: any) {
          console.error("[ACTIVATION] ❌ Échec auto-activation:", err);
          setPhase("form");
        }
      } else {
        console.log("[ACTIVATION] ℹ️ Pas de session active pour auto-activation", {
          hasSession: !!session,
          hasToken: !!token,
          hasArtisanData: !!artisanData,
        });
      }
    };

    if (artisanData && token) {
      checkAuthAndAutoActivate();
    }
  }, [artisanData, token]);

  // Validate token and fetch artisan data
  useEffect(() => {
    const validateToken = async () => {
      console.log("[ACTIVATION] 🚀 Démarrage validation du token...", { token: token?.substring(0, 8) + "..." });
      
      if (!token) {
        console.log("[ACTIVATION] ❌ Pas de token fourni");
        setError("Lien d'activation invalide. Veuillez contacter le support.");
        setPhase("error");
        return;
      }

      try {
        // Check if already logged in
        const { data: { session } } = await supabase.auth.getSession();
        console.log("[ACTIVATION] 📋 Session existante:", session ? `Oui (${session.user.email})` : "Non");
        
        // Find artisan with this activation token
        console.log("[ACTIVATION] 🔍 Recherche artisan avec ce token...");
        const { data: artisan, error: artisanError } = await supabase
          .from("artisans")
          .select("id, email, business_name, status, user_id")
          .eq("activation_token", token)
          .maybeSingle();

        if (artisanError) {
          console.error("[ACTIVATION] ❌ Erreur recherche artisan:", artisanError);
          throw artisanError;
        }

        if (!artisan) {
          console.log("[ACTIVATION] ❌ Aucun artisan trouvé avec ce token");
          setError("Ce lien d'activation est invalide ou a déjà été utilisé.");
          setPhase("error");
          return;
        }

        console.log("[ACTIVATION] ✅ Artisan trouvé:", {
          id: artisan.id,
          email: artisan.email,
          business_name: artisan.business_name,
          status: artisan.status,
          hasUserId: !!artisan.user_id,
        });

        // Check if already activated
        if (artisan.user_id) {
          console.log("[ACTIVATION] ⚠️ Artisan déjà activé (user_id existe)");
          setError("Ce compte a déjà été activé. Veuillez vous connecter.");
          setPhase("error");
          return;
        }

        if (!artisan.email) {
          console.log("[ACTIVATION] ❌ Pas d'email associé à l'artisan");
          setError("Aucun email n'est associé à cette fiche. Veuillez contacter le support.");
          setPhase("error");
          return;
        }

        setArtisanData({
          id: artisan.id,
          email: artisan.email,
          business_name: artisan.business_name,
        });

        // If user is already logged in with matching email, auto-activate
        if (session?.user?.email === artisan.email) {
          console.log("[ACTIVATION] 🔗 Email session correspond, auto-activation...");
          setPhase("linking");
          
          try {
            await linkArtisanToUser(session.user.id, artisan.id);
            console.log("[ACTIVATION] 🎉 Auto-activation réussie (session existante)");
            setPhase("success");
            setTimeout(() => navigate("/artisan/dashboard"), 2500);
            return;
          } catch (err: any) {
            console.error("[ACTIVATION] ❌ Échec auto-activation:", err);
            // Continue to form
          }
        }

        // Check if email already exists in auth.users
        console.log("[ACTIVATION] 🔍 Vérification compte existant...");
        try {
          const { data: checkResult, error: checkError } = await supabase.functions.invoke('check-email-exists', {
            body: { email: artisan.email, activation_token: token }
          });

          if (!checkError && checkResult) {
            console.log("[ACTIVATION] 📋 Résultat vérification compte:", checkResult);
            setExistingAccount(checkResult);
          }
        } catch (err) {
          console.warn("[ACTIVATION] ⚠️ Impossible de vérifier email existant:", err);
        }

        console.log("[ACTIVATION] 📝 Affichage du formulaire");
        setPhase("form");
      } catch (err) {
        console.error("[ACTIVATION] ❌ Erreur validation token:", err);
        setError("Une erreur est survenue. Veuillez réessayer.");
        setPhase("error");
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[ACTIVATION] 📤 Soumission du formulaire...");
    
    if (!artisanData) {
      console.log("[ACTIVATION] ❌ Pas de données artisan");
      return;
    }
    
    // Validate password
    if (formData.password.length < 8) {
      console.log("[ACTIVATION] ❌ Mot de passe trop court");
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    
    // Only check confirm password if creating new account
    if (!existingAccount?.exists && formData.password !== formData.confirmPassword) {
      console.log("[ACTIVATION] ❌ Mots de passe non identiques");
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setIsSubmitting(true);
    console.log("[ACTIVATION] 🔄 Traitement en cours...", {
      email: artisanData.email,
      existingAccount: existingAccount,
    });

    try {
      // Case 1: Existing client account - need to convert
      if (existingAccount?.exists && existingAccount.role === 'client') {
        console.log("[ACTIVATION] 👤 Cas 1: Compte client existant → conversion en artisan");
        await handleExistingClientAccount();
        return;
      }

      // Case 2: Existing artisan account - allow login and link
      if (existingAccount?.exists && existingAccount.role === 'artisan') {
        console.log("[ACTIVATION] 👤 Cas 2: Compte artisan existant → liaison nouvelle vitrine");
        await handleExistingArtisanAccount();
        return;
      }

      // Case 3: New account - check if account was created but not confirmed
      console.log("[ACTIVATION] 🔍 Re-vérification compte existant...");
      const { data: recheckData } = await supabase.functions.invoke("check-email-exists", {
        body: { email: artisanData.email, activation_token: token },
      });

      if (recheckData?.exists) {
        console.log("[ACTIVATION] 👤 Cas 3: Compte créé précédemment, tentative connexion");
        await handleAccountAfterConfirmation();
        return;
      }

      // Case 4: Brand new account - only signUp, no linking yet
      console.log("[ACTIVATION] 🆕 Cas 4: Nouveau compte → inscription");
      await handleNewAccountSignUp();
      
    } catch (err: any) {
      console.error("[ACTIVATION] ❌ Erreur activation:", err);
      toast.error(err.message || "Une erreur est survenue lors de l'activation");
      setIsSubmitting(false);
    }
  };

  const handleExistingClientAccount = async () => {
    if (!artisanData) return;
    
    console.log("[ACTIVATION] 🔐 Connexion compte client existant...");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: artisanData.email,
      password: formData.password,
    });

    if (signInError) {
      console.error("[ACTIVATION] ❌ Erreur connexion:", signInError.message);
      if (signInError.message.includes("Invalid login credentials")) {
        toast.error("Mot de passe incorrect. Veuillez réessayer ou réinitialiser votre mot de passe.");
        setIsSubmitting(false);
        return;
      }
      throw signInError;
    }

    if (signInData.user) {
      console.log("[ACTIVATION] ✅ Connexion réussie, conversion client → artisan...");
      await new Promise(resolve => setTimeout(resolve, 500));
      await convertClientToArtisan(signInData.user.id, artisanData.id);
      console.log("[ACTIVATION] 🎉 Conversion réussie!");
      setPhase("success");
      setTimeout(() => navigate("/artisan/dashboard"), 2500);
    }
  };

  const handleExistingArtisanAccount = async () => {
    if (!artisanData) return;
    
    console.log("[ACTIVATION] 🔐 Connexion compte artisan existant...");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: artisanData.email,
      password: formData.password,
    });

    if (signInError) {
      console.error("[ACTIVATION] ❌ Erreur connexion:", signInError.message);
      if (signInError.message.includes("Invalid login credentials")) {
        toast.error("Mot de passe incorrect. Veuillez réessayer ou réinitialiser votre mot de passe.");
        setIsSubmitting(false);
        return;
      }
      throw signInError;
    }

    if (signInData.user) {
      console.log("[ACTIVATION] ✅ Connexion réussie, liaison nouvelle vitrine...");
      await new Promise(resolve => setTimeout(resolve, 500));
      await linkArtisanToUser(signInData.user.id, artisanData.id);
      console.log("[ACTIVATION] 🎉 Liaison réussie!");
      setPhase("success");
      setTimeout(() => navigate("/artisan/dashboard"), 2500);
    }
  };

  const handleAccountAfterConfirmation = async () => {
    if (!artisanData) return;
    
    console.log("[ACTIVATION] 🔐 Tentative connexion (compte existant)...");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: artisanData.email,
      password: formData.password,
    });

    if (signInError) {
      console.error("[ACTIVATION] ❌ Erreur connexion:", signInError.message);
      if (signInError.message.includes("Invalid login credentials")) {
        toast.error("Mot de passe incorrect. Veuillez réessayer.");
        setIsSubmitting(false);
        return;
      }
      // Email still not confirmed
      if (signInError.message.includes("email_not_confirmed") || 
          signInError.message.includes("Email not confirmed")) {
        console.log("[ACTIVATION] 📧 Email non confirmé → affichage écran d'attente");
        toast.info(
          "Veuillez confirmer votre email en cliquant sur le lien envoyé, puis revenez sur cette page.",
          { duration: 10000 }
        );
        setPhase("awaiting_confirmation");
        setIsSubmitting(false);
        return;
      }
      throw signInError;
    }

    if (signInData.user) {
      console.log("[ACTIVATION] ✅ Connexion réussie, vérification session...");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: sessionCheck } = await supabase.auth.getSession();
      if (!sessionCheck.session) {
        console.error("[ACTIVATION] ❌ Session non établie après connexion");
        throw new Error("Session non établie. Veuillez rafraîchir la page et réessayer.");
      }
      
      console.log("[ACTIVATION] 🔗 Liaison artisan...");
      await linkArtisanToUser(signInData.user.id, artisanData.id);
      console.log("[ACTIVATION] 🎉 Activation terminée!");
      setPhase("success");
      setTimeout(() => navigate("/artisan/dashboard"), 2500);
    }
  };

  const handleNewAccountSignUp = async () => {
    if (!artisanData) return;
    
    console.log("[ACTIVATION] 📝 Création nouveau compte...", {
      email: artisanData.email,
      redirectTo: `${window.location.origin}/activer-compte?token=${token}`,
    });
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: artisanData.email,
      password: formData.password,
      options: {
        data: {
          user_type: "artisan",
        },
        emailRedirectTo: `${window.location.origin}/activer-compte?token=${token}`,
      }
    });

    if (authError) {
      console.error("[ACTIVATION] ❌ Erreur inscription:", authError.message);
      // Handle case where user already exists
      if (authError.message.includes("already registered")) {
        console.log("[ACTIVATION] ⚠️ Compte déjà existant, tentative connexion...");
        setExistingAccount({ exists: true, role: null, userId: null });
        await handleAccountAfterConfirmation();
        return;
      }
      throw authError;
    }

    if (authData.user) {
      console.log("[ACTIVATION] ✅ Inscription réussie!", {
        userId: authData.user.id,
        email: authData.user.email,
        emailConfirmedAt: authData.user.email_confirmed_at,
      });
      
      // Small delay for profile creation
      console.log("[ACTIVATION] ⏳ Attente création profil (1s)...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to sign in immediately
      console.log("[ACTIVATION] 🔐 Tentative connexion immédiate...");
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: artisanData.email,
        password: formData.password,
      });

      if (signInError) {
        console.error("[ACTIVATION] ⚠️ Connexion échouée:", signInError.message);
        // Email not confirmed - this is expected
        if (signInError.message.includes("email_not_confirmed") || 
            signInError.message.includes("Email not confirmed")) {
          console.log("[ACTIVATION] 📧 Email non confirmé → affichage écran d'attente");
          setPhase("awaiting_confirmation");
          setIsSubmitting(false);
          return;
        }
        throw signInError;
      }

      // If sign in succeeded (auto-confirm enabled), proceed with activation
      console.log("[ACTIVATION] ✅ Connexion réussie (auto-confirm actif)");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: sessionCheck } = await supabase.auth.getSession();
      console.log("[ACTIVATION] 📋 Vérification session:", !!sessionCheck.session);
      
      if (sessionCheck.session) {
        console.log("[ACTIVATION] 🔗 Liaison artisan...");
        await linkArtisanToUser(authData.user.id, artisanData.id);
        console.log("[ACTIVATION] 🎉 Activation terminée avec succès!");
        setPhase("success");
        setTimeout(() => navigate("/artisan/dashboard"), 2500);
      }
    }
  };

  const convertClientToArtisan = async (userId: string, artisanId: string) => {
    console.log("[ACTIVATION] 🔄 Conversion client → artisan...", { userId, artisanId });
    
    // 🔒 SECURITY CHECK: Never convert an admin account
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    
    if (existingRole?.role === "admin") {
      console.error("[ACTIVATION] ⛔ TENTATIVE DE CONVERSION D'UN COMPTE ADMIN!");
      // Log critical security event
      try {
        await supabase.rpc('add_security_log', {
          p_user_id: userId,
          p_action: 'blocked_admin_to_artisan_conversion',
          p_details: { artisan_id: artisanId, attempted_conversion: true },
          p_severity: 'critical'
        });
      } catch (logErr) {
        console.error("[ACTIVATION] Erreur log sécurité:", logErr);
      }
      throw new Error("Impossible de convertir un compte administrateur en artisan.");
    }
    
    // 1. Update artisan with user_id
    console.log("[ACTIVATION] 📝 Étape 1: Liaison user_id à artisan...");
    const { error: updateError } = await supabase
      .from("artisans")
      .update({
        user_id: userId,
        activation_token: null,
      })
      .eq("id", artisanId)
      .eq("activation_token", token);

    if (updateError) {
      console.error("[ACTIVATION] ❌ Échec liaison artisan:", updateError);
      throw new Error("Impossible de lier le compte artisan. Veuillez réessayer.");
    }
    console.log("[ACTIVATION] ✅ Artisan lié");

    // 2. Delete the client role
    console.log("[ACTIVATION] 📝 Étape 2: Suppression rôle client...");
    const { error: deleteRoleError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (deleteRoleError) {
      console.error("[ACTIVATION] ⚠️ Échec suppression rôle client:", deleteRoleError);
    } else {
      console.log("[ACTIVATION] ✅ Rôle client supprimé");
    }

    // 3. Insert artisan role
    console.log("[ACTIVATION] 📝 Étape 3: Attribution rôle artisan...");
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert([{ user_id: userId, role: "artisan" }]);

    if (roleError) {
      console.error("[ACTIVATION] ⚠️ Échec attribution rôle artisan:", roleError);
    } else {
      console.log("[ACTIVATION] ✅ Rôle artisan attribué");
    }

    // 4. Get and link profile_id
    console.log("[ACTIVATION] 📝 Étape 4: Liaison profile_id...");
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile?.id) {
      const { error: profileUpdateError } = await supabase
        .from("artisans")
        .update({ profile_id: profile.id })
        .eq("user_id", userId);

      if (profileUpdateError) {
        console.error("[ACTIVATION] ⚠️ Échec liaison profile_id:", profileUpdateError);
      } else {
        console.log("[ACTIVATION] ✅ Profile_id lié:", profile.id);
      }
    } else {
      console.log("[ACTIVATION] ⚠️ Aucun profil trouvé pour ce user");
    }
    
    console.log("[ACTIVATION] 🎉 Conversion terminée!");
  };

  const linkArtisanToUser = async (userId: string, artisanId: string) => {
    console.log("[ACTIVATION] 🔗 Liaison artisan → user...", { userId, artisanId });
    
    // 🔒 SECURITY CHECK: Never link an admin account to an artisan
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    
    if (existingRole?.role === "admin") {
      console.error("[ACTIVATION] ⛔ TENTATIVE DE LIAISON D'UN COMPTE ADMIN À UN ARTISAN!");
      // Log critical security event
      try {
        await supabase.rpc('add_security_log', {
          p_user_id: userId,
          p_action: 'blocked_admin_artisan_link',
          p_details: { artisan_id: artisanId, attempted_link: true },
          p_severity: 'critical'
        });
      } catch (logErr) {
        console.error("[ACTIVATION] Erreur log sécurité:", logErr);
      }
      throw new Error("Impossible de lier un compte administrateur à un profil artisan.");
    }
    
    // Verify session is active
    const { data: sessionData } = await supabase.auth.getSession();
    console.log("[ACTIVATION] 📋 Vérification session:", {
      active: !!sessionData.session,
      userId: sessionData.session?.user?.id,
    });

    if (!sessionData.session) {
      console.error("[ACTIVATION] ❌ Pas de session active");
      throw new Error("Session non établie. Veuillez vous reconnecter.");
    }

    // 1. Update artisan with user_id
    console.log("[ACTIVATION] 📝 Étape 1: Mise à jour artisan (user_id, token=null)...");
    const { error: updateError, data: updateData } = await supabase
      .from("artisans")
      .update({
        user_id: userId,
        activation_token: null,
      })
      .eq("id", artisanId)
      .eq("activation_token", token)
      .select();

    if (updateError) {
      console.error("[ACTIVATION] ❌ Échec mise à jour artisan:", {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        artisanId,
        userId,
        token: token?.substring(0, 8) + "...",
      });
      
      if (updateError.code === "42501") {
        throw new Error("Erreur de permission. Veuillez vous reconnecter et réessayer.");
      }
      if (updateError.code === "23505") {
        throw new Error("Ce compte est déjà lié à une autre vitrine artisan.");
      }
      throw new Error(`Impossible de lier le compte artisan: ${updateError.message}`);
    }

    if (!updateData || updateData.length === 0) {
      console.error("[ACTIVATION] ❌ Aucune ligne mise à jour (token invalide ou déjà utilisé)");
      throw new Error("Le lien d'activation a déjà été utilisé ou est invalide.");
    }
    console.log("[ACTIVATION] ✅ Artisan mis à jour:", updateData[0]);

    // 2. Delete default client role
    console.log("[ACTIVATION] 📝 Étape 2: Suppression rôle par défaut...");
    const { error: deleteRoleError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (deleteRoleError) {
      console.error("[ACTIVATION] ⚠️ Échec suppression rôle:", deleteRoleError);
    } else {
      console.log("[ACTIVATION] ✅ Rôle par défaut supprimé");
    }

    // 3. Create artisan role
    console.log("[ACTIVATION] 📝 Étape 3: Attribution rôle artisan...");
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert([{ user_id: userId, role: "artisan" }]);

    if (roleError) {
      console.error("[ACTIVATION] ⚠️ Échec attribution rôle:", roleError);
    } else {
      console.log("[ACTIVATION] ✅ Rôle artisan attribué");
    }

    // 4. Get profile_id
    console.log("[ACTIVATION] 📝 Étape 4: Recherche profile_id (max 5 tentatives)...");
    let profileId: string | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (profile?.id) {
        profileId = profile.id;
        console.log("[ACTIVATION] ✅ Profile trouvé (tentative ${attempt + 1}):", profileId);
        break;
      }
      console.log("[ACTIVATION] ⏳ Tentative ${attempt + 1}/5 - profil non trouvé, attente 500ms...");
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 5. Update profile_id
    if (profileId) {
      const { error: profileUpdateError } = await supabase
        .from("artisans")
        .update({ profile_id: profileId })
        .eq("user_id", userId);
      
      if (profileUpdateError) {
        console.error("Failed to update profile_id:", profileUpdateError);
      }
    }
  };

  // Error state
  if (phase === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A192F' }}>
        <SEOHead 
          title="Activation de compte" 
          description="Activez votre compte artisan"
          noIndex={true}
        />
        <div className="max-w-md mx-auto text-center px-4">
          <div className="w-20 h-20 mx-auto bg-destructive/20 rounded-full flex items-center justify-center mb-6 border border-destructive/30">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-black text-white mb-4 uppercase">Lien invalide</h1>
          <p className="text-white mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <Button variant="gold" onClick={() => navigate("/auth")} className="w-full font-bold">
              Se connecter
            </Button>
            <Button variant="outline-gold" onClick={() => navigate("/contact")} className="w-full">
              Contacter le support
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A192F' }}>
        <SEOHead 
          title="Activation de compte" 
          description="Activez votre compte artisan"
          noIndex={true}
        />
        <div className="flex flex-col items-center justify-center text-center px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl border-2 border-primary/40 flex items-center justify-center bg-primary/10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
          <p className="text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-4">VÉRIFICATION DE VOTRE ACCÈS ÉLITE...</p>
          <p className="text-white">Vérification du lien d'activation...</p>
        </div>
      </div>
    );
  }

  // Linking state (auto-activation in progress)
  if (phase === "linking") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A192F' }}>
        <SEOHead 
          title="Activation en cours" 
          description="Activation de votre compte artisan"
          noIndex={true}
        />
        <div className="flex flex-col items-center justify-center text-center px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl border-2 border-primary/40 flex items-center justify-center bg-primary/10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
          <p className="text-lg font-black text-white mb-2 uppercase">Activation de votre compte...</p>
          <p className="text-white">Veuillez patienter quelques secondes</p>
        </div>
      </div>
    );
  }

  // Admin warning state
  if (phase === "admin_warning") {
    const handleLogout = async () => {
      await supabase.auth.signOut();
      toast.success("Déconnexion réussie. Vous pouvez maintenant activer le compte artisan.");
      setPhase("form");
    };

    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A192F' }}>
        <SEOHead title="Activation bloquée" description="Vous devez vous déconnecter pour activer ce compte" noIndex={true} />
        <div className="max-w-md mx-auto px-4">
          <Card className="border-destructive/50" style={{ background: '#020617' }}>
            <CardHeader className="text-center">
              <div className="w-20 h-20 mx-auto bg-destructive/20 rounded-full flex items-center justify-center mb-4 border border-destructive/30">
                <Shield className="h-10 w-10 text-destructive" />
              </div>
              <CardTitle className="text-2xl text-destructive uppercase">Compte administrateur détecté</CardTitle>
              <CardDescription className="text-white mt-2">
                Vous êtes connecté avec un compte administrateur. Pour des raisons de sécurité, vous ne pouvez pas activer un compte artisan avec cette session.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border border-destructive/30 rounded-lg p-4" style={{ background: 'rgba(220,38,38,0.08)' }}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="text-sm text-white">
                    <p className="font-bold text-destructive mb-2">Pourquoi ce blocage ?</p>
                    <p>Le compte administrateur doit rester séparé des comptes artisans. Veuillez vous déconnecter puis utiliser un compte différent.</p>
                  </div>
                </div>
              </div>
              <Button className="w-full" variant="destructive" onClick={handleLogout}>Se déconnecter</Button>
              <Button variant="outline-gold" className="w-full" onClick={() => navigate("/")}>Retour à l'accueil</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Email mismatch state
  if (phase === "email_mismatch") {
    const handleLogout = async () => {
      await supabase.auth.signOut();
      toast.success("Déconnexion réussie. Vous pouvez maintenant vous connecter avec le bon compte.");
      setPhase("form");
    };

    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A192F' }}>
        <SEOHead title="Email différent" description="L'email connecté ne correspond pas à l'artisan" noIndex={true} />
        <div className="max-w-md mx-auto px-4">
          <Card className="border-primary/30" style={{ background: '#020617' }}>
            <CardHeader className="text-center">
              <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4 border border-primary/30">
                <Mail className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl text-primary uppercase">Email différent</CardTitle>
              <CardDescription className="text-white mt-2">
                Vous êtes actuellement connecté avec un email différent de celui associé à cette vitrine artisan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border border-primary/30 rounded-lg p-4" style={{ background: 'rgba(212,175,55,0.08)' }}>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Email de la vitrine :</span>
                    <span className="font-semibold text-white">{artisanData?.email}</span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg p-4 text-sm text-white" style={{ background: 'rgba(212,175,55,0.05)' }}>
                <p>Pour activer cette vitrine, veuillez vous déconnecter puis vous reconnecter avec l'adresse email <span className="font-semibold text-primary">{artisanData?.email}</span>.</p>
              </div>
              <Button className="w-full" variant="gold" onClick={handleLogout}>Se déconnecter</Button>
              <Button variant="outline-gold" className="w-full" onClick={() => navigate("/")}>Retour à l'accueil</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Awaiting email confirmation state
  if (phase === "awaiting_confirmation") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A192F' }}>
        <SEOHead title="Confirmez votre email" description="Confirmez votre adresse email pour activer votre compte" noIndex={true} />
        <div className="max-w-md mx-auto px-4">
          <Card className="border-primary/30" style={{ background: '#020617' }}>
            <CardHeader className="text-center">
              <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4 border border-primary/30">
                <Mail className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl text-white uppercase">Confirmez votre email</CardTitle>
              <CardDescription className="text-white mt-2">
                Un email de confirmation a été envoyé à <span className="font-semibold text-primary">{artisanData?.email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border border-primary/30 rounded-lg p-4" style={{ background: 'rgba(212,175,55,0.08)' }}>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div className="text-sm text-white">
                    <p className="font-bold text-primary mb-2">Étapes à suivre :</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Ouvrez votre boîte email</li>
                      <li>Cliquez sur le lien de confirmation</li>
                      <li>Vous serez automatiquement redirigé</li>
                    </ol>
                  </div>
                </div>
              </div>
              <div className="text-center text-sm text-white/60">
                <p>Vous n'avez pas reçu l'email ?</p>
                <p className="mt-1">Vérifiez vos spams ou attendez quelques minutes.</p>
              </div>
              <Button variant="outline-gold" className="w-full" onClick={() => setPhase("form")}>
                Revenir au formulaire
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success state
  if (phase === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A192F' }}>
        <SEOHead 
          title="Compte activé !" 
          description="Votre compte artisan a été activé"
          noIndex={true}
        />
        <div className="max-w-md mx-auto text-center px-4">
          <div className="w-24 h-24 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-6 border-2 border-primary/50 shadow-gold">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-primary mb-2 uppercase tracking-wide">ACCÈS ÉLITE ACTIVÉ !</h1>
          <p className="text-lg text-white mb-4">Votre compte a été activé avec succès</p>
          <p className="text-white mb-6">
            Vous allez être redirigé vers votre tableau de bord...
          </p>
          <div className="flex items-center justify-center gap-2 text-white">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Redirection en cours...</span>
          </div>
        </div>
      </div>
    );
  }

  // Determine which form to show
  const isExistingClient = existingAccount?.exists && existingAccount?.role === 'client';
  const isExistingArtisan = existingAccount?.exists && existingAccount?.role === 'artisan';

  // Form state
  return (
    <div className="min-h-screen flex items-center justify-center py-12" style={{ background: '#0A192F' }}>
      <SEOHead 
        title="Activation de compte" 
        description="Créez votre mot de passe pour activer votre compte artisan"
        noIndex={true}
      />
      
      {/* Top gold banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-gold text-center py-2.5 px-4">
        <p className="text-sm font-black uppercase tracking-wider" style={{ color: '#0A192F' }}>
          🔒 VOTRE SECTEUR EST RÉSERVÉ POUR 24H
        </p>
      </div>
      
      <div className="max-w-md mx-auto w-full px-4 mt-12">
        <Card className="border-primary/30 shadow-gold" style={{ background: '#020617' }}>
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/30">
              {isExistingClient || isExistingArtisan ? (
                <UserCheck className="h-8 w-8 text-primary" />
              ) : (
                <Shield className="h-8 w-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl text-white uppercase font-black tracking-wide">
              {isExistingClient || isExistingArtisan ? "Compte existant détecté" : "BIENVENUE DANS L'EXCLUSIVITÉ"}
            </CardTitle>
            <p className="text-sm text-primary font-semibold uppercase tracking-wider mt-1">
              DERNIÈRE ÉTAPE AVANT VOS CHANTIERS
            </p>
            <CardDescription className="text-white mt-3">
                {isExistingClient ? (
                  <>
                    Bonjour ! Vous avez déjà un compte client avec l'adresse <span className="font-semibold text-foreground">{artisanData?.email}</span>.
                    <br /><br />
                    Entrez votre mot de passe existant pour convertir votre compte en compte artisan et accéder à votre vitrine <span className="font-semibold text-foreground">{artisanData?.business_name}</span>.
                  </>
                ) : isExistingArtisan ? (
                  <>
                    Bonjour ! Vous avez déjà un compte artisan avec l'adresse <span className="font-semibold text-foreground">{artisanData?.email}</span>.
                    <br /><br />
                    Entrez votre mot de passe pour lier cette nouvelle vitrine <span className="font-semibold text-foreground">{artisanData?.business_name}</span> à votre compte.
                  </>
                ) : (
                  <>
                    Bienvenue <span className="font-semibold text-foreground">{artisanData?.business_name}</span> !<br />
                    Créez votre mot de passe pour accéder à votre espace artisan.
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isExistingClient && (
                <div className="border border-primary/30 rounded-lg p-4 mb-6" style={{ background: 'rgba(212,175,55,0.08)' }}>
                  <div className="flex items-start gap-3">
                    <Key className="h-5 w-5 text-primary mt-0.5" />
                    <div className="text-sm text-white">
                      <p className="font-bold text-primary mb-1">Conversion de compte</p>
                      <p>Votre compte client sera converti en compte artisan. Vous conserverez votre historique.</p>
                    </div>
                  </div>
                </div>
              )}

              {isExistingArtisan && (
                <div className="border border-primary/30 rounded-lg p-4 mb-6" style={{ background: 'rgba(212,175,55,0.08)' }}>
                  <div className="flex items-start gap-3">
                    <Key className="h-5 w-5 text-primary mt-0.5" />
                    <div className="text-sm text-white">
                      <p className="font-bold text-primary mb-1">Liaison de compte</p>
                      <p>Cette nouvelle vitrine sera ajoutée à votre compte artisan existant.</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={artisanData?.email || ""}
                    disabled
                    className="mt-1.5 border-primary/30 text-white"
                    style={{ background: '#0A192F' }}
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-white">
                    {isExistingClient ? "Mot de passe de votre compte client *" : isExistingArtisan ? "Mot de passe de votre compte artisan *" : "Mot de passe *"}
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      minLength={8}
                      className="pr-10 border-primary/30 text-white"
                      style={{ background: '#0A192F' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {!isExistingClient && !isExistingArtisan && (
                    <p className="text-xs text-white/60 mt-1">Minimum 8 caractères</p>
                  )}
                </div>

                {!isExistingClient && !isExistingArtisan && (
                  <div>
                    <Label htmlFor="confirmPassword" className="text-white">Confirmer le mot de passe *</Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                        minLength={8}
                        className="pr-10 border-primary/30 text-white"
                        style={{ background: '#0A192F' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full font-black text-base uppercase" 
                  variant="gold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {isExistingClient ? "Conversion en cours..." : isExistingArtisan ? "Liaison en cours..." : "Activation en cours..."}
                    </>
                  ) : (
                    isExistingClient ? "CONVERTIR MON COMPTE" : isExistingArtisan ? "LIER CETTE VITRINE" : "DÉVERROUILLER MON ACCÈS ET MES CHANTIERS"
                  )}
                </Button>
              </form>

              {(isExistingClient || isExistingArtisan) && (
                <div className="mt-4 text-center">
                  <button 
                    onClick={() => navigate("/forgot-password")}
                    className="text-sm text-primary hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              )}

              <div className="mt-6 text-center">
                <p className="text-sm text-white/60">
                  Vous avez déjà un compte ?{" "}
                  <button 
                    onClick={() => navigate("/auth")}
                    className="text-primary hover:underline font-medium"
                  >
                    Connectez-vous
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
};

export default ActivateAccount;
