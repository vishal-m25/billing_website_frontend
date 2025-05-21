
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { fetchParts, addPart, Part, updatePart, deletePart } from "@/services/api";
import { useApiWithToast } from "@/services/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Plus, Search, PackageOpen, Edit, Check } from "lucide-react";

// Form schema
const partSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  partNumber: z.string().min(2, { message: "Part number is required" }),
  description: z.string().optional(),
  category: z.string().min(1, { message: "Category is required" }),
  price: z.coerce.number().positive({ message: "Price must be positive" }),
  costPrice: z.coerce.number().positive({ message: "Cost price must be positive" }),
  stockQuantity: z.coerce.number().int().nonnegative({ message: "Quantity must be a positive integer" }),
  manufacturer: z.string().min(1, { message: "Manufacturer is required" }),
  location: z.string().optional(),
});

type PartFormValues = z.infer<typeof partSchema>;

const InventoryPage = () => {
  const { toast } = useToast();
  const api = useApiWithToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch parts data
  const {
    data: parts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["parts"],
    queryFn: fetchParts,
  });

  // Setup form
  const form = useForm<PartFormValues>({
    resolver: zodResolver(partSchema),
    defaultValues: {
      name: "",
      partNumber: "",
      description: "",
      category: "",
      price: 0,
      costPrice: 0,
      stockQuantity: 0,
      manufacturer: "",
      location: "",
    },
  });

  // Reset form to default values
  const resetForm = () => {
    form.reset({
      name: "",
      partNumber: "",
      description: "",
      category: "",
      price: 0,
      costPrice: 0,
      stockQuantity: 0,
      manufacturer: "",
      location: "",
    });
  };

  // Add part mutation
  const addPartMutation = useMutation({
    mutationFn: (newPart: Omit<Part, '_id' | 'createdAt' | 'updatedAt'>) => {
      return api.addPartWithToast(newPart);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parts"] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  // Update part mutation
  const updatePartMutation = useMutation({
    mutationFn: (updatedPart: Partial<Part> & { _id: string }) => {
      return api.updatePartWithToast(updatedPart);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parts"] });
      setIsDialogOpen(false);
      setIsEditMode(false);
      setSelectedPart(null);
      resetForm();
    },
  });

  const deletePartMutation = useMutation({
    mutationFn: (id: string) => {return api.deletedataWithToast(id)},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parts"] });
      setIsDialogOpen(false);
      setIsEditMode(false);
      setSelectedPart(null);
      resetForm();
    },
  });

  const handleDelete = (id: string) => {
    deletePartMutation.mutate(id);
    closeDialog();
  };

  // Filter parts based on search term
  const filteredParts = parts.filter(
    (part) =>
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open dialog for adding new part
  const openAddDialog = () => {
    setIsEditMode(false);
    setSelectedPart(null);
    resetForm();
    setIsDialogOpen(true);
  };

  // Open dialog for editing part
  const openEditDialog = (part: Part) => {
    setIsEditMode(true);
    setSelectedPart(part);
    form.reset({
      name: part.name,
      partNumber: part.partNumber,
      description: part.description || "",
      category: part.category,
      price: part.price,
      costPrice: part.costPrice,
      stockQuantity: part.stockQuantity,
      manufacturer: part.manufacturer,
      location: part.location || "",
    });
    setIsDialogOpen(true);
  };

  // Close dialog
  const closeDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setSelectedPart(null);
    resetForm();
  };

  // Submit form handler
  const onSubmit = (data: PartFormValues) => {
    if (isEditMode && selectedPart?._id) {
      updatePartMutation.mutate({
        _id: selectedPart._id,
        ...data,
      });
    } else {
      addPartMutation.mutate(data as Omit<Part, "_id" | "createdAt" | "updatedAt">);
    }
  };

  // Categories for select
  const categories = [
    "Engine",
    "Brakes",
    "Suspension",
    "Transmission",
    "Electrical",
    "Cooling",
    "Body",
    "Interior",
    "Ignition",
    "Fuel System",
    "Exhaust",
    "Other",
  ];

  if (isLoading) {
    return <div className="text-center py-10">Loading inventory data...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        Error loading inventory data. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Inventory Management
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" /> Add New Part
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Update Part" : "Add New Part"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? "Update the details of the selected part"
                  : "Enter the details of the new part to add to inventory"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Part Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Part name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="partNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Part Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Part number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Part description"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="manufacturer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manufacturer</FormLabel>
                        <FormControl>
                          <Input placeholder="Manufacturer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selling Price ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="costPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost Price ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stockQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Shelf/Bin location" {...field} />
                      </FormControl>
                      <FormDescription>
                        Where this part is stored in your warehouse
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                {isEditMode && (
                    <Button
                      disabled={updatePartMutation.isPending}
                      onClick={() => handleDelete(selectedPart._id!) }

                    >
                      {deletePartMutation.isPending ? "Deleting.." : "Delete Part"}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addPartMutation.isPending || updatePartMutation.isPending}
                  >
                    {addPartMutation.isPending || updatePartMutation.isPending
                      ? "Saving..."
                      : isEditMode
                      ? "Update Part"
                      : "Save Part"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Inventory</CardTitle>
          <CardDescription>
            Manage your spare parts inventory
          </CardDescription>
          <div className="mt-2 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search parts by name, number, category..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Part Number</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Cost Price</TableHead>
                  <TableHead className="text-right">Sell Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <PackageOpen className="h-10 w-10 mb-2" />
                        {searchTerm ? (
                          <p>No parts match your search criteria</p>
                        ) : (
                          <>
                            <p className="font-medium">No parts in inventory</p>
                            <p className="text-sm">Add parts to get started</p>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParts.map((part) => (
                    <TableRow key={part._id}>
                      <TableCell className="font-medium">{part.name}</TableCell>
                      <TableCell>{part.partNumber}</TableCell>
                      <TableCell>{part.category}</TableCell>
                      <TableCell>{part.manufacturer}</TableCell>
                      <TableCell>{part.location}</TableCell>
                      <TableCell className="text-right">
                      ₹{((part.costPrice ?? 0) * 100).toFixed(2)}

                      </TableCell>
                      <TableCell className="text-right">
                      ₹{(part.price ??0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {part.stockQuantity}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(part)}
                        >
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {filteredParts.length} parts found
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default InventoryPage;
