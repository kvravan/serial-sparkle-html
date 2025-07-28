import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Plus, Download, Upload, Grid, List, Eye, Trash2, GitBranch } from "lucide-react";
import { Product, SerialInventory, SerialStatus } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { useSerialStore } from "@/hooks/useSerialStore";
import { AddSerialsForm } from "./AddSerialsForm";
import { ImportSerialsForm } from "./ImportSerialsForm";
import { SerialDetail } from "./SerialDetail";
import { UploadChildSerialsForm } from "./UploadChildSerialsForm";

interface SerialManagementProps {
  product: Product;
  onClose: () => void;
}

export const SerialManagement = ({ product, onClose }: SerialManagementProps) => {
  const [serials, setSerials] = useState<SerialInventory[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [showUploadChildSerialsForm, setShowUploadChildSerialsForm] = useState(false);
  const [selectedSerial, setSelectedSerial] = useState<SerialInventory | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [previousViewMode, setPreviousViewMode] = useState<"grid" | "table">("grid");
  const { getSerialsByPartNumber, store } = useSerialStore();

  useEffect(() => {
    const loadSerials = async () => {
      const productSerials = await getSerialsByPartNumber(product.id);
      setSerials(productSerials);
    };
    loadSerials();
  }, [product.id, getSerialsByPartNumber, store]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<SerialStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const filteredSerials = serials.filter(serial => {
    const matchesSearch = serial.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || serial.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteSerial = (serialId: string) => {
    // TODO: Implement delete functionality with serialStore
    setSerials(serials.filter(s => s.id !== serialId));
  };

  const statusCounts = {
    total: serials.length,
    assigned: serials.filter(s => s.status === 'assigned').length,
    blocked: serials.filter(s => s.status === 'blocked').length,
    unassigned: serials.filter(s => s.status === 'unassigned').length,
  };

  if (showAddForm) {
    return (
      <AddSerialsForm
        product={product}
        onClose={() => {
          setShowAddForm(false);
          setActiveTab("serials");
        }}
      />
    );
  }

  if (showImportForm) {
    return (
      <ImportSerialsForm
        product={product}
        onClose={() => {
          setShowImportForm(false);
          setActiveTab("serials");
        }}
      />
    );
  }

  if (showUploadChildSerialsForm) {
    return (
      <UploadChildSerialsForm
        product={product}
        onClose={() => {
          setShowUploadChildSerialsForm(false);
          setActiveTab("serials");
        }}
      />
    );
  }

  if (selectedSerial) {
    return (
      <SerialDetail
        serial={selectedSerial}
        onClose={() => {
          console.log('SerialDetail closed, returning to tab:', activeTab, 'viewMode:', previousViewMode);
          setSelectedSerial(null);
          setViewMode(previousViewMode);
        }}
      />
    );
  }

  const handleViewSerial = (serial: SerialInventory, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('View serial clicked:', serial.id, serial.serial_number, 'current tab:', activeTab, 'viewMode:', viewMode);
    setPreviousViewMode(viewMode);
    setSelectedSerial(serial);
  };

  const SerialCard = ({ serial }: { serial: SerialInventory }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="font-mono text-sm font-medium">{serial.serial_number}</div>
          <StatusBadge status={serial.status} />
        </div>
        
        {serial.expiry_date && (
          <div className="text-sm text-muted-foreground mb-2">
            Expires: {serial.expiry_date.toLocaleDateString()}
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Created: {serial.created_date.toLocaleDateString()}</span>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 hover:bg-primary/10"
              onClick={(e) => handleViewSerial(serial, e)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {serial.status === 'unassigned' && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteSerial(serial.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
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
          <h2 className="text-2xl font-bold">Manage Serials</h2>
          <p className="text-muted-foreground">{product.buyer_part_number}</p>
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
          
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SerialStatus | "all")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
            </SelectContent>
          </Select>
          
          <Badge variant="secondary" className="text-sm">
            {filteredSerials.length} serials
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              console.log('Upload Child Serials clicked');
              setShowUploadChildSerialsForm(true);
            }}
          >
            <GitBranch className="h-4 w-4 mr-2" />
            Upload Child Serials
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              console.log('Import clicked');
              setShowImportForm(true);
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          
           <Button 
             size="sm" 
             onClick={() => {
               console.log('Add Serials clicked');
               setShowAddForm(true);
             }}
           >
             <Plus className="h-4 w-4 mr-2" />
             Add Serials
           </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="serials">Serial Numbers</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
               <CardContent className="p-6">
                 <div className="text-2xl font-bold">{statusCounts.total}</div>
                 <p className="text-xs text-muted-foreground">Total Serials</p>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="p-6">
                 <div className="text-2xl font-bold text-success">{statusCounts.assigned}</div>
                 <p className="text-xs text-muted-foreground">Assigned</p>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="p-6">
                 <div className="text-2xl font-bold text-warning">{statusCounts.blocked}</div>
                 <p className="text-xs text-muted-foreground">Blocked</p>
               </CardContent>
             </Card>
             <Card>
               <CardContent className="p-6">
                 <div className="text-2xl font-bold">{statusCounts.unassigned}</div>
                 <p className="text-xs text-muted-foreground">Available</p>
               </CardContent>
             </Card>
          </div>
        </TabsContent>

        <TabsContent value="serials" className="space-y-4">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSerials.map((serial) => (
                <SerialCard key={serial.id} serial={serial} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="p-4 text-sm font-medium">Serial Number</th>
                        <th className="p-4 text-sm font-medium">Status</th>
                        <th className="p-4 text-sm font-medium">Expiry Date</th>
                        <th className="p-4 text-sm font-medium">Created</th>
                        <th className="p-4 text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSerials.map((serial) => (
                        <tr key={serial.id} className="border-b last:border-b-0 hover:bg-muted/50">
                          <td className="p-4 font-mono text-sm">{serial.serial_number}</td>
                          <td className="p-4">
                            <StatusBadge status={serial.status} />
                          </td>
                          <td className="p-4 text-sm">
                            {serial.expiry_date ? serial.expiry_date.toLocaleDateString() : '-'}
                          </td>
                          <td className="p-4 text-sm">{serial.created_date.toLocaleDateString()}</td>
                          <td className="p-4">
                            <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                              onClick={(e) => handleViewSerial(serial, e)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                              {serial.status === 'unassigned' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteSerial(serial.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
          
          {filteredSerials.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-lg font-medium mb-2">No serials found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or add new serial numbers.
              </p>
              <Button onClick={() => {
                setShowAddForm(true);
                setActiveTab("serials");
              }}>Add Serial Numbers</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Serial number history and audit trail will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};