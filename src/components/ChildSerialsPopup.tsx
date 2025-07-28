import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Package, Check } from "lucide-react";
import { SerialInventory } from "@/types";
import { useSerialStore } from "@/hooks/useSerialStore";

interface ChildSerialsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSerials: (serials: SerialInventory[]) => void;
  childPartNumbers: string[];
}

export const ChildSerialsPopup = ({ isOpen, onClose, onSelectSerials, childPartNumbers }: ChildSerialsPopupProps) => {
  const { store } = useSerialStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSerials, setSelectedSerials] = useState<Set<string>>(new Set());
  const [filteredSerials, setFilteredSerials] = useState<SerialInventory[]>([]);

  const serials = store?.serials || [];

  useEffect(() => {
    // Filter serials that belong to child parts and are unassigned
    const childSerials = serials.filter(serial => 
      childPartNumbers.includes(serial.part_number_id) && 
      serial.status === 'unassigned'
    );

    // Apply search filter
    const filtered = childSerials.filter(serial =>
      serial.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredSerials(filtered);
  }, [serials, childPartNumbers, searchTerm]);

  const handleSerialToggle = (serialId: string) => {
    const newSelected = new Set(selectedSerials);
    if (newSelected.has(serialId)) {
      newSelected.delete(serialId);
    } else {
      newSelected.add(serialId);
    }
    setSelectedSerials(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedSerials.size === filteredSerials.length) {
      setSelectedSerials(new Set());
    } else {
      setSelectedSerials(new Set(filteredSerials.map(s => s.id)));
    }
  };

  const handleConfirm = () => {
    const selected = filteredSerials.filter(serial => selectedSerials.has(serial.id));
    onSelectSerials(selected);
    setSelectedSerials(new Set());
    setSearchTerm("");
    onClose();
  };

  const handleCancel = () => {
    setSelectedSerials(new Set());
    setSearchTerm("");
    onClose();
  };

  const getPartNumber = (partNumberId: string) => {
    const product = store?.products.find(p => p.id === partNumberId);
    return product?.buyer_part_number || partNumberId;
  };

  const groupedSerials = filteredSerials.reduce((acc, serial) => {
    const partNumber = getPartNumber(serial.part_number_id);
    if (!acc[partNumber]) acc[partNumber] = [];
    acc[partNumber].push(serial);
    return acc;
  }, {} as Record<string, SerialInventory[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Child Serials</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search serials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={filteredSerials.length === 0}
              >
                {selectedSerials.size === filteredSerials.length ? "Deselect All" : "Select All"}
              </Button>
              <Badge variant="secondary">
                {selectedSerials.size} of {filteredSerials.length} selected
              </Badge>
            </div>
          </div>

          <ScrollArea className="h-96 border rounded-lg p-4">
            {Object.keys(groupedSerials).length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No serials found</h3>
                <p className="text-muted-foreground">
                  No unassigned serials found for the child parts.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedSerials).map(([partNumber, partSerials]) => (
                  <div key={partNumber}>
                    <div className="flex items-center space-x-2 mb-3">
                      <Package className="h-4 w-4 text-primary" />
                      <h4 className="font-medium">{partNumber}</h4>
                      <Badge variant="outline" className="text-xs">
                        {partSerials.length} serials
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 ml-6">
                      {partSerials.map((serial) => (
                        <div
                          key={serial.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedSerials.has(serial.id) 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => handleSerialToggle(serial.id)}
                        >
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={selectedSerials.has(serial.id)}
                              onChange={() => handleSerialToggle(serial.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-mono text-sm truncate">{serial.serial_number}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {serial.status}
                                </Badge>
                                {serial.expiry_date && (
                                  <span className="text-xs text-muted-foreground">
                                    Exp: {serial.expiry_date.toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            {selectedSerials.has(serial.id) && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={selectedSerials.size === 0}>
              Add {selectedSerials.size} Child Serials
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};