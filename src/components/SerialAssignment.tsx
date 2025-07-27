import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ArrowLeft, Package, CheckCircle } from "lucide-react";
import { ASN, SerialInventory } from "@/types";
import { useSerialStore } from "@/hooks/useSerialStore";
import { StatusBadge } from "./StatusBadge";

interface SerialAssignmentProps {
  asn: ASN;
  onClose: () => void;
}

export const SerialAssignment = ({ asn, onClose }: SerialAssignmentProps) => {
  const { store, getSerialsByStatus, updateSerialStatus } = useSerialStore();
  const [availableSerials, setAvailableSerials] = useState<SerialInventory[]>([]);
  const [blockedSerials, setBlockedSerials] = useState<SerialInventory[]>([]);
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSerialData();
  }, []);

  const loadSerialData = async () => {
    try {
      const unassignedSerials = await getSerialsByStatus('unassigned');
      const blockedSerials = await getSerialsByStatus('blocked');
      
      setAvailableSerials(unassignedSerials);
      setBlockedSerials(blockedSerials);
    } catch (error) {
      console.error('Failed to load serial data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleAssignSerials = async () => {
    try {
      // Update serial status to blocked and assign to ASN
      for (const serialId of selectedSerials) {
        await updateSerialStatus(serialId, 'blocked', asn.id);
      }
      
      // Reload data to reflect changes
      await loadSerialData();
      setSelectedSerials([]);
    } catch (error) {
      console.error('Failed to assign serials:', error);
    }
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
            <Package className="h-4 w-4 mr-2" />
            Import Serials
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading serials...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Available Serials Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Available Serials ({filteredAvailableSerials.length})</span>
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
                    All serials are currently assigned or blocked.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Blocked Serials Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Blocked Serials ({filteredBlockedSerials.length})</span>
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
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No blocked serials</h3>
                  <p className="text-muted-foreground">
                    Assign serials from available inventory to block them for this ASN.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};