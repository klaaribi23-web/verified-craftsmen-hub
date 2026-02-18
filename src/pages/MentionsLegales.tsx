import { SEOHead } from "@/components/seo/SEOHead";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const MentionsLegales = () => {
  return (
    <>
      <SEOHead
        title="Mentions Légales"
        description="Mentions légales du site Artisans Validés - Informations juridiques, éditeur, hébergeur et conditions d'utilisation."
        noIndex={true}
      />
      <Navbar />
      
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-navy py-16 md:py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center">
              Mentions Légales
            </h1>
            <p className="text-white/80 text-center mt-4 max-w-2xl mx-auto">
              Informations légales conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 md:py-16 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="space-y-10">
              
              {/* Éditeur du site */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">1</span>
                  Éditeur du site
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong className="text-foreground">Nom commercial :</strong> KJ SYSTEMES</p>
                  <p><strong className="text-foreground">Forme juridique :</strong> Entrepreneur individuel</p>
                  <p><strong className="text-foreground">Responsable de la publication :</strong> Khalid LAARIBI</p>
                  <p><strong className="text-foreground">SIRET :</strong> 793 270 968 00035</p>
                  <p><strong className="text-foreground">SIREN :</strong> 793 270 968</p>
                  <p><strong className="text-foreground">Code APE :</strong> 70.22Z - Conseil pour les affaires et autres conseils de gestion</p>
                  <p><strong className="text-foreground">Adresse :</strong> 77 rue de la Monnaie, 59800 Lille, France</p>
                  <p><strong className="text-foreground">Email :</strong> <a href="mailto:contact@artisansvalides.fr" className="text-primary hover:underline">contact@artisansvalides.fr</a></p>
                  <p><strong className="text-foreground">Téléphone :</strong> <a href="tel:0353632999" className="text-primary hover:underline">03 53 63 29 99</a></p>
                </div>
              </article>

              {/* Directeur de la publication */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">2</span>
                  Directeur de la publication
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong className="text-foreground">Nom :</strong> Khalid LAARIBI</p>
                  <p><strong className="text-foreground">Qualité :</strong> Entrepreneur individuel - Gérant</p>
                </div>
              </article>

              {/* Hébergeur */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">3</span>
                  Hébergeur
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong className="text-foreground">Nom :</strong> Lovable (GPT Engineer Inc.)</p>
                  <p><strong className="text-foreground">Adresse :</strong> 2261 Market Street #4805, San Francisco, CA 94114, USA</p>
                  <p><strong className="text-foreground">Site web :</strong> <a href="https://lovable.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://lovable.dev</a></p>
                </div>
              </article>

              {/* Propriété intellectuelle */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">4</span>
                  Propriété intellectuelle
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
                  </p>
                  <p>
                    La reproduction de tout ou partie de ce site sur un support électronique quel qu'il soit est formellement interdite sauf autorisation expresse du directeur de la publication.
                  </p>
                  <p>
                    Les marques, logos et visuels présents sur ce site sont la propriété exclusive de KJ SYSTEMES ou de leurs propriétaires respectifs et ne peuvent être utilisés sans autorisation préalable.
                  </p>
                </div>
              </article>

              {/* Protection des données personnelles */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">5</span>
                  Protection des données personnelles
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Conformément à la loi « Informatique et Libertés » du 6 janvier 1978 modifiée et au Règlement Général sur la Protection des Données (RGPD) du 25 mai 2018, vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition aux données personnelles vous concernant.
                  </p>
                  <p>
                    Pour exercer ces droits, vous pouvez nous contacter :
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Par email : <a href="mailto:contact@artisansvalides.fr" className="text-primary hover:underline">contact@artisansvalides.fr</a></li>
                    <li>Par courrier : KJ SYSTEMES, 77 rue de la Monnaie, 59800 Lille</li>
                  </ul>
                  <p>
                    Les données collectées sur ce site sont traitées de manière confidentielle et ne sont jamais cédées à des tiers à des fins commerciales.
                  </p>
                </div>
              </article>

              {/* Cookies */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">6</span>
                  Cookies
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Ce site utilise des cookies pour améliorer l'expérience utilisateur et mesurer l'audience. En poursuivant votre navigation sur ce site, vous acceptez l'utilisation de ces cookies.
                  </p>
                  <p>
                    Vous pouvez à tout moment paramétrer votre navigateur pour refuser les cookies ou être alerté lorsqu'un cookie est installé sur votre ordinateur.
                  </p>
                </div>
              </article>

              {/* Limitation de responsabilité */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">7</span>
                  Limitation de responsabilité
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Les informations contenues sur ce site sont aussi précises que possible et le site est périodiquement remis à jour, mais peut toutefois contenir des inexactitudes, des omissions ou des lacunes.
                  </p>
                  <p>
                    KJ SYSTEMES ne pourra être tenu responsable des dommages directs et indirects causés au matériel de l'utilisateur lors de l'accès au site, résultant soit de l'utilisation d'un matériel ne répondant pas aux spécifications techniques requises, soit de l'apparition d'un bug ou d'une incompatibilité.
                  </p>
                </div>
              </article>

              {/* Droit applicable */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">8</span>
                  Droit applicable
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux français seront seuls compétents.
                  </p>
                  <p className="text-sm italic">
                    Dernière mise à jour : Janvier 2025
                  </p>
                </div>
              </article>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default MentionsLegales;
