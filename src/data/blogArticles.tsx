import { Link } from "react-router-dom";

export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: React.ReactNode;
  author: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  image: string;
}

export const blogArticles: BlogArticle[] = [
  {
    id: "1",
    slug: "comment-choisir-artisan-qualifie",
    title: "Comment choisir un artisan qualifié pour vos travaux en 2024",
    excerpt: "Découvrez les critères essentiels pour sélectionner un artisan de confiance : certifications, assurances, devis détaillés et avis clients vérifiés.",
    author: "L'équipe Artisans Validés",
    date: "20 décembre 2024",
    readTime: "8 min",
    category: "Conseils",
    tags: ["artisan qualifié", "travaux maison", "devis", "certifications"],
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=400&fit=crop",
    content: (
      <article className="prose prose-lg max-w-none">
        <p className="text-xl text-muted-foreground leading-relaxed">
          Trouver un <strong>artisan qualifié</strong> pour vos travaux de rénovation ou de construction peut sembler complexe. 
          Entre les nombreuses offres disponibles et les arnaques potentielles, il est crucial de savoir identifier les 
          <strong> professionnels du bâtiment</strong> dignes de confiance. Voici notre guide complet pour faire le bon choix.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Les certifications et labels à vérifier</h2>
        <p>
          Avant de confier vos <strong>travaux de rénovation</strong> à un artisan, assurez-vous qu'il possède les certifications 
          nécessaires. Les labels comme <strong>RGE (Reconnu Garant de l'Environnement)</strong> sont particulièrement importants 
          pour les travaux de rénovation énergétique, car ils vous permettent de bénéficier d'aides financières comme 
          MaPrimeRénov' ou l'éco-prêt à taux zéro.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Label RGE</strong> : obligatoire pour les travaux d'économie d'énergie subventionnés</li>
          <li><strong>Qualibat</strong> : certification de qualification et de capacité professionnelle</li>
          <li><strong>CAPEB</strong> : adhésion à la Confédération de l'Artisanat et des Petites Entreprises du Bâtiment</li>
          <li><strong>FFB</strong> : membre de la Fédération Française du Bâtiment</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">L'importance des assurances professionnelles</h2>
        <p>
          Un <strong>artisan sérieux</strong> doit obligatoirement disposer d'une assurance décennale et d'une responsabilité 
          civile professionnelle. Ces garanties vous protègent en cas de malfaçons ou de dommages pendant les travaux. 
          N'hésitez pas à demander une attestation d'assurance avant de signer tout contrat.
        </p>
        <p>
          Sur <Link to="/" className="text-primary hover:underline font-medium">Artisans Validés</Link>, tous nos 
          <strong> artisans vérifiés</strong> ont fourni leurs documents d'assurance, que notre équipe vérifie manuellement.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Comment analyser un devis de travaux</h2>
        <p>
          Un <strong>devis détaillé</strong> est le premier signe d'un artisan professionnel. Il doit contenir :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>La description précise des travaux à réaliser</li>
          <li>Les matériaux utilisés avec leurs références</li>
          <li>Le coût de la main d'œuvre</li>
          <li>Les délais d'exécution</li>
          <li>Les conditions de paiement</li>
          <li>La mention "Devis gratuit" ou le coût éventuel</li>
        </ul>
        <p>
          Nous vous conseillons de <Link to="/demande-devis" className="text-primary hover:underline font-medium">demander plusieurs devis</Link> pour 
          comparer les offres et les prix pratiqués dans votre région.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Les avis clients : un indicateur fiable</h2>
        <p>
          Les <strong>avis clients vérifiés</strong> constituent un excellent moyen d'évaluer la qualité du travail d'un artisan. 
          Recherchez les témoignages sur des plateformes spécialisées comme Artisans Validés, où chaque avis provient d'un 
          client ayant réellement fait appel aux services de l'artisan.
        </p>
        <p>
          Méfiez-vous des profils sans avis ou avec uniquement des notes parfaites. Un <strong>artisan de confiance</strong> aura 
          généralement quelques avis constructifs qui démontrent son professionnalisme face aux remarques clients.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Conclusion : faites confiance aux artisans validés</h2>
        <p>
          Choisir le bon artisan demande du temps et de la vigilance. En passant par une plateforme comme 
          <Link to="/" className="text-primary hover:underline font-medium"> Artisans Validés</Link>, vous bénéficiez d'un processus 
          de vérification rigoureux qui vous garantit des <strong>professionnels qualifiés</strong>, assurés et recommandés par leurs clients.
        </p>
        <p>
          <Link to="/trouver-artisan" className="text-primary hover:underline font-medium">Trouvez dès maintenant un artisan qualifié</Link> près 
          de chez vous et lancez vos projets de travaux en toute sérénité !
        </p>
      </article>
    ),
  },
  {
    id: "2",
    slug: "renovation-energetique-aides-2024",
    title: "Rénovation énergétique : toutes les aides disponibles en 2024",
    excerpt: "MaPrimeRénov', éco-PTZ, CEE... Découvrez comment financer vos travaux de rénovation énergétique et réduire vos factures grâce aux aides de l'État.",
    author: "L'équipe Artisans Validés",
    date: "15 décembre 2024",
    readTime: "10 min",
    category: "Financement",
    tags: ["rénovation énergétique", "MaPrimeRénov", "aides travaux", "isolation"],
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop",
    content: (
      <article className="prose prose-lg max-w-none">
        <p className="text-xl text-muted-foreground leading-relaxed">
          La <strong>rénovation énergétique</strong> de votre logement représente un investissement important, mais de nombreuses 
          <strong> aides financières</strong> existent pour alléger la facture. Voici le guide complet des dispositifs disponibles 
          en 2024 pour financer vos travaux d'isolation, de chauffage ou de ventilation.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">MaPrimeRénov' : l'aide principale pour vos travaux</h2>
        <p>
          <strong>MaPrimeRénov'</strong> est devenue l'aide phare pour la rénovation énergétique en France. Elle remplace 
          l'ancien crédit d'impôt CITE et s'adresse à tous les propriétaires, qu'ils occupent leur logement ou le mettent en location.
        </p>
        <p>
          Le montant de l'aide dépend de vos revenus et de la nature des travaux :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Isolation des murs</strong> : jusqu'à 75€/m² pour les ménages modestes</li>
          <li><strong>Pompe à chaleur</strong> : jusqu'à 5 000€ d'aide</li>
          <li><strong>Chaudière biomasse</strong> : jusqu'à 10 000€ pour les revenus très modestes</li>
          <li><strong>Fenêtres double vitrage</strong> : jusqu'à 100€ par équipement</li>
        </ul>
        <p>
          <strong>Important :</strong> Pour bénéficier de MaPrimeRénov', vous devez faire appel à un 
          <Link to="/trouver-artisan" className="text-primary hover:underline font-medium"> artisan certifié RGE</Link>. 
          Sur Artisans Validés, vous pouvez facilement identifier les professionnels disposant de cette certification.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">L'éco-prêt à taux zéro (éco-PTZ)</h2>
        <p>
          L'<strong>éco-PTZ</strong> permet d'emprunter jusqu'à 50 000€ sans intérêts pour financer vos travaux de 
          rénovation énergétique. Ce prêt est accessible sans condition de ressources et peut être combiné avec MaPrimeRénov'.
        </p>
        <p>
          Les travaux éligibles comprennent :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>L'isolation thermique de la toiture</li>
          <li>L'isolation des murs extérieurs</li>
          <li>Le remplacement des menuiseries</li>
          <li>L'installation d'un système de chauffage performant</li>
          <li>L'installation d'un chauffe-eau solaire ou thermodynamique</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Les Certificats d'Économies d'Énergie (CEE)</h2>
        <p>
          Les <strong>CEE</strong>, aussi appelés "primes énergie", sont financées par les fournisseurs d'énergie. 
          Elles peuvent représenter plusieurs centaines voire milliers d'euros selon les travaux réalisés.
        </p>
        <p>
          Ces primes sont cumulables avec MaPrimeRénov' et l'éco-PTZ. Pour en bénéficier, vous devez :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Choisir un fournisseur d'énergie partenaire AVANT de signer le devis</li>
          <li>Faire réaliser les travaux par un <strong>artisan RGE</strong></li>
          <li>Fournir les factures et attestations demandées</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">La TVA à taux réduit</h2>
        <p>
          Pour les travaux de rénovation énergétique, vous bénéficiez automatiquement d'une <strong>TVA à 5,5%</strong> au lieu 
          de 20%. Cette réduction s'applique directement sur le devis de votre <strong>artisan qualifié</strong>.
        </p>
        <p>
          Conditions : le logement doit être achevé depuis plus de 2 ans et constituer votre résidence principale ou secondaire.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Comment cumuler les aides efficacement ?</h2>
        <p>
          La bonne nouvelle, c'est que la plupart de ces aides sont <strong>cumulables</strong>. Voici un exemple concret :
        </p>
        <div className="bg-muted p-4 rounded-lg my-4">
          <p className="font-semibold mb-2">Exemple : Isolation des combles (100m²)</p>
          <ul className="list-none space-y-1">
            <li>Coût total des travaux : 5 000€</li>
            <li>MaPrimeRénov' : -2 000€</li>
            <li>Prime CEE : -1 000€</li>
            <li>Économie TVA : -350€</li>
            <li className="font-bold text-primary">Reste à charge : 1 650€</li>
          </ul>
        </div>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Trouvez votre artisan RGE sur Artisans Validés</h2>
        <p>
          Pour bénéficier de ces aides, le choix d'un <strong>artisan certifié RGE</strong> est obligatoire. 
          Sur <Link to="/" className="text-primary hover:underline font-medium">Artisans Validés</Link>, nous vérifions 
          les certifications de chaque professionnel inscrit.
        </p>
        <p>
          <Link to="/demande-devis" className="text-primary hover:underline font-medium">Demandez un devis gratuit</Link> dès 
          maintenant et lancez votre projet de rénovation énergétique avec des artisans de confiance !
        </p>
      </article>
    ),
  },
  {
    id: "3",
    slug: "plombier-electricien-maçon-trouver-artisan",
    title: "Plombier, électricien, maçon : comment trouver le bon artisan près de chez vous",
    excerpt: "Fuite d'eau, panne électrique ou travaux de gros œuvre ? Découvrez nos conseils pour trouver rapidement un artisan compétent dans votre ville.",
    author: "L'équipe Artisans Validés",
    date: "10 décembre 2024",
    readTime: "7 min",
    category: "Guide pratique",
    tags: ["plombier", "électricien", "maçon", "artisan local", "dépannage"],
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=400&fit=crop",
    content: (
      <article className="prose prose-lg max-w-none">
        <p className="text-xl text-muted-foreground leading-relaxed">
          Que ce soit pour une urgence comme une <strong>fuite d'eau</strong> ou pour des travaux planifiés, trouver un 
          <strong> artisan compétent</strong> dans sa ville peut s'avérer difficile. Plombier, électricien, maçon, carreleur... 
          Chaque corps de métier a ses spécificités. Voici comment faire le bon choix.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Trouver un plombier de confiance</h2>
        <p>
          Le <strong>plombier</strong> est l'artisan le plus sollicité en cas d'urgence. Fuite d'eau, WC bouché, chauffe-eau 
          en panne... Ces situations nécessitent une intervention rapide d'un professionnel qualifié.
        </p>
        <p>
          Pour trouver un <strong>plombier sérieux</strong>, vérifiez :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Sa carte professionnelle et son numéro SIRET</li>
          <li>Ses <strong>avis clients</strong> sur des plateformes vérifiées</li>
          <li>Ses tarifs affichés (déplacement, main d'œuvre, forfait urgence)</li>
          <li>Sa disponibilité et sa zone d'intervention</li>
        </ul>
        <p>
          <strong>Attention aux arnaques !</strong> Méfiez-vous des plombiers qui refusent de donner un devis ou qui demandent 
          un paiement en espèces. Passez par <Link to="/trouver-artisan" className="text-primary hover:underline font-medium">notre annuaire d'artisans vérifiés</Link> pour 
          éviter les mauvaises surprises.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Choisir un électricien qualifié</h2>
        <p>
          Les travaux d'<strong>électricité</strong> sont particulièrement sensibles car ils touchent à la sécurité de votre 
          logement. Un <strong>électricien qualifié</strong> doit respecter les normes NF C 15-100 et vous délivrer une 
          attestation de conformité.
        </p>
        <p>
          Les signes d'un électricien professionnel :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Formation CAP/BEP ou BTS en électricité</li>
          <li>Certification <strong>Qualifelec</strong> ou équivalent</li>
          <li>Assurance décennale à jour</li>
          <li>Devis détaillé avec plan électrique</li>
        </ul>
        <p>
          Sur Artisans Validés, nos <strong>électriciens vérifiés</strong> ont tous fourni leurs diplômes et attestations 
          d'assurance. <Link to="/demande-devis" className="text-primary hover:underline font-medium">Demandez votre devis gratuit</Link> en 
          quelques clics.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Maçon : les travaux de gros œuvre</h2>
        <p>
          Le <strong>maçon</strong> intervient sur les travaux de structure : construction de murs, fondations, terrasses, 
          ouvertures... Ces travaux nécessitent un savoir-faire technique et une parfaite connaissance des matériaux.
        </p>
        <p>
          Pour des travaux de <strong>maçonnerie</strong> réussis, assurez-vous que votre artisan :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Possède une expérience prouvée (photos de réalisations)</li>
          <li>Maîtrise les différents types de construction (béton, pierre, brique)</li>
          <li>Propose un planning précis des travaux</li>
          <li>Dispose d'une <strong>assurance décennale</strong> (obligatoire pour le gros œuvre)</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Les autres corps de métier essentiels</h2>
        <p>
          Au-delà des trois métiers principaux, de nombreux <strong>artisans spécialisés</strong> peuvent intervenir sur vos projets :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Carreleur</strong> : pose de carrelage, faïence, mosaïque</li>
          <li><strong>Peintre</strong> : peinture intérieure et extérieure, revêtements muraux</li>
          <li><strong>Menuisier</strong> : pose de fenêtres, portes, placards sur mesure</li>
          <li><strong>Couvreur</strong> : réparation et réfection de toiture</li>
          <li><strong>Chauffagiste</strong> : installation et entretien de systèmes de chauffage</li>
        </ul>
        <p>
          Tous ces professionnels sont disponibles sur <Link to="/trouver-artisan" className="text-primary hover:underline font-medium">notre plateforme</Link>, 
          avec des profils vérifiés et des avis clients authentiques.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Pourquoi passer par Artisans Validés ?</h2>
        <p>
          Notre plateforme vous garantit des <strong>artisans de confiance</strong> grâce à notre processus de vérification rigoureux :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Vérification des documents officiels (Kbis, assurances, diplômes)</li>
          <li>Contrôle des avis clients</li>
          <li>Mise en relation gratuite et sans engagement</li>
          <li>Devis comparatifs pour faire le meilleur choix</li>
        </ul>
        <p>
          <Link to="/trouver-artisan" className="text-primary hover:underline font-medium">Trouvez votre artisan</Link> dès 
          maintenant et confiez vos travaux à des professionnels qualifiés près de chez vous !
        </p>
      </article>
    ),
  },
];

export const getArticleBySlug = (slug: string): BlogArticle | undefined => {
  return blogArticles.find((article) => article.slug === slug);
};
