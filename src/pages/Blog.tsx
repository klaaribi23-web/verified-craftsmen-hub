import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { blogArticles } from "@/data/blogArticles";
import { Helmet } from "react-helmet-async";

const Blog = () => {
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Blog Artisans Validés",
    "description": "Conseils, guides et actualités sur les artisans du bâtiment, la rénovation et les travaux maison",
    "url": "https://artisansvalides.fr/blog",
    "publisher": {
      "@type": "Organization",
      "name": "Artisans Validés",
      "logo": {
        "@type": "ImageObject",
        "url": "https://artisansvalides.fr/favicon.png"
      }
    },
    "blogPost": blogArticles.map((article) => ({
      "@type": "BlogPosting",
      "headline": article.title,
      "description": article.excerpt,
      "url": `https://artisansvalides.fr/blog/${article.slug}`,
      "image": article.image,
      "datePublished": article.date,
      "author": {
        "@type": "Organization",
        "name": article.author
      }
    }))
  };

  return (
    <>
      <SEOHead
        title="Blog - Conseils travaux et rénovation"
        description="Découvrez nos articles et conseils sur les artisans du bâtiment, la rénovation énergétique, les aides financières et les bonnes pratiques pour vos travaux maison."
        canonical="https://artisansvalides.fr/blog"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(blogSchema)}
        </script>
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="pt-16 lg:pt-20">
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-primary/10 via-background to-gold/10 py-16 lg:py-24">
            <div className="container mx-auto px-4 text-center">
              <Badge variant="secondary" className="mb-4">Blog</Badge>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-6">
                Conseils travaux & rénovation
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
                Guides pratiques, aides financières, astuces pour choisir vos artisans... 
                Retrouvez tous nos conseils pour réussir vos projets de travaux.
              </p>
            </div>
          </section>

          {/* Articles Grid */}
          <section className="py-16 lg:py-24">
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogArticles.map((article) => (
                  <article key={article.id}>
                    <Card className="group h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300">
                      <Link to={`/blog/${article.slug}`} className="flex flex-col h-full">
                        <div className="relative h-52 overflow-hidden">
                          <img
                            src={article.image}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-primary text-primary-foreground">{article.category}</Badge>
                          </div>
                        </div>
                        <CardContent className="p-6 flex flex-col flex-1">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <time dateTime={article.date}>{article.date}</time>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {article.readTime}
                            </span>
                          </div>
                          <h2 className="text-xl font-bold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                            {article.title}
                          </h2>
                          <p className="text-muted-foreground line-clamp-3 mb-4 flex-1">
                            {article.excerpt}
                          </p>
                          <div className="flex items-center text-primary font-medium mt-auto">
                            Lire l'article
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-background to-gold/5">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Prêt à lancer vos travaux ?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Trouvez des artisans qualifiés et vérifiés près de chez vous. 
                Demandez des devis gratuits et comparez les offres.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="gold" size="lg">
                  <Link to="/demande-devis">Demander un devis gratuit</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/trouver-artisan">Parcourir les artisans</Link>
                </Button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Blog;
