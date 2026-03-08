import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";

const CGV = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title="Conditions Générales de Vente"
        description="Conditions générales de vente de la plateforme Artisans Validés - Tarification, abonnements et modalités de paiement."
        noIndex={true}
      />
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-primary py-16 md:py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
              Conditions Générales de Vente
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Applicables aux services proposés sur la plateforme Artisans Validés
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="prose prose-lg max-w-none">
              
              <p className="text-muted-foreground mb-8">
                Dernière mise à jour : 10 janvier 2025
              </p>

              {/* Article 1 */}
              <article className="mb-10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Article 1 - Préambule
                </h2>
                <p className="text-muted-foreground mb-4">
                  Les présentes Conditions Générales de Vente (ci-après « CGV ») régissent les relations contractuelles entre :
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>
                    <strong>KJ SYSTEMES</strong>, société par actions simplifiée au capital de 1 000 euros, immatriculée au RCS de Lille sous le numéro 932 008 411, dont le siège social est situé au 77 rue de la monnaie, 59800 Lille, France (ci-après « le Prestataire » ou « Artisans Validés »)
                  </li>
                  <li>
                    Toute personne physique ou morale souscrivant à un abonnement sur la plateforme Artisans Validés (ci-après « le Client » ou « l'Artisan »)
                  </li>
                </ul>
                <p className="text-muted-foreground">
                  La souscription à un abonnement implique l'acceptation pleine et entière des présentes CGV.
                </p>
              </article>

              {/* Article 2 */}
              <article className="mb-10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Article 2 - Objet
                </h2>
                <p className="text-muted-foreground mb-4">
                  Les présentes CGV ont pour objet de définir les conditions dans lesquelles le Prestataire fournit aux Clients professionnels (artisans) les services suivants :
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Création et gestion d'un profil professionnel sur la plateforme</li>
                  <li>Mise en relation avec des clients particuliers</li>
                  <li>Accès aux demandes de devis et missions publiées</li>
                  <li>Outils de communication et de gestion de la relation client</li>
                  <li>Visibilité et référencement sur la plateforme</li>
                  <li>Accès aux fonctionnalités premium selon l'abonnement souscrit</li>
                </ul>
              </article>

              {/* Article 3 */}
              <article className="mb-10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Article 3 - Offres et tarification
                </h2>
                
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  3.1 Formules d'abonnement
                </h3>
                <p className="text-muted-foreground mb-4">
                  Le Prestataire propose plusieurs formules d'abonnement destinées aux artisans professionnels :
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
                  <li><strong>Formule Gratuite</strong> : Accès limité aux fonctionnalités de base</li>
                  <li><strong>Formule Starter</strong> : 29€ HT/mois - Fonctionnalités essentielles</li>
                  <li><strong>Formule Pro</strong> : 59€ HT/mois - Fonctionnalités avancées et priorité de visibilité</li>
                  <li><strong>Formule Premium</strong> : 99€ HT/mois - Accès complet à toutes les fonctionnalités</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  3.2 Prix
                </h3>
                <p className="text-muted-foreground mb-4">
                  Les prix sont indiqués en euros hors taxes (HT). La TVA applicable (20%) sera ajoutée au montant HT. Les prix peuvent être modifiés à tout moment, les modifications prenant effet à la prochaine période de facturation.
                </p>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  3.3 Réductions et promotions
                </h3>
                <p className="text-muted-foreground">
                  Des offres promotionnelles peuvent être proposées ponctuellement. Elles ne sont pas cumulables sauf mention contraire et sont valables dans les conditions et durées précisées lors de leur communication.
                </p>
              </article>

              {/* Article 4 */}
              <article className="mb-10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Article 4 - Modalités de paiement
                </h2>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  4.1 Moyens de paiement acceptés
                </h3>
                <p className="text-muted-foreground mb-4">
                  Le paiement s'effectue par carte bancaire (Visa, Mastercard, American Express) via notre prestataire de paiement sécurisé Stripe.
                </p>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  4.2 Facturation
                </h3>
                <p className="text-muted-foreground mb-4">
                  Les abonnements sont facturés mensuellement ou annuellement selon le choix du Client. La facturation intervient en début de période. Une facture est automatiquement générée et envoyée par email.
                </p>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  4.3 Prélèvement automatique
                </h3>
                <p className="text-muted-foreground mb-4">
                  En souscrivant à un abonnement, le Client autorise le prélèvement automatique du montant de l'abonnement à chaque échéance. Le Client peut modifier son moyen de paiement à tout moment depuis son espace personnel.
                </p>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  4.4 Défaut de paiement
                </h3>
                <p className="text-muted-foreground">
                  En cas d'échec de paiement, le Prestataire se réserve le droit de suspendre l'accès aux services premium jusqu'à régularisation. Après deux tentatives infructueuses, l'abonnement pourra être résilié de plein droit.
                </p>
              </article>

              {/* Article 5 */}
              <article className="mb-10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Article 5 - Durée et renouvellement
                </h2>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  5.1 Durée de l'abonnement
                </h3>
                <p className="text-muted-foreground mb-4">
                  Les abonnements sont souscrits pour une durée d'un mois ou d'un an selon le choix du Client lors de la souscription.
                </p>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  5.2 Renouvellement automatique
                </h3>
                <p className="text-muted-foreground mb-4">
                  Sauf résiliation par le Client avant la fin de la période en cours, les abonnements sont renouvelés automatiquement pour une durée identique à la période initiale.
                </p>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  5.3 Notification de renouvellement
                </h3>
                <p className="text-muted-foreground">
                  Un email de rappel est envoyé au Client 7 jours avant le renouvellement de l'abonnement.
                </p>
              </article>

              {/* Article 6 */}
              <article className="mb-10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Article 6 - Droit de rétractation
                </h2>
                <p className="text-muted-foreground mb-4">
                  Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux contrats de fourniture de services pleinement exécutés avant la fin du délai de rétractation et dont l'exécution a commencé après accord préalable exprès du consommateur.
                </p>
                <p className="text-muted-foreground">
                  En souscrivant à un abonnement et en accédant immédiatement aux services, le Client reconnaît renoncer expressément à son droit de rétractation.
                </p>
              </article>

              {/* Article 7 */}
              <article className="mb-10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Article 7 - Résiliation
                </h2>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  7.1 Résiliation par le Client
                </h3>
                <p className="text-muted-foreground mb-4">
                  Le Client peut résilier son abonnement à tout moment depuis son espace personnel. La résiliation prend effet à la fin de la période en cours. Aucun remboursement prorata temporis n'est effectué.
                </p>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  7.2 Résiliation par le Prestataire
                </h3>
                <p className="text-muted-foreground mb-4">
                  Le Prestataire se réserve le droit de résilier l'abonnement d'un Client en cas de :
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Non-respect des Conditions Générales d'Utilisation</li>
                  <li>Défaut de paiement non régularisé</li>
                  <li>Comportement frauduleux ou abusif</li>
                  <li>Atteinte à l'image de la plateforme</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  7.3 Conséquences de la résiliation
                </h3>
                <p className="text-muted-foreground">
                  À la résiliation, le Client conserve l'accès aux fonctionnalités gratuites de la plateforme. Les données du profil sont conservées pendant 3 ans conformément aux obligations légales.
                </p>
              </article>

              {/* Article 8 */}
              <article className="mb-10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Article 8 - Responsabilités
                </h2>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  8.1 Responsabilité du Prestataire
                </h3>
                <p className="text-muted-foreground mb-4">
                  Le Prestataire s'engage à fournir les services avec diligence et selon les règles de l'art. Sa responsabilité est limitée aux dommages directs et prévisibles résultant d'un manquement à ses obligations contractuelles.
                </p>
                <p className="text-muted-foreground mb-4">
                  Le Prestataire ne saurait être tenu responsable :
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Des relations commerciales entre les artisans et leurs clients</li>
                  <li>De la qualité des prestations réalisées par les artisans</li>
                  <li>Des interruptions de service dues à des cas de force majeure</li>
                  <li>Des pertes de données dues à une négligence du Client</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  8.2 Responsabilité du Client
                </h3>
                <p className="text-muted-foreground">
                  Le Client est responsable de l'exactitude des informations fournies, du respect de ses obligations légales et professionnelles, et de l'utilisation conforme des services.
                </p>
              </article>

              {/* Article 9 */}
              <article className="mb-10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Article 9 - Propriété intellectuelle
                </h2>
                <p className="text-muted-foreground mb-4">
                  L'ensemble des éléments de la plateforme (textes, graphiques, logos, logiciels, etc.) sont la propriété exclusive du Prestataire ou de ses partenaires. Toute reproduction ou utilisation non autorisée est interdite.
                </p>
                <p className="text-muted-foreground">
                  Le Client conserve la propriété des contenus qu'il publie sur la plateforme et concède au Prestataire une licence d'utilisation non exclusive pour les besoins du service.
                </p>
              </article>

              {/* Article 10 */}
              <article className="mb-10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Article 10 - Protection des données personnelles
                </h2>
                <p className="text-muted-foreground mb-4">
                  Le traitement des données personnelles est effectué conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
                </p>
                <p className="text-muted-foreground">
                  Pour plus d'informations, veuillez consulter notre <a href="/confidentialite" className="text-primary hover:underline">Politique de Confidentialité</a>.
                </p>
              </article>

              {/* Article 11 */}
              <article className="mb-10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Article 11 - Modification des CGV
                </h2>
                <p className="text-muted-foreground mb-4">
                  Le Prestataire se réserve le droit de modifier les présentes CGV à tout moment. Les modifications seront notifiées aux Clients par email au moins 30 jours avant leur entrée en vigueur.
                </p>
                <p className="text-muted-foreground">
                  La poursuite de l'utilisation des services après l'entrée en vigueur des nouvelles CGV vaut acceptation de celles-ci.
                </p>
              </article>

              {/* Article 12 */}
              <article className="mb-10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Article 12 - Droit applicable et litiges
                </h2>
                <p className="text-muted-foreground mb-4">
                  Les présentes CGV sont régies par le droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable avant toute action judiciaire.
                </p>
                <p className="text-muted-foreground mb-4">
                  À défaut d'accord amiable, le litige sera soumis aux tribunaux compétents de Lille.
                </p>
                <p className="text-muted-foreground">
                  Conformément aux dispositions du Code de la consommation, le Client peut recourir gratuitement au service de médiation de la consommation.
                </p>
              </article>

              {/* Article 13 */}
              <article className="mb-10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Article 13 - Contact
                </h2>
                <p className="text-muted-foreground mb-4">
                  Pour toute question concernant les présentes CGV, vous pouvez nous contacter :
                </p>
                <ul className="list-none text-muted-foreground space-y-2">
                  <li><strong>Email :</strong> contact@artisansvalides.fr</li>
                  <li><strong>Téléphone :</strong> 03 53 63 29 99</li>
                  <li><strong>Adresse :</strong> KJ SYSTEMES - 77 rue de la monnaie, 59800 Lille, France</li>
                </ul>
              </article>

            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CGV;
