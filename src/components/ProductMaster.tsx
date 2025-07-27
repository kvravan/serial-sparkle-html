import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, Package, Eye } from "lucide-react";
import { Product } from "@/types";
import { ProductDetail } from "./ProductDetail";
import { AddSerialsForm } from "./AddSerialsForm";
import { useSerialStore } from "@/hooks/useSerialStore";

// Mock data
const mockProducts: Product[] = [
  {
    id: '1',
    buyer_identifier: 'ACME_CORP',
    supplier_identifier: 'TECH_SUPPLY_001',
    buyer_part_number: 'CPU-001-X7',
    description: 'High-performance processor unit with enhanced cooling',
    price: 299.99,
    dimensions: '40mm x 40mm x 5mm',
    created_date: new Date('2024-01-15'),
    updated_date: new Date('2024-01-20')
  },
  {
    id: '2',
    buyer_identifier: 'ACME_CORP',
    supplier_identifier: 'TECH_SUPPLY_001', 
    buyer_part_number: 'MEM-002-DDR5',
    description: 'DDR5 Memory Module 32GB',
    price: 189.99,
    dimensions: '133mm x 30mm x 5mm',
    created_date: new Date('2024-01-10'),
    updated_date: new Date('2024-01-18')
  },
  {
    id: '3',
    buyer_identifier: 'BETA_SYSTEMS',
    supplier_identifier: 'COMPONENT_PLUS',
    buyer_part_number: 'SSD-003-NVMe',
    description: 'NVMe SSD 1TB High Speed Storage',
    price: 149.99,
    dimensions: '80mm x 22mm x 2.38mm',
    created_date: new Date('2024-01-12'),
    updated_date: new Date('2024-01-22')
  }
];

interface ProductMasterProps {
  onProductSelect?: (product: Product) => void;
}

export const ProductMaster = ({ onProductSelect }: ProductMasterProps) => {
  const [products, setProducts] = useState(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAddSerials, setShowAddSerials] = useState<Product | null>(null);

  const filteredProducts = products.filter(product =>
    product.buyer_part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.buyer_identifier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    onProductSelect?.(product);
  };

  const handleCloseDetail = () => {
    setSelectedProduct(null);
  };

  const handleShowAddSerials = (product: Product) => {
    setShowAddSerials(product);
  };

  const handleCloseAddSerials = () => {
    setShowAddSerials(null);
  };

  if (showAddSerials) {
    return (
      <AddSerialsForm 
        product={showAddSerials} 
        onClose={handleCloseAddSerials}
      />
    );
  }

  if (selectedProduct) {
    return (
      <ProductDetail 
        product={selectedProduct} 
        onClose={handleCloseDetail}
        onAddSerials={handleShowAddSerials}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Master</h2>
          <p className="text-muted-foreground">
            Manage product catalog and serial number assignments
          </p>
        </div>
        <Button className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="text-sm">
          {filteredProducts.length} products
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card 
            key={product.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleProductClick(product)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <Package className="h-8 w-8 text-primary" />
                <Badge variant="outline">{product.buyer_identifier}</Badge>
              </div>
              <CardTitle className="text-lg">{product.buyer_part_number}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Supplier:</span>
                <span className="font-medium">{product.supplier_identifier}</span>
              </div>
              {product.price && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">${product.price}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  Updated {product.updated_date.toLocaleDateString()}
                </span>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search criteria or add a new product.
          </p>
          <Button>Add Product</Button>
        </div>
      )}
    </div>
  );
};