import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Package, Box, Layers } from "lucide-react";
import { ASN } from "@/types";
import { useSerialStore } from "@/hooks/useSerialStore";
import { ASNHierarchyView } from "./ASNHierarchyView";
import { SerialGridView } from "./SerialGridView";
import { AssignSerialsPopup } from "./AssignSerialsPopup";

interface ASNSerialAssignmentPopupProps {
  asn: ASN;
  open: boolean;
  onClose: () => void;
}

export const ASNSerialAssignmentPopup = ({ asn, open, onClose }: ASNSerialAssignmentPopupProps) => {
  const { getSerialsByASN } = useSerialStore();
  const [blockedSerials, setBlockedSerials] = useState(0);
  const [showSerialGrid, setShowSerialGrid] = useState<{
    show: boolean;
    partNumbers?: string[];
    assignmentContext?: {
      type: 'item' | 'lot' | 'package';
      id: string;
      name: string;
    };
  }>({ show: false });
  const [showAssignPopup, setShowAssignPopup] = useState<{
    show: boolean;
    partNumbers: string[];
    assignmentContext: {
      type: 'item' | 'lot' | 'package';
      id: string;
      name: string;
    };
  } | null>(null);

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
    setShowAssignPopup({
      show: true,
      partNumbers,
      assignmentContext: context
    });
  };

  const handleCloseSerialGrid = () => {
    setShowSerialGrid({ show: false });
  };

  const handleCloseAssignPopup = () => {
    setShowAssignPopup(null);
  };

  const handleAssignComplete = (serialIds: string[]) => {
    console.log('Assigned serials:', serialIds);
    loadBlockedSerials(); // Refresh the blocked serials count
    setShowAssignPopup(null);
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
            showBackButton={true}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center space-x-4">
              <div>
                <DialogTitle className="text-2xl font-bold">Assign Serials</DialogTitle>
                <p className="text-muted-foreground">{asn.asn_number}</p>
              </div>
              <Badge variant="secondary" className="ml-auto">
                {blockedSerials} blocked serials
              </Badge>
            </div>
          </DialogHeader>
          
          <Tabs defaultValue="hierarchy" className="flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="hierarchy">ASN Hierarchy View</TabsTrigger>
              <TabsTrigger value="grid">Serial Grid View</TabsTrigger>
            </TabsList>

            <TabsContent value="hierarchy" className="mt-6 flex-1 overflow-hidden">
              <ASNHierarchyView
                asn={asn}
                onAssignToNode={handleAssignToNode}
              />
            </TabsContent>

            <TabsContent value="grid" className="mt-6 flex-1 overflow-hidden">
              <SerialGridView
                asn={asn}
                onClose={onClose}
                showBackButton={false}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Assign Serials Popup */}
      {showAssignPopup && (
        <AssignSerialsPopup
          asn={asn}
          partNumbers={showAssignPopup.partNumbers}
          assignmentContext={showAssignPopup.assignmentContext}
          open={showAssignPopup.show}
          onClose={handleCloseAssignPopup}
          onAssign={handleAssignComplete}
        />
      )}
    </>
  );
};