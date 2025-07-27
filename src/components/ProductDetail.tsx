import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, Settings, BarChart3, Plus } from "lucide-react";
import { Product } from "@/types";
import { SerialManagement } from "./SerialManagement";
import { useSerialStore } from "@/hooks/useSerialStore";

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  onAddSerials?: (product: Product) => void;
}

export const ProductDetail = ({ product, onClose, onAddSerials }: ProductDetailProps) => {
  const [showSerialManagement, setShowSerialManagement] = useState(false);
  const { getSerialsByPartNumber, getSerialCounts } = useSerialStore();
  const [serialStats, setSerialStats] = useState({
    total: 0,
    unassigned: 0,
    blocked: 0,
    assigned: 0
  });

  useEffect(() => {
    const loadSerialStats = async () => {
      const serials = await getSerialsByPartNumber(product.id);
      setSerialStats({
        total: serials.length,
        unassigned: serials.filter(s => s.status === 'unassigned').length,
        blocked: serials.filter(s => s.status === 'blocked').length,
        assigned: serials.filter(s => s.status === 'assigned').length
      });
    };
    
    loadSerialStats();
  }, [product.id, getSerialsByPartNumber]);

  if (showSerialManagement) {
    return (
      <SerialManagement 
        product={product}
        onClose={() => setShowSerialManagement(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center space-x-3">
          <Package className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">{product.buyer_part_number}</h2>
          <Badge variant="outline">{product.buyer_identifier}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Product Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="mt-1">{product.description}</p>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Buyer Identifier</label>
                <p className="mt-1 font-mono text-sm">{product.buyer_identifier}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Supplier Identifier</label>
                <p className="mt-1 font-mono text-sm">{product.supplier_identifier}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Part Number</label>
                <p className="mt-1 font-mono text-sm">{product.buyer_part_number}</p>
              </div>
              {product.price && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Price</label>
                  <p className="mt-1 font-semibold">${product.price}</p>
                </div>
              )}
            </div>
            
            {product.dimensions && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Dimensions</label>
                <p className="mt-1 font-mono text-sm">{product.dimensions}</p>
              </div>
            )}
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                <p className="mt-1">{product.created_date.toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Updated Date</label>
                <p className="mt-1">{product.updated_date.toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Serial Number Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{serialStats.total}</div>
                <div className="text-sm text-muted-foreground">Total Serials</div>
              </div>
              <div className="text-center p-4 bg-success/10 rounded-lg">
                <div className="text-2xl font-bold text-success">{serialStats.assigned}</div>
                <div className="text-sm text-muted-foreground">Assigned</div>
              </div>
              <div className="text-center p-4 bg-secondary/50 rounded-lg">
                <div className="text-2xl font-bold">{serialStats.unassigned}</div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Blocked</span>
                <Badge variant="secondary">{serialStats.blocked}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Unassigned</span>
                <Badge variant="outline">{serialStats.unassigned}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Assigned</span>
                <Badge variant="default">{serialStats.assigned}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button 
          variant="outline"
          onClick={() => setShowSerialManagement(true)}
          className="flex items-center space-x-2"
        >
          <Settings className="h-4 w-4" />
          <span>Manage Serials</span>
        </Button>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};