import * as fs from 'fs';

const content = fs.readFileSync('pages/ProductDetails.tsx', 'utf8');
const lines = content.split('\n');

const newJSX = `
  const changeImage = (index: number) => {
    setDirection(index > activeImg ? 1 : -1);
    setActiveImg(index);
  };

  const handleBundleAddToCart = () => {
    if (!product) return;
    setAddingBundle(true);

    setTimeout(() => {
      const itemsToAdd = [product, ...bundleItems];
      let cart: any[] = [];
      try {
        cart = JSON.parse(localStorage.getItem("f_cart") || "[]");
      } catch (e) {}

      itemsToAdd.forEach((item) => {
        const offerPrice = item.isOffer && item.offerPrice ? item.offerPrice : item.price;
        const existing = cart.find((c: any) => c.id === item.id);
        if (existing) {
          existing.quantity += 1;
        } else {
          cart.push({
            ...item,
            quantity: 1,
            originalPrice: item.price,
            price: offerPrice * 0.9,
          });
        }
      });
      localStorage.setItem("f_cart", JSON.stringify(cart));

      setTimeout(() => {
        setAddingBundle(false);
        navigate("/cart");
      }, 600);
    }, 200);
  };

  if (!product)
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#121212]">
        <div className="w-8 h-8 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 animate-pulse mix-blend-screen" />
      </div>
    );

  const images = product.images || [product.image];

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: product.images || [product.image],
    description:
      product.description || \`Buy \${product.name} at DEEP SHOP premium store.\`,
    sku: product.id,
    offers: {
      "@type": "Offer",
      url: window.location.href,
      priceCurrency: "BDT",
      price: mysteryOffer
        ? mysteryOffer.discountPrice
        : product.isOffer && product.offerPrice
          ? product.offerPrice
          : product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(product.rating && product.numReviews
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.numReviews,
          },
        }
      : {}),
  };

  return (
    <div className="w-full mx-auto min-h-screen bg-background text-foreground pb-24 lg:pb-0 overflow-x-hidden">
      <SEO
        title={product.name}
        description={
          product.description ||
          \`Buy \${product.name}\`
        }
        image={product.image}
        jsonLd={jsonLd}
        price={
          mysteryOffer
            ? mysteryOffer.discountPrice
            : product.isOffer && product.offerPrice
              ? product.offerPrice
              : product.price
        }
        availability={product.stock > 0 ? "in stock" : "out of stock"}
      />
      <div className="w-full max-w-7xl mx-auto p-4 md:p-8 animate-fade-in">
        {/* Breadcrumbs Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center text-sm text-zinc-500 dark:text-zinc-400 mb-6 whitespace-nowrap overflow-x-auto no-scrollbar">
          <button onClick={() => navigate("/")} className="hover:text-emerald-500 transition-colors">Home</button>
          <ChevronRight className="h-4 w-4 mx-1 shrink-0" />
          <button onClick={() => navigate("/all-products")} className="hover:text-emerald-500 transition-colors">Products</button>
          <ChevronRight className="h-4 w-4 mx-1 shrink-0" />
          <span className="text-zinc-900 dark:text-zinc-100 font-medium truncate">{product.name}</span>
        </nav>

        <div className="flex justify-between items-center mb-6">
          <div /> {/* Spacer */}
          <div className="flex items-center gap-2 relative z-20">
              <Button onClick={toggleWishlist} variant="ghost" size="icon" className={isWishlisted ? "text-red-500" : ""}>
                  <Heart className="h-5 w-5" fill={isWishlisted ? "currentColor" : "none"} />
                  <span className="sr-only">Wishlist</span>
              </Button>
              <Button onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: product.name, url: window.location.href }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  notify("Link copied!", "success");
                }
              }} variant="ghost" size="icon">
                  <Share2 className="h-5 w-5" />
                  <span className="sr-only">Share</span>
              </Button>
          </div>
        </div>

        {/* Main content grid */}
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Image Gallery Section */}
          <div className="flex flex-col gap-4">
             <AnimatePresence mode="popLayout" custom={direction}>
               <motion.div
                  key={activeImg}
                  initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction < 0 ? 50 : -50 }}
                  transition={{ duration: 0.3 }}
                  className="relative aspect-square md:aspect-[4/5] w-full overflow-hidden rounded-2xl md:rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex items-center justify-center p-8 cursor-zoom-in group"
                  onClick={() => setFullScreenImg(images[activeImg])}
               >
                  <img
                      src={images[activeImg]}
                      alt={\`\${product.name} image \${activeImg + 1}\`}
                      className={\`object-contain w-full h-full mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-700 \${product.stock <= 0 ? "grayscale opacity-75" : ""}\`}
                  />
                  {product.stock <= 0 && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                      <div className="bg-zinc-900/80 backdrop-blur-md text-white px-6 py-3 rounded-full border border-zinc-700 shadow-sm flex items-center space-x-2 animate-pulse">
                        <Icon name="clock" className="text-zinc-400" />
                        <span className="text-[10px] font-semibold tracking-normal whitespace-nowrap">Restocking Soon</span>
                      </div>
                    </div>
                  )}
               </motion.div>
             </AnimatePresence>
             
            {images.length > 1 && (
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {images.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => changeImage(index)}
                        className={\`h-2 w-2 rounded-full transition-colors \${activeImg === index ? "bg-emerald-500 w-4" : "bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-500"}\`}
                        aria-label={\`View image \${index + 1}\`}
                    />
                    ))}
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setFullScreenImg(images[activeImg])}>
                    <Camera className="h-4 w-4" /> Full View
                </Button>
              </div>
            )}
          </div>

          {/* Product Details Section */}
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-zinc-900 dark:text-zinc-100">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-4">
               <div className="flex items-center gap-1">
                 {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={\`h-4 w-4 \${star <= Math.round(product.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-zinc-300 dark:text-zinc-700"}\`}
                    />
                 ))}
                 <span className="ml-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                   {(product.rating || 0).toFixed(1)} ({product.numReviews || 0} reviews)
                 </span>
               </div>
            </div>

            <div className="mt-2 mb-6">
              {mysteryOffer ? (
                 <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-white">
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-zinc-400 mb-1">Mystery Box Offer active!</p>
                      <div className="flex items-center gap-3">
                         <span className="text-4xl font-bold tracking-tighter text-emerald-400">৳{mysteryOffer.discountPrice.toLocaleString()}</span>
                         <span className="text-sm line-through text-zinc-500 font-semibold">৳{product.price.toLocaleString()}</span>
                      </div>
                    </div>
                    <Icon name="gift" className="text-3xl text-emerald-400 animate-pulse hidden sm:block" />
                 </div>
              ) : (
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-100">
                    ৳{product.isOffer && product.offerPrice ? product.offerPrice.toLocaleString() : product.price.toLocaleString()}
                  </span>
                  {product.isOffer && product.offerPrice && (
                    <span className="text-lg text-zinc-400 line-through font-semibold pb-1">
                      ৳{product.price.toLocaleString()}
                    </span>
                  )}
                  {product.freeShipping && (
                     <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-1 ml-2 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">+ Free Shipping</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 my-2 z-10 relative">
              {product.stock <= 0 ? (
                <Button size="lg" className="flex-1 gap-2 rounded-full py-6 text-base" onClick={handleNotifyMe}>
                   <Icon name="bell" className="text-lg" /> Notify Me
                </Button>
              ) : (
                <>
                  <Button onClick={() => addToCart(false)} disabled={addingToCart} variant="outline" size="lg" className="flex-1 gap-2 rounded-full py-6 text-base border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                    {addingToCart ? <div className="w-5 h-5 border-2 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin" /> : <ShoppingCart className="h-5 w-5" />}
                    Add to Cart
                  </Button>
                  <Button onClick={() => addToCart(true)} size="lg" className="flex-[1.5] gap-2 rounded-full py-6 text-base shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white border-none">
                    <Zap className="h-5 w-5" /> Buy Now
                  </Button>
                </>
              )}
            </div>

            {/* Tags/Badges based on product attributes */}
            <div className="flex flex-wrap gap-2 my-6">
                <Badge variant="secondary" className="px-3 py-1.5 text-xs font-medium gap-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-none">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Brand New
                </Badge>
                {product.category && (
                  <Badge variant="secondary" className="px-3 py-1.5 text-xs font-medium gap-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-none">
                    <Box className="h-4 w-4 text-blue-500" /> {product.category}
                  </Badge>
                )}
                <Badge variant="secondary" className="px-3 py-1.5 text-xs font-medium gap-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-none">
                  <ShieldCheck className="h-4 w-4 text-purple-500" /> 100% Authentic
                </Badge>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-zinc-900/50 rounded-2xl p-5 md:p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm mt-2">
               <h3 className="text-sm font-bold mb-3 text-zinc-900 dark:text-zinc-100">Product Description</h3>
               <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
                 {product.description || "High-quality premium accessory designed for ultimate performance and style."}
               </p>
            </div>
            
            {/* Seller Information */}
            <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
               <div className="flex justify-between items-center p-4 bg-white dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-emerald-100 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/20">
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold dark:bg-emerald-900/30 dark:text-emerald-400">VG</AvatarFallback>
                      </Avatar>
                      <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">Vibe Gadget</p>
                          <div className="flex items-center space-x-1 mt-0.5">
                            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-medium text-zinc-500">4.9 Seller Rating</span>
                          </div>
                      </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 text-xs font-bold" onClick={() => navigate('/all-products')}>
                      Visit Store &rarr;
                  </Button>
              </div>
            </div>
          </div>
        </main>

        {/* Related / Bundle section */}
        {bundleItems.length > 0 && (
          <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
             <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-6 gap-4">
                <div>
                  <h3 className="text-sm font-bold text-emerald-500 mb-1">Bundle Offer</h3>
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Shop the Look</h2>
                </div>
                <Button onClick={handleBundleAddToCart} disabled={addingBundle} variant="default" className="rounded-full shadow-sm text-sm bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto">
                   {addingBundle ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Add Bundle (Save 10%)"}
                </Button>
             </div>
             
             <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-4 mt-8">
               <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-2 shrink-0">
                  <img src={product.image} className="w-full h-full object-contain" />
               </div>
               {bundleItems.map(item => (
                 <React.Fragment key={item.id}>
                    <Icon name="plus" className="text-zinc-400 shrink-0" />
                    <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-2 shrink-0">
                       <img src={item.image} className="w-full h-full object-contain" />
                    </div>
                 </React.Fragment>
               ))}
             </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
           <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <div className="text-center md:text-left">
                 <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Customer Reviews</h2>
                 <p className="text-sm text-zinc-500 mt-1">Based on {product.numReviews || 0} reviews</p>
              </div>
              <ReviewComposer 
                 productId={product.id} 
                 product={product} 
              />
           </div>

           <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 shadow-sm dark:border-zinc-800 overflow-hidden">
                  <CommentReply review={review} />
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                  <p className="text-sm font-semibold text-zinc-500">No reviews yet. Be the first!</p>
                </div>
              )}
           </div>
        </div>

        {product.videoUrl && (
          <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
             <h2 className="text-2xl font-bold tracking-tight mb-6 text-zinc-900 dark:text-zinc-100">Product Video</h2>
             <div className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-lg bg-black relative aspect-video w-full">
                <iframe
                 src={product.videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                 className="absolute inset-0 w-full h-full"
                 allowFullScreen
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
               ></iframe>
             </div>
          </div>
        )}

      </div>

      <AnimatePresence>
         {fullScreenImg && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 bg-zinc-900/80 backdrop-blur-xl z-[100000] flex items-center justify-center p-6 md:p-12 cursor-zoom-out"
             onClick={() => setFullScreenImg(null)}
           >
             <motion.button onClick={() => setFullScreenImg(null)} className="absolute top-6 right-6 md:top-10 md:right-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-colors z-[100001]">
                <Icon name="times" />
             </motion.button>
             <motion.img
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               src={fullScreenImg}
               className="max-w-full max-h-full object-contain rounded-2xl md:rounded-3xl shadow-2xl pointer-events-auto"
               alt="Immersive product view"
               onClick={(e) => e.stopPropagation()}
             />
           </motion.div>
         )}
      </AnimatePresence>
      <CustomSectionEmbed location="product_bottom" />
    </div>
  );
`;

const startIndex = lines.findIndex(l => l.trim() === 'const changeImage = (index: number) => {');
const endIndex = lines.findIndex((l, index) => index > startIndex && l.trim() === '};');

if (startIndex !== -1 && endIndex !== -1) {
  // Replace imports at top to include Lucide icons and shadcn components
  const importLines = [
    'import { ChevronRight, Star, Heart, Share2, ShoppingCart, Camera, Zap, CheckCircle2, Box, ShieldCheck, Bell } from "lucide-react";',
    'import { Button } from "../components/ui/button";',
    'import { Badge } from "../components/ui/badge";',
    'import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";'
  ];
  lines.splice(30, 0, ...importLines);
  
  // Need to find startIndex again because we added lines
  const newStartIndex = lines.findIndex(l => l.trim() === 'const changeImage = (index: number) => {');
  const newEndIndex = lines.findIndex((l, index) => index > newStartIndex && l.trim() === '};');

  lines.splice(newStartIndex, newEndIndex - newStartIndex + 1, newJSX);

  fs.writeFileSync('pages/ProductDetails.tsx', lines.join('\\n'));
  console.log("Success");
} else {
  console.log("Could not find start or end index.");
}
