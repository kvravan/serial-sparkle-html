import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, X, Search, Package } from "lucide-react";
import { Product } from "@/types";
import { useSerialStore } from "@/hooks/useSerialStore";
import { useToast } from "@/hooks/use-toast";

interface AddChildPartsFormProps {
  product: Product;
  onClose: () => void;
}

interface ChildPart {
  id: string;
  part_number: string;
  description: string;
  quantity_required: number;
}

export const AddChildPartsForm = ({ product, onClose }: AddChildPartsFormProps) => {
  const { store } = useSerialStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParts, setSelectedParts] = useState<ChildPart[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const products = store?.products || [];
  
  const filteredProducts = products.filter(p => 
    p.id !== product.id &&
    (p.buyer_part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addChildPart = (selectedProduct: Product) => {
    if (selectedParts.some(p => p.id === selectedProduct.id)) {
      toast({
        title: "Already added",
        description: "This part is already in the list.",
        variant: "destructive"
      });
      return;
    }

    const newChildPart: ChildPart = {
      id: selectedProduct.id,
      part_number: selectedProduct.buyer_part_number,
      description: selectedProduct.description,
      quantity_required: quantities[selectedProduct.id] || 1
    };

    setSelectedParts(prev => [...prev, newChildPart]);
    setQuantities(prev => ({ ...prev, [selectedProduct.id]: 1 }));
    setSearchTerm("");
  };

  const removeChildPart = (partId: string) => {
    setSelectedParts(prev => prev.filter(p => p.id !== partId));
    setQuantities(prev => {
      const { [partId]: removed, ...rest } = prev;
      return rest;
    });
  };

  const updateQuantity = (partId: string, quantity: number) => {
    if (quantity < 1) return;
    setQuantities(prev => ({ ...prev, [partId]: quantity }));
    setSelectedParts(prev => prev.map(p => 
      p.id === partId ? { ...p, quantity_required: quantity } : p
    ));
  };

  const handleSave = () => {
    if (selectedParts.length === 0) {
      toast({
        title: "No parts selected",
        description: "Please select at least one child part.",
        variant: "destructive"
      });
      return;
    }

    // In a real application, this would save to the backend
    toast({
      title: "Child parts added",
      description: `${selectedParts.length} child parts added to ${product.buyer_part_number}.`
    });
    onClose();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Add Child Parts</h2>
          <p className="text-muted-foreground">Add immediate child parts for {product.buyer_part_number}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search and Add Parts */}
        <Card>
          <CardHeader>
            <CardTitle>Search Parts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search parts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-2">
              {searchTerm && filteredProducts.map((prod) => (
                <Card key={prod.id} className="p-3 cursor-pointer hover:bg-muted/50" onClick={() => addChildPart(prod)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Package className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{prod.buyer_part_number}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{prod.description}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              ))}
              
              {searchTerm && filteredProducts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No parts found</p>
                </div>
              )}
              
              {!searchTerm && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Start typing to search for parts</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Selected Child Parts */}
        <Card>
          <CardHeader>
            <CardTitle>Selected Child Parts ({selectedParts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedParts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No child parts selected</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedParts.map((part) => (
                  <Card key={part.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">{part.part_number}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeChildPart(part.id)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{part.description}</p>
                        <div className="flex items-center space-x-2">
                          <Label className="text-xs">Qty:</Label>
                          <Input
                            type="number"
                            min="1"
                            value={quantities[part.id] || 1}
                            onChange={(e) => updateQuantity(part.id, parseInt(e.target.value) || 1)}
                            className="w-20 h-7 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={selectedParts.length === 0}>
          Save Child Parts
        </Button>
      </div>
    </div>
  );
};