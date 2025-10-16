import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Filter,
  Upload,
  X,
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';

// Types
interface Category {
  id: number;
  name: string;
  description: string;
  image_url?: string;
}

interface ProductImage {
  id: number;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  price: string;
  stock_quantity: number;
  category_id: number;
  category_name?: string;
  brand: string;
  colors?: string[];
  sizes?: string[];
  images?: ProductImage[];
  sku?: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  stock_quantity: string;
  category_id: string;
  brand: string;
  colors: string[];
  sizes: string[];
  images: string[];
  is_featured: boolean;
  gender?: string;
}

const AdminProducts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: "",
    stock_quantity: "",
    category_id: "",
    brand: "",
    colors: [],
    sizes: [],
    images: [],
    is_featured: false,
    gender: "none",
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // API Functions
  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products/categories', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(data.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'all') {
        const category = categories.find(c => c.id.toString() === selectedCategory);
        if (category) params.append('category', category.name);
      }

      // Prepare headers - only include Authorization if token exists and is valid
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token && token !== 'null' && token.trim() !== '') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:5000/api/products?${params}`, {
        headers: headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.data.products);
      setTotalPages(data.data.pagination.total_pages);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async () => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('auth_token');

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        category_id: parseInt(formData.category_id),
        brand: formData.brand.trim(),
        colors: formData.colors,
        sizes: formData.sizes,
        images: [], // Required by validation - images will be uploaded separately
        is_featured: formData.is_featured,
        gender: formData.gender === "none" ? undefined : formData.gender, // Only include valid gender values
      };

      console.log('Creating product with data:', productData);

      // Create product first
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Product creation error:', errorData);
        
        // Handle validation errors
        if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors = errorData.details.map(err => `${err.field}: ${err.message}`).join(', ');
          throw new Error(`Validation failed: ${validationErrors}`);
        }
        
        throw new Error(errorData.message || 'Failed to create product');
      }

      const result = await response.json();
      const productId = result.data.product.id;

      // Upload images if any were selected
      if (selectedFiles.length > 0) {
        try {
          await uploadImages(productId);
        } catch (imageError) {
          console.error('Error uploading images:', imageError);
          toast({
            title: "Warning",
            description: "Product created but some images failed to upload",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Success",
        description: "Product created successfully",
      });

      setIsAddDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      stock_quantity: "",
      category_id: "",
      brand: "",
      colors: [],
      sizes: [],
      images: [],
      is_featured: false,
      gender: "none",
    });
    setSelectedFiles([]);
    setImagePreviews([]);
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Limit to 5 files
    if (files.length > 5) {
      toast({
        title: "Too many files",
        description: "You can only upload up to 5 images",
        variant: "destructive",
      });
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    const previews: string[] = [];

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: `${file.name} is larger than 5MB`,
          variant: "destructive",
        });
        return;
      }

      validFiles.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        previews.push(e.target?.result as string);
        if (previews.length === validFiles.length) {
          setImagePreviews(previews);
        }
      };
      reader.readAsDataURL(file);
    });

    setSelectedFiles(validFiles);
  };

  const removeImage = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const uploadImages = async (productId: number) => {
    if (selectedFiles.length === 0) return;

    try {
      const formData = new FormData();
      formData.append('product_id', productId.toString());
      
      selectedFiles.forEach((file, index) => {
        formData.append('images', file);
      });

      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/products/images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload images');
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      fetchProducts();
    }
  }, [currentPage, searchTerm, selectedCategory, categories]);

  // The filtering is now handled server-side, so we just use products directly
  const filteredProducts = products;

  const getStatusColor = (isActive: boolean, stockQuantity: number) => {
    if (!isActive) {
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
    if (stockQuantity === 0) {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    }
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
  };

  const getStatusText = (isActive: boolean, stockQuantity: number) => {
    if (!isActive) return "Inactive";
    if (stockQuantity === 0) return "Out of Stock";
    return "Active";
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: "Out of Stock", color: "text-red-600" };
    if (stock < 10) return { text: "Low Stock", color: "text-yellow-600" };
    return { text: "In Stock", color: "text-green-600" };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProduct();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog and inventory
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Create a new product in your catalog
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid gap-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter product name" 
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input 
                      id="stock" 
                      type="number" 
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                      placeholder="0" 
                      min="0"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={formData.category_id} 
                      onValueChange={(value) => setFormData({...formData, category_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="brand">Brand *</Label>
                    <Input 
                      id="brand" 
                      value={formData.brand}
                      onChange={(e) => setFormData({...formData, brand: e.target.value})}
                      placeholder="Product brand" 
                      required
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value) => setFormData({...formData, gender: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="unisex">Unisex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Enter product description"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="colors">Colors (comma separated)</Label>
                    <Input
                      id="colors"
                      value={formData.colors.join(', ')}
                      onChange={(e) => setFormData({
                        ...formData, 
                        colors: e.target.value.split(',').map(c => c.trim()).filter(c => c)
                      })}
                      placeholder="Red, Blue, Black"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sizes">Sizes (comma separated)</Label>
                    <Input
                      id="sizes"
                      value={formData.sizes.join(', ')}
                      onChange={(e) => setFormData({
                        ...formData, 
                        sizes: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      })}
                      placeholder="S, M, L, XL"
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="images">Product Images (up to 5 images)</Label>
                  <div className="space-y-2">
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelection}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      Supported formats: JPEG, PNG, WebP. Maximum 5MB per image.
                    </p>
                    
                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 h-6 w-6 p-0"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="is_featured">Featured Product</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Product"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Product Management</CardTitle>
          <CardDescription>
            Search, filter, and manage your products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {products.length} products {totalPages > 1 && `(Page ${currentPage} of ${totalPages})`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading products...
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock_quantity);

                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              Array.isArray(product.images) && product.images.length > 0
                                ? `http://localhost:5000${product.images[0].image_url}`
                                : "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiBkeT0iLjNlbSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+"
                            }
                            alt={product.name}
                            className="h-10 w-10 rounded object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiBkeT0iLjNlbSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+"; 
                            }}
                          />
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.brand}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.category_name || "N/A"}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${parseFloat(product.price).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.stock_quantity}</div>
                          <div className={`text-sm ${stockStatus.color}`}>
                            {stockStatus.text}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getStatusColor(product.is_active, product.stock_quantity)}
                        >
                          {getStatusText(product.is_active, product.stock_quantity)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(product.created_at).toLocaleDateString()}
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
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Product
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {!loading && filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-medium">No products found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || selectedCategory !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Get started by adding your first product"}
                </p>
                {!searchTerm && selectedCategory === "all" && (
                  <Button
                    className="mt-4"
                    onClick={() => setIsAddDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Product
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 px-6 pb-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProducts;
