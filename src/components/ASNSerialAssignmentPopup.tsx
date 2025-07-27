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
              <DialogTitle className="text-2xl font-bold">Assign Serials</DialogTitle>
              <p className="text-muted-foreground">{asn.asn_number}</p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              {blockedSerials} blocked serials
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <ASNHierarchyView
            asn={asn}
            onAssignToNode={handleAssignToNode}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};