import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Search, Package, Plus } from "lucide-react";
import { ASN, SerialInventory } from "@/types";
import { StatusBadge } from "./StatusBadge";

interface SerialAssignmentProps {
  asn: ASN;
  onClose: () => void;
}

// Mock data for available serials
const mockAvailableSerials: SerialInventory[] = [
  {
    id: '4',
    supplier_id: 'sup1',
    buyer_id: 'buy1',
    part_number_id: '1',
    serial_number: 'CPU001X7004',
    status: 'unassigned',
    created_date: new Date('2024-01-18'),
    updated_date: new Date('2024-01-18'),
    created_by: 'admin',
    updated_by: 'admin'
  },
  {
    id: '5',
    supplier_id: 'sup1',
    buyer_id: 'buy1',
    part_number_id: '1',
    serial_number: 'CPU001X7005',
    status: 'unassigned',
    created_date: new Date('2024-01-19'),
    updated_date: new Date('2024-01-19'),
    created_by: 'admin',
    updated_by: 'admin'
  }
];

const mockBlockedSerials: SerialInventory[] = [
  {
    id: '3',
    supplier_id: 'sup1',
    buyer_id: 'buy1',
    part_number_id: '1',
    serial_number: 'CPU001X7003',
    status: 'blocked',
    created_date: new Date('2024-01-17'),
    updated_date: new Date('2024-01-22'),
    created_by: 'admin',
    updated_by: 'admin'
  }
];

export const SerialAssignment = ({ asn, onClose }: SerialAssignmentProps) => {
  const [availableSerials, setAvailableSerials] = useState(mockAvailableSerials);
  const [blockedSerials, setBlockedSerials] = useState(mockBlockedSerials);
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAvailableSerials = availableSerials.filter(serial =>
    serial.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBlockedSerials = blockedSerials.filter(serial =>
    serial.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSerialSelection = (serialId: string, checked: boolean) => {
    if (checked) {
      setSelectedSerials([...selectedSerials, serialId]);
    } else {
      setSelectedSerials(selectedSerials.filter(id => id !== serialId));
    }
  };

  const handleAssignSerials = () => {
    // Move selected serials from available to blocked
    const serialsToMove = availableSerials.filter(serial => 
      selectedSerials.includes(serial.id)
    );
    
    const updatedSerials = serialsToMove.map(serial => ({
      ...serial,
      status: 'blocked' as const
    }));

    setBlockedSerials([...blockedSerials, ...updatedSerials]);
    setAvailableSerials(availableSerials.filter(serial => 
      !selectedSerials.includes(serial.id)
    ));
    setSelectedSerials([]);
  };

  const SerialCard = ({ serial, selectable = false }: { 
    serial: SerialInventory; 
    selectable?: boolean; 
  }) => (
    <Card className={`hover:shadow-md transition-shadow ${
      selectable && selectedSerials.includes(serial.id) ? 'ring-2 ring-primary' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            {selectable && (
              <Checkbox
                checked={selectedSerials.includes(serial.id)}
                onCheckedChange={(checked) => 
                  handleSerialSelection(serial.id, checked as boolean)
                }
              />
            )}
            <div className="font-mono text-sm font-medium">{serial.serial_number}</div>
          </div>
          <StatusBadge status={serial.status} />
        </div>
        
        <div className="text-xs text-muted-foreground">
          Created: {serial.created_date.toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Assign Serials</h2>
          <p className="text-muted-foreground">{asn.asn_number}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search serial numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {selectedSerials.length > 0 && (
            <Badge variant="default" className="text-sm">
              {selectedSerials.length} selected
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {selectedSerials.length > 0 && (
            <Button onClick={handleAssignSerials}>
              Assign Selected ({selectedSerials.length})
            </Button>
          )}
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Import Serials
          </Button>
        </div>
      </div>

      <Tabs defaultValue="blocked" className="space-y-4">
        <TabsList>
          <TabsTrigger value="blocked">
            Blocked Serials
            <Badge variant="outline" className="ml-2">
              {filteredBlockedSerials.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="inventory">
            Inventory Serials
            <Badge variant="outline" className="ml-2">
              {filteredAvailableSerials.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blocked" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Serials Blocked for this ASN</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredBlockedSerials.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBlockedSerials.map((serial) => (
                    <SerialCard key={serial.id} serial={serial} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No blocked serials</h3>
                  <p className="text-muted-foreground">
                    Assign serials from inventory to block them for this ASN.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Available Inventory Serials</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredAvailableSerials.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAvailableSerials.map((serial) => (
                    <SerialCard 
                      key={serial.id} 
                      serial={serial} 
                      selectable={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No available serials</h3>
                  <p className="text-muted-foreground">
                    All serials for this part number are currently assigned or blocked.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {selectedSerials.length > 0 && (
          <Button onClick={handleAssignSerials}>
            Assign Selected Serials
          </Button>
        )}
      </div>
    </div>
  );
};