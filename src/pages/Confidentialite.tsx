import { SEOHead } from "@/components/seo/SEOHead";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Confidentialite = () => {
  return (
    <>
      <SEOHead
        title="Politique de Confidentialité"
        description="Politique de Confidentialité du site Artisans Validés - Collecte, traitement et protection de vos données personnelles conformément au RGPD."
        noIndex={true}
      />
      <Navbar />
      
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-primary py-16 md:py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground text-center">
              Politique de Confidentialité
            </h1>
            <p className="text-primary-foreground/80 text-center mt-4 max-w-2xl mx-auto">
              Protection de vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD)
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 md:py-16 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="space-y-10">
              
              {/* Introduction */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">1</span>
                  Introduction
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    KJ SYSTEMES, exploitant la plateforme Artisans Validés, s'engage à protéger la vie privée des utilisateurs de son site <a href="https://artisansvalides.fr" className="text-primary hover:underline">artisansvalides.fr</a>.
                  </p>
                  <p>
                    La présente Politique de Confidentialité décrit les types de données personnelles que nous collectons, les finalités de leur traitement, les mesures de sécurité mises en place et vos droits concernant ces données.
                  </p>
                  <p>
                    Cette politique est conforme au Règlement (UE) 2016/679 du 27 avril 2016 (RGPD) et à la loi n° 78-17 du 6 janvier 1978 modifiée relative à l'informatique, aux fichiers et aux libertés.
                  </p>
                </div>
              </article>

              {/* Responsable du traitement */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">2</span>
                  Responsable du traitement
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>Le responsable du traitement des données personnelles est :</p>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p><strong className="text-foreground">KJ SYSTEMES</strong></p>
                    <p>Représenté par : Knob</p>
                    <p>Adresse : 77 rue de la Monnaie, 59800 Lille, France</p>
                    <p>Email : <a href="mailto:contact@artisansvalides.fr" className="text-primary hover:underline">contact@artisansvalides.fr</a></p>
                    <p>Téléphone : <a href="tel:0353632999" className="text-primary hover:underline">03 53 63 29 99</a></p>
                    <p>SIRET : 793 270 968 00035</p>
                  </div>
                </div>
              </article>

              {/* Données collectées */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">3</span>
                  Données personnelles collectées
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>Nous collectons différentes catégories de données personnelles selon votre utilisation de la Plateforme :</p>
                  
                  <h3 className="font-semibold text-foreground">3.1 Données d'identification</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Nom et prénom</li>
                    <li>Adresse email</li>
                    <li>Numéro de téléphone</li>
                    <li>Adresse postale</li>
                    <li>Photo de profil (optionnelle)</li>
                  </ul>
                  
                  <h3 className="font-semibold text-foreground">3.2 Données professionnelles (Artisans)</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Raison sociale et nom commercial</li>
                    <li>Numéro SIRET/SIREN</li>
                    <li>Numéro d'assurance décennale</li>
                    <li>Qualifications et certifications professionnelles</li>
                    <li>Zone d'intervention géographique</li>
                    <li>Portfolio de réalisations</li>
                  </ul>
                  
                  <h3 className="font-semibold text-foreground">3.3 Données de navigation</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Adresse IP</li>
                    <li>Type de navigateur et système d'exploitation</li>
                    <li>Pages visitées et durée de visite</li>
                    <li>Cookies et identifiants de session</li>
                  </ul>
                  
                  <h3 className="font-semibold text-foreground">3.4 Données transactionnelles</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Historique des demandes de devis</li>
                    <li>Messages échangés via la messagerie</li>
                    <li>Informations de paiement (traitées par Stripe)</li>
                  </ul>
                </div>
              </article>

              {/* Finalités du traitement */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">4</span>
                  Finalités du traitement
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>Vos données personnelles sont collectées et traitées pour les finalités suivantes :</p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Finalité</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Base légale</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        <tr>
                          <td className="py-3 px-4">Création et gestion de votre compte</td>
                          <td className="py-3 px-4">Exécution du contrat</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">Mise en relation Clients/Artisans</td>
                          <td className="py-3 px-4">Exécution du contrat</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">Gestion des demandes de devis et missions</td>
                          <td className="py-3 px-4">Exécution du contrat</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">Traitement des paiements et facturation</td>
                          <td className="py-3 px-4">Exécution du contrat / Obligation légale</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">Envoi de communications relatives au service</td>
                          <td className="py-3 px-4">Intérêt légitime</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">Envoi de newsletters et offres commerciales</td>
                          <td className="py-3 px-4">Consentement</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">Amélioration de la Plateforme et statistiques</td>
                          <td className="py-3 px-4">Intérêt légitime</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">Prévention de la fraude et sécurité</td>
                          <td className="py-3 px-4">Intérêt légitime</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">Respect des obligations légales</td>
                          <td className="py-3 px-4">Obligation légale</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </article>

              {/* Durée de conservation */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">5</span>
                  Durée de conservation
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>Vos données personnelles sont conservées pendant les durées suivantes :</p>
                  <ul className="space-y-3">
                    <li><strong className="text-foreground">Données de compte :</strong> pendant toute la durée de votre inscription, puis 3 ans après la dernière activité sur votre compte</li>
                    <li><strong className="text-foreground">Données de facturation :</strong> 10 ans à compter de la clôture de l'exercice comptable concerné (obligation légale)</li>
                    <li><strong className="text-foreground">Messages et échanges :</strong> 5 ans après la dernière interaction</li>
                    <li><strong className="text-foreground">Données de navigation (cookies) :</strong> 13 mois maximum</li>
                    <li><strong className="text-foreground">Documents professionnels des artisans :</strong> pendant toute la durée de validité du document + 1 an</li>
                  </ul>
                  <p>
                    À l'expiration de ces délais, vos données sont supprimées ou anonymisées de manière irréversible.
                  </p>
                </div>
              </article>

              {/* Destinataires des données */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">6</span>
                  Destinataires des données
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>Vos données personnelles peuvent être communiquées aux destinataires suivants :</p>
                  
                  <h3 className="font-semibold text-foreground">6.1 Destinataires internes</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Équipe technique pour la maintenance de la Plateforme</li>
                    <li>Service client pour répondre à vos demandes</li>
                    <li>Service comptable pour la gestion des facturations</li>
                  </ul>
                  
                  <h3 className="font-semibold text-foreground">6.2 Sous-traitants</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Hébergement :</strong> Lovable (GPT Engineer Inc.) - États-Unis</li>
                    <li><strong>Paiements :</strong> Stripe - États-Unis (certifié PCI-DSS)</li>
                    <li><strong>Emails transactionnels :</strong> Resend - États-Unis</li>
                  </ul>
                  <p className="text-sm mt-2">
                    Ces prestataires sont soumis à des clauses contractuelles strictes garantissant la protection de vos données conformément au RGPD.
                  </p>
                  
                  <h3 className="font-semibold text-foreground">6.3 Autres utilisateurs</h3>
                  <p>
                    Certaines informations de votre profil sont visibles par les autres utilisateurs de la Plateforme (nom, ville, description, portfolio pour les artisans). Vous pouvez contrôler ces paramètres de visibilité depuis votre espace personnel.
                  </p>
                  
                  <h3 className="font-semibold text-foreground">6.4 Autorités publiques</h3>
                  <p>
                    Vos données peuvent être communiquées aux autorités administratives ou judiciaires compétentes en cas de réquisition légale.
                  </p>
                </div>
              </article>

              {/* Transferts hors UE */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">7</span>
                  Transferts de données hors Union Européenne
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Certains de nos sous-traitants sont situés aux États-Unis. Ces transferts sont encadrés par :
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Le cadre de protection des données UE-États-Unis (Data Privacy Framework)</li>
                    <li>Des clauses contractuelles types adoptées par la Commission européenne</li>
                    <li>Des mesures de sécurité techniques et organisationnelles complémentaires</li>
                  </ul>
                  <p>
                    Vous pouvez obtenir une copie des garanties mises en place en nous contactant.
                  </p>
                </div>
              </article>

              {/* Sécurité des données */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">8</span>
                  Sécurité des données
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles :
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Chiffrement des données en transit (HTTPS/TLS)</li>
                    <li>Chiffrement des données sensibles au repos</li>
                    <li>Contrôle d'accès strictement limité aux données personnelles</li>
                    <li>Authentification renforcée pour l'accès aux systèmes</li>
                    <li>Surveillance continue des systèmes et détection d'intrusion</li>
                    <li>Sauvegardes régulières et procédures de reprise d'activité</li>
                    <li>Formation du personnel aux bonnes pratiques de sécurité</li>
                  </ul>
                  <p>
                    En cas de violation de données susceptible d'engendrer un risque pour vos droits et libertés, nous vous en informerons dans les meilleurs délais conformément à la réglementation applicable.
                  </p>
                </div>
              </article>

              {/* Cookies */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">9</span>
                  Cookies et technologies similaires
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Notre site utilise des cookies pour améliorer votre expérience de navigation et analyser l'utilisation de la Plateforme.
                  </p>
                  
                  <h3 className="font-semibold text-foreground">Types de cookies utilisés :</h3>
                  <ul className="space-y-3">
                    <li>
                      <strong className="text-foreground">Cookies essentiels :</strong> nécessaires au fonctionnement de la Plateforme (authentification, sécurité). Ces cookies ne peuvent pas être désactivés.
                    </li>
                    <li>
                      <strong className="text-foreground">Cookies de performance :</strong> permettent de mesurer l'audience et d'améliorer les performances du site.
                    </li>
                    <li>
                      <strong className="text-foreground">Cookies fonctionnels :</strong> permettent de mémoriser vos préférences (langue, paramètres d'affichage).
                    </li>
                  </ul>
                  
                  <h3 className="font-semibold text-foreground">Gestion des cookies :</h3>
                  <p>
                    Vous pouvez à tout moment modifier vos préférences en matière de cookies via les paramètres de votre navigateur. Notez que la désactivation de certains cookies peut affecter le fonctionnement de la Plateforme.
                  </p>
                </div>
              </article>

              {/* Vos droits */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">10</span>
                  Vos droits
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Conformément au RGPD, vous disposez des droits suivants concernant vos données personnelles :
                  </p>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">Droit d'accès</h4>
                      <p className="text-sm">Obtenir la confirmation que vos données sont traitées et en recevoir une copie.</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">Droit de rectification</h4>
                      <p className="text-sm">Faire corriger des données inexactes ou compléter des données incomplètes.</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">Droit à l'effacement</h4>
                      <p className="text-sm">Demander la suppression de vos données dans certaines conditions.</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">Droit à la limitation</h4>
                      <p className="text-sm">Demander la suspension temporaire du traitement de vos données.</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">Droit à la portabilité</h4>
                      <p className="text-sm">Recevoir vos données dans un format structuré et lisible par machine.</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">Droit d'opposition</h4>
                      <p className="text-sm">Vous opposer au traitement de vos données pour des raisons légitimes.</p>
                    </div>
                  </div>
                  
                  <p className="mt-4">
                    <strong className="text-foreground">Droit de retirer votre consentement :</strong> Lorsque le traitement est fondé sur votre consentement, vous pouvez le retirer à tout moment sans affecter la licéité du traitement effectué avant ce retrait.
                  </p>
                  
                  <p>
                    <strong className="text-foreground">Directives post-mortem :</strong> Vous pouvez définir des directives relatives à la conservation, à l'effacement et à la communication de vos données après votre décès.
                  </p>
                </div>
              </article>

              {/* Exercice des droits */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">11</span>
                  Comment exercer vos droits
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Pour exercer vos droits, vous pouvez nous contacter :
                  </p>
                  <ul className="space-y-2">
                    <li><strong className="text-foreground">Par email :</strong> <a href="mailto:contact@artisansvalides.fr" className="text-primary hover:underline">contact@artisansvalides.fr</a></li>
                    <li><strong className="text-foreground">Par courrier :</strong> KJ SYSTEMES - Protection des données, 77 rue de la Monnaie, 59800 Lille</li>
                  </ul>
                  <p>
                    Nous nous engageons à répondre à votre demande dans un délai d'un mois. Ce délai peut être prolongé de deux mois supplémentaires en cas de demande complexe, auquel cas nous vous en informerons.
                  </p>
                  <p>
                    Une pièce d'identité pourra vous être demandée afin de vérifier votre identité.
                  </p>
                  <p>
                    <strong className="text-foreground">Réclamation auprès de la CNIL :</strong> Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL) :
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 mt-2">
                    <p>CNIL - Commission Nationale de l'Informatique et des Libertés</p>
                    <p>3 Place de Fontenoy - TSA 80715</p>
                    <p>75334 Paris Cedex 07</p>
                    <p>Site web : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.cnil.fr</a></p>
                  </div>
                </div>
              </article>

              {/* Mineurs */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">12</span>
                  Protection des mineurs
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    La Plateforme n'est pas destinée aux personnes de moins de 18 ans. Nous ne collectons pas sciemment de données personnelles concernant des mineurs.
                  </p>
                  <p>
                    Si vous êtes parent ou tuteur légal et que vous avez connaissance que votre enfant nous a fourni des données personnelles, veuillez nous contacter afin que nous puissions prendre les mesures nécessaires.
                  </p>
                </div>
              </article>

              {/* Modifications */}
              <article className="bg-card rounded-xl p-6 md:p-8 shadow-sm border">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center text-navy font-bold text-sm">13</span>
                  Modifications de la Politique de Confidentialité
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Nous nous réservons le droit de modifier la présente Politique de Confidentialité à tout moment pour l'adapter aux évolutions réglementaires ou à nos pratiques.
                  </p>
                  <p>
                    En cas de modification substantielle, nous vous en informerons par email ou par notification visible sur la Plateforme avant l'entrée en vigueur des changements.
                  </p>
                  <p>
                    La date de dernière mise à jour est indiquée en bas de ce document.
                  </p>
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

export default Confidentialite;
