import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Package, Box, Layers, Filter } from "lucide-react";
import { ASN, Product } from "@/types";
import { useSerialStore } from "@/hooks/useSerialStore";
import { ASNHierarchyView } from "./ASNHierarchyView";
import { SerialGridView } from "./SerialGridView";

interface ASNManageSerialsProps {
  asn: ASN;
  open: boolean;
  onClose: () => void;
}

export const ASNManageSerials = ({ asn, open, onClose }: ASNManageSerialsProps) => {
  const { getSerialsByASN, store } = useSerialStore();
  const [blockedSerials, setBlockedSerials] = useState(0);
  const [selectedPartNumber, setSelectedPartNumber] = useState<string>("all");
  const [showSerialGrid, setShowSerialGrid] = useState<{
    show: boolean;
    partNumbers?: string[];
    assignmentContext?: {
      type: 'item' | 'lot' | 'package';
      id: string;
      name: string;
    };
  }>({ show: false });

  useEffect(() => {
    if (open && asn) {
      loadBlockedSerials();
    }
  }, [open, asn]);

  const loadBlockedSerials = async () => {
    const serials = await getSerialsByASN(asn.id);
    setBlockedSerials(serials.filter(s => s.status === 'blocked').length);
  };

  const handleAssignToNode = (partNumbers: string[], context: { type: 'item' | 'lot' | 'package'; id: string; name: string }) => {
    setShowSerialGrid({
      show: true,
      partNumbers,
      assignmentContext: context
    });
  };

  const handleCloseSerialGrid = () => {
    setShowSerialGrid({ show: false });
  };

  // Get unique part numbers from ASN items
  const uniquePartNumbers = Array.from(new Set(asn.items.map(item => item.buyer_part_number)));
  
  // Filter items based on selected part number
  const filteredASN = selectedPartNumber === "all" 
    ? asn 
    : {
        ...asn,
        items: asn.items.filter(item => item.buyer_part_number === selectedPartNumber)
      };

  // Get product information for part numbers
  const getProductForPartNumber = (partNumber: string): Product | undefined => {
    return store?.products.find(p => p.buyer_part_number === partNumber);
  };

  if (showSerialGrid.show) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
          <SerialGridView
            asn={asn}
            partNumbers={showSerialGrid.partNumbers}
            assignmentContext={showSerialGrid.assignmentContext}
            onClose={handleCloseSerialGrid}
            contextLaunched={true}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            <div>
              <DialogTitle className="text-2xl font-bold">Manage Serials</DialogTitle>
              <p className="text-muted-foreground">{asn.asn_number}</p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              {blockedSerials} blocked serials
            </Badge>
          </div>
        </DialogHeader>
        
        {/* Part Number Filter */}
        <div className="flex items-center space-x-4 px-6 py-2 border-b">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter by Part Number:</span>
          <Select value={selectedPartNumber} onValueChange={setSelectedPartNumber}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Part Numbers</SelectItem>
              {uniquePartNumbers.map(partNumber => (
                <SelectItem key={partNumber} value={partNumber}>
                  {partNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPartNumber !== "all" && (
            <Badge variant="outline">
              {filteredASN.items.length} items filtered
            </Badge>
          )}
        </div>

        <Tabs defaultValue="items" className="flex-1 overflow-hidden">
          <TabsList className="mx-6">
            <TabsTrigger value="items" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Items & Lots</span>
            </TabsTrigger>
            <TabsTrigger value="packing" className="flex items-center space-x-2">
              <Box className="h-4 w-4" />
              <span>Packing Structure</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="mx-6 mt-6 flex-1 overflow-hidden">
            <ASNHierarchyView
              asn={filteredASN}
              onAssignToNode={handleAssignToNode}
            />
          </TabsContent>

          <TabsContent value="packing" className="mx-6 mt-6 flex-1 overflow-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Layers className="h-5 w-5" />
                  <span>Package Hierarchy</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Example nested package structure */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Box className="h-4 w-4" />
                        <span className="font-medium">Master Carton MC-001</span>
                        <Badge variant="outline">Container</Badge>
                      </div>
                      <Button variant="outline" size="sm">Assign Serials</Button>
                    </div>
                    
                    <div className="ml-6 space-y-2 border-l-2 border-dashed border-muted-foreground/20 pl-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4" />
                          <span>Inner Box IB-001</span>
                          <Badge variant="secondary">CPU-001-X7</Badge>
                        </div>
                        <Button variant="outline" size="sm">Assign Serials</Button>
                      </div>
                      
                      <div className="ml-6 space-y-1 border-l-2 border-dashed border-muted-foreground/20 pl-4">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>• Unit U-001 (Serial: CPU001X7001)</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>• Unit U-002 (Serial: CPU001X7002)</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>• Unit U-003 (Serial: CPU001X7003)</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4" />
                          <span>Inner Box IB-002</span>
                          <Badge variant="secondary">MEM-002-DDR5</Badge>
                        </div>
                        <Button variant="outline" size="sm">Assign Serials</Button>
                      </div>
                      
                      <div className="ml-6 space-y-1 border-l-2 border-dashed border-muted-foreground/20 pl-4">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>• Unit U-004 (Serial: MEM002DDR5001)</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>• Unit U-005 (Serial: MEM002DDR5002)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Box className="h-4 w-4" />
                        <span className="font-medium">Master Carton MC-002</span>
                        <Badge variant="outline">Container</Badge>
                      </div>
                      <Button variant="outline" size="sm">Assign Serials</Button>
                    </div>
                    
                    <div className="ml-6 space-y-2 border-l-2 border-dashed border-muted-foreground/20 pl-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4" />
                          <span>Inner Box IB-003</span>
                          <Badge variant="secondary">SSD-003-NVMe</Badge>
                        </div>
                        <Button variant="outline" size="sm">Assign Serials</Button>
                      </div>
                      
                      <div className="ml-6 space-y-1 border-l-2 border-dashed border-muted-foreground/20 pl-4">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>• Unit U-006 (Serial: SSD003NVME001)</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>• Unit U-007 (Serial: SSD003NVME002)</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>• Unit U-008 (Serial: SSD003NVME003)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};