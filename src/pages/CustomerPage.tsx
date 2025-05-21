import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, UserPlus, Users, Mail, Phone, Home, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  fetchCustomers, 
  addCustomer, 
  updateCustomer,
  deleteCustomer,
  Customer,
  CustomerAddress,
  useApiWithToast
} from "@/services/api";

// Form schema for customer address
const customerAddressSchema = z.object({
  street: z
    .string()
    .min(5, "Street address must be at least 5 characters")
    .max(100, "Street address too long"),
  city: z
    .string()
    .min(2, "City must be at least 2 characters")
    .max(50, "City too long")
    .regex(/^[a-zA-Z\s]+$/, "City must contain only letters")
    .default(""),
  state: z
    .string()
    .min(2, "State must be at least 2 characters")
    .max(50, "State too long")
    .default(""),
  zipCode: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, "Invalid US zip code"),
  country: z
    .string()
    .min(2, "Country name too short")
    .max(50, "Country name too long")
    .regex(/^[a-zA-Z\s]+$/, "Country must contain only letters")
    .default(""),
});

// Form schema for customer matching the provided schema
const customerFormSchema = z.object({
  name: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be at most 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces"),

  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Enter a valid international phone number"),
  address: customerAddressSchema
});

// Type for form values
type CustomerFormValues = z.infer<typeof customerFormSchema>;

const CustomerPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Use the API with toast functionality
  const {
    fetchCustomersWithToast,
    addCustomerWithToast,
    updateCustomerWithToast,
    deleteCustomerWithToast
  } = useApiWithToast();

  // Fetch customers
  const {
    data: customers = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
    refetchOnWindowFocus: false,
  });

  // Add customer mutation
  const addCustomerMutation = useMutation({
    mutationFn: (newCustomer: CustomerFormValues) => {
      // Convert form values to required Customer type
      const customerData: Omit<Customer, '_id'> = {
        name: newCustomer.name,
        phone: newCustomer.phone,
        address: {
          street: newCustomer.address.street,
          city: newCustomer.address.city,
          state: newCustomer.address.state,
          zipCode: newCustomer.address.zipCode,
          country: newCustomer.address.country,
        }
      };
      return addCustomerWithToast(customerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsAddDialogOpen(false);
    },
  });

  // Edit customer mutation
  const editCustomerMutation = useMutation({
    mutationFn: (updatedCustomer: CustomerFormValues) => {
      if (selectedCustomer?._id) {
        // Convert form values to required Customer type with _id
        const customerData: Partial<Customer> & { _id: string } = {
          _id: selectedCustomer._id,
          name: updatedCustomer.name,
          phone: updatedCustomer.phone,
          address: {
            street: updatedCustomer.address.street,
            city: updatedCustomer.address.city,
            state: updatedCustomer.address.state,
            zipCode: updatedCustomer.address.zipCode,
            country: updatedCustomer.address.country,
          }
        };
        return updateCustomerWithToast(customerData);
      }
      throw new Error("Customer ID not found");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsEditDialogOpen(false);
    },
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: (customerId: string) => {
      return deleteCustomerWithToast(customerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsDeleteDialogOpen(false);
    },
  });

  // Form for adding/editing customer with nested address fields
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: ""
      }
    },
  });

  // Handle adding a new customer
  const handleAddCustomer = (values: CustomerFormValues) => {
    addCustomerMutation.mutate(values);
  };

  // Handle editing a customer
  const handleEditCustomer = (values: CustomerFormValues) => {
    editCustomerMutation.mutate(values);
  };

  // Handle deleting a customer
  const handleDeleteCustomer = () => {
    if (selectedCustomer?._id) {
      deleteCustomerMutation.mutate(selectedCustomer._id);
    }
  };

  // Open edit dialog and populate form with customer data including address
  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    form.reset({
      name: customer.name,
      phone: customer.phone,
      address: {
        street: customer.address.street,
        city: customer.address.city,
        state: customer.address.state,
        zipCode: customer.address.zipCode,
        country: customer.address.country
      }
    });
    setIsEditDialogOpen(true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  // Format address for display
  const formatAddress = (address: CustomerAddress): string => {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country
    ].filter(Boolean);
    
    return parts.join(", ");
  };

  // Filter customers based on search query
  const filteredCustomers = searchQuery
    ? customers.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        (customer.address && 
          Object.values(customer.address)
            .some(value => 
              value && value.toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
      )
    : customers;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Customer Management</h1>
        <div className="flex gap-4">
          <div className="relative flex-1 md:min-w-[300px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => {
            form.reset(); // Reset form
            setIsAddDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Customers
            <span className="ml-2 text-sm text-muted-foreground font-normal">
              ({filteredCustomers.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">Loading customers...</div>
          ) : isError ? (
            <div className="flex justify-center py-8 text-red-500">Error loading customers</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-lg font-medium">No customers found</p>
              <p className="text-muted-foreground">
                {searchQuery ? "Try adjusting your search query" : "Start by adding a new customer"}
              </p>
              {!searchQuery && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    form.reset();
                    setIsAddDialogOpen(true);
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Your First Customer
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead className="hidden lg:table-cell">Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer._id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{customer.phone}</TableCell>
                      <TableCell className="hidden lg:table-cell max-w-[300px] truncate">
                        {formatAddress(customer.address)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openEditDialog(customer)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openDeleteDialog(customer)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Customer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new customer to the system.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddCustomer)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input {...field} placeholder="Enter customer name" className="pl-9" />
                          <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input {...field} placeholder="Enter customer phone (e.g., +11234567890)" className="pl-9" />
                          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">Address Information</h3>
                <FormField
                  control={form.control}
                  name="address.street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input {...field} placeholder="Enter street address" className="pl-9" />
                          <Home className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address.zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter ZIP code (e.g., 12345 or 12345-6789)" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address.country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input {...field} placeholder="Enter country" className="pl-9" />
                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={addCustomerMutation.isPending}>
                  {addCustomerMutation.isPending ? "Adding..." : "Add Customer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update the customer information.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditCustomer)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input {...field} placeholder="Enter customer name" className="pl-9" />
                          <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input {...field} placeholder="Enter customer phone (e.g., +11234567890)" className="pl-9" />
                          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">Address Information</h3>
                <FormField
                  control={form.control}
                  name="address.street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input {...field} placeholder="Enter street address" className="pl-9" />
                          <Home className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address.zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter ZIP code (e.g., 12345 or 12345-6789)" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address.country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input {...field} placeholder="Enter country" className="pl-9" />
                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={editCustomerMutation.isPending}>
                  {editCustomerMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCustomer?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCustomer}
              className="bg-red-500 hover:bg-red-600"
              disabled={deleteCustomerMutation.isPending}
            >
              {deleteCustomerMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomerPage;