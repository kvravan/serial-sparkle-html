import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Save, X, Plus, CalendarIcon } from "lucide-react";
import { SerialInventory, SerialStatus } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { useSerialStore } from "@/hooks/useSerialStore";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SerialDetailProps {
  serial: SerialInventory;
  onClose: () => void;
}

export const SerialDetail = ({ serial: initialSerial, onClose }: SerialDetailProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [serial, setSerial] = useState(initialSerial);
  const [editForm, setEditForm] = useState({
    serial_number: initialSerial.serial_number,
    status: initialSerial.status,
    expiry_date: initialSerial.expiry_date,
    attributes: Object.entries(initialSerial.attributes_json || {}).map(([key, value]) => ({
      key,
      value: String(value)
    }))
  });
  
  const { updateSerial } = useSerialStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Check if serial can be edited (only unassigned and blocked serials)
  const canEdit = serial.status === 'unassigned' || serial.status === 'blocked';

  const addAttribute = () => {
    setEditForm(prev => ({
      ...prev,
      attributes: [...prev.attributes, { key: '', value: '' }]
    }));
  };

  const updateAttribute = (index: number, field: 'key' | 'value', value: string) => {
    setEditForm(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) => 
        i === index ? { ...attr, [field]: value } : attr
      )
    }));
  };

  const removeAttribute = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    console.log('Save clicked, form data:', editForm);
    
    if (!editForm.serial_number.trim()) {
      toast({
        title: "Validation Error",
        description: "Serial number is required.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create attributes object from array
      const attributesJson = editForm.attributes.reduce((acc, attr) => {
        if (attr.key.trim() && attr.value.trim()) {
          acc[attr.key.trim()] = attr.value.trim();
        }
        return acc;
      }, {} as Record<string, any>);

      const updatedSerial: SerialInventory = {
        ...serial,
        serial_number: editForm.serial_number.trim(),
        status: editForm.status,
        expiry_date: editForm.expiry_date,
        attributes_json: attributesJson,
        updated_date: new Date(),
        updated_by: 'user'
      };

      await updateSerial(updatedSerial);
      setSerial(updatedSerial);
      setIsEditing(false);
      
      toast({
        title: "Serial Updated",
        description: "Serial number has been updated successfully.",
      });
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: "Failed to update serial number.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setEditForm({
      serial_number: serial.serial_number,
      status: serial.status,
      expiry_date: serial.expiry_date,
      attributes: Object.entries(serial.attributes_json || {}).map(([key, value]) => ({
        key,
        value: String(value)
      }))
    });
    setIsEditing(false);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Edit clicked for serial:', serial.id);
    setIsEditing(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Serial Details</h2>
            <p className="text-muted-foreground">View and manage serial information</p>
          </div>
        </div>
        
        {canEdit && !isEditing && (
          <Button onClick={handleEditClick} variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
        
        {isEditing && (
          <div className="flex space-x-2">
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save"}
            </Button>
            <Button onClick={handleCancel} variant="outline" disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Serial Number</Label>
              {isEditing ? (
                <Input
                  value={editForm.serial_number}
                  onChange={(e) => setEditForm(prev => ({ ...prev, serial_number: e.target.value }))}
                  placeholder="Enter serial number"
                />
              ) : (
                <p className="font-mono text-lg">{serial.serial_number}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              {isEditing ? (
                <Select 
                  value={editForm.status} 
                  onValueChange={(value: SerialStatus) => setEditForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <StatusBadge status={serial.status} />
              )}
            </div>

            <div className="space-y-2">
              <Label>Expiry Date</Label>
              {isEditing ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editForm.expiry_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editForm.expiry_date ? format(editForm.expiry_date, "PPP") : "Select expiry date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editForm.expiry_date}
                      onSelect={(date) => setEditForm(prev => ({ ...prev, expiry_date: date }))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <p>{serial.expiry_date ? format(serial.expiry_date, "PPP") : "Not set"}</p>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Created Date</Label>
                <p>{format(serial.created_date, "PPP")}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Updated Date</Label>
                <p>{format(serial.updated_date, "PPP")}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Created By</Label>
                <p>{serial.created_by}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Updated By</Label>
                <p>{serial.updated_by}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Custom Attributes
              {isEditing && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addAttribute}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-2">
                {editForm.attributes.map((attr, index) => (
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
                {editForm.attributes.length === 0 && (
                  <p className="text-muted-foreground text-sm">No custom attributes</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(serial.attributes_json || {}).length > 0 ? (
                  Object.entries(serial.attributes_json || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <Label className="text-muted-foreground">{key}</Label>
                      <Badge variant="outline">{String(value)}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No custom attributes</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {serial.asn_id && (
        <Card>
          <CardHeader>
            <CardTitle>ASN Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label className="text-muted-foreground">ASN ID</Label>
              <p className="font-mono">{serial.asn_id}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};