import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, ChevronDown, Package, Box, Layers, Tag } from "lucide-react";
import { ASN, ASNItem, ASNLot } from "@/types";
import { useSerialStore } from "@/hooks/useSerialStore";

interface ASNHierarchyViewProps {
  asn: ASN;
  onAssignToNode: (partNumbers: string[], context: { type: 'item' | 'lot' | 'package'; id: string; name: string }) => void;
}

interface PackageStructure {
  id: string;
  name: string;
  type: 'container' | 'pallet' | 'carton';
  children?: PackageStructure[];
  partNumbers: string[];
}

// Mock package structure data
const mockPackageStructure: PackageStructure[] = [
  {
    id: 'container1',
    name: 'Container CONT-001',
    type: 'container',
    partNumbers: ['CPU-001-X7', 'MEM-002-DDR5'],
    children: [
      {
        id: 'pallet1',
        name: 'Pallet PAL-001',
        type: 'pallet',
        partNumbers: ['CPU-001-X7'],
        children: [
          {
            id: 'carton1',
            name: 'Carton CAR-001',
            type: 'carton',
            partNumbers: ['CPU-001-X7']
          },
          {
            id: 'carton2',
            name: 'Carton CAR-002',
            type: 'carton',
            partNumbers: ['CPU-001-X7']
          }
        ]
      },
      {
        id: 'pallet2',
        name: 'Pallet PAL-002',
        type: 'pallet',
        partNumbers: ['MEM-002-DDR5'],
        children: [
          {
            id: 'carton3',
            name: 'Carton CAR-003',
            type: 'carton',
            partNumbers: ['MEM-002-DDR5']
          }
        ]
      }
    ]
  }
];

export const ASNHierarchyView = ({ asn, onAssignToNode }: ASNHierarchyViewProps) => {
  const { getSerialsByASN } = useSerialStore();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());
  const [serialsByPartNumber, setSerialsByPartNumber] = useState<Record<string, any[]>>({});

  useEffect(() => {
    loadSerialData();
  }, [asn.id]);

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

  const toggleItemExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const togglePackageExpansion = (packageId: string) => {
    const newExpanded = new Set(expandedPackages);
    if (newExpanded.has(packageId)) {
      newExpanded.delete(packageId);
    } else {
      newExpanded.add(packageId);
    }
    setExpandedPackages(newExpanded);
  };

  const getSerialPreview = (partNumbers: string[]) => {
    const allSerials = partNumbers.flatMap(pn => serialsByPartNumber[pn] || []);
    const blockedSerials = allSerials.filter(s => s.status === 'blocked');
    return blockedSerials.slice(0, 10);
  };

  const getSerialCount = (partNumbers: string[]) => {
    const allSerials = partNumbers.flatMap(pn => serialsByPartNumber[pn] || []);
    return allSerials.filter(s => s.status === 'blocked').length;
  };

  const ItemNode = ({ item }: { item: ASNItem }) => {
    const isExpanded = expandedItems.has(item.id);
    const serialCount = getSerialCount([item.buyer_part_number]);
    const serialPreview = getSerialPreview([item.buyer_part_number]);

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleItemExpansion(item.id)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              <Package className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">{item.buyer_part_number}</CardTitle>
                <p className="text-sm text-muted-foreground">Quantity: {item.ship_quantity}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{serialCount} blocked</Badge>
              <Button
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
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="space-y-4">
            {serialPreview.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Blocked Serials (showing {Math.min(10, serialCount)} of {serialCount})</h4>
                <div className="flex flex-wrap gap-2 mb-2">
                  {serialPreview.map((serial) => (
                    <Badge key={serial.id} variant="outline" className="text-xs">
                      {serial.serial_number}
                    </Badge>
                  ))}
                </div>
                {serialCount > 10 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto"
                    onClick={() => onAssignToNode([item.buyer_part_number], {
                      type: 'item',
                      id: item.id,
                      name: item.buyer_part_number
                    })}
                  >
                    View All {serialCount} Serials
                  </Button>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Lots</h4>
              {item.lots.map((lot) => (
                <LotNode key={lot.id} lot={lot} partNumber={item.buyer_part_number} />
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  const LotNode = ({ lot, partNumber }: { lot: ASNLot; partNumber: string }) => {
    const serialCount = getSerialCount([partNumber]);
    const serialPreview = getSerialPreview([partNumber]);

    return (
      <Card className="ml-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div>
                <h5 className="font-medium">{lot.lot_number}</h5>
                <p className="text-sm text-muted-foreground">Quantity: {lot.quantity}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">{serialCount} blocked</Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAssignToNode([partNumber], {
                  type: 'lot',
                  id: lot.id,
                  name: lot.lot_number
                })}
              >
                Assign
              </Button>
            </div>
          </div>
          
          {serialPreview.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {serialPreview.slice(0, 5).map((serial) => (
                  <Badge key={serial.id} variant="outline" className="text-xs">
                    {serial.serial_number}
                  </Badge>
                ))}
                {serialCount > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{serialCount - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const PackageNode = ({ packageData, level = 0 }: { packageData: PackageStructure; level?: number }) => {
    const isExpanded = expandedPackages.has(packageData.id);
    const serialCount = getSerialCount(packageData.partNumbers);
    const serialPreview = getSerialPreview(packageData.partNumbers);

    const getIcon = () => {
      switch (packageData.type) {
        case 'container': return <Layers className="h-5 w-5 text-primary" />;
        case 'pallet': return <Box className="h-5 w-5 text-blue-500" />;
        case 'carton': return <Package className="h-4 w-4 text-green-500" />;
        default: return <Box className="h-5 w-5" />;
      }
    };

    return (
      <Card className={`mb-4 ${level > 0 ? 'ml-6' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {packageData.children && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePackageExpansion(packageData.id)}
                  className="h-6 w-6 p-0"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              )}
              {getIcon()}
              <div>
                <CardTitle className={level > 0 ? "text-base" : "text-lg"}>{packageData.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {packageData.partNumbers.join(', ')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{serialCount} blocked</Badge>
              <Button
                size="sm"
                onClick={() => onAssignToNode(packageData.partNumbers, {
                  type: 'package',
                  id: packageData.id,
                  name: packageData.name
                })}
              >
                Assign
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="space-y-4">
            {serialPreview.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Blocked Serials (showing {Math.min(10, serialCount)} of {serialCount})</h4>
                <div className="flex flex-wrap gap-2 mb-2">
                  {serialPreview.map((serial) => (
                    <Badge key={serial.id} variant="outline" className="text-xs">
                      {serial.serial_number}
                    </Badge>
                  ))}
                </div>
                {serialCount > 10 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto"
                    onClick={() => onAssignToNode(packageData.partNumbers, {
                      type: 'package',
                      id: packageData.id,
                      name: packageData.name
                    })}
                  >
                    View All {serialCount} Serials
                  </Button>
                )}
              </div>
            )}
            
            {packageData.children?.map((child) => (
              <PackageNode key={child.id} packageData={child} level={level + 1} />
            ))}
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <Tabs defaultValue="items" className="h-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="items">Items & Lots</TabsTrigger>
        <TabsTrigger value="packages">Packing Structure</TabsTrigger>
      </TabsList>

      <TabsContent value="items" className="mt-6 space-y-4 overflow-y-auto max-h-[60vh]">
        {asn.items.map((item) => (
          <ItemNode key={item.id} item={item} />
        ))}
        
        {asn.items.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No items found</h3>
            <p className="text-muted-foreground">
              This ASN doesn't have any items defined yet.
            </p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="packages" className="mt-6 space-y-4 overflow-y-auto max-h-[60vh]">
        {mockPackageStructure.map((packageData) => (
          <PackageNode key={packageData.id} packageData={packageData} />
        ))}
      </TabsContent>
    </Tabs>
  );
};