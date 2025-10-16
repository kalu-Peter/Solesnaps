import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, Trash2, Plus, Search, MapPin, Phone, DollarSign, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface DeliveryLocation {
  id: number;
  city_name: string;
  shopping_amount: number;
  pickup_location: string;
  pickup_phone: string;
  pickup_status: 'active' | 'inactive' | 'maintenance';
}

interface LocationFormData {
  city_name: string;
  shopping_amount: string;
  pickup_location: string;
  pickup_phone: string;
  pickup_status: 'active' | 'inactive' | 'maintenance';
}

const AdminDeliveryLocations: React.FC = () => {
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<DeliveryLocation | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<DeliveryLocation | null>(null);
  const [authError, setAuthError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<LocationFormData>({
    city_name: '',
    shopping_amount: '',
    pickup_location: '',
    pickup_phone: '',
    pickup_status: 'active'
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
      
      const response = await fetch('http://localhost:5000/api/delivery', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch delivery locations');
      }

      const data = await response.json();
      setLocations(data.data.locations);
    } catch (error: any) {
      console.error('Error fetching delivery locations:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch delivery locations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createLocation = async () => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
      
      if (!token) {
        setAuthError(true);
        toast({
          title: "Authentication Required",
          description: "Please log in to continue.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      const locationData = {
        city_name: formData.city_name.trim(),
        shopping_amount: parseFloat(formData.shopping_amount),
        pickup_location: formData.pickup_location.trim(),
        pickup_phone: formData.pickup_phone.trim(),
        pickup_status: formData.pickup_status
      };

      const response = await fetch('http://localhost:5000/api/delivery', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create delivery location');
      }

      toast({
        title: "Success",
        description: "Delivery location created successfully",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchLocations();
    } catch (error: any) {
      console.error('Error creating delivery location:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create delivery location",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateLocation = async () => {
    if (!selectedLocation) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');

      const locationData = {
        city_name: formData.city_name.trim(),
        shopping_amount: parseFloat(formData.shopping_amount),
        pickup_location: formData.pickup_location.trim(),
        pickup_phone: formData.pickup_phone.trim(),
        pickup_status: formData.pickup_status
      };

      const response = await fetch(`http://localhost:5000/api/delivery/${selectedLocation.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update delivery location');
      }

      toast({
        title: "Success",
        description: "Delivery location updated successfully",
      });

      setIsEditDialogOpen(false);
      setSelectedLocation(null);
      resetForm();
      fetchLocations();
    } catch (error: any) {
      console.error('Error updating delivery location:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update delivery location",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteLocation = async () => {
    if (!locationToDelete) return;

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');

      const response = await fetch(`http://localhost:5000/api/delivery/${locationToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to deactivate delivery location');
      }

      toast({
        title: "Success",
        description: "Delivery location deactivated successfully",
      });

      setIsDeleteDialogOpen(false);
      setLocationToDelete(null);
      fetchLocations();
    } catch (error: any) {
      console.error('Error deactivating delivery location:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate delivery location",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      city_name: '',
      shopping_amount: '',
      pickup_location: '',
      pickup_phone: '',
      pickup_status: 'active'
    });
    setSelectedLocation(null);
  };

  const openEditDialog = (location: DeliveryLocation) => {
    setSelectedLocation(location);
    setFormData({
      city_name: location.city_name,
      shopping_amount: location.shopping_amount.toString(),
      pickup_location: location.pickup_location,
      pickup_phone: location.pickup_phone,
      pickup_status: location.pickup_status
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (location: DeliveryLocation) => {
    setLocationToDelete(location);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLocation) {
      updateLocation();
    } else {
      createLocation();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLocations = locations.filter(location =>
    location.city_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.pickup_location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchLocations();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Delivery Locations</h1>
          <p className="text-muted-foreground">
            Manage pickup locations and delivery costs
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Locations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Locations</CardTitle>
          <CardDescription>
            {filteredLocations.length} location(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading locations...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>City</TableHead>
                  <TableHead>Delivery Cost</TableHead>
                  <TableHead>Pickup Location</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {location.city_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        KSH {location.shopping_amount.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>{location.pickup_location}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {location.pickup_phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(location.pickup_status)}>
                        {location.pickup_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEditDialog(location)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Location
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => openDeleteDialog(location)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedLocation ? 'Edit Delivery Location' : 'Create New Delivery Location'}
            </DialogTitle>
            <DialogDescription>
              {selectedLocation ? 'Update the delivery location details.' : 'Add a new pickup location and delivery cost.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="city_name">City Name *</Label>
              <Input
                id="city_name"
                value={formData.city_name}
                onChange={(e) => setFormData({ ...formData, city_name: e.target.value })}
                placeholder="Enter city name"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="shopping_amount">Delivery Cost (KSH) *</Label>
              <Input
                id="shopping_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.shopping_amount}
                onChange={(e) => setFormData({ ...formData, shopping_amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="pickup_location">Pickup Location *</Label>
              <Input
                id="pickup_location"
                value={formData.pickup_location}
                onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                placeholder="Enter pickup location address"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="pickup_phone">Pickup Phone *</Label>
              <Input
                id="pickup_phone"
                value={formData.pickup_phone}
                onChange={(e) => setFormData({ ...formData, pickup_phone: e.target.value })}
                placeholder="+254XXXXXXXXX"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="pickup_status">Status</Label>
              <Select 
                value={formData.pickup_status} 
                onValueChange={(value: 'active' | 'inactive' | 'maintenance') => 
                  setFormData({ ...formData, pickup_status: value })
                }
              >
                <SelectTrigger className="text-black">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="text-black">Active</SelectItem>
                  <SelectItem value="inactive" className="text-black">Inactive</SelectItem>
                  <SelectItem value="maintenance" className="text-black">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 
                  (selectedLocation ? "Updating..." : "Creating...") : 
                  (selectedLocation ? "Update Location" : "Create Location")
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the delivery location for "{locationToDelete?.city_name}". 
              The location will be marked as inactive but not permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteLocation} className="bg-destructive text-destructive-foreground">
              Deactivate Location
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDeliveryLocations;