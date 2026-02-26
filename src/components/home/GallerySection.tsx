import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Camera, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const GallerySection = () => {
  const { data: portfolioImages, isLoading } = useQuery({
    queryKey: ["homepage-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_artisans")
        .select("id, business_name, portfolio_images, slug, city")
        .eq("status", "active")
        .not("portfolio_images", "is", null)
        .limit(12);

      if (error) throw error;

      // Flatten and get unique images with artisan info
      const images: { url: string; artisanName: string; slug: string; city: string }[] = [];
      data?.forEach((artisan) => {
        if (artisan.portfolio_images && Array.isArray(artisan.portfolio_images)) {
          artisan.portfolio_images.slice(0, 2).forEach((img) => {
            if (img && images.length < 8) {
              images.push({
                url: img,
                artisanName: artisan.business_name || "Artisan",
                slug: artisan.slug || artisan.id || "",
                city: artisan.city || "France",
              });
            }
          });
        }
      });
      return images;
    },
  });

  const defaultImages = [
    "/favicon.png",
    "/favicon.png",
    "/favicon.png",
    "/favicon.png",
    "/favicon.png",
    "/favicon.png",
  ];

  const displayImages = portfolioImages && portfolioImages.length > 0 
    ? portfolioImages 
    : defaultImages.map((url, i) => ({ 
        url, 
        artisanName: "Artisan", 
        slug: "", 
        city: "France" 
      }));

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <Camera className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Réalisations</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Découvrez leurs réalisations
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Parcourez les travaux de nos artisans vérifiés et laissez-vous inspirer par leur savoir-faire
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {displayImages.slice(0, 8).map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              viewport={{ once: true }}
              className={`relative group overflow-hidden rounded-xl ${
                index === 0 || index === 5 ? "md:col-span-2 md:row-span-2" : ""
              }`}
            >
              <div className={`aspect-square ${index === 0 || index === 5 ? "md:aspect-[4/3]" : ""}`}>
                <img
                  src={image.url}
                  alt={`Réalisation de ${image.artisanName}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = "/favicon.png";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {image.slug && (
                  <Link
                    to={`/artisan/${image.slug}`}
                    className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <p className="text-white font-semibold text-sm md:text-base truncate">
                      {image.artisanName}
                    </p>
                    <p className="text-white/80 text-xs md:text-sm">{image.city}</p>
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Button asChild size="lg" variant="outline" className="group">
            <Link to="/trouver-artisan">
              Voir tous les artisans
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default GallerySection;
