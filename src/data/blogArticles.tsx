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
    slug: "renovation-energetique-arnaques-2026",
    title: "Rénovation énergétique : 5 signes qui cachent une arnaque en 2026",
    excerpt: "Ne vous laissez pas piéger par le démarchage abusif. Découvrez comment identifier les faux labels RGE et les offres trop belles pour être vraies.",
    author: "L'équipe Artisans Validés",
    date: "5 février 2026",
    readTime: "9 min",
    category: "Sécurité",
    tags: ["arnaque rénovation", "label RGE", "démarchage abusif", "protection consommateur", "rénovation 2026"],
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=400&fit=crop",
    content: (
      <article className="prose prose-lg max-w-none">
        <p className="text-xl text-muted-foreground leading-relaxed">
          La <strong>rénovation énergétique</strong> attire malheureusement de nombreux escrocs. En 2026, les arnaques se sont 
          sophistiquées. Chaque année, des milliers de Français sont victimes de fraudes liées aux travaux d'isolation, 
          de chauffage ou de panneaux solaires. Voici les <strong>5 signes qui doivent vous alerter</strong>.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">1. Le démarchage téléphonique ou à domicile non sollicité</h2>
        <p>
          Un professionnel sérieux ne vous appellera jamais à froid pour vous proposer une isolation "offerte". 
          Le <strong>démarchage agressif</strong> est le signe n°1 d'une arnaque. Depuis 2023, le démarchage téléphonique 
          pour la rénovation énergétique est d'ailleurs encadré par la loi.
        </p>
        <p>
          <strong>Règle d'or :</strong> Ne donnez jamais suite à un appel non sollicité. C'est vous qui devez initier la 
          démarche en contactant directement des artisans vérifiés.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">2. Le faux label RGE ou la certification expirée</h2>
        <p>
          Certains artisans affichent un <strong>label RGE</strong> qui est en réalité expiré, suspendu ou tout simplement 
          inventé. Sans certification valide au moment de la facturation, vos demandes d'aides seront refusées.
        </p>
        <p>
          <strong>Comment vérifier :</strong> Consultez l'annuaire officiel sur <em>france-renov.gouv.fr</em>. 
          Sur <Link to="/" className="text-primary hover:underline font-medium">Artisans Validés</Link>, nous vérifions 
          manuellement chaque certification avant validation.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">3. L'offre "reste à charge zéro"</h2>
        <p>
          Aucun dispositif légal ne permet un <strong>reste à charge zéro</strong> sur tous les travaux. Si un commercial 
          vous promet que vous n'aurez rien à payer, c'est que le devis est artificiellement gonflé pour absorber les aides, 
          ou que la qualité des travaux sera sacrifiée.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">4. La pression pour signer immédiatement</h2>
        <p>
          "L'offre expire demain", "Il ne reste que 3 places dans votre département"... Ces techniques de 
          <strong> pression commerciale</strong> sont des signaux d'alerte majeurs. Un artisan sérieux vous laissera 
          toujours le temps de la réflexion et de la comparaison.
        </p>
        <p>
          <strong>Rappel légal :</strong> Vous disposez d'un délai de rétractation de 14 jours pour tout contrat 
          signé à domicile ou à distance.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">5. L'absence de visite technique préalable</h2>
        <p>
          Un devis établi sans <strong>visite technique</strong> de votre logement est nécessairement approximatif. 
          Un professionnel compétent doit évaluer l'existant, prendre des mesures et adapter sa proposition à votre situation réelle.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Protégez-vous : choisissez des artisans vérifiés</h2>
        <p>
          La meilleure protection reste de passer par une plateforme qui <strong>vérifie en amont</strong> les certifications, 
          assurances et références de chaque artisan. C'est exactement la mission de 
          <Link to="/" className="text-primary hover:underline font-medium"> Artisans Validés</Link>.
        </p>

        <div className="mt-8 p-6 bg-gold/10 rounded-xl border border-gold/20 text-center">
          <p className="text-lg font-semibold mb-4">Ne prenez aucun risque avec vos travaux</p>
          <Link to="/demande-devis" className="inline-flex items-center gap-2 bg-gold hover:bg-gold-hover text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg">
            Vérifier mon projet
          </Link>
        </div>
      </article>
    ),
  },
  {
    id: "2",
    slug: "maprimenov-cee-changements-2026",
    title: "MaPrimeRénov et CEE : Tout ce qui change pour vos travaux cette année",
    excerpt: "Le guide complet pour comprendre les nouveaux barèmes d'aides et constituer un dossier sans erreur administrative.",
    author: "L'équipe Artisans Validés",
    date: "3 février 2026",
    readTime: "11 min",
    category: "Financement",
    tags: ["MaPrimeRénov", "CEE", "aides rénovation 2026", "barèmes", "dossier administratif"],
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop",
    content: (
      <article className="prose prose-lg max-w-none">
        <p className="text-xl text-muted-foreground leading-relaxed">
          Les dispositifs d'aides à la rénovation énergétique évoluent chaque année. En 2026, de nouveaux barèmes 
          <strong> MaPrimeRénov'</strong> et <strong>CEE</strong> sont entrés en vigueur. Voici tout ce qu'il faut savoir 
          pour constituer un dossier solide et obtenir le maximum d'aides.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Les nouveautés MaPrimeRénov' en 2026</h2>
        <p>
          Le gouvernement a renforcé le dispositif avec plusieurs changements majeurs :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Revalorisation des plafonds</strong> : les montants maximaux ont été augmentés pour les rénovations globales</li>
          <li><strong>Simplification du parcours</strong> : un guichet unique pour toutes les demandes</li>
          <li><strong>Bonus sortie de passoire</strong> : prime supplémentaire pour les logements classés F ou G</li>
          <li><strong>Accompagnement obligatoire</strong> : Mon Accompagnateur Rénov' pour les projets de plus de 5 000€</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">CEE : ce qui change pour les primes énergie</h2>
        <p>
          Les <strong>Certificats d'Économies d'Énergie</strong> restent cumulables avec MaPrimeRénov'. Les principaux changements :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Nouveaux coefficients de calcul pour l'isolation</li>
          <li>Renforcement des contrôles post-travaux</li>
          <li>Délai de dépôt ramené à 4 mois après facturation</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Les 5 erreurs fatales à éviter</h2>
        
        <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Erreur n°1 : Démarrer avant la validation</h3>
        <p>
          Pour MaPrimeRénov', attendez impérativement la notification d'accord. Pour les CEE, inscrivez-vous 
          auprès du fournisseur AVANT de signer le devis.
        </p>

        <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Erreur n°2 : Choisir un artisan non-RGE</h3>
        <p>
          Les deux dispositifs exigent un <strong>artisan certifié RGE</strong>. Vérifiez la validité de la certification 
          sur <Link to="/trouver-artisan" className="text-primary hover:underline font-medium">notre annuaire vérifié</Link>.
        </p>

        <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Erreur n°3 : Un devis incomplet</h3>
        <p>
          Le devis doit mentionner : numéro RGE, performance thermique des matériaux (valeur R, COP...), 
          surfaces exactes et détail main d'œuvre/fournitures.
        </p>

        <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Erreur n°4 : Oublier de cumuler les aides</h3>
        <p>
          MaPrimeRénov' + CEE + éco-PTZ + TVA 5,5% : ces aides sont cumulables. Ne passez pas à côté de milliers d'euros.
        </p>

        <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Erreur n°5 : Dépasser les délais</h3>
        <p>
          Respectez scrupuleusement les délais de dépôt. Tout retard entraîne un refus automatique et définitif.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Faites-vous accompagner par des pros</h2>
        <p>
          Le montage d'un dossier d'aides est complexe. En passant par 
          <Link to="/" className="text-primary hover:underline font-medium"> Artisans Validés</Link>, vous accédez à des 
          artisans qui maîtrisent les procédures et vous guident à chaque étape.
        </p>

        <div className="mt-8 p-6 bg-gold/10 rounded-xl border border-gold/20 text-center">
          <p className="text-lg font-semibold mb-4">Obtenez vos aides sans stress</p>
          <Link to="/demande-devis" className="inline-flex items-center gap-2 bg-gold hover:bg-gold-hover text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg">
            Vérifier mon projet
          </Link>
        </div>
      </article>
    ),
  },
  {
    id: "3",
    slug: "assurance-decennale-seule-vraie-garantie",
    title: "Assurance décennale : Pourquoi c'est votre seule vraie garantie",
    excerpt: "Un artisan sans assurance valide est un risque majeur. Voici comment nous vérifions chaque document pour vous protéger.",
    author: "L'équipe Artisans Validés",
    date: "1 février 2026",
    readTime: "8 min",
    category: "Guide pratique",
    tags: ["assurance décennale", "garantie", "protection client", "malfaçon", "vérification artisan"],
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop",
    content: (
      <article className="prose prose-lg max-w-none">
        <p className="text-xl text-muted-foreground leading-relaxed">
          L'<strong>assurance décennale</strong> n'est pas une option : c'est une obligation légale et votre unique 
          protection réelle en cas de malfaçon grave. Un artisan sans assurance valide représente un risque 
          financier et juridique majeur. Voici pourquoi nous en faisons un critère non négociable.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Ce que couvre la garantie décennale</h2>
        <p>
          La <strong>garantie décennale</strong> (loi Spinetta, 1978) protège le maître d'ouvrage pendant 
          <strong> 10 ans</strong> contre les dommages qui compromettent la solidité du bâtiment ou le rendent 
          impropre à sa destination :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Fissures structurelles des murs ou fondations</li>
          <li>Problèmes d'étanchéité de la toiture</li>
          <li>Défaillance du chauffage rendant le logement inhabitable</li>
          <li>Affaissement de plancher ou de terrasse</li>
          <li>Infiltrations par les menuiseries extérieures</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Sans décennale : le scénario catastrophe</h2>
        <p>
          Si votre artisan n'a pas d'assurance décennale valide, vous devrez le poursuivre personnellement en justice. 
          Les procédures durent 2 à 5 ans, coûtent plusieurs milliers d'euros, et l'issue est incertaine.
        </p>
        <p>
          <strong>Le chiffre qui fait réfléchir :</strong> 30% des entreprises du bâtiment de moins de 5 salariés 
          disparaissent dans les 5 premières années. Sans décennale, votre recours disparaît avec elles.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Notre processus de vérification</h2>
        <p>
          Chez <Link to="/" className="text-primary hover:underline font-medium">Artisans Validés</Link>, chaque 
          artisan doit fournir son attestation d'assurance décennale en cours de validité. Notre équipe vérifie :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Validité</strong> : dates d'effet et d'expiration contrôlées</li>
          <li><strong>Cohérence</strong> : l'activité déclarée correspond aux travaux proposés</li>
          <li><strong>Authenticité</strong> : vérification auprès de l'assureur si nécessaire</li>
          <li><strong>Renouvellement</strong> : suivi annuel de chaque attestation</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Les autres garanties vérifiées</h2>
        <p>
          Au-delà de la décennale, nous contrôlons aussi :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Responsabilité civile professionnelle</strong> : dommages aux tiers pendant le chantier</li>
          <li><strong>Garantie de parfait achèvement</strong> : 1 an pour signaler tout défaut</li>
          <li><strong>Garantie biennale</strong> : 2 ans sur les équipements dissociables</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Votre tranquillité, notre engagement</h2>
        <p>
          En choisissant un artisan sur notre plateforme, vous avez la certitude que toutes les garanties légales 
          sont en place. Zéro mauvaise surprise, zéro zone grise : uniquement des 
          <strong> professionnels correctement assurés et vérifiés</strong>.
        </p>

        <div className="mt-8 p-6 bg-gold/10 rounded-xl border border-gold/20 text-center">
          <p className="text-lg font-semibold mb-4">Protégez-vous avec des artisans assurés</p>
          <Link to="/demande-devis" className="inline-flex items-center gap-2 bg-gold hover:bg-gold-hover text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg">
            Vérifier mon projet
          </Link>
        </div>
      </article>
    ),
  },
];

export const getArticleBySlug = (slug: string): BlogArticle | undefined => {
  return blogArticles.find((article) => article.slug === slug);
};
