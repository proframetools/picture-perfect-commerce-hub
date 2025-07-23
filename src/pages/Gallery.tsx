import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Heart, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import QuickOrderModal from "@/components/QuickOrderModal";

interface GalleryItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  frame_style: string;
  material: string;
  customer_name?: string;
  rating?: number;
  product_id?: string;
}

interface Product {
  id: string;
  name: string;
  base_price: number;
}

const Gallery = () => {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [quickOrderProduct, setQuickOrderProduct] = useState<Product | null>(null);

  const filters = [
    { id: "all", name: "All Styles" },
    { id: "wood", name: "Wood Frames" },
    { id: "metal", name: "Metal Frames" },
    { id: "ornate", name: "Ornate Frames" },
    { id: "modern", name: "Modern Frames" },
  ];

  useEffect(() => {
    fetchGalleryData();
  }, []);

  const fetchGalleryData = async () => {
    try {
      // Fetch products for quick order functionality
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, base_price')
        .limit(6);

      setProducts(productsData || []);

      // Mock gallery data (in real app, this would come from database)
      const mockGalleryItems: GalleryItem[] = [
        {
          id: "1",
          title: "Family Portrait in Classic Wood",
          description: "Beautiful family portrait in our signature oak frame with cream matting",
          image_url: "/placeholder.svg",
          frame_style: "Classic Wood",
          material: "Oak",
          customer_name: "Sarah M.",
          rating: 5,
          product_id: productsData?.[0]?.id
        },
        {
          id: "2", 
          title: "Wedding Photo in Elegant Silver",
          description: "Stunning wedding photo showcased in our premium silver metal frame",
          image_url: "/placeholder.svg",
          frame_style: "Metal Frame",
          material: "Silver",
          customer_name: "Michael & Lisa",
          rating: 5,
          product_id: productsData?.[1]?.id
        },
        {
          id: "3",
          title: "Baby's First Portrait",
          description: "Precious first portrait in a soft white wooden frame with double matting",
          image_url: "/placeholder.svg", 
          frame_style: "Modern White",
          material: "Pine",
          customer_name: "Jennifer K.",
          rating: 5,
          product_id: productsData?.[2]?.id
        },
        {
          id: "4",
          title: "Landscape Photography",
          description: "Breathtaking landscape in a rustic barnwood frame",
          image_url: "/placeholder.svg",
          frame_style: "Rustic Wood", 
          material: "Barnwood",
          customer_name: "David L.",
          rating: 4,
          product_id: productsData?.[3]?.id
        },
        {
          id: "5",
          title: "Graduate Photo Collection",
          description: "Graduation memories preserved in matching black metal frames",
          image_url: "/placeholder.svg",
          frame_style: "Modern Metal",
          material: "Black Metal",
          customer_name: "The Johnson Family",
          rating: 5,
          product_id: productsData?.[4]?.id
        },
        {
          id: "6",
          title: "Pet Portrait in Ornate Gold",
          description: "Beloved family pet captured in an elegant ornate gold frame",
          image_url: "/placeholder.svg",
          frame_style: "Ornate Gold",
          material: "Gold Leaf",
          customer_name: "Emma R.",
          rating: 5,
          product_id: productsData?.[5]?.id
        }
      ];

      setGalleryItems(mockGalleryItems);
    } catch (error) {
      console.error("Error fetching gallery data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = galleryItems.filter(item => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "wood") return item.material.toLowerCase().includes("wood") || item.material.toLowerCase().includes("oak") || item.material.toLowerCase().includes("pine") || item.material.toLowerCase().includes("barnwood");
    if (selectedFilter === "metal") return item.material.toLowerCase().includes("metal") || item.material.toLowerCase().includes("silver");
    if (selectedFilter === "ornate") return item.frame_style.toLowerCase().includes("ornate") || item.material.toLowerCase().includes("gold");
    if (selectedFilter === "modern") return item.frame_style.toLowerCase().includes("modern");
    return true;
  });

  const handleTryThisStyle = (item: GalleryItem) => {
    const product = products.find(p => p.id === item.product_id);
    if (product) {
      setQuickOrderProduct(product);
    }
  };

  const handleAddToCart = (combination: any) => {
    console.log("Adding to cart:", combination);
    // TODO: Implement actual cart functionality
    setQuickOrderProduct(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-6 py-12">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-48 mx-auto mb-4"></div>
              <div className="h-4 bg-muted rounded w-96 mx-auto"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Customer Gallery
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how our customers have transformed their precious memories into stunning wall art
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {filters.map((filter) => (
            <Button
              key={filter.id}
              variant={selectedFilter === filter.id ? "default" : "outline"}
              onClick={() => setSelectedFilter(filter.id)}
              className="rounded-full"
            >
              {filter.name}
            </Button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden group hover:shadow-hover transition-all duration-300">
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleTryThisStyle(item)}
                  >
                    Try This Style
                  </Button>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">{item.frame_style}</Badge>
                  {item.rating && (
                    <div className="flex items-center gap-1">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                      ))}
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-3">
                  {item.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Material: {item.material}
                  </span>
                  {item.customer_name && (
                    <span className="text-sm text-muted-foreground">
                      - {item.customer_name}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center bg-muted/30 rounded-lg p-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Create Your Own?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Start customizing your perfect frame today and join our gallery of satisfied customers
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button variant="default" size="lg">
                Browse Frames
              </Button>
            </Link>
            <Link to="/#products">
              <Button variant="outline" size="lg">
                Start Customizing
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />

      {/* Quick Order Modal */}
      {quickOrderProduct && (
        <QuickOrderModal
          isOpen={true}
          onClose={() => setQuickOrderProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
};

export default Gallery;