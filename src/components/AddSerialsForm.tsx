import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Plus, Hash, FileText, CalendarIcon, Upload, X } from "lucide-react";
import { useSerialStore } from "@/hooks/useSerialStore";
import { SerialInventory, Product } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AddSerialsFormProps {
  product: Product;
  onClose: () => void;
}

export const AddSerialsForm = ({ product, onClose }: AddSerialsFormProps) => {
  const { addSerials } = useSerialStore();
  const { toast } = useToast();
  
  // Single entry form
  const [singleSerial, setSingleSerial] = useState("");
  const [expiryDate, setExpiryDate] = useState<Date>();
  const [attributes, setAttributes] = useState<{key: string, value: string}[]>([]);
  
  // Bulk generation form
  const [prefix, setPrefix] = useState("");
  const [startNumber, setStartNumber] = useState("");
  const [endNumber, setEndNumber] = useState("");
  const [bulkExpiryDate, setBulkExpiryDate] = useState<Date>();
  const [bulkAttributes, setBulkAttributes] = useState<{key: string, value: string}[]>([]);
  
  
  const [loading, setLoading] = useState(false);

  const addAttribute = (setAttr: typeof setAttributes) => {
    setAttr(prev => [...prev, { key: '', value: '' }]);
  };

  const updateAttribute = (index: number, field: 'key' | 'value', value: string, setAttr: typeof setAttributes) => {
    setAttr(prev => prev.map((attr, i) => i === index ? { ...attr, [field]: value } : attr));
  };

  const removeAttribute = (index: number, setAttr: typeof setAttributes) => {
    setAttr(prev => prev.filter((_, i) => i !== index));
  };

  const createAttributesJson = (attrs: {key: string, value: string}[]): Record<string, any> => {
    return attrs.reduce((acc, attr) => {
      if (attr.key.trim() && attr.value.trim()) {
        acc[attr.key.trim()] = attr.value.trim();
      }
      return acc;
    }, {} as Record<string, any>);
  };

  const handleSingleAdd = async () => {
    if (!singleSerial.trim()) return;
    
    setLoading(true);
    try {
      const newSerial: SerialInventory = {
        id: `serial_${Date.now()}`,
        supplier_id: 'sup1',
        buyer_id: 'buy1',
        part_number_id: product.id,
        serial_number: singleSerial.trim(),
        status: 'unassigned',
        expiry_date: expiryDate,
        attributes_json: createAttributesJson(attributes),
        created_date: new Date(),
        updated_date: new Date(),
        created_by: 'user',
        updated_by: 'user'
      };
      
      await addSerials([newSerial]);
      setSingleSerial("");
      setExpiryDate(undefined);
      setAttributes([]);
      toast({
        title: "Serial added",
        description: `Serial number ${singleSerial} added successfully.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add serial number.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkGenerate = async () => {
    const start = parseInt(startNumber);
    const end = parseInt(endNumber);
    
    if (!prefix.trim() || isNaN(start) || isNaN(end) || start > end) {
      toast({
        title: "Invalid input",
        description: "Please provide valid prefix and number range.",
        variant: "destructive"
      });
      return;
    }
    
    if (end - start > 1000) {
      toast({
        title: "Range too large",
        description: "Maximum 1000 serials can be generated at once.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const serials: SerialInventory[] = [];
      for (let i = start; i <= end; i++) {
        const paddedNumber = i.toString().padStart(3, '0');
        serials.push({
          id: `serial_${Date.now()}_${i}`,
          supplier_id: 'sup1',
          buyer_id: 'buy1',
          part_number_id: product.id,
          serial_number: `${prefix}${paddedNumber}`,
          status: 'unassigned',
          expiry_date: bulkExpiryDate,
          attributes_json: createAttributesJson(bulkAttributes),
          created_date: new Date(),
          updated_date: new Date(),
          created_by: 'user',
          updated_by: 'user'
        });
      }
      
      await addSerials(serials);
      setPrefix("");
      setStartNumber("");
      setEndNumber("");
      setBulkExpiryDate(undefined);
      setBulkAttributes([]);
      
      toast({
        title: "Serials generated",
        description: `${serials.length} serial numbers generated successfully.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate serial numbers.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const getBulkPreview = () => {
    const start = parseInt(startNumber);
    const end = parseInt(endNumber);
    
    if (!prefix.trim() || isNaN(start) || isNaN(end) || start > end) {
      return [];
    }
    
    const preview = [];
    const count = Math.min(end - start + 1, 5);
    
    for (let i = 0; i < count; i++) {
      const num = start + i;
      const paddedNumber = num.toString().padStart(3, '0');
      preview.push(`${prefix}${paddedNumber}`);
    }
    
    if (end - start + 1 > 5) {
      preview.push('...');
    }
    
    return preview;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Add Serial Numbers</h2>
          <p className="text-muted-foreground">{product.buyer_part_number}</p>
        </div>
      </div>

      <Tabs defaultValue="single" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Single Entry</span>
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center space-x-2">
            <Hash className="h-4 w-4" />
            <span>Bulk Generate</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Add Single Serial Number</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serial-number">Serial Number</Label>
                <Input
                  id="serial-number"
                  placeholder="Enter serial number..."
                  value={singleSerial}
                  onChange={(e) => setSingleSerial(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSingleAdd()}
                />
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
                    onClick={() => addAttribute(setAttributes)}
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
                      onChange={(e) => updateAttribute(index, 'key', e.target.value, setAttributes)}
                    />
                    <Input
                      placeholder="Value"
                      value={attr.value}
                      onChange={(e) => updateAttribute(index, 'value', e.target.value, setAttributes)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeAttribute(index, setAttributes)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <Button 
                onClick={handleSingleAdd} 
                disabled={!singleSerial.trim() || loading}
                className="w-full"
              >
                {loading ? "Adding..." : "Add Serial Number"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Generate Serial Numbers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prefix">Prefix</Label>
                  <Input
                    id="prefix"
                    placeholder="e.g., CPU001X7"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start">Start Number</Label>
                  <Input
                    id="start"
                    type="number"
                    placeholder="1"
                    value={startNumber}
                    onChange={(e) => setStartNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">End Number</Label>
                  <Input
                    id="end"
                    type="number"
                    placeholder="100"
                    value={endNumber}
                    onChange={(e) => setEndNumber(e.target.value)}
                  />
                </div>
              </div>
              
              {getBulkPreview().length > 0 && (
                <div className="space-y-2">
                  <Label>Preview ({parseInt(endNumber) - parseInt(startNumber) + 1 || 0} total)</Label>
                  <div className="flex flex-wrap gap-2">
                    {getBulkPreview().map((serial, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {serial}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Expiry Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !bulkExpiryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {bulkExpiryDate ? format(bulkExpiryDate, "PPP") : "Select expiry date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={bulkExpiryDate}
                      onSelect={setBulkExpiryDate}
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
                    onClick={() => addAttribute(setBulkAttributes)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
                {bulkAttributes.map((attr, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      placeholder="Key"
                      value={attr.key}
                      onChange={(e) => updateAttribute(index, 'key', e.target.value, setBulkAttributes)}
                    />
                    <Input
                      placeholder="Value"
                      value={attr.value}
                      onChange={(e) => updateAttribute(index, 'value', e.target.value, setBulkAttributes)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeAttribute(index, setBulkAttributes)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <Button 
                onClick={handleBulkGenerate} 
                disabled={!prefix.trim() || !startNumber || !endNumber || loading}
                className="w-full"
              >
                {loading ? "Generating..." : `Generate ${parseInt(endNumber) - parseInt(startNumber) + 1 || 0} Serial Numbers`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};