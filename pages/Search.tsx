import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { Product } from "../types";
import { Search as SearchIcon, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "../components/ui/ProductCard";
import Icon from "../components/Icon";

const Search: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [recent, setRecent] = useState<string[]>(
    JSON.parse(localStorage.getItem("vibe_recent_searches") || '["Mobiles", "Border Cross", "Original Phones", "Chargers", "Type-C"]'),
  );
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // For favorite products, pick random/top rated.
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);

  useEffect(() => {
    const q = collection(db, "products");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Product);
      setAllProducts(prods);
      setFavoriteProducts(prods.slice(0, 4)); // just picking top 4
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setResults([]);
      return;
    }
    const filtered = allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setResults(filtered);
  }, [searchTerm, allProducts]);

  const saveSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recent.filter((r) => r !== term)].slice(0, 6);
    setRecent(updated);
    localStorage.setItem("vibe_recent_searches", JSON.stringify(updated));
  };

  const favoriteCategories = [
    { name: "Border Cross", color: "bg-blue-50 text-blue-500", icon: "plane" },
    { name: "Mobiles", color: "bg-red-50 text-red-500", icon: "mobile" },
    { name: "Original Phones", color: "bg-green-50 text-green-500", icon: "check-circle" },
    { name: "Chargers", color: "bg-yellow-50 text-yellow-500", icon: "bolt" },
    { name: "Accessories", color: "bg-purple-50 text-purple-500", icon: "link" },
  ];

  return (
    <div className="pt-6 pb-[120px] px-4 sm:px-6 animate-fade-in min-h-screen bg-[#f3f3f3] dark:bg-zinc-900 mx-auto font-sans">
      <div className="max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search border cross, mobiles & gear..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveSearch(searchTerm)}
            className="w-full bg-[#e3e3e3] dark:bg-zinc-800 text-zinc-900 dark:text-锌-100 rounded-[14px] py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 text-[15px] font-medium"
          />
        </div>
      </div>

      {searchTerm.trim() === "" ? (
        <>
          {/* Recent Searches */}
          {recent.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-4 tracking-tight">
                Recent Searches
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {recent.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSearchTerm(item);
                      saveSearch(item);
                    }}
                    className="px-4 py-2 bg-white dark:bg-zinc-800 rounded-[10px] text-[13.5px] font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-700 hover:shadow-sm transition-all"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Favorite Categories */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">
                Favorite Categories
              </h2>
              <button className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200">
                See all
              </button>
            </div>
            <div className="flex overflow-x-auto pb-2 gap-4 -mx-4 px-4 scrollbar-hide">
              {favoriteCategories.map((cat, i) => (
                <div key={i} className="flex flex-col items-center gap-2 cursor-pointer group shrink-0" onClick={() => { setSearchTerm(cat.name); saveSearch(cat.name); }}>
                  <div className={`w-16 h-16 rounded-full flex justify-center items-center ${cat.color} bg-white shadow-sm border border-zinc-100 dark:border-zinc-800 transition-transform group-hover:scale-105`}>
                     <Icon name={cat.icon} className="text-2xl" />
                  </div>
                  <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Favorite Products */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">
                Favorite Products
              </h2>
              <button className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200">
                See all
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {favoriteProducts.map((prod) => (
                <div 
                  key={prod.id} 
                  onClick={() => navigate(`/product/${prod.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/${prod.id}`)}
                  className="bg-white dark:bg-zinc-800 rounded-[20px] p-4 flex flex-col justify-start cursor-pointer hover:shadow-md transition-shadow border border-zinc-100 dark:border-zinc-700"
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden mb-3 bg-[#f8f8f8] flex items-center justify-center border border-zinc-100 dark:border-zinc-700">
                    <img src={prod.image} alt={prod.name} className="w-10 h-10 object-contain mix-blend-multiply dark:mix-blend-normal" />
                  </div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-[15px] leading-tight line-clamp-1 mb-1">
                    {prod.name}
                  </h3>
                  <span className="text-[13px] text-zinc-500 dark:text-zinc-400 capitalize">
                    {prod.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-[13px] font-bold text-zinc-500 dark:text-zinc-400 tracking-normal mb-2 uppercase">
            Search Results ({results.length})
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pb-2">
            {results.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
          {results.length === 0 && (
            <div className="py-20 text-center opacity-40">
              <Icon name="box-open" className="text-3xl mb-4" />
              <p className="text-[15px] font-bold tracking-normal">
                No products matched
              </p>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default Search;
