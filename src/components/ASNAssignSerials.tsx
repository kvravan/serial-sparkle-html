import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Grid3X3 } from "lucide-react";
import { ASN } from "@/types";
import { useSerialStore } from "@/hooks/useSerialStore";
import { ASNHierarchyViewTabs } from "./ASNHierarchyViewTabs";
import { SerialGridView } from "./SerialGridView";

interface ASNAssignSerialsProps {
  asn: ASN;
  open: boolean;
  onClose: () => void;
}

export const ASNAssignSerials = ({ asn, open, onClose }: ASNAssignSerialsProps) => {
  const { getSerialsByASN } = useSerialStore();
  const [blockedSerials, setBlockedSerials] = useState(0);
  const [activeTab, setActiveTab] = useState("hierarchy");
  const [serialGridFilters, setSerialGridFilters] = useState<{
    partNumbers?: string[];
    assignmentContext?: {
      type: 'item' | 'lot' | 'package';
      id: string;
      name: string;
    };
  }>({});

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
    setSerialGridFilters({
      partNumbers,
      assignmentContext: context
    });
    setActiveTab("serial-grid");
  };

  const handleBackToHierarchy = () => {
    setActiveTab("hierarchy");
    setSerialGridFilters({});
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">Assign Serials</DialogTitle>
              <p className="text-muted-foreground">{asn.asn_number}</p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              {blockedSerials} blocked serials
            </Badge>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 flex-shrink-0">
            <TabsTrigger value="hierarchy" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>ASN Hierarchy View</span>
            </TabsTrigger>
            <TabsTrigger value="serial-grid" className="flex items-center space-x-2">
              <Grid3X3 className="h-4 w-4" />
              <span>Serial Grid View</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hierarchy" className="mx-6 mt-6 flex-1 flex flex-col min-h-0">
            <ASNHierarchyViewTabs
              asn={asn}
              onAssignToNode={handleAssignToNode}
            />
          </TabsContent>

          <TabsContent value="serial-grid" className="mx-6 mt-6 flex-1 flex flex-col min-h-0">
            <SerialGridView
              asn={asn}
              partNumbers={serialGridFilters.partNumbers}
              assignmentContext={serialGridFilters.assignmentContext}
              onClose={handleBackToHierarchy}
              contextLaunched={false}
              showBackButton={true}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};