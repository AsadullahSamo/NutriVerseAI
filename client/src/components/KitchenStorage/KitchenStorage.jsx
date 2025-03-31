import React, { useState } from 'react';
import { useKitchenStorage } from './KitchenStorageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
export function KitchenStorage() {
    const { state, dispatch } = useKitchenStorage();
    const { toast } = useToast();
    const [newLocation, setNewLocation] = useState({ name: '', type: 'pantry', capacity: 0 });
    const [newItem, setNewItem] = useState({ name: '', locationId: '', quantity: 0 });
    const [showLocationDialog, setShowLocationDialog] = useState(false);
    const [showItemDialog, setShowItemDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    const handleAddLocation = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/storage-locations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newLocation),
            });
            if (!response.ok)
                throw new Error('Failed to add location');
            const location = await response.json();
            dispatch({ type: 'ADD_LOCATION', payload: location });
            setShowLocationDialog(false);
            setNewLocation({ name: '', type: 'pantry', capacity: 0 });
            toast({
                title: 'Success',
                description: 'Storage location added successfully',
            });
        }
        catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to add storage location',
                variant: 'destructive',
            });
        }
        finally {
            setLoading(false);
        }
    };
    const handleAddItem = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/storage-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newItem),
            });
            if (!response.ok)
                throw new Error('Failed to add item');
            const item = await response.json();
            dispatch({ type: 'ADD_ITEM', payload: item });
            setShowItemDialog(false);
            setNewItem({ name: '', locationId: '', quantity: 0 });
            toast({
                title: 'Success',
                description: 'Item added successfully',
            });
        }
        catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to add item',
                variant: 'destructive',
            });
        }
        finally {
            setLoading(false);
        }
    };
    const fetchSmartShoppingList = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/storage/smart-shopping-list');
            if (!response.ok)
                throw new Error('Failed to generate shopping list');
            const list = await response.json();
            dispatch({ type: 'SET_SHOPPING_LIST', payload: list });
        }
        catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to generate smart shopping list',
                variant: 'destructive',
            });
        }
        finally {
            setLoading(false);
        }
    };
    const fetchSpoilagePredictions = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/storage/spoilage-prediction');
            if (!response.ok)
                throw new Error('Failed to get spoilage predictions');
            const predictions = await response.json();
            dispatch({ type: 'SET_SPOILAGE_PREDICTIONS', payload: predictions });
        }
        catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to get spoilage predictions',
                variant: 'destructive',
            });
        }
        finally {
            setLoading(false);
        }
    };
    const fetchLayoutOptimization = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/storage/optimize-layout');
            if (!response.ok)
                throw new Error('Failed to optimize layout');
            const optimization = await response.json();
            dispatch({ type: 'SET_LAYOUT_OPTIMIZATION', payload: optimization });
        }
        catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to optimize storage layout',
                variant: 'destructive',
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Kitchen Storage Organization</h1>
        <div className="space-x-2">
          <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
            <DialogTrigger asChild>
              <Button>Add Location</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Storage Location</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={newLocation.name} onChange={(e) => setNewLocation(Object.assign(Object.assign({}, newLocation), { name: e.target.value }))}/>
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={newLocation.type} onValueChange={(value) => setNewLocation(Object.assign(Object.assign({}, newLocation), { type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pantry">Pantry</SelectItem>
                      <SelectItem value="refrigerator">Refrigerator</SelectItem>
                      <SelectItem value="freezer">Freezer</SelectItem>
                      <SelectItem value="cabinet">Cabinet</SelectItem>
                      <SelectItem value="counter">Counter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input id="capacity" type="number" value={newLocation.capacity} onChange={(e) => setNewLocation(Object.assign(Object.assign({}, newLocation), { capacity: parseInt(e.target.value) }))}/>
                </div>
                <Button onClick={handleAddLocation} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                  Add Location
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
            <DialogTrigger asChild>
              <Button>Add Item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Storage Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="itemName">Name</Label>
                  <Input id="itemName" value={newItem.name} onChange={(e) => setNewItem(Object.assign(Object.assign({}, newItem), { name: e.target.value }))}/>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select value={newItem.locationId} onValueChange={(value) => setNewItem(Object.assign(Object.assign({}, newItem), { locationId: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {state.locations.map((location) => (<SelectItem key={location.id} value={location.id.toString()}>
                          {location.name}
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" type="number" value={newItem.quantity} onChange={(e) => setNewItem(Object.assign(Object.assign({}, newItem), { quantity: parseInt(e.target.value) }))}/>
                </div>
                <Button onClick={handleAddItem} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                  Add Item
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Smart Shopping List</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchSmartShoppingList} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Generate Shopping List
            </Button>
            {state.smartShoppingList.length > 0 && (<ul className="mt-4 space-y-2">
                {state.smartShoppingList.map((item, index) => (<li key={index} className="flex justify-between">
                    <span>{item.name}</span>
                    <span className="text-sm text-gray-500">{item.reason}</span>
                  </li>))}
              </ul>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spoilage Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchSpoilagePredictions} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Check Spoilage Risk
            </Button>
            {state.spoilagePredictions.length > 0 && (<ul className="mt-4 space-y-2">
                {state.spoilagePredictions.map((prediction) => {
                const item = state.items.find((i) => i.id === prediction.itemId);
                return (<li key={prediction.itemId} className="space-y-1">
                      <div className="flex justify-between">
                        <span>{item === null || item === void 0 ? void 0 : item.name}</span>
                        <span className={prediction.daysUntilSpoilage < 7 ? 'text-red-500' : 'text-green-500'}>
                          {prediction.daysUntilSpoilage} days
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{prediction.recommendation}</p>
                    </li>);
            })}
              </ul>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Layout Optimization</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchLayoutOptimization} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Optimize Storage Layout
            </Button>
            {state.layoutOptimization.moves.length > 0 && (<ul className="mt-4 space-y-2">
                {state.layoutOptimization.moves.map((move) => {
                const item = state.items.find((i) => i.id === move.itemId);
                const location = state.locations.find((l) => l.id === move.newLocationId);
                return (<li key={move.itemId} className="space-y-1">
                      <div className="flex justify-between">
                        <span>{item === null || item === void 0 ? void 0 : item.name}</span>
                        <span>→</span>
                        <span>{location === null || location === void 0 ? void 0 : location.name}</span>
                      </div>
                      <p className="text-sm text-gray-500">{move.reason}</p>
                    </li>);
            })}
              </ul>)}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Storage Locations</CardTitle>
          </CardHeader>
          <CardContent>
            {state.locations.map((location) => (<div key={location.id} className="flex items-center justify-between p-2 border-b last:border-0">
                <div>
                  <h3 className="font-medium">{location.name}</h3>
                  <p className="text-sm text-gray-500">
                    {location.type} - {location.currentItems}/{location.capacity} items
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                // TODO: Implement edit location
            }}>
                  Edit
                </Button>
              </div>))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage Items</CardTitle>
          </CardHeader>
          <CardContent>
            {state.items.map((item) => {
            const location = state.locations.find((l) => l.id === item.locationId);
            return (<div key={item.id} className="flex items-center justify-between p-2 border-b last:border-0">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-500">
                      {location === null || location === void 0 ? void 0 : location.name} - Quantity: {item.quantity}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => {
                    // TODO: Implement edit item
                }}>
                    Edit
                  </Button>
                </div>);
        })}
          </CardContent>
        </Card>
      </div>
    </div>);
}
