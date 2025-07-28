import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, GitBranch, Upload, Check } from "lucide-react";
import { Product } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ChildSerialsPopup } from "./ChildSerialsPopup";

interface UploadChildSerialsFormProps {
  product: Product;
  onClose: () => void;
}

export const UploadChildSerialsForm = ({ product, onClose }: UploadChildSerialsFormProps) => {
  const { toast } = useToast();
  const [showChildSerialsPopup, setShowChildSerialsPopup] = useState(false);
  const [selectedSerials, setSelectedSerials] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Mock child part numbers - in real app, this would come from the product's child parts
  const mockChildPartNumbers = ['CPU-001-X7', 'MEM-002-DDR5', 'SSD-001-NVMe'];

  const handleSelectChildSerials = (serials: any[]) => {
    setSelectedSerials(serials);
  };

  const handleUpload = async () => {
    if (selectedSerials.length === 0) {
      toast({
        title: "No serials selected",
        description: "Please select child serials to upload.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Child serials uploaded",
        description: `${selectedSerials.length} child serials uploaded successfully for ${product.buyer_part_number}.`
      });
      
      setSelectedSerials([]);
      onClose();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload child serials. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeSerial = (serialId: string) => {
    setSelectedSerials(prev => prev.filter(s => s.id !== serialId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Upload Child Serials</h2>
          <p className="text-muted-foreground">Upload child serials for {product.buyer_part_number}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Selected Child Serials ({selectedSerials.length})</Label>
            <Button 
              variant="outline" 
              onClick={() => setShowChildSerialsPopup(true)}
              className="flex items-center space-x-2"
            >
              <GitBranch className="h-4 w-4" />
              <span>Select Child Serials</span>
            </Button>
          </div>
          
          {selectedSerials.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No child serials selected</h3>
              <p className="text-muted-foreground mb-4">
                Select child serials from immediate child parts to upload.
              </p>
              <Button onClick={() => setShowChildSerialsPopup(true)}>
                Select Child Serials
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
                <div className="space-y-3">
                  {selectedSerials.map((serial) => (
                    <div key={serial.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Check className="h-4 w-4 text-primary" />
                        <div>
                          <Badge variant="outline" className="font-mono">
                            {serial.serial_number}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            Part: {serial.part_number_id}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSerial(serial.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Upload Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Selected Serials:</span>
                    <span className="ml-2 font-medium">{selectedSerials.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Target Product:</span>
                    <span className="ml-2 font-medium">{product.buyer_part_number}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose} disabled={isUploading}>
          Cancel
        </Button>
        <Button 
          onClick={handleUpload} 
          disabled={selectedSerials.length === 0 || isUploading}
          className="flex items-center space-x-2"
        >
          <Upload className="h-4 w-4" />
          <span>{isUploading ? "Uploading..." : `Upload ${selectedSerials.length} Child Serials`}</span>
        </Button>
      </div>

      <ChildSerialsPopup
        isOpen={showChildSerialsPopup}
        onClose={() => setShowChildSerialsPopup(false)}
        onSelectSerials={handleSelectChildSerials}
        childPartNumbers={mockChildPartNumbers}
      />
    </div>
  );
};