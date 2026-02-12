import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const footerLinks = {
    services: [{
      label: "Plombier",
      href: "/trouver-artisan"
    }, {
      label: "Électricien",
      href: "/trouver-artisan"
    }, {
      label: "Chauffagiste",
      href: "/trouver-artisan"
    }, {
      label: "Peintre",
      href: "/trouver-artisan"
    }, {
      label: "Serrurier",
      href: "/trouver-artisan"
    }, {
      label: "Maçon",
      href: "/trouver-artisan"
    }, {
      label: "Mon Tableau de Bord",
      href: "/artisan/dashboard"
    }],
    company: [{
      label: "À propos",
      href: "/a-propos"
    }, {
      label: "Comment ça marche",
      href: "/comment-ca-marche"
    }, {
      label: "Devenir partenaire",
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
      label: "CGV",
      href: "/cgv"
    }, {
      label: "Politique de confidentialité",
      href: "/confidentialite"
    }]
  };
  const cityPoles = [
    { label: "Île-de-France", cities: [{ name: "Paris", slug: "paris" }, { name: "Boulogne", slug: "boulogne-billancourt" }, { name: "Versailles", slug: "versailles" }] },
    { label: "Nord & Est", cities: [{ name: "Lille", slug: "lille" }, { name: "Strasbourg", slug: "strasbourg" }, { name: "Reims", slug: "reims" }] },
    { label: "Sud & Rhône-Alpes", cities: [{ name: "Lyon", slug: "lyon" }, { name: "Marseille", slug: "marseille" }, { name: "Nice", slug: "nice" }, { name: "Toulouse", slug: "toulouse" }] },
    { label: "Ouest", cities: [{ name: "Bordeaux", slug: "bordeaux" }, { name: "Nantes", slug: "nantes" }, { name: "Rennes", slug: "rennes" }] },
  ];
  const regionLinks = [
    "Hauts-de-France", "Île-de-France", "Auvergne-Rhône-Alpes",
    "Provence-Alpes-Côte d'Azur", "Occitanie", "Nouvelle-Aquitaine",
    "Bretagne", "Grand Est", "Pays de la Loire", "Normandie",
  ];
  return <footer className="bg-navy text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <img src={logo} alt="Logo Artisans Validés" width={40} height={40} className="w-10 h-10 rounded-lg" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white leading-tight">ARTISANS</span>
                <span className="text-xs font-semibold text-gold -mt-1">VALIDÉS</span>
              </div>
            </Link>
            <p className="text-white/70 text-sm mb-6 max-w-sm">
              La plateforme de confiance qui vous connecte avec des artisans vérifiés et qualifiés dans toute la France.
            </p>
            <div className="space-y-3">
              <a href="tel:+33353632999" className="flex items-center gap-3 text-white/70 hover:text-gold transition-colors">
                <Phone className="w-4 h-4" />
                <span className="text-sm">03 53 63 29 99</span>
              </a>
              <a href="mailto:contact@artisansvalides.fr" className="flex items-center gap-3 text-white/70 hover:text-gold transition-colors">
                <Mail className="w-4 h-4" />
                <span className="text-sm">contact@artisansvalides.fr</span>
              </a>
              <div className="flex items-center gap-3 text-white/70">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">77 rue de la Monnaie, 59800 Lille</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <nav aria-label="Nos métiers">
            <h2 className="font-semibold text-white mb-4">Nos métiers</h2>
            <ul className="space-y-3">
              {footerLinks.services.map(link => <li key={link.label}>
                  <Link to={link.href} className="text-sm text-white/70 hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>)}
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Entreprise">
            <h2 className="font-semibold text-white mb-4">Entreprise</h2>
            <ul className="space-y-3">
              {footerLinks.company.map(link => <li key={link.href}>
                  <Link to={link.href} className="text-sm text-white/70 hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>)}
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Informations légales">
            <h2 className="font-semibold text-white mb-4">Informations</h2>
            <ul className="space-y-3">
          {footerLinks.legal.map(link => <li key={link.href}>
                  <Link to={link.href} className="text-sm text-white/70 hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>)}
              <li>
                <button
                  onClick={() => {
                    localStorage.removeItem("artisans-valides-cookie-preferences");
                    window.location.reload();
                  }}
                  className="text-sm text-white/70 hover:text-gold transition-colors cursor-pointer bg-transparent border-none p-0"
                >
                  Gestion des cookies
                </button>
              </li>
            </ul>
          </nav>

          {/* Cities by poles */}
          <nav aria-label="Nos villes" className="lg:col-span-2">
            <h2 className="font-semibold text-white mb-4">Nos villes</h2>
            <div className="grid grid-cols-2 gap-4">
              {cityPoles.map(pole => (
                <div key={pole.label}>
                  <p className="text-xs font-semibold text-gold mb-1.5">{pole.label}</p>
                  <ul className="space-y-1.5">
                    {pole.cities.map(city => (
                      <li key={city.slug}>
                        <Link to={`/artisans-ville/${city.slug}`} className="text-sm text-white/70 hover:text-gold transition-colors">
                          {city.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </div>

        {/* Zones d'intervention SEO */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col items-center gap-2 mb-4">
            <h2 className="font-semibold text-white">Nos zones d'intervention</h2>
            <p className="text-xs text-white/50">Plus de 500 artisans certifiés répartis sur le territoire.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {regionLinks.map(region => (
              <Link key={region} to={`/trouver-artisan?region=${encodeURIComponent(region)}`} className="text-sm text-white/60 bg-white/5 px-3 py-1.5 rounded-full hover:bg-white/10 hover:text-gold transition-colors">
                {region}
              </Link>
            ))}
          </div>
        </div>

        {/* Andrea mention */}
        <div className="mt-6 text-center">
          <p className="text-xs text-white/40">Expertise terrain : <span className="text-gold font-semibold">Andrea</span> — Notre experte IA qui valide chaque artisan sur le terrain.</p>
        </div>
        </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/50">
              © {currentYear} Artisans Validés. Tous droits réservés. —{" "}
              <a href="https://www.artisansvalides.fr" className="hover:text-gold transition-colors">www.artisansvalides.fr</a>
            </p>
            <div className="flex items-center gap-4" role="list" aria-label="Réseaux sociaux">
              <a href="https://www.facebook.com/artisansvalides" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-gold transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" aria-hidden="true" />
              </a>
              <a href="https://www.instagram.com/artisansvalides" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-gold transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" aria-hidden="true" />
              </a>
              <a href="https://www.linkedin.com/company/artisansvalides" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-gold transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;