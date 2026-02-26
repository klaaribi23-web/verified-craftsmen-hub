import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const DoubleCTAFinal = () => (
  <section className="py-20 md:py-28 bg-background">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Particuliers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-primary/20 bg-card p-8 text-center flex flex-col items-center"
        >
          <h3 className="text-xl font-bold text-foreground mb-2">Vous avez un projet ?</h3>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Déposez votre projet gratuitement. Vos coordonnées restent privées jusqu'à ce que vous décidiez.
          </p>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold btn-shine" asChild>
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
          <h3 className="text-xl font-bold text-foreground mb-2">Vous êtes artisan ?</h3>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Vérifiez si votre secteur est encore disponible. Places limitées.
          </p>
          <Button
            variant="outline"
            className="border-2 border-primary/30 text-primary hover:bg-primary/10 font-bold"
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
