import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase-config";

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const categories = [
    "All",
    "Food & Treats",
    "Toys",
    "Beds & Furniture",
    "Accessories",
    "Health & Wellness",
  ];

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const fetchedProducts = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: String(data.name || ""),
            category: String(data.category || ""),
            description: String(data.description || ""),
            price: Number(data.price || 0),
            image: data.image || "/images/shop-images/default-image.jpg",
          };
        })
        // Remove any products that couldn't be properly processed
        .filter((product) => product.name !== "");

      setProducts(fetchedProducts);
    });

    return () => unsubscribe();
  }, []);

  const filterProducts = () => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description &&
          product.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="min-h-screen bg-background/40"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-6 pb-8 font-nunito-bold">
        <h1 className="text-4xl font-bold text-text mb-2 tracking-wide text-center">
          Pet Shop
        </h1>
        <p className="text-text/80 mb-8 tracking-wide font-nunito-medium text-center max-w-2xl mx-auto">
          Everything your pet needs, from nutrition to comfort, all in one
          place.
        </p>

        {/* Search and Category Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-center items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green2/60 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border-[1.6px] border-green2 bg-background/95 focus:outline-none focus:border-primary text-text"
            />
          </div>

          <div className="relative w-full md:w-64">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-2 bg-green3 text-text rounded-full hover:bg-green3/80 transition-colors border-[1.6px] border-green2 flex items-center justify-between"
            >
              <span>{selectedCategory}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-background/95 border-[1.6px] border-green2 rounded-xl shadow-lg z-50">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-green3/20 text-text transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <AnimatePresence mode="wait">
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterProducts().map((product) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.3 }}
                className="bg-background/95 p-6 rounded-2xl border-[1.6px] border-green2 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="relative group">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-xl mb-4"
                  />
                  <div className="absolute inset-0 bg-green2/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                </div>

                <span className="inline-block px-3 py-1 bg-green3/30 text-text/80 text-xs rounded-full mb-2">
                  {product.category}
                </span>

                <h2 className="text-xl font-semibold text-text mb-1">
                  {product.name}
                </h2>

                <p className="text-text/60 text-sm mb-2">
                  {product.description}
                </p>

                <p className="text-lg font-semibold text-primary mb-4">
                  ₱{product.price}
                </p>

                <button className="w-full px-4 py-2 bg-green3 text-text rounded-full hover:bg-green3/80 transition-colors border-[1.6px] border-green2">
                  Add to Cart
                </button>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Shop;
