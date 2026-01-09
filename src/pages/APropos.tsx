import { motion } from 'framer-motion';
import { Heart, Shield, Users, Star, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/seo/SEOHead';
import heroCraftsman from '@/assets/about/hero-craftsman.jpg';
import homeTrust from '@/assets/about/home-trust.jpg';
import artisanPortrait from '@/assets/about/artisan-portrait.jpg';
import handshakeTrust from '@/assets/about/handshake-trust.jpg';
import platformBrowse from '@/assets/about/platform-browse.jpg';
const fadeInUp = {
  hidden: {
    opacity: 0,
    y: 30
  },
  visible: {
    opacity: 1,
    y: 0
  }
};
const staggerContainer = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};
const APropos = () => {
  return <>
      <SEOHead title="À Propos" description="Artisans Validés : là où la confiance reprend sa place. Découvrez notre vision d'un bâtiment plus respecté et d'une relation plus saine entre artisans et particuliers." canonical="https://artisansvalides.fr/a-propos" />
      
      <Navbar />
      
      <main className="min-h-screen pt-12 lg:pt-0">
        {/* Hero Section */}
        <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroCraftsman} alt="Artisan au travail" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/70 to-navy/50" />
          </div>
          
          <motion.div className="relative z-10 text-center px-4 max-w-4xl mx-auto" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.span variants={fadeInUp} className="inline-block px-4 py-2 bg-gold/20 text-gold rounded-full text-sm font-medium mb-6">
              Notre Histoire
            </motion.span>
            <motion.h1 variants={fadeInUp} className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Artisans Validés
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-gold font-medium italic">
              Là où la confiance reprend sa place
            </motion.p>
          </motion.div>
        </section>

        {/* Introduction Section */}
        <section className="py-20 bg-background md:py-[50px]">
          <div className="container mx-auto px-4">
            <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" whileInView="visible" viewport={{
            once: true,
            margin: "-100px"
          }} variants={staggerContainer}>
              <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-foreground leading-relaxed mb-8">
                Confier sa maison à quelqu'un,
                <br />
                <span className="text-muted-foreground">ce n'est jamais un simple devis.</span>
              </motion.p>
              
              <motion.div variants={fadeInUp} className="space-y-3 text-lg text-muted-foreground">
                <p>C'est une <span className="text-gold font-semibold">confiance donnée</span>.</p>
                <p>C'est une <span className="text-gold font-semibold">clé remise</span>.</p>
                <p>C'est un <span className="text-gold font-semibold">quotidien</span> que l'on met entre des mains.</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-20 bg-muted/30 mx-0 md:py-[50px] my-0">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <motion.div initial="hidden" whileInView="visible" viewport={{
              once: true,
              margin: "-100px"
            }} variants={staggerContainer}>
                <motion.p variants={fadeInUp} className="text-lg text-muted-foreground mb-8">
                  Et pourtant, trop souvent, cette confiance est abîmée.
                </motion.p>
                
                <motion.ul variants={fadeInUp} className="space-y-4 text-foreground">
                  {["Plateformes impersonnelles", "Coordonnées vendues à la chaîne", "Appels incessants", "Artisans mis en concurrence sans respect de leur métier", "Particuliers déçus, méfiants, fatigués"].map((item, index) => <li key={index} className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                      <span>{item}</span>
                    </li>)}
                </motion.ul>
                
                <motion.p variants={fadeInUp} className="mt-10 text-2xl md:text-3xl font-bold text-primary">
                  Nous avons dit stop.
                </motion.p>
              </motion.div>
              
              <motion.div initial={{
              opacity: 0,
              scale: 0.95
            }} whileInView={{
              opacity: 1,
              scale: 1
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.6
            }} className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-gold/20 to-primary/20 rounded-2xl blur-xl" />
                <img src={homeTrust} alt="Intérieur de maison chaleureux" className="relative rounded-2xl shadow-2xl w-full" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-20 md:py-28 bg-navy text-white">
          <div className="container mx-auto px-4">
            <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{
            once: true
          }} variants={staggerContainer}>
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
                Une autre vision du bâtiment
              </motion.h2>
              <motion.div variants={fadeInUp} className="w-20 h-1 bg-gold mx-auto" />
            </motion.div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div initial={{
              opacity: 0,
              x: -30
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.6
            }}>
                <p className="text-lg text-white/80 mb-8">
                  Artisans Validés est né d'un choix simple mais radical :
                  <br />
                  <span className="text-gold font-semibold text-xl">remettre de l'humain là où il a disparu.</span>
                </p>
                
                <div className="space-y-4 text-white/70 mb-10">
                  <p>Ici, le volume ne guide pas nos décisions.</p>
                  <p>Nous ne poussons pas à appeler n'importe qui.</p>
                  <p>Nous ne transformons pas un métier en marchandise.</p>
                </div>
                
                <div className="space-y-4">
                  {[{
                  icon: Heart,
                  text: "La confiance avant la quantité"
                }, {
                  icon: Star,
                  text: "Le savoir-faire avant les promesses"
                }, {
                  icon: Shield,
                  text: "Le respect avant la pression"
                }].map(({
                  icon: Icon,
                  text
                }, index) => <motion.div key={index} initial={{
                  opacity: 0,
                  x: -20
                }} whileInView={{
                  opacity: 1,
                  x: 0
                }} viewport={{
                  once: true
                }} transition={{
                  delay: index * 0.1
                }} className="flex items-center gap-4 bg-white/5 p-4 rounded-xl">
                      <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-gold" />
                      </div>
                      <span className="text-lg font-medium text-white">{text}</span>
                    </motion.div>)}
                </div>
              </motion.div>
              
              <motion.div initial={{
              opacity: 0,
              x: 30
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.6
            }} className="relative">
                <div className="absolute -inset-4 bg-gold/10 rounded-2xl blur-2xl" />
                <img src={handshakeTrust} alt="Poignée de main entre client et artisan" className="relative rounded-2xl shadow-2xl w-full" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* For Clients Section */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <motion.div initial={{
              opacity: 0,
              scale: 0.95
            }} whileInView={{
              opacity: 1,
              scale: 1
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.6
            }} className="order-2 lg:order-1">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-gold/20 rounded-2xl blur-xl" />
                  <img src={platformBrowse} alt="Navigation sur la plateforme" className="relative rounded-2xl shadow-2xl w-full" />
                </div>
              </motion.div>
              
              <motion.div className="order-1 lg:order-2" initial="hidden" whileInView="visible" viewport={{
              once: true
            }} variants={staggerContainer}>
                <motion.span variants={fadeInUp} className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                  Pour les particuliers
                </motion.span>
                
                <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Votre maison n'est pas un chantier comme les autres
                </motion.h2>
                
                <motion.p variants={fadeInUp} className="text-lg text-muted-foreground mb-8">
                  C'est votre refuge. Votre histoire. Votre investissement.
                </motion.p>
                
                <motion.div variants={fadeInUp} className="space-y-4 mb-8">
                  {["Vous prenez le temps de choisir", "Vous consultez des profils complets", "Vous découvrez des réalisations concrètes", "Vous lisez des avis transparents", "Vous décidez librement qui contacter, et quand"].map((item, index) => <div key={index} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </div>)}
                </motion.div>
                
                <motion.div variants={fadeInUp} className="bg-muted/50 p-6 rounded-xl border border-border">
                  <p className="text-muted-foreground italic">
                    Sans harcèlement. Sans urgence artificielle. Sans mauvaise surprise.
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* For Artisans Section */}
        <section className="py-20 md:py-28 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <motion.div initial="hidden" whileInView="visible" viewport={{
              once: true
            }} variants={staggerContainer}>
                <motion.span variants={fadeInUp} className="inline-block px-4 py-2 bg-gold/10 text-gold rounded-full text-sm font-medium mb-4">
                  Pour les artisans
                </motion.span>
                
                <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Votre métier mérite mieux
                </motion.h2>
                
                <motion.p variants={fadeInUp} className="text-lg text-muted-foreground mb-8">
                  Qu'un simple numéro de téléphone vendu au plus offrant.
                </motion.p>
                
                <motion.div variants={fadeInUp} className="space-y-4 text-foreground mb-8">
                  <p>Vous avez appris sur le terrain.</p>
                  <p>Vous avez fait vos preuves, chantier après chantier.</p>
                  <p>Vous avez bâti votre réputation par le travail bien fait.</p>
                </motion.div>
                
                <motion.div variants={fadeInUp} className="bg-gradient-to-r from-gold/10 to-primary/10 p-6 rounded-xl border border-gold/20">
                  <p className="text-foreground mb-4">
                    <span className="font-semibold">Artisans Validés</span> vous offre une vitrine à la hauteur de votre savoir-faire.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Vous pouvez créer votre fiche vous-même, ou nous confier le soin de raconter votre histoire, votre expertise, vos valeurs.
                  </p>
                </motion.div>
                
                <motion.p variants={fadeInUp} className="mt-8 text-lg text-gold font-medium">
                  Ici, ce sont les clients qui viennent à vous.
                  <br />
                  Parce qu'ils vous ont choisis. Parce qu'ils vous font confiance.
                </motion.p>
              </motion.div>
              
              <motion.div initial={{
              opacity: 0,
              scale: 0.95
            }} whileInView={{
              opacity: 1,
              scale: 1
            }} viewport={{
              once: true
            }} transition={{
              duration: 0.6
            }}>
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-bl from-gold/20 to-primary/20 rounded-2xl blur-xl" />
                  <img src={artisanPortrait} alt="Portrait d'un artisan professionnel" className="relative rounded-2xl shadow-2xl w-full" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Commitment Section */}
        <section className="py-20 md:py-28 bg-navy text-white overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{
            once: true
          }} variants={staggerContainer}>
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
                Notre engagement
              </motion.h2>
              <motion.div variants={fadeInUp} className="w-20 h-1 bg-gold mx-auto" />
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {[{
              title: "Pas de commissions",
              desc: "Vos échanges restent les vôtres"
            }, {
              title: "Pas de promesses floues",
              desc: "Clarté et transparence"
            }, {
              title: "Pas de fausses urgences",
              desc: "Prenez le temps de décider"
            }].map((item, index) => <motion.div key={index} initial={{
              opacity: 0,
              y: 30
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.1
            }} className="text-center p-8 bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-gold" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-white/60">{item.desc}</p>
                </motion.div>)}
            </div>
            
            <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" whileInView="visible" viewport={{
            once: true
          }} variants={staggerContainer}>
              <motion.p variants={fadeInUp} className="text-lg text-white/80 mb-4">
                Seulement :
              </motion.p>
              <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4 mb-12">
                {["des projets sérieux", "des professionnels engagés", "une plateforme claire, transparente et humaine"].map((item, index) => <span key={index} className="px-4 py-2 bg-gold/20 text-gold rounded-full text-sm font-medium">
                    {item}
                  </span>)}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Final Message Section */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-4">
            <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" whileInView="visible" viewport={{
            once: true
          }} variants={staggerContainer}>
              <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-foreground mb-8">
                Artisans Validés n'est pas une plateforme de plus.
                <br />
                <span className="text-gold font-bold">C'est une vision.</span>
              </motion.p>
              
              <motion.div variants={fadeInUp} className="space-y-3 text-lg text-muted-foreground mb-12">
                <p>Celle d'un bâtiment plus respecté.</p>
                <p>D'un choix plus éclairé.</p>
                <p>D'une relation plus saine entre ceux qui construisent</p>
                <p>et ceux qui font construire.</p>
              </motion.div>
              
              <motion.div variants={fadeInUp} className="bg-gradient-to-r from-navy to-primary p-8 md:p-12 rounded-2xl text-white mb-12">
                <p className="text-xl md:text-2xl font-medium mb-2">
                  Nous ne voulons pas être les plus gros.
                </p>
                <p className="text-2xl md:text-3xl font-bold text-gold">
                  Nous voulons être les plus justes.
                </p>
              </motion.div>
              
              <motion.div variants={fadeInUp}>
                <p className="text-2xl md:text-3xl font-bold text-foreground mb-8">
                  Artisans Validés
                  <br />
                  <span className="text-gold">Le choix éclairé pour vos travaux</span>
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" variant="gold" className="text-lg">
                    <Link to="/trouver-artisan">
                      Trouver un artisan
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-lg">
                    <Link to="/devenir-artisan">
                      Devenir artisan partenaire
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>;
};
export default APropos;