import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Upload, CalendarIcon, Plus, X } from "lucide-react";
import { useSerialStore } from "@/hooks/useSerialStore";
import { SerialInventory, Product } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ImportSerialsFormProps {
  product: Product;
  onClose: () => void;
}

export const ImportSerialsForm = ({ product, onClose }: ImportSerialsFormProps) => {
  const { addSerials } = useSerialStore();
  const { toast } = useToast();
  
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date>();
  const [attributes, setAttributes] = useState<{key: string, value: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const addAttribute = () => {
    setAttributes(prev => [...prev, { key: '', value: '' }]);
  };

  const updateAttribute = (index: number, field: 'key' | 'value', value: string) => {
    setAttributes(prev => prev.map((attr, i) => i === index ? { ...attr, [field]: value } : attr));
  };

  const removeAttribute = (index: number) => {
    setAttributes(prev => prev.filter((_, i) => i !== index));
  };

  const createAttributesJson = (attrs: {key: string, value: string}[]): Record<string, any> => {
    return attrs.reduce((acc, attr) => {
      if (attr.key.trim() && attr.value.trim()) {
        acc[attr.key.trim()] = attr.value.trim();
      }
      return acc;
    }, {} as Record<string, any>);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a valid CSV file.",
        variant: "destructive"
      });
    }
  };

  const handleImport = async () => {
    if (!csvFile) return;
    
    setLoading(true);
    try {
      const text = await csvFile.text();
      const lines = text.trim().split('\n').filter(line => line.trim());
      const serials: SerialInventory[] = [];
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          serials.push({
            id: `serial_${Date.now()}_${Math.random()}`,
            supplier_id: 'sup1',
            buyer_id: 'buy1',
            part_number_id: product.id,
            serial_number: trimmedLine,
            status: 'unassigned',
            expiry_date: expiryDate,
            attributes_json: createAttributesJson(attributes),
            created_date: new Date(),
            updated_date: new Date(),
            created_by: 'user',
            updated_by: 'user'
          });
        }
      }
      
      if (serials.length === 0) {
        toast({
          title: "No data",
          description: "No valid serial numbers found in the file.",
          variant: "destructive"
        });
        return;
      }

      await addSerials(serials);
      toast({
        title: "Serials imported",
        description: `${serials.length} serial numbers imported successfully.`
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import serial numbers.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Import Serial Numbers</h2>
          <p className="text-muted-foreground">{product.buyer_part_number}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import from CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <div className="space-y-2">
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="w-auto mx-auto"
                />
                <p className="text-sm text-muted-foreground">
                  Select a CSV file with one serial number per line
                </p>
              </div>
            </div>
            {csvFile && (
              <div className="text-sm text-muted-foreground">
                Selected file: {csvFile.name}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Expiry Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expiryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expiryDate ? format(expiryDate, "PPP") : "Select expiry date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expiryDate}
                  onSelect={setExpiryDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Custom Attributes (Optional)</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addAttribute}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            {attributes.map((attr, index) => (
              <div key={index} className="flex space-x-2">
                <Input
                  placeholder="Key"
                  value={attr.key}
                  onChange={(e) => updateAttribute(index, 'key', e.target.value)}
                />
                <Input
                  placeholder="Value"
                  value={attr.value}
                  onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeAttribute(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          
          <Button 
            onClick={handleImport} 
            disabled={!csvFile || loading}
            className="w-full"
          >
            {loading ? "Importing..." : "Import Serial Numbers"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};