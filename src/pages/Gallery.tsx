import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, Heart, ShoppingCart, Search, ZoomIn, Share2, X } from "lucide-react";
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
  occasion?: string;
  room_type?: string;
  price_range?: string;
  testimonial?: string;
  size?: string;
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
  const [occasionFilter, setOccasionFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [quickOrderProduct, setQuickOrderProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const filters = [
    { id: "all", name: "All Styles" },
    { id: "wood", name: "Wood Frames" },
    { id: "metal", name: "Metal Frames" },
    { id: "ornate", name: "Ornate Frames" },
    { id: "modern", name: "Modern Frames" },
  ];

  const occasionFilters = [
    { id: "all", name: "All Occasions" },
    { id: "wedding", name: "Wedding" },
    { id: "family", name: "Family" },
    { id: "baby", name: "Baby" },
    { id: "graduation", name: "Graduation" },
    { id: "pet", name: "Pet" },
  ];

  const roomFilters = [
    { id: "all", name: "All Rooms" },
    { id: "living", name: "Living Room" },
    { id: "bedroom", name: "Bedroom" },
    { id: "office", name: "Office" },
    { id: "nursery", name: "Nursery" },
    { id: "hallway", name: "Hallway" },
  ];

  const priceFilters = [
    { id: "all", name: "All Prices" },
    { id: "under50", name: "Under $50" },
    { id: "50to100", name: "$50-$100" },
    { id: "100to200", name: "$100-$200" },
    { id: "over200", name: "Over $200" },
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
          product_id: productsData?.[0]?.id,
          occasion: "family",
          room_type: "living",
          price_range: "50to100",
          testimonial: "Absolutely love how this turned out! The quality is incredible and it looks perfect in our living room.",
          size: "16x20"
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
          product_id: productsData?.[1]?.id,
          occasion: "wedding",
          room_type: "bedroom",
          price_range: "100to200",
          testimonial: "Perfect for our special day memories. The silver frame matches our decor beautifully.",
          size: "24x36"
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
          product_id: productsData?.[2]?.id,
          occasion: "baby",
          room_type: "nursery",
          price_range: "under50",
          testimonial: "So sweet and gentle - perfect for our little one's nursery!",
          size: "11x14"
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
          product_id: productsData?.[3]?.id,
          occasion: "art",
          room_type: "office",
          price_range: "100to200",
          testimonial: "The rustic frame really brings out the natural beauty of the landscape.",
          size: "20x30"
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
          product_id: productsData?.[4]?.id,
          occasion: "graduation",
          room_type: "hallway",
          price_range: "50to100",
          testimonial: "Great way to display our daughter's achievement. The matching frames look so professional.",
          size: "8x10"
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
          product_id: productsData?.[5]?.id,
          occasion: "pet",
          room_type: "living",
          price_range: "over200",
          testimonial: "This ornate frame gives our pet portrait such an elegant, regal look. Worth every penny!",
          size: "16x20"
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
    // Style filter
    if (selectedFilter !== "all") {
      if (selectedFilter === "wood" && !(item.material.toLowerCase().includes("wood") || item.material.toLowerCase().includes("oak") || item.material.toLowerCase().includes("pine") || item.material.toLowerCase().includes("barnwood"))) return false;
      if (selectedFilter === "metal" && !(item.material.toLowerCase().includes("metal") || item.material.toLowerCase().includes("silver"))) return false;
      if (selectedFilter === "ornate" && !(item.frame_style.toLowerCase().includes("ornate") || item.material.toLowerCase().includes("gold"))) return false;
      if (selectedFilter === "modern" && !item.frame_style.toLowerCase().includes("modern")) return false;
    }
    
    // Occasion filter
    if (occasionFilter !== "all" && item.occasion !== occasionFilter) return false;
    
    // Room filter
    if (roomFilter !== "all" && item.room_type !== roomFilter) return false;
    
    // Price filter
    if (priceFilter !== "all" && item.price_range !== priceFilter) return false;
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(query) || 
             item.description.toLowerCase().includes(query) ||
             item.frame_style.toLowerCase().includes(query) ||
             item.material.toLowerCase().includes(query) ||
             (item.customer_name && item.customer_name.toLowerCase().includes(query));
    }
    
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

  const handleToggleFavorite = (itemId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(itemId)) {
      newFavorites.delete(itemId);
    } else {
      newFavorites.add(itemId);
    }
    setFavorites(newFavorites);
  };

  const handleShare = (item: GalleryItem) => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.description,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`Check out this beautiful frame: ${item.title} - ${window.location.href}`);
      // You could show a toast here
    }
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

        {/* Search and Filters */}
        <div className="mb-8 space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search gallery..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap justify-center gap-4">
            <Select value={occasionFilter} onValueChange={setOccasionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Occasion" />
              </SelectTrigger>
              <SelectContent>
                {occasionFilters.map((filter) => (
                  <SelectItem key={filter.id} value={filter.id}>
                    {filter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={roomFilter} onValueChange={setRoomFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Room" />
              </SelectTrigger>
              <SelectContent>
                {roomFilters.map((filter) => (
                  <SelectItem key={filter.id} value={filter.id}>
                    {filter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                {priceFilters.map((filter) => (
                  <SelectItem key={filter.id} value={filter.id}>
                    {filter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Style Filter Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
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
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden group hover:shadow-hover transition-all duration-300">
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onClick={() => setSelectedImage(item)}
                />
                
                {/* Action Buttons Overlay */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => setSelectedImage(item)}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => handleToggleFavorite(item.id)}
                  >
                    <Heart className={`h-4 w-4 ${favorites.has(item.id) ? 'fill-current text-red-500' : ''}`} />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => handleShare(item)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>

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
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Material: {item.material}
                  </span>
                  {item.size && (
                    <span className="text-sm text-muted-foreground">
                      {item.size}"
                    </span>
                  )}
                </div>
                {item.customer_name && (
                  <div className="text-sm text-muted-foreground">
                    - {item.customer_name}
                  </div>
                )}
                {item.testimonial && (
                  <p className="text-xs text-muted-foreground italic mt-2 line-clamp-2">
                    "{item.testimonial}"
                  </p>
                )}
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

      {/* Image Zoom Modal */}
      {selectedImage && (
        <Dialog open={true} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedImage.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedImage(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col lg:flex-row h-full p-6 gap-6">
              <div className="flex-1 relative">
                <img
                  src={selectedImage.image_url}
                  alt={selectedImage.title}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div className="lg:w-80 space-y-4">
                <div>
                  <Badge variant="secondary" className="mb-2">{selectedImage.frame_style}</Badge>
                  <h3 className="text-xl font-bold mb-2">{selectedImage.title}</h3>
                  <p className="text-muted-foreground mb-4">{selectedImage.description}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Material:</span>
                    <span className="text-sm font-medium">{selectedImage.material}</span>
                  </div>
                  {selectedImage.size && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Size:</span>
                      <span className="text-sm font-medium">{selectedImage.size}"</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Customer:</span>
                    <span className="text-sm font-medium">{selectedImage.customer_name}</span>
                  </div>
                  {selectedImage.rating && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Rating:</span>
                      <div className="flex items-center gap-1">
                        {[...Array(selectedImage.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {selectedImage.testimonial && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">Customer Review:</h4>
                    <p className="text-sm text-muted-foreground italic">
                      "{selectedImage.testimonial}"
                    </p>
                  </div>
                )}

                <div className="space-y-2 pt-4">
                  <Button 
                    className="w-full"
                    onClick={() => handleTryThisStyle(selectedImage)}
                  >
                    Try This Style
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleToggleFavorite(selectedImage.id)}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${favorites.has(selectedImage.id) ? 'fill-current text-red-500' : ''}`} />
                      {favorites.has(selectedImage.id) ? 'Saved' : 'Save'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleShare(selectedImage)}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

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