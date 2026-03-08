import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const DoubleCTAFinal = () => (
  <section className="py-14 md:py-20 bg-background">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Particuliers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-primary/20 bg-card p-8 text-center flex flex-col items-center"
        >
          <h3 className="text-xl font-bold text-foreground mb-2">Prêt à lancer vos travaux ?</h3>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Décrivez votre besoin en 2 minutes. Vos coordonnées ne sont jamais partagées sans votre accord.
          </p>
          <Button variant="gold" className="font-bold btn-shine" asChild>
            <Link to="/demande-devis">
              Lancer mon projet
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </motion.div>

        {/* Artisans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-primary/20 bg-card p-8 text-center flex flex-col items-center"
        >
          <h3 className="text-xl font-bold text-foreground mb-2">Artisan ? Votre secteur est peut-être encore libre.</h3>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            2 places max par ville et par métier. Pendant que vous hésitez, un concurrent peut prendre la vôtre.
          </p>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold btn-shine"
            asChild
          >
            <Link to="/devenir-partenaire">
              Vérifier mon secteur
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  </section>
);

export default DoubleCTAFinal;
