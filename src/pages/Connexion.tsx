import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, ArrowRight, Users } from "lucide-react";

const Connexion = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<"client" | "artisan">("client");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const updateForm = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      
      <main className="pt-20 pb-16 min-h-screen flex items-center">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-soft border border-border p-8"
            >
              {/* Logo */}
              <div className="text-center mb-8">
                <Link to="/" className="inline-flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-gold rounded-lg flex items-center justify-center shadow-gold">
                    <Shield className="w-6 h-6 text-navy-dark" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-lg font-bold text-navy leading-tight">ARTISANS</span>
                    <span className="text-xs font-semibold text-gold -mt-1">VALIDÉS</span>
                  </div>
                </Link>
              </div>

              {/* Toggle Login/Signup */}
              <div className="flex bg-muted rounded-lg p-1 mb-6">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
                    isLogin ? "bg-white shadow-soft text-navy" : "text-muted-foreground"
                  }`}
                >
                  Connexion
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
                    !isLogin ? "bg-white shadow-soft text-navy" : "text-muted-foreground"
                  }`}
                >
                  Inscription
                </button>
              </div>

              {/* User Type Toggle */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setUserType("client")}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    userType === "client"
                      ? "border-gold bg-gold/10"
                      : "border-border hover:border-gold/50"
                  }`}
                >
                  <Users className={`w-6 h-6 mx-auto mb-2 ${
                    userType === "client" ? "text-gold" : "text-muted-foreground"
                  }`} />
                  <span className={`text-sm font-medium ${
                    userType === "client" ? "text-navy" : "text-muted-foreground"
                  }`}>
                    Particulier
                  </span>
                </button>
                <button
                  onClick={() => setUserType("artisan")}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    userType === "artisan"
                      ? "border-gold bg-gold/10"
                      : "border-border hover:border-gold/50"
                  }`}
                >
                  <Shield className={`w-6 h-6 mx-auto mb-2 ${
                    userType === "artisan" ? "text-gold" : "text-muted-foreground"
                  }`} />
                  <span className={`text-sm font-medium ${
                    userType === "artisan" ? "text-navy" : "text-muted-foreground"
                  }`}>
                    Artisan
                  </span>
                </button>
              </div>

              {/* Form */}
              <form className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-navy">
                    <Mail className="w-4 h-4 inline-block mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) => updateForm("email", e.target.value)}
                    className="mt-1.5 h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-navy">
                    <Lock className="w-4 h-4 inline-block mr-2" />
                    Mot de passe
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => updateForm("password", e.target.value)}
                    className="mt-1.5 h-12"
                  />
                </div>

                {!isLogin && (
                  <div>
                    <Label htmlFor="confirmPassword" className="text-navy">
                      Confirmer le mot de passe
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => updateForm("confirmPassword", e.target.value)}
                      className="mt-1.5 h-12"
                    />
                  </div>
                )}

                {isLogin && (
                  <div className="flex justify-end">
                    <Link to="/mot-de-passe-oublie" className="text-sm text-gold hover:underline">
                      Mot de passe oublié ?
                    </Link>
                  </div>
                )}

                <Button variant="gold" size="lg" className="w-full">
                  {isLogin ? "Se connecter" : "Créer mon compte"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </form>

              {/* Footer */}
              <p className="text-center text-sm text-muted-foreground mt-6">
                {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
                {" "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-gold hover:underline font-medium"
                >
                  {isLogin ? "S'inscrire" : "Se connecter"}
                </button>
              </p>

              {userType === "artisan" && !isLogin && (
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Pour une inscription complète artisan,{" "}
                  <Link to="/devenir-artisan" className="text-gold hover:underline">
                    cliquez ici
                  </Link>
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Connexion;
