import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Package, Box, Layers, Filter, ChevronDown, ChevronRight } from "lucide-react";
import { ASN, Product } from "@/types";
import { useSerialStore } from "@/hooks/useSerialStore";

interface ASNHierarchyViewTabsProps {
  asn: ASN;
  onAssignToNode: (partNumbers: string[], context: { type: 'item' | 'lot' | 'package'; id: string; name: string }) => void;
}

export const ASNHierarchyViewTabs = ({ asn, onAssignToNode }: ASNHierarchyViewTabsProps) => {
  const { getSerialsByASN, store } = useSerialStore();
  const [selectedPartNumber, setSelectedPartNumber] = useState<string>("all");
  const [serialsByPartNumber, setSerialsByPartNumber] = useState<Record<string, any[]>>({});
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (asn) {
      loadSerialData();
      // Expand first item by default
      if (asn.items.length > 0) {
        setExpandedItems(new Set([asn.items[0].id]));
      }
    }
  }, [asn]);

  const loadSerialData = async () => {
    const serials = await getSerialsByASN(asn.id);
    const grouped = serials.reduce((acc, serial) => {
      const key = serial.part_number_id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(serial);
      return acc;
    }, {} as Record<string, any[]>);
    setSerialsByPartNumber(grouped);
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

  // Get serials for a specific part number
  const getSerialsForPartNumber = (partNumber: string) => {
    const product = getProductForPartNumber(partNumber);
    if (!product) return [];
    return serialsByPartNumber[product.id] || [];
  };

  const toggleItemExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Generate package structure based on ASN items
  const generatePackageStructure = () => {
    const containers = [];
    let containerIndex = 1;
    
    for (const item of filteredASN.items) {
      const product = getProductForPartNumber(item.buyer_part_number);
      if (!product) continue;
      
      const itemSerials = getSerialsForPartNumber(item.buyer_part_number);
      const blockedSerials = itemSerials.filter(s => s.status === 'blocked');
      
      // Create container for each item
      const container = {
        id: `container-${containerIndex}`,
        name: `Master Carton MC-${containerIndex.toString().padStart(3, '0')}`,
        item: item,
        product: product,
        serials: blockedSerials.slice(0, 5), // Show first 5 serials
        totalSerials: blockedSerials.length,
        assignedPercentage: Math.round((blockedSerials.length / item.ship_quantity) * 100)
      };
      
      containers.push(container);
      containerIndex++;
    }
    
    return containers;
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Part Number Filter */}
      <div className="flex items-center space-x-4 pb-4 border-b flex-shrink-0">
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

      <Tabs defaultValue="items" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
          <TabsTrigger value="items" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Items & Lots</span>
          </TabsTrigger>
          <TabsTrigger value="packing" className="flex items-center space-x-2">
            <Box className="h-4 w-4" />
            <span>Packages</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-6 flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto space-y-4">
            {filteredASN.items.map((item) => {
              const product = getProductForPartNumber(item.buyer_part_number);
              const itemSerials = getSerialsForPartNumber(item.buyer_part_number);
              const assignedSerials = itemSerials.filter(s => s.status === 'blocked').length;
              const assignedPercentage = Math.round((assignedSerials / item.ship_quantity) * 100);
              const isExpanded = expandedItems.has(item.id);

              return (
                <Card key={item.id} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={() => toggleItemExpansion(item.id)}
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                        <Package className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-lg">{product?.description || item.buyer_part_number}</CardTitle>
                          <p className="text-sm text-muted-foreground">{item.buyer_part_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-sm font-medium">{assignedSerials}/{item.ship_quantity} assigned</div>
                          <div className="text-xs text-muted-foreground">{assignedPercentage}% complete</div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onAssignToNode([item.buyer_part_number], {
                            type: 'item',
                            id: item.id,
                            name: item.buyer_part_number
                          })}
                        >
                          Assign
                        </Button>
                      </div>
                    </div>
                    
                    <Progress value={assignedPercentage} className="w-full h-2" />
                    <p className="text-sm text-muted-foreground">
                      {product?.description || 'Advanced component for enterprise systems'}
                    </p>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {item.lots.map((lot, index) => {
                          const lotSerials = itemSerials.filter(s => s.lot_number === lot.lot_number);
                          const lotAssigned = lotSerials.filter(s => s.status === 'blocked').length;
                          const lotPercentage = Math.round((lotAssigned / lot.quantity) * 100);

                          return (
                            <div key={lot.id} className="ml-8 border-l-2 border-dashed border-muted-foreground/20 pl-4">
                              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <Box className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium text-sm">{lot.lot_number}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {lot.quantity} serials in lot
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="text-right">
                                    <div className="text-sm font-medium">{lotAssigned}/{lot.quantity}</div>
                                    <div className="text-xs text-muted-foreground">{lotPercentage}%</div>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => onAssignToNode([item.buyer_part_number], {
                                      type: 'lot',
                                      id: lot.id,
                                      name: lot.lot_number
                                    })}
                                  >
                                    Assign
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}

            {filteredASN.items.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No items found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filter criteria.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="packing" className="mt-6 flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto space-y-4">
            {generatePackageStructure().map((container) => (
              <Card key={container.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Layers className="h-5 w-5 text-blue-500" />
                      <div>
                        <CardTitle className="text-lg">{container.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">Container • Level 1</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-sm font-medium">{container.totalSerials}/{container.item.ship_quantity} packed</div>
                        <div className="text-xs text-muted-foreground">{container.assignedPercentage}% packed</div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onAssignToNode([container.product.buyer_part_number], {
                          type: 'package',
                          id: container.id,
                          name: container.name
                        })}
                      >
                        Assign
                      </Button>
                    </div>
                  </div>
                  <Progress value={container.assignedPercentage} className="w-full h-2" />
                </CardHeader>
                
                <CardContent>
                  <div className="ml-6 space-y-2 border-l-2 border-dashed border-muted-foreground/20 pl-4">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">Inner Box IB-{container.id.split('-')[1].padStart(3, '0')}</div>
                          <div className="text-xs text-muted-foreground">
                            Level 2 • {container.product.buyer_part_number}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary">{container.totalSerials} units</Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onAssignToNode([container.product.buyer_part_number], {
                            type: 'item',
                            id: container.item.id,
                            name: container.product.buyer_part_number
                          })}
                        >
                          Assign
                        </Button>
                      </div>
                    </div>
                    
                    {container.serials.length > 0 && (
                      <div className="ml-6 space-y-1 border-l-2 border-dashed border-muted-foreground/20 pl-4">
                        {container.serials.slice(0, 3).map((serial, index) => (
                          <div key={serial.id} className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>• Unit U-{(index + 1).toString().padStart(3, '0')} (Serial: {serial.serial_number})</span>
                          </div>
                        ))}
                        {container.totalSerials > 3 && (
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>• ... and {container.totalSerials - 3} more units</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {generatePackageStructure().length === 0 && (
              <div className="text-center py-12">
                <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No packages found</h3>
                <p className="text-muted-foreground">
                  No items available for the selected filters.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};