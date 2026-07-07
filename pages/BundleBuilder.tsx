import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useNotify } from '../components/Notifications';
import { ArrowLeft, Plus, Check, ShoppingBag, X } from 'lucide-react';

const BundleBuilder = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const notify = useNotify();

  const [selectedBase, setSelectedBase] = useState<any>(null);
  const [selectedAccessories, setSelectedAccessories] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const baseProducts = products.filter(p => !p.category?.toLowerCase().includes('strap') && !p.category?.toLowerCase().includes('charger') && !p.category?.toLowerCase().includes('case'));
  const accessories = products.filter(p => p.category?.toLowerCase().includes('strap') || p.category?.toLowerCase().includes('charger') || p.category?.toLowerCase().includes('case') || p.price < 2000);

  const toggleAccessory = (acc: any) => {
    if (selectedAccessories.find(a => a.id === acc.id)) {
      setSelectedAccessories(selectedAccessories.filter(a => a.id !== acc.id));
    } else {
      if (selectedAccessories.length >= 3) {
        notify('Maximum 3 accessories allowed in a bundle!', 'error');
        return;
      }
      setSelectedAccessories([...selectedAccessories, acc]);
    }
  };

  const totalPrice = (selectedBase ? selectedBase.price : 0) + selectedAccessories.reduce((sum, a) => sum + a.price, 0);
  const discount = selectedAccessories.length > 0 ? (selectedAccessories.length * 2) : 0; // 2% per accessory
  const discountedPrice = totalPrice - (totalPrice * (discount / 100));

  const handleAddToCart = () => {
    if (!selectedBase) return;
    
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem('f_cart') || '[]'); } catch (e) {}

    // Add base
    const baseItem = { ...selectedBase, quantity: 1 };
    cart.push(baseItem);

    // Add accessories
    selectedAccessories.forEach(acc => {
      cart.push({ ...acc, quantity: 1, price: acc.price * (1 - discount / 100) });
    });

    localStorage.setItem('f_cart', JSON.stringify(cart));
    notify('Bundle added to cart!', 'success');
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pb-24 text-zinc-900 dark:text-zinc-100">
      <div className="max-w-5xl mx-auto px-4 pt-6 md:pt-10">
        <h1 className="text-3xl font-black tracking-tight mb-2">Build Custom Tech Box</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Select your favorite items to craft your personalized high-vibe tech bundle.</p>
      </div>

      <div className="max-w-5xl mx-auto p-4 lg:p-8 pt-0 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Selection UI */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-black mb-4">1. Choose Base Device</h2>
            <div className="grid grid-cols-2 gap-4">
              {baseProducts.slice(0, 4).map(p => (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedBase(p)}
                  className={`p-4 rounded-3xl border-2 transition-all cursor-pointer ${selectedBase?.id === p.id ? 'border-[#1cdb5e] bg-[#1cdb5e]/5' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300'}`}
                >
                  <img src={p.image || p.images?.[0]} className="w-full aspect-square object-contain mb-3" alt={p.name || p.title} />
                  <p className="font-bold text-sm truncate">{p.name || p.title}</p>
                  <p className="text-xs text-zinc-500 font-bold mt-1">৳{p.price}</p>
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {selectedBase && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-xl font-black mb-4">2. Add Accessories (Up to 3)</h2>
                <div className="grid grid-cols-3 gap-3">
                  {accessories.slice(0, 9).map(p => {
                    const isSelected = selectedAccessories.find(a => a.id === p.id);
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => toggleAccessory(p)}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer relative ${isSelected ? 'border-[#1cdb5e] bg-[#1cdb5e]/5' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300'}`}
                      >
                        {isSelected && <div className="absolute top-2 right-2 w-5 h-5 bg-[#1cdb5e] rounded-full flex items-center justify-center text-white"><Check className="w-3 h-3" /></div>}
                        <img src={p.image || p.images?.[0]} className="w-full aspect-square object-contain mb-2" alt={p.name || p.title} />
                        <p className="font-bold text-[10px] truncate">{p.name || p.title}</p>
                        <p className="text-[10px] text-zinc-500 font-bold mt-1">৳{p.price}</p>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Box Visualization (Bento Grid) */}
        <div className="sticky top-24 h-fit">
          <div className="bg-zinc-100 dark:bg-zinc-900 rounded-[3rem] p-6 lg:p-10 border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-center font-black tracking-widest uppercase text-zinc-400 mb-6 text-sm">Your Tech Box</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              {/* Main Device Slot */}
              <div className="col-span-2 aspect-[2/1] bg-white dark:bg-black rounded-3xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center p-6 relative overflow-hidden shadow-sm">
                {selectedBase ? (
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                    <img src={selectedBase.image || selectedBase.images?.[0]} className="h-32 object-contain" alt="" />
                  </motion.div>
                ) : (
                  <div className="text-zinc-300 dark:text-zinc-700 flex flex-col items-center">
                    <Plus className="w-8 h-8 mb-2" />
                    <span className="text-xs font-bold uppercase tracking-widest">Base Device</span>
                  </div>
                )}
              </div>

              {/* Accessory Slots */}
              {[0, 1, 2].map((index) => {
                const acc = selectedAccessories[index];
                return (
                  <div key={index} className={`${index === 2 ? 'col-span-2' : 'col-span-1'} aspect-square bg-white dark:bg-black rounded-3xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center p-4 relative shadow-sm`}>
                    {acc ? (
                      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center relative">
                        <button onClick={() => toggleAccessory(acc)} className="absolute -top-6 -right-6 p-2 text-zinc-400 hover:text-red-500 bg-zinc-100 rounded-full dark:bg-zinc-900"><X className="w-3 h-3" /></button>
                        <img src={acc.image || acc.images?.[0]} className="h-20 object-contain" alt="" />
                      </motion.div>
                    ) : (
                      <div className="text-zinc-300 dark:text-zinc-700 flex flex-col items-center">
                        <Plus className="w-6 h-6 mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-center">Acc {index + 1}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="bg-white dark:bg-black p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-between items-center mb-2 text-sm text-zinc-500">
                <span>Subtotal</span>
                <span>৳{totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-4 text-sm text-[#1cdb5e] font-bold">
                <span>Bundle Discount</span>
                <span>-{discount}%</span>
              </div>
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold">Total</span>
                <span className="text-2xl font-black tracking-tight">৳{discountedPrice.toLocaleString()}</span>
              </div>

              <button 
                onClick={handleAddToCart}
                disabled={!selectedBase}
                className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-4 h-4" /> Add Box to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BundleBuilder;
