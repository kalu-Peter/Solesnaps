import React, { useState } from "react";
import ProductCard from "@/components/ProductCard";
import ProductDetails from "@/components/ProductDetails";

// Example of how to use ProductCard with ProductDetails modal
const ProductGridExample = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);

  // Sample products data (replace with your actual data)
  const products = [
    {
      id: "1",
      name: "Manchester United Terrace Icons Track Top",
      description:
        "A nod to the beautiful game back in the day. This Manchester United track top blends classic terrace culture with modern-day adidas comfort. The stand-up collar and embroidered Trefoil will bring back match day memories for some, while soft, stretchy twill fabric keeps everyone comfortable. The shield-style badge on the chest is borrowed from this season's third kit.",
      price: "18100",
      stock_quantity: 15,
      brand: "Adidas",
      colors: ["Red", "Black", "White"],
      sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
      images: [
        {
          id: 1,
          image_url: "/images/product1-1.jpg",
          alt_text: "Manchester United Track Top Front",
          is_primary: true,
          sort_order: 1,
        },
        {
          id: 2,
          image_url: "/images/product1-2.jpg",
          alt_text: "Manchester United Track Top Back",
          is_primary: false,
          sort_order: 2,
        },
      ],
      category_name: "Football",
      is_featured: true,
      is_active: true,
      gender: "Unisex",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    },
    // Add more products as needed
  ];

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setIsProductDetailsOpen(true);
  };

  const handleCloseProductDetails = () => {
    setIsProductDetailsOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Our Products</h1>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            {...product}
            onProductClick={handleProductClick}
          />
        ))}
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          isOpen={isProductDetailsOpen}
          onClose={handleCloseProductDetails}
        />
      )}
    </div>
  );
};

export default ProductGridExample;
