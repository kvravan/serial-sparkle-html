import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, FileText, Eye, Truck, Package } from "lucide-react";
import { ASN } from "@/types";
import { ASNDetail } from "./ASNDetail";
import { useSerialStore } from "@/hooks/useSerialStore";

export const ASNManagement = () => {
  const { store, loading } = useSerialStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedASN, setSelectedASN] = useState<ASN | null>(null);

  const asns = store?.asns || [];

  const filteredASNs = asns.filter(asn =>
    asn.asn_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asn.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleASNClick = (asn: ASN) => {
    setSelectedASN(asn);
  };

  const handleCloseDetail = () => {
    setSelectedASN(null);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'submitted':
        return 'success';
      case 'received':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (selectedASN) {
    return (
      <ASNDetail 
        asn={selectedASN} 
        onClose={handleCloseDetail}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ASN Management</h2>
          <p className="text-muted-foreground">
            Advanced Shipping Notices and serial number assignments
          </p>
        </div>
        <Button className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Create ASN</span>
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search ASNs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="text-sm">
          {filteredASNs.length} ASNs
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredASNs.map((asn) => (
          <Card 
            key={asn.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleASNClick(asn)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <FileText className="h-8 w-8 text-primary" />
                <Badge variant={getStatusVariant(asn.status) as any}>
                  {asn.status.charAt(0).toUpperCase() + asn.status.slice(1)}
                </Badge>
              </div>
              <CardTitle className="text-lg">{asn.asn_number}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Ship Date:</span>
                <span className="font-medium">
                  {asn.ship_date?.toLocaleDateString() || 'Not set'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Delivery:</span>
                <span className="font-medium">
                  {asn.delivery_date?.toLocaleDateString() || 'Not set'}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Items:</span>
                <Badge variant="outline">{asn.items.length}</Badge>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  Updated {asn.updated_date.toLocaleDateString()}
                </span>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredASNs.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No ASNs found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search criteria or create a new ASN.
          </p>
          <Button>Create ASN</Button>
        </div>
      )}
    </div>
  );
};