import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const footerLinks = {
    services: [{
      label: "Plombier",
      href: "/artisans/plombier"
    }, {
      label: "Électricien",
      href: "/artisans/electricien"
    }, {
      label: "Chauffagiste",
      href: "/artisans/chauffagiste"
    }, {
      label: "Peintre",
      href: "/artisans/peintre"
    }, {
      label: "Serrurier",
      href: "/artisans/serrurier"
    }, {
      label: "Maçon",
      href: "/artisans/macon"
    }],
    company: [{
      label: "À propos",
      href: "/a-propos"
    }, {
      label: "Comment ça marche",
      href: "/comment-ca-marche"
    }, {
      label: "Devenir artisan",
      href: "/devenir-artisan"
    }, {
      label: "Blog",
      href: "/blog"
    }, {
      label: "Contact",
      href: "/contact"
    }],
    legal: [{
      label: "Mentions légales",
      href: "/mentions-legales"
    }, {
      label: "CGU",
      href: "/cgu"
    }, {
      label: "Politique de confidentialité",
      href: "/confidentialite"
    }]
  };
  return <footer className="bg-navy text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <img src={logo} alt="Artisans Validés" className="w-10 h-10 rounded-lg" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white leading-tight">ARTISANS</span>
                <span className="text-xs font-semibold text-gold -mt-1">VALIDÉS</span>
              </div>
            </Link>
            <p className="text-white/70 text-sm mb-6 max-w-sm">
              La plateforme de confiance qui vous connecte avec des artisans vérifiés et qualifiés dans toute la France.
            </p>
            <div className="space-y-3">
              <a href="tel:+33123456789" className="flex items-center gap-3 text-white/70 hover:text-gold transition-colors">
                <Phone className="w-4 h-4" />
                <span className="text-sm">01 23 45 67 89</span>
              </a>
              <a href="mailto:contact@artisans-valides.fr" className="flex items-center gap-3 text-white/70 hover:text-gold transition-colors">
                <Mail className="w-4 h-4" />
                <span className="text-sm">contact@artisansvalides.fr</span>
              </a>
              <div className="flex items-center gap-3 text-white/70">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Paris, France</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-white mb-4">Nos métiers</h4>
            <ul className="space-y-3">
              {footerLinks.services.map(link => <li key={link.href}>
                  <Link to={link.href} className="text-sm text-white/70 hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>)}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Entreprise</h4>
            <ul className="space-y-3">
              {footerLinks.company.map(link => <li key={link.href}>
                  <Link to={link.href} className="text-sm text-white/70 hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>)}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Informations</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map(link => <li key={link.href}>
                  <Link to={link.href} className="text-sm text-white/70 hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>)}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/50">
              © {currentYear} Artisans Validés. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-white/50 hover:text-gold transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/50 hover:text-gold transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/50 hover:text-gold transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;