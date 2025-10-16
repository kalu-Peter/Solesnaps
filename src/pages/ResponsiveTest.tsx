import { useState } from 'react';
import { useResponsive } from '@/hooks/use-responsive';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Eye, 
  EyeOff,
  Settings,
  Users,
  ShoppingCart,
  Package
} from 'lucide-react';

const ResponsiveTestPage = () => {
  const { windowWidth, isMobile, isTablet, isDesktop, isBreakpoint } = useResponsive();
  const [showDetails, setShowDetails] = useState(false);

  const getDeviceIcon = () => {
    if (isMobile) return <Smartphone className="h-5 w-5 text-blue-500" />;
    if (isTablet) return <Tablet className="h-5 w-5 text-green-500" />;
    return <Monitor className="h-5 w-5 text-purple-500" />;
  };

  const getDeviceType = () => {
    if (isMobile) return 'Mobile';
    if (isTablet) return 'Tablet';
    return 'Desktop';
  };

  const mockUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive' },
  ];

  const statsCards = [
    { title: 'Total Users', value: '2,543', icon: Users },
    { title: 'Orders', value: '1,234', icon: ShoppingCart },
    { title: 'Products', value: '456', icon: Package },
    { title: 'Settings', value: '12', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Device Info Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getDeviceIcon()}
            Responsive Design Test
          </CardTitle>
          <CardDescription>
            Testing responsive breakpoints and mobile layout adaptations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Device Type</p>
              <Badge variant={isMobile ? 'default' : 'secondary'}>
                {getDeviceType()}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Width</p>
              <p className="text-sm text-muted-foreground">{windowWidth}px</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Breakpoints</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant={isBreakpoint('sm') ? 'default' : 'outline'} className="text-xs">
                  SM
                </Badge>
                <Badge variant={isBreakpoint('md') ? 'default' : 'outline'} className="text-xs">
                  MD
                </Badge>
                <Badge variant={isBreakpoint('lg') ? 'default' : 'outline'} className="text-xs">
                  LG
                </Badge>
                <Badge variant={isBreakpoint('xl') ? 'default' : 'outline'} className="text-xs">
                  XL
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Is Mobile</p>
              <Badge variant={isMobile ? 'destructive' : 'secondary'}>
                {isMobile ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Actions</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full sm:w-auto"
              >
                {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showDetails ? 'Hide' : 'Show'} Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards - Mobile Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                    <p className="text-lg font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Form Elements - Responsive Layout */}
      <Card>
        <CardHeader>
          <CardTitle>Responsive Form Layout</CardTitle>
          <CardDescription>Testing form responsiveness across devices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <Input placeholder="Search users..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">Apply Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table - Mobile Responsive */}
      <Card>
        <CardHeader>
          <CardTitle>Responsive Data Table</CardTitle>
          <CardDescription>
            Table layout adapts to screen size - columns hide on smaller screens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Name</TableHead>
                  <TableHead className="min-w-[200px]">Email</TableHead>
                  <TableHead className="min-w-[80px] hidden sm:table-cell">Role</TableHead>
                  <TableHead className="min-w-[80px] hidden md:table-cell">Status</TableHead>
                  <TableHead className="min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{user.name}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">
                          {user.role} • {user.status}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={user.status === 'Active' ? 'default' : 'destructive'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        {isMobile ? null : (
                          <Button variant="destructive" size="sm">
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile-specific content */}
      {isMobile && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Mobile-Only Content</CardTitle>
            <CardDescription className="text-blue-600">
              This card only appears on mobile devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700">
              This demonstrates conditional rendering based on screen size. On mobile devices,
              we can show simplified layouts, stack elements vertically, or hide less important information.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Desktop-specific content */}
      {isDesktop && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-purple-800">Desktop-Only Content</CardTitle>
            <CardDescription className="text-purple-600">
              This card only appears on desktop devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-700">
              On desktop, we have more screen real estate to show detailed information,
              multiple columns, and advanced features.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detailed breakpoint info */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Breakpoint Details</CardTitle>
            <CardDescription>Detailed information about current responsive state</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Breakpoint Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Small (640px+):</span>
                    <Badge variant={isBreakpoint('sm') ? 'default' : 'outline'}>
                      {isBreakpoint('sm') ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium (768px+):</span>
                    <Badge variant={isBreakpoint('md') ? 'default' : 'outline'}>
                      {isBreakpoint('md') ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Large (1024px+):</span>
                    <Badge variant={isBreakpoint('lg') ? 'default' : 'outline'}>
                      {isBreakpoint('lg') ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Extra Large (1280px+):</span>
                    <Badge variant={isBreakpoint('xl') ? 'default' : 'outline'}>
                      {isBreakpoint('xl') ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Device Categories</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Mobile (&lt;640px):</span>
                    <Badge variant={isMobile ? 'default' : 'outline'}>
                      {isMobile ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Tablet (640px-1023px):</span>
                    <Badge variant={isTablet ? 'default' : 'outline'}>
                      {isTablet ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Desktop (1024px+):</span>
                    <Badge variant={isDesktop ? 'default' : 'outline'}>
                      {isDesktop ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResponsiveTestPage;