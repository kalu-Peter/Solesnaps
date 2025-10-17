import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Tag, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar as CalendarIcon,
  Copy,
  Eye,
  MoreHorizontal,
  Filter,
  Search
} from 'lucide-react';
import { couponService, Coupon, formatCouponValue, isCouponActive, isCouponExpired } from '@/services/couponService';

interface CouponFormData {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description: string;
  minimum_order_amount?: number;
  maximum_discount_amount?: number;
  usage_limit?: number;
  is_active: boolean;
  starts_at: string;
  expires_at: string;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'inactive'>('all');
  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    type: 'percentage',
    value: 0,
    description: '',
    minimum_order_amount: undefined,
    maximum_discount_amount: undefined,
    usage_limit: undefined,
    is_active: true,
    starts_at: new Date().toISOString().split('T')[0],
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await couponService.getAllCoupons();
      setCoupons(response.data.coupons);
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    try {
      setLoading(true);
      
      const couponData = {
        ...formData,
        starts_at: new Date(formData.starts_at).toISOString(),
        expires_at: new Date(formData.expires_at).toISOString(),
      };

      if (editingCoupon) {
        await couponService.updateCoupon(editingCoupon.id, couponData);
      } else {
        await couponService.createCoupon(couponData);
      }

      await fetchCoupons();
      setShowCreateDialog(false);
      setEditingCoupon(null);
      resetForm();
    } catch (err) {
      console.error('Failed to save coupon:', err);
      setError(err instanceof Error ? err.message : 'Failed to save coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      await couponService.deleteCoupon(id);
      await fetchCoupons();
    } catch (err) {
      console.error('Failed to delete coupon:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete coupon');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      value: 0,
      description: '',
      minimum_order_amount: undefined,
      maximum_discount_amount: undefined,
      usage_limit: undefined,
      is_active: true,
      starts_at: new Date().toISOString().split('T')[0],
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      description: coupon.description,
      minimum_order_amount: coupon.minimum_order_amount,
      maximum_discount_amount: coupon.maximum_discount_amount,
      usage_limit: coupon.usage_limit,
      is_active: coupon.is_active,
      starts_at: new Date(coupon.starts_at).toISOString().split('T')[0],
      expires_at: new Date(coupon.expires_at).toISOString().split('T')[0],
    });
    setShowCreateDialog(true);
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code: result });
  };

  const getStatusBadge = (coupon: Coupon) => {
    if (!coupon.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (isCouponExpired(coupon)) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (isCouponActive(coupon)) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
    return <Badge variant="outline">Scheduled</Badge>;
  };

  const filteredCoupons = coupons
    .filter(coupon => {
      if (searchTerm) {
        return coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
               coupon.description.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return true;
    })
    .filter(coupon => {
      switch (filterStatus) {
        case 'active':
          return isCouponActive(coupon);
        case 'expired':
          return isCouponExpired(coupon);
        case 'inactive':
          return !coupon.is_active;
        default:
          return true;
      }
    });

  const totalSavings = coupons.reduce((total, coupon) => {
    // This would need to be calculated from actual order data
    return total + (coupon.used_count * (coupon.type === 'fixed' ? coupon.value : 0));
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coupons</h1>
          <p className="text-muted-foreground">Manage discount coupons and promotional codes</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingCoupon(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="code">Coupon Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="Enter coupon code"
                      />
                      <Button type="button" variant="outline" onClick={generateCouponCode}>
                        Generate
                      </Button>
                    </div>
                  </div>
                  <div className="w-32">
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.type} onValueChange={(value: 'percentage' | 'fixed') => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="value">
                      {formData.type === 'percentage' ? 'Percentage (%)' : 'Amount (KES)'}
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                      min="0"
                      max={formData.type === 'percentage' ? 100 : undefined}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the coupon"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Conditions */}
              <div className="space-y-4">
                <h4 className="font-medium">Conditions</h4>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="min_order">Minimum Order Amount (KES)</Label>
                    <Input
                      id="min_order"
                      type="number"
                      value={formData.minimum_order_amount || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        minimum_order_amount: e.target.value ? Number(e.target.value) : undefined 
                      })}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="max_discount">Maximum Discount Amount (KES)</Label>
                    <Input
                      id="max_discount"
                      type="number"
                      value={formData.maximum_discount_amount || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        maximum_discount_amount: e.target.value ? Number(e.target.value) : undefined 
                      })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <Label htmlFor="usage_limit">Usage Limit</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    value={formData.usage_limit || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      usage_limit: e.target.value ? Number(e.target.value) : undefined 
                    })}
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <Separator />

              {/* Validity */}
              <div className="space-y-4">
                <h4 className="font-medium">Validity</h4>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="starts_at">Start Date</Label>
                    <Input
                      id="starts_at"
                      type="date"
                      value={formData.starts_at}
                      onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="expires_at">End Date</Label>
                    <Input
                      id="expires_at"
                      type="date"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateOrUpdate} disabled={loading}>
                  {loading ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coupons.filter(c => isCouponActive(c)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coupons.reduce((total, c) => total + c.used_count, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {totalSavings.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search coupons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Coupons ({filteredCoupons.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading coupons...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No coupons found. Create your first coupon to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCoupons.map((coupon) => (
                <div key={coupon.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="font-mono">
                        {coupon.code}
                      </Badge>
                      {getStatusBadge(coupon)}
                      <span className="text-lg font-semibold">
                        {formatCouponValue(coupon)} off
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {coupon.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Used: {coupon.used_count}/{coupon.usage_limit || '∞'}</span>
                      <span>
                        Valid: {format(new Date(coupon.starts_at), 'MMM dd')} - {format(new Date(coupon.expires_at), 'MMM dd, yyyy')}
                      </span>
                      {coupon.minimum_order_amount && (
                        <span>Min order: KES {coupon.minimum_order_amount}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(coupon.code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(coupon)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(coupon.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}