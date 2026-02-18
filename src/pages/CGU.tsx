import { SEOHead } from "@/components/seo/SEOHead";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const CGU = () => {
  return (
    <>
      <SEOHead
        title="Conditions Générales d'Utilisation"
        description="Conditions Générales d'Utilisation du site Artisans Validés - Règles d'accès et d'utilisation de la plateforme."
        noIndex={true}
      />
      <Navbar />
      
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-navy py-16 md:py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center">
              Conditions Générales d'Utilisation
            </h1>
            <p className="text-white/80 text-center mt-4 max-w-2xl mx-auto">
              Règles d'accès et d'utilisation de la plateforme Artisans Validés
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 md:py-16 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="space-y-10">
              
              {/* Préambule */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">1</span>
                  Préambule
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») ont pour objet de définir les modalités et conditions d'utilisation de la plateforme Artisans Validés (ci-après « la Plateforme »), accessible à l'adresse <a href="https://artisansvalides.fr" className="text-primary hover:underline">artisansvalides.fr</a>.
                  </p>
                  <p>
                    La Plateforme est éditée par KJ SYSTEMES, entrepreneur individuel, dont le siège social est situé au 77 rue de la Monnaie, 59800 Lille, France.
                  </p>
                  <p>
                    L'utilisation de la Plateforme implique l'acceptation pleine et entière des présentes CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la Plateforme.
                  </p>
                </div>
              </article>

              {/* Définitions */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">2</span>
                  Définitions
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <ul className="space-y-3">
                    <li><strong className="text-foreground">« Utilisateur »</strong> : désigne toute personne qui accède et utilise la Plateforme, qu'elle soit Client ou Artisan.</li>
                    <li><strong className="text-foreground">« Client »</strong> : désigne toute personne physique ou morale recherchant les services d'un artisan via la Plateforme.</li>
                    <li><strong className="text-foreground">« Artisan »</strong> : désigne tout professionnel du bâtiment et des services inscrit sur la Plateforme et proposant ses prestations aux Clients.</li>
                    <li><strong className="text-foreground">« Compte »</strong> : désigne l'espace personnel créé par l'Utilisateur lors de son inscription sur la Plateforme.</li>
                    <li><strong className="text-foreground">« Services »</strong> : désigne l'ensemble des fonctionnalités proposées par la Plateforme.</li>
                    <li><strong className="text-foreground">« Mission »</strong> : désigne une demande de travaux ou de services publiée par un Client.</li>
                  </ul>
                </div>
              </article>

              {/* Objet de la Plateforme */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">3</span>
                  Objet de la Plateforme
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Artisans Validés est une plateforme de mise en relation entre des Clients recherchant des artisans qualifiés et des Artisans proposant leurs services dans différents corps de métiers (plomberie, électricité, peinture, maçonnerie, etc.).
                  </p>
                  <p>
                    La Plateforme permet notamment aux Utilisateurs de :
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Rechercher et consulter des profils d'artisans vérifiés</li>
                    <li>Publier des demandes de travaux (Missions)</li>
                    <li>Recevoir et comparer des devis</li>
                    <li>Communiquer via la messagerie intégrée</li>
                    <li>Laisser des recommandations et évaluations</li>
                  </ul>
                  <p>
                    <strong className="text-foreground">Important :</strong> Artisans Validés agit uniquement en tant qu'intermédiaire technique. La Plateforme n'est pas partie aux contrats conclus entre les Clients et les Artisans.
                  </p>
                </div>
              </article>

              {/* Inscription et Compte */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">4</span>
                  Inscription et Compte Utilisateur
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <h3 className="font-semibold text-foreground">4.1 Conditions d'inscription</h3>
                  <p>
                    L'inscription sur la Plateforme est gratuite et ouverte à toute personne physique majeure ou personne morale. L'Utilisateur s'engage à fournir des informations exactes, complètes et à jour lors de son inscription.
                  </p>
                  
                  <h3 className="font-semibold text-foreground">4.2 Création du Compte</h3>
                  <p>
                    La création d'un Compte nécessite la fourniture d'une adresse email valide et la création d'un mot de passe sécurisé. L'Utilisateur est seul responsable de la confidentialité de ses identifiants de connexion.
                  </p>
                  
                  <h3 className="font-semibold text-foreground">4.3 Vérification des Artisans</h3>
                  <p>
                    Les Artisans souhaitant s'inscrire sur la Plateforme doivent fournir des justificatifs professionnels (SIRET, assurance décennale, qualifications, etc.). KJ SYSTEMES se réserve le droit de refuser ou de suspendre tout compte ne répondant pas aux critères de qualité exigés.
                  </p>
                </div>
              </article>

              {/* Utilisation de la Plateforme */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">5</span>
                  Utilisation de la Plateforme
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <h3 className="font-semibold text-foreground">5.1 Règles générales</h3>
                  <p>L'Utilisateur s'engage à utiliser la Plateforme de manière conforme aux lois en vigueur et aux présentes CGU. Il est notamment interdit de :</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Publier des contenus illicites, diffamatoires ou portant atteinte aux droits de tiers</li>
                    <li>Usurper l'identité d'un tiers</li>
                    <li>Utiliser la Plateforme à des fins frauduleuses</li>
                    <li>Perturber le fonctionnement normal de la Plateforme</li>
                    <li>Collecter des données personnelles d'autres Utilisateurs</li>
                  </ul>
                  
                  <h3 className="font-semibold text-foreground">5.2 Obligations des Clients</h3>
                  <p>Le Client s'engage à :</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Décrire précisément ses besoins lors de la publication d'une Mission</li>
                    <li>Répondre aux sollicitations des Artisans dans un délai raisonnable</li>
                    <li>Honorer ses engagements contractuels envers les Artisans sélectionnés</li>
                  </ul>
                  
                  <h3 className="font-semibold text-foreground">5.3 Obligations des Artisans</h3>
                  <p>L'Artisan s'engage à :</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Maintenir à jour ses informations professionnelles et ses qualifications</li>
                    <li>Fournir des devis clairs et détaillés</li>
                    <li>Respecter les délais et engagements pris envers les Clients</li>
                    <li>Disposer de toutes les assurances obligatoires pour l'exercice de son activité</li>
                  </ul>
                </div>
              </article>

              {/* Abonnements et Tarification */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">6</span>
                  Abonnements et Tarification
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <h3 className="font-semibold text-foreground">6.1 Accès gratuit pour les Clients</h3>
                  <p>
                    L'utilisation de la Plateforme est entièrement gratuite pour les Clients. Aucun frais n'est facturé pour la recherche d'artisans, la publication de Missions ou la réception de devis.
                  </p>
                  
                  <h3 className="font-semibold text-foreground">6.2 Abonnements Artisans</h3>
                  <p>
                    Les Artisans peuvent souscrire à différentes formules d'abonnement offrant des fonctionnalités avancées (visibilité accrue, nombre de candidatures illimité, etc.). Les tarifs et conditions des abonnements sont détaillés sur la page dédiée de la Plateforme.
                  </p>
                  
                  <h3 className="font-semibold text-foreground">6.3 Paiement et Facturation</h3>
                  <p>
                    Les paiements sont sécurisés et traités par notre prestataire de paiement Stripe. Les abonnements sont facturés mensuellement ou annuellement selon la formule choisie.
                  </p>
                </div>
              </article>

              {/* Responsabilités */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">7</span>
                  Responsabilités
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <h3 className="font-semibold text-foreground">7.1 Responsabilité de KJ SYSTEMES</h3>
                  <p>
                    KJ SYSTEMES s'engage à mettre en œuvre tous les moyens nécessaires pour assurer le bon fonctionnement de la Plateforme. Toutefois, KJ SYSTEMES ne saurait être tenue responsable :
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Des relations contractuelles entre Clients et Artisans</li>
                    <li>De la qualité des prestations réalisées par les Artisans</li>
                    <li>Des interruptions temporaires de service pour maintenance</li>
                    <li>Des dommages résultant de l'utilisation frauduleuse de la Plateforme par des tiers</li>
                  </ul>
                  
                  <h3 className="font-semibold text-foreground">7.2 Responsabilité des Utilisateurs</h3>
                  <p>
                    Chaque Utilisateur est seul responsable de l'utilisation qu'il fait de la Plateforme et des contenus qu'il publie. L'Utilisateur garantit KJ SYSTEMES contre toute réclamation de tiers liée à son utilisation de la Plateforme.
                  </p>
                </div>
              </article>

              {/* Propriété intellectuelle */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">8</span>
                  Propriété intellectuelle
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    L'ensemble des éléments constituant la Plateforme (textes, graphismes, logiciels, photographies, images, vidéos, sons, plans, logos, marques, etc.) sont la propriété exclusive de KJ SYSTEMES ou de ses partenaires.
                  </p>
                  <p>
                    Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments de la Plateforme, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de KJ SYSTEMES.
                  </p>
                  <p>
                    Les Utilisateurs conservent la propriété des contenus qu'ils publient sur la Plateforme mais accordent à KJ SYSTEMES une licence non exclusive d'utilisation pour les besoins du fonctionnement de la Plateforme.
                  </p>
                </div>
              </article>

              {/* Protection des données */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">9</span>
                  Protection des données personnelles
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    KJ SYSTEMES s'engage à protéger les données personnelles des Utilisateurs conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
                  </p>
                  <p>
                    Pour plus d'informations sur la collecte et le traitement de vos données personnelles, veuillez consulter notre <a href="/confidentialite" className="text-primary hover:underline">Politique de Confidentialité</a>.
                  </p>
                </div>
              </article>

              {/* Modification et Résiliation */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">10</span>
                  Modification et Résiliation
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <h3 className="font-semibold text-foreground">10.1 Modification des CGU</h3>
                  <p>
                    KJ SYSTEMES se réserve le droit de modifier les présentes CGU à tout moment. Les Utilisateurs seront informés de toute modification substantielle par email ou par notification sur la Plateforme. La poursuite de l'utilisation de la Plateforme après notification vaut acceptation des nouvelles CGU.
                  </p>
                  
                  <h3 className="font-semibold text-foreground">10.2 Résiliation du Compte</h3>
                  <p>
                    L'Utilisateur peut résilier son Compte à tout moment depuis les paramètres de son espace personnel ou en contactant le service client. KJ SYSTEMES se réserve le droit de suspendre ou supprimer tout Compte en cas de violation des présentes CGU.
                  </p>
                </div>
              </article>

              {/* Droit applicable et litiges */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">11</span>
                  Droit applicable et Règlement des litiges
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Les présentes CGU sont régies par le droit français. En cas de litige relatif à l'interprétation ou à l'exécution des présentes CGU, les parties s'engagent à rechercher une solution amiable avant toute action judiciaire.
                  </p>
                  <p>
                    Conformément aux dispositions du Code de la consommation concernant le règlement amiable des litiges, le Client peut recourir gratuitement au service de médiation de la consommation.
                  </p>
                  <p>
                    À défaut de résolution amiable, les tribunaux de Lille seront seuls compétents pour connaître du litige.
                  </p>
                </div>
              </article>

              {/* Contact */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">12</span>
                  Contact
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Pour toute question relative aux présentes CGU, vous pouvez nous contacter :
                  </p>
                  <ul className="space-y-2">
                    <li><strong className="text-foreground">Par email :</strong> <a href="mailto:contact@artisansvalides.fr" className="text-primary hover:underline">contact@artisansvalides.fr</a></li>
                    <li><strong className="text-foreground">Par téléphone :</strong> <a href="tel:0353632999" className="text-primary hover:underline">03 53 63 29 99</a></li>
                    <li><strong className="text-foreground">Par courrier :</strong> KJ SYSTEMES, 77 rue de la Monnaie, 59800 Lille, France</li>
                  </ul>
                  <p className="text-sm italic mt-6">
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

export default CGU;
