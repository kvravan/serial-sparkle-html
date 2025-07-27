import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Search, CheckSquare, X } from "lucide-react";
import { ASN, SerialInventory } from "@/types";
import { useSerialStore } from "@/hooks/useSerialStore";
import { StatusBadge } from "./StatusBadge";

interface AssignSerialsPopupProps {
  asn: ASN;
  partNumbers: string[];
  assignmentContext: {
    type: 'item' | 'lot' | 'package';
    id: string;
    name: string;
  };
  open: boolean;
  onClose: () => void;
  onAssign: (serialIds: string[]) => void;
}

export const AssignSerialsPopup = ({ 
  asn, 
  partNumbers, 
  assignmentContext, 
  open, 
  onClose,
  onAssign
}: AssignSerialsPopupProps) => {
  const { getSerialsByASN, getSerialsByStatus, updateSerialStatus } = useSerialStore();
  const [blockedSerials, setBlockedSerials] = useState<SerialInventory[]>([]);
  const [inventorySerials, setInventorySerials] = useState<SerialInventory[]>([]);
  const [selectedSerials, setSelectedSerials] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 100;

  useEffect(() => {
    if (open) {
      loadSerials();
      setSelectedSerials(new Set());
    }
  }, [open, asn.id, partNumbers]);

  const loadSerials = async () => {
    const asnSerials = await getSerialsByASN(asn.id);
    const inventorySerials = await getSerialsByStatus('unassigned');
    
    // Filter by part numbers if provided
    const filterByPartNumber = (serials: SerialInventory[]) => 
      partNumbers.length > 0 
        ? serials.filter(s => partNumbers.includes(s.part_number_id))
        : serials;

    setBlockedSerials(filterByPartNumber(asnSerials.filter(s => s.status === 'blocked')));
    setInventorySerials(filterByPartNumber(inventorySerials));
  };

  const filterSerials = (serials: SerialInventory[]) => {
    return serials.filter(serial => {
      const matchesSearch = serial.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || serial.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredSerials = (serials: SerialInventory[]) => {
    const filtered = filterSerials(serials);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const getTotalPages = (serials: SerialInventory[]) => {
    const filtered = filterSerials(serials);
    return Math.ceil(filtered.length / ITEMS_PER_PAGE);
  };

  const handleSerialSelection = (serialId: string, selected: boolean) => {
    const newSelected = new Set(selectedSerials);
    if (selected) {
      newSelected.add(serialId);
    } else {
      newSelected.delete(serialId);
    }
    setSelectedSerials(newSelected);
  };

  const handleSelectAll = (serials: SerialInventory[]) => {
    const filteredSerials = getFilteredSerials(serials);
    const allSelected = filteredSerials.every(serial => selectedSerials.has(serial.id));
    
    const newSelected = new Set(selectedSerials);
    if (allSelected) {
      filteredSerials.forEach(serial => newSelected.delete(serial.id));
    } else {
      filteredSerials.forEach(serial => newSelected.add(serial.id));
    }
    setSelectedSerials(newSelected);
  };

  const handleAssignSelected = async () => {
    const serialIds = Array.from(selectedSerials);
    
    for (const serialId of serialIds) {
      await updateSerialStatus(serialId, 'blocked', asn.id);
    }
    
    onAssign(serialIds);
    onClose();
  };

  const SerialCard = ({ serial }: { serial: SerialInventory }) => {
    const isSelected = selectedSerials.has(serial.id);
    
    return (
      <Card 
        className={`cursor-pointer hover:shadow-md transition-shadow ${
          isSelected ? 'ring-2 ring-primary' : ''
        }`}
        onClick={() => handleSerialSelection(serial.id, !isSelected)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => handleSerialSelection(serial.id, checked as boolean)}
                onClick={(e) => e.stopPropagation()}
              />
              <div>
                <div className="font-mono text-sm font-medium">{serial.serial_number}</div>
                <div className="text-xs text-muted-foreground">
                  Part: {serial.part_number_id}
                </div>
              </div>
            </div>
            <StatusBadge status={serial.status} />
          </div>
          
          <div className="text-xs text-muted-foreground">
            Created: {serial.created_date.toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    );
  };

  const filteredBlockedSerials = getFilteredSerials(blockedSerials);
  const filteredInventorySerials = getFilteredSerials(inventorySerials);
  const blockedTotalPages = getTotalPages(blockedSerials);
  const inventoryTotalPages = getTotalPages(inventorySerials);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">Assign Serials</DialogTitle>
              <p className="text-muted-foreground">
                {assignmentContext.type}: {assignmentContext.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Part Numbers: {partNumbers.join(', ')}
              </p>
            </div>
            <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 h-full flex flex-col">
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
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
              
              {selectedSerials.size > 0 && (
                <Badge variant="default" className="text-sm">
                  {selectedSerials.size} selected
                </Badge>
              )}
            </div>

            {selectedSerials.size > 0 && (
              <div className="flex items-center space-x-2">
                <Button onClick={handleAssignSelected}>
                  Assign Selected ({selectedSerials.size})
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedSerials(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </div>

          <Tabs defaultValue="inventory" className="flex-1 flex flex-col">
            <TabsList>
              <TabsTrigger value="inventory">
                Available Serials
                <Badge variant="outline" className="ml-2">
                  {filterSerials(inventorySerials).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="blocked">
                Already Blocked
                <Badge variant="outline" className="ml-2">
                  {filterSerials(blockedSerials).length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inventory" className="flex-1 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Available Inventory Serials</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll(inventorySerials)}
                  className="flex items-center space-x-2"
                >
                  <CheckSquare className="h-4 w-4" />
                  <span>Select All Visible</span>
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {filteredInventorySerials.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredInventorySerials.map((serial) => (
                      <SerialCard key={serial.id} serial={serial} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No inventory serials found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? "Try adjusting your search criteria." : "No unassigned serials are available for the selected part numbers."}
                    </p>
                  </div>
                )}
              </div>
              
              {inventoryTotalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {inventoryTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(inventoryTotalPages, currentPage + 1))}
                    disabled={currentPage === inventoryTotalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="blocked" className="flex-1 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Serials Already Blocked for this ASN</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {filteredBlockedSerials.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredBlockedSerials.map((serial) => (
                      <Card key={serial.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="font-mono text-sm font-medium">{serial.serial_number}</div>
                              <div className="text-xs text-muted-foreground">
                                Part: {serial.part_number_id}
                              </div>
                            </div>
                            <StatusBadge status={serial.status} />
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            Created: {serial.created_date.toLocaleDateString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No blocked serials found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? "Try adjusting your search criteria." : "No serials are blocked for this ASN yet."}
                    </p>
                  </div>
                )}
              </div>
              
              {blockedTotalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {blockedTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(blockedTotalPages, currentPage + 1))}
                    disabled={currentPage === blockedTotalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};