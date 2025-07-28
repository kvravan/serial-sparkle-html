import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, Package, Eye, GitBranch } from "lucide-react";
import { Product } from "@/types";
import { ProductDetail } from "./ProductDetail";
import { AddSerialsForm } from "./AddSerialsForm";
import { AddChildPartsForm } from "./AddChildPartsForm";
import { useGlobalState } from "@/hooks/useGlobalState";

interface ProductMasterProps {
  onProductSelect?: (product: Product) => void;
}

export const ProductMaster = ({ onProductSelect }: ProductMasterProps) => {
  const { ui, actions, computed, system } = useGlobalState();
  
  const filteredProducts = computed.getFilteredProducts();

  const handleProductClick = (product: Product) => {
    actions.setSelectedProduct(product);
    onProductSelect?.(product);
  };

  const handleCloseDetail = () => {
    actions.setSelectedProduct(null);
  };

  const handleShowAddSerials = (product: Product) => {
    actions.setSelectedProduct(product);
    actions.toggleModal('addSerial', true);
  };

  const handleCloseAddSerials = () => {
    actions.toggleModal('addSerial', false);
  };

  const handleShowAddChildParts = (product: Product) => {
    actions.setSelectedProduct(product);
    actions.toggleModal('uploadChildSerials', true);
  };

  const handleCloseAddChildParts = () => {
    actions.toggleModal('uploadChildSerials', false);
  };

  if (ui.modals.uploadChildSerials && ui.selectedProduct) {
    return (
      <AddChildPartsForm
        product={ui.selectedProduct}
        onClose={handleCloseAddChildParts}
      />
    );
  }

  if (ui.modals.addSerial && ui.selectedProduct) {
    return (
      <AddSerialsForm 
        product={ui.selectedProduct} 
        onClose={handleCloseAddSerials}
      />
    );
  }

  if (ui.selectedProduct) {
    return (
      <ProductDetail 
        product={ui.selectedProduct} 
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
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="flex items-center space-x-2">
            <GitBranch className="h-4 w-4" />
            <span>Manage Child Parts</span>
          </Button>
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={ui.searchTerms.products}
            onChange={(e) => actions.setSearchTerm('products', e.target.value)}
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
                <div className="flex items-center space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowAddChildParts(product);
                    }}
                    title="Add child parts"
                  >
                    <GitBranch className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductClick(product);
                    }}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
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