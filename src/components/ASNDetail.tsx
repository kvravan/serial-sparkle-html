import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, Package, Truck, Settings, Send } from "lucide-react";
import { ASN } from "@/types";
import { SerialAssignment } from "./SerialAssignment";
import { ASNManageSerials } from "./ASNManageSerials";
import { useSerialStore } from "@/hooks/useSerialStore";

interface ASNDetailProps {
  asn: ASN;
  onClose: () => void;
}

export const ASNDetail = ({ asn, onClose }: ASNDetailProps) => {
  const [showSerialAssignment, setShowSerialAssignment] = useState(false);
  const [showAssignmentPopup, setShowAssignmentPopup] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const { getSerialsByASN, getSerialsByPartNumber } = useSerialStore();
  const [assignedCounts, setAssignedCounts] = useState<{[key: string]: number}>({});

  // Calculate assigned serial counts for each item
  React.useEffect(() => {
    const calculateAssignedCounts = async () => {
      const counts: {[key: string]: number} = {};
      for (const item of asn.items) {
        const assignedSerials = await getSerialsByPartNumber(item.part_number_id);
        counts[item.id] = assignedSerials.filter(s => s.asn_id === asn.id && s.status === 'assigned').length;
      }
      setAssignedCounts(counts);
    };
    calculateAssignedCounts();
  }, [asn.items, asn.id, getSerialsByPartNumber]);

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

  if (showSerialAssignment) {
    return (
      <SerialAssignment 
        asn={asn}
        onClose={() => setShowSerialAssignment(false)}
      />
    );
  }

  if (showAssignmentPopup) {
    return (
      <ASNManageSerials
        asn={asn}
        open={true}
        onClose={() => {
          setShowAssignmentPopup(false);
          setSelectedItem(null);
        }}
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
          <FileText className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">{asn.asn_number}</h2>
          <Badge variant={getStatusVariant(asn.status) as any}>
            {asn.status.charAt(0).toUpperCase() + asn.status.slice(1)}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="header" className="space-y-4">
        <TabsList>
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="header" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>ASN Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ASN Number</label>
                  <p className="mt-1 font-mono text-sm">{asn.asn_number}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant={getStatusVariant(asn.status) as any}>
                      {asn.status.charAt(0).toUpperCase() + asn.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Ship Date</label>
                    <p className="mt-1">{asn.ship_date?.toLocaleDateString() || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Delivery Date</label>
                    <p className="mt-1">{asn.delivery_date?.toLocaleDateString() || 'Not set'}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                    <p className="mt-1">{asn.created_date.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Updated Date</label>
                    <p className="mt-1">{asn.updated_date.toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{asn.items.length}</div>
                  <div className="text-sm text-muted-foreground">Total Items</div>
                </div>
                
                  <div className="space-y-3">
                   <div className="flex items-center justify-between text-sm">
                     <span>Total Quantity</span>
                     <Badge variant="outline">
                       {asn.items.reduce((sum, item) => sum + item.ship_quantity, 0)}
                     </Badge>
                   </div>
                   <div className="flex items-center justify-between text-sm">
                     <span>Assigned Serials</span>
                     <Badge variant="success">
                       {Object.values(assignedCounts).reduce((sum, count) => sum + count, 0)}
                     </Badge>
                   </div>
                   <div className="flex items-center justify-between text-sm">
                     <span>Pending Assignment</span>
                     <Badge variant="warning">
                       {asn.items.reduce((sum, item) => sum + item.ship_quantity, 0) - 
                        Object.values(assignedCounts).reduce((sum, count) => sum + count, 0)}
                     </Badge>
                   </div>
                 </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ASN Items Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 text-sm font-medium">Part Number</th>
                      <th className="p-4 text-sm font-medium">Ship Quantity</th>
                      <th className="p-4 text-sm font-medium">Lots</th>
                      <th className="p-4 text-sm font-medium">Assigned Serials</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asn.items.map((item) => (
                      <tr key={item.id} className="border-b last:border-b-0 hover:bg-muted/50">
                        <td className="p-4 font-mono text-sm">{item.buyer_part_number}</td>
                        <td className="p-4 text-sm">{item.ship_quantity}</td>
                        <td className="p-4">
                          <Badge variant="outline">{item.lots.length}</Badge>
                        </td>
                        <td className="p-4">
                           <Badge variant="success">{assignedCounts[item.id] || 0}</Badge>
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        {asn.status === 'draft' && (
          <>
            <Button 
               variant="outline"
               onClick={() => {
                 setSelectedItem(null);
                 setShowAssignmentPopup(true);
               }}
               className="flex items-center space-x-2"
             >
               <Settings className="h-4 w-4" />
               <span>Manage Serials</span>
             </Button>
            <Button className="flex items-center space-x-2">
              <Send className="h-4 w-4" />
              <span>Submit ASN</span>
            </Button>
          </>
        )}
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};