import { useParams, Link, Navigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Tag, ArrowLeft } from "lucide-react";
import { blogArticles, getArticleBySlug } from "@/data/blogArticles";
import { Helmet } from "react-helmet-async";

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : undefined;

  if (!article) {
    return <Navigate to="/blog" replace />;
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.excerpt,
    "image": article.image,
    "author": {
      "@type": "Organization",
      "name": article.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Artisans Validés",
      "logo": {
        "@type": "ImageObject",
        "url": "https://artisansvalides.fr/favicon.png"
      }
    },
    "datePublished": article.date,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://artisansvalides.fr/blog/${article.slug}`
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Accueil",
        "item": "https://artisansvalides.fr"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://artisansvalides.fr/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": article.title,
        "item": `https://artisansvalides.fr/blog/${article.slug}`
      }
    ]
  };

  const relatedArticles = blogArticles.filter((a) => a.id !== article.id).slice(0, 2);

  return (
    <>
      <SEOHead
        title={article.title}
        description={article.excerpt}
        canonical={`https://artisansvalides.fr/blog/${article.slug}`}
        ogType="article"
        ogImage={article.image}
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="pt-20 lg:pt-24">
          {/* Article Header */}
          <div className="relative h-[40vh] min-h-[300px] lg:h-[50vh] overflow-hidden">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-12">
              <div className="container mx-auto">
                {/* Breadcrumb */}
                <nav className="mb-4" aria-label="Fil d'Ariane">
                  <ol className="flex items-center gap-2 text-sm text-white/70">
                    <li>
                      <Link to="/" className="hover:text-white transition-colors">Accueil</Link>
                    </li>
                    <li>/</li>
                    <li>
                      <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
                    </li>
                    <li>/</li>
                    <li className="text-white truncate max-w-[200px]">{article.title}</li>
                  </ol>
                </nav>
                
                <Badge className="bg-primary text-primary-foreground mb-4">{article.category}</Badge>
                <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white max-w-4xl leading-tight">
                  {article.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-4 text-white/80 text-sm">
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    {article.author}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <time dateTime={article.date}>{article.date}</time>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {article.readTime} de lecture
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <div className="container mx-auto px-4 py-12 lg:py-16">
            <div className="max-w-3xl mx-auto">
              {/* Back link */}
              <Link 
                to="/blog" 
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour au blog
              </Link>

              {/* Article body */}
              {article.content}

              {/* Tags */}
              <div className="mt-12 pt-8 border-t border-border">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground mr-2">Mots-clés :</span>
                  {article.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <Card className="mt-12 bg-gradient-to-br from-primary/10 via-primary/5 to-gold/10 border-primary/20">
                <CardContent className="p-6 lg:p-8 text-center">
                  <h2 className="text-2xl font-bold mb-4">Besoin d'un artisan qualifié ?</h2>
                  <p className="text-muted-foreground mb-6">
                    Trouvez des professionnels vérifiés près de chez vous et recevez des devis gratuits
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild variant="gold" size="lg">
                      <Link to="/demande-devis">Demander un devis gratuit</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link to="/trouver-artisan">Trouver un artisan</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <section className="mt-16">
                  <h2 className="text-2xl font-bold mb-6">Articles similaires</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {relatedArticles.map((relatedArticle) => (
                      <Card
                        key={relatedArticle.id}
                        className="group overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <Link to={`/blog/${relatedArticle.slug}`}>
                          <img
                            src={relatedArticle.image}
                            alt={relatedArticle.title}
                            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <CardContent className="p-4">
                            <Badge variant="secondary" className="mb-2">{relatedArticle.category}</Badge>
                            <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                              {relatedArticle.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {relatedArticle.excerpt}
                            </p>
                          </CardContent>
                        </Link>
                      </Card>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default BlogArticle;
