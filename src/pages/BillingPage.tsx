
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SearchableSelect
} from "@/components/ui/select";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { 
  fetchParts, 
  fetchCustomers, 
  Customer, 
  InvoiceItem, 
  Invoice 
} from "@/services/api";
import { useApiWithToast } from "@/services/api";
import { Plus, Trash2, Save, UserPlus, Receipt } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import BillPreview from "@/components/BillPreview";




// Customer form schema
const customerSchema = z.object({
  name: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be at most 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces")
    .default(''),



  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Enter a valid international phone number"),

  address: z.object({
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
      .regex(/^\d{6}/, "Invalid US zip code"),

    country: z
      .string()
      .min(2, "Country name too short")
      .max(50, "Country name too long")
      .regex(/^[a-zA-Z\s]+$/, "Country must contain only letters")
      .default(""),

  }),
});




const BillingPage = () => {
  const { toast } = useToast();
  const api = useApiWithToast();
  const [isBillPreviewOpen, setIsBillPreviewOpen] = useState(false);
  const [currentBillData, setCurrentBillData] = useState<any>(null);

  // Customer form dialog state
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  
  // Customer form setup
  type CustomerFormValues = z.infer<typeof customerSchema>;

  // ✅ useForm Setup
  const customerForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
    },
  });

  // Fetch parts data
  const {
    data: parts = [],
    isLoading: isLoadingParts,
    error: partsError,
  } = useQuery({
    queryKey: ["parts"],
    queryFn: fetchParts,
  });

  // Fetch customers data
  const {
    data: customers = [],
    isLoading: isLoadingCustomers,
    error: customersError,
    refetch: refetchCustomers,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  // Invoice state
  const [selectedCustomer, setSelectedCustomer] = useState<any>({});
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [selectedPart, setSelectedPart] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(8); // 8% tax rate by default
  const [notes, setNotes] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`
  );

  // Create customer and part options for searchable select
  const customerOptions = useMemo(() => {
    return (customers ?? []).map(customer => ({
      label: `${customer.name} (${customer.phone})`,
      value: customer._id || "",
    }));
  }, [customers]);
  
  
  

  const partOptions = useMemo(() =>
    (parts ?? []).map(part => ({
      label: `${part.name} - ${part.partNumber} (₹${part.price.toFixed(2)})`,
      value: part._id || ""
    })),
    [parts]
  );

  const [customerSearch, setCustomerSearch] = useState('');
const filteredCustomers = customers?.filter((c) =>
  c.name.toLowerCase().includes(customerSearch.toLowerCase())
) || [];

  

  // Handle customer form submission
  const onCustomerSubmit = async (data: CustomerFormValues) => {
    try {
      // Add new customer via API (no id/_id sent)
      const newCustomer = await api.addCustomerWithToast(
        data as Omit<Customer, "_id">,
        "Customer added successfully"
      );

  
      // Refresh customer list
      await refetchCustomers();
  
      // Auto-select the new customer using the returned _id
      if (newCustomer && newCustomer._id) {
        setSelectedCustomer(newCustomer);
      }
  
      // Close dialog and reset form
      setIsCustomerDialogOpen(false);
      customerForm.reset();
  
    } catch (error) {
      console.error("Error adding customer:", error);
    }
  };
  

  const [partSearch, setPartSearch] = useState("");
const filteredParts = useMemo(() => {
  return (parts ?? []).filter((p) =>
    `${p.name} ${p.partNumber}`.toLowerCase().includes(partSearch.toLowerCase())
  );
}, [partSearch, parts]);


  // Calculate totals
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = (subtotal * tax) / 100;
  const totalDiscount = invoiceItems.reduce(
    (sum, item) => sum + item.discount,
    0
  );
  const total = subtotal + taxAmount - totalDiscount;

  // Add item to invoice
  const addItem = () => {
    if (!selectedPart || quantity <= 0) {
      
      toast({
        title: "Error",
        description: "Please select a part and enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    const part = parts.find((p) => p._id === selectedPart);
    if (!part) return;

    const itemDiscount = discount || 0;
    const total = part.price * quantity - itemDiscount;

    const newItem: InvoiceItem = {
      partId: part._id!,
      partName: part.name,
      partNumber: part.partNumber,
      quantity,
      unitPrice: part.price,
      discount: itemDiscount,
      total,
    };

    setInvoiceItems([...invoiceItems, newItem]);
    setSelectedPart("");
    setQuantity(1);
    setDiscount(0);
  };

  // Remove item from invoice
  const removeItem = (index: number) => {
    const newItems = [...invoiceItems];
    newItems.splice(index, 1);
    setInvoiceItems(newItems);
  };

  // Create invoice
  const handleCreateInvoice = async () => {
    if (!selectedCustomer) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive",
      });
      return;
    }

    if (invoiceItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the invoice",
        variant: "destructive",
      });
      return;
    }

    const customer = customers.find((c) => c._id === selectedCustomer);
    if (!customer) return;

    const invoiceData: Omit<Invoice, "_id" | "createdAt"> = {
      invoiceNumber,
      customer,
      items: invoiceItems,
      subtotal,
      tax: taxAmount,
      discount: totalDiscount,
      total,
      paymentMethod,
      notes,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
    };

    try {
      await api.createInvoiceWithToast(invoiceData);
      // Reset form after successful creation
      setSelectedCustomer("");
      setInvoiceItems([]);
      setNotes("");
      setInvoiceNumber(
        `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0")}`
      );
    } catch (error) {
      console.error("Error creating invoice:", error);
    }
  };

  // Get selected part details
  const getSelectedPartDetails = () => {
    return parts.find((p) => p._id === selectedPart);
  };

  const selectedPartDetails = getSelectedPartDetails();

  if (isLoadingParts || isLoadingCustomers) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (partsError || customersError) {
    return (
      <div className="text-center py-10 text-red-500">
        Error loading data. Please try again later.
      </div>
    );
  }


  const handleGenerateBill = () => {
    if (!selectedCustomer || invoiceItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a customer and add parts to the bill.",
      });
      return;
    }

    const billData = {
      customer: selectedCustomer,
      items: invoiceItems,
      discount: totalDiscount,
      total: total,
      date: new Date().toLocaleDateString(),
    };

    setCurrentBillData(billData);
    setIsBillPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Receipt className="h-7 w-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Create Invoice</h1>
        </div>
        <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-md">
          {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer and Invoice Information */}
        <Card className="lg:col-span-1 border-blue-100 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
            <CardTitle>Customer & Invoice Info</CardTitle>
            <CardDescription>
              Select customer and invoice details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="invoice-number">Invoice Number</Label>
              <Input
                id="invoice-number"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="customer">Customer</Label>
                <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <UserPlus className="h-4 w-4 mr-1" /> New Customer
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Customer</DialogTitle>
                    <DialogDescription>Fill in the customer details.</DialogDescription>
                  </DialogHeader>
                  <Form {...customerForm}>
                    <form onSubmit={customerForm.handleSubmit(onCustomerSubmit)} className="space-y-4">
                      <FormField
                        control={customerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="First name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      
                      <FormField
                        control={customerForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Address Fields */}
                      <FormField
                        control={customerForm.control}
                        name="address.street"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street</FormLabel>
                            <FormControl>
                              <Input placeholder="Street address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={customerForm.control}
                        name="address.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="City" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={customerForm.control}
                        name="address.state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input placeholder="State" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={customerForm.control}
                        name="address.zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zip Code</FormLabel>
                            <FormControl>
                              <Input placeholder="Zip code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={customerForm.control}
                        name="address.country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input placeholder="Country" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button type="submit">Add Customer</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                  </DialogContent>

                </Dialog>
              </div>
              <div className="relative">
  <Input
    placeholder="Search or select customer"
    value={customerSearch}
    onChange={(e) => setCustomerSearch(e.target.value)}
    className="w-full"
  />
  {customerSearch && filteredCustomers.length > 0 && (
    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-60 overflow-y-auto">
      {filteredCustomers.map((customer) => (
        <div
          key={customer._id}
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => {
            setSelectedCustomer(customer);
            setCustomerSearch("");
          }}
        >
          {customer.name} ({customer.phone})
        </div>
      ))}
    </div>
  )}
  {customerSearch && filteredCustomers.length === 0 && (
    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow px-4 py-2 text-sm text-muted-foreground">
      No customers found
    </div>
  )}
</div>


            </div>
            {selectedCustomer.name && (
              <div className="space-y-2 bg-blue-50 p-3 rounded-md text-sm">
                <p>
                  <span className="font-medium">ID:</span>{" "}
                  {selectedCustomer.id}
                </p>
                <p>
                  <span className="font-medium">Name:</span>{" "}
                  {selectedCustomer.name}
                </p>
                <p>
                  <span className="font-medium">Phone:</span>{" "}
                  {selectedCustomer.phone}
                </p>
                
                <p>
                  <span className="font-medium">Address:</span>{" "}
                  {selectedCustomer.street+","+selectedCustomer.city+","+selectedCustomer.state+","+selectedCustomer.country+"-"+selectedCustomer.zipCode}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Debit Card">Debit Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-rate">Tax Rate (%)</Label>
              <Input
                id="tax-rate"
                type="number"
                min="0"
                max="100"
                value={tax}
                onChange={(e) => setTax(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Add Items Section */}
        <Card className="lg:col-span-2 border-blue-100 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
            <CardTitle>Invoice Items</CardTitle>
            <CardDescription>
              Add parts to the invoice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {/* Add Item Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-3 lg:col-span-1">
                <Label htmlFor="part">Select Part</Label>
                <div className="relative">
  <Input
    placeholder="Search or select part"
    value={partSearch}
    onChange={(e) => setPartSearch(e.target.value)}
    className="w-full"
  />
  {partSearch && filteredParts.length > 0 && (
    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-60 overflow-y-auto">
      {filteredParts.map((part) => (
        <div
          key={part._id}
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => {
            setSelectedPart(part._id);
            setPartSearch("");
          }}
        >
          {part.name} ({part.partNumber}) - ₹{part.price.toFixed(2)}
        </div>
      ))}
    </div>
  )}
  {partSearch && filteredParts.length === 0 && (
    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow px-4 py-2 text-sm text-muted-foreground">
      No parts found
    </div>
  )}
</div>

              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Discount (₹)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="bg-white"
                />
              </div>
              {selectedPartDetails && (
                <div className="col-span-3 bg-blue-50 p-3 rounded-md text-sm grid grid-cols-3 gap-4">
                  <p>
                    <span className="font-medium">Part Number:</span>{" "}
                    {selectedPartDetails.partNumber}
                  </p>
                  <p>
                    <span className="font-medium">Price:</span> ₹
                    {selectedPartDetails.price.toFixed(2)}
                  </p>
                  <p>
                    <span className="font-medium">In Stock:</span>{" "}
                    <span className={selectedPartDetails.stockQuantity < 5 ? "text-red-600 font-medium" : ""}>
                      {selectedPartDetails.stockQuantity}
                    </span>
                  </p>
                </div>
              )}
              <div className="md:col-span-3">
                <Button onClick={addItem} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" /> Add Item to Invoice
                </Button>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Items Table */}
            <div className="overflow-x-auto rounded-lg border border-blue-100">
              <Table>
                <TableHeader className="bg-blue-50">
                  <TableRow>
                    <TableHead>Part</TableHead>
                    <TableHead>Part #</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No items added yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoiceItems.map((item, index) => (
                      <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <TableCell className="font-medium">{item.partName}</TableCell>
                        <TableCell>{item.partNumber}</TableCell>
                        <TableCell>₹{item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>₹{item.discount.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold">₹{item.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex-col space-y-4 bg-gray-50 rounded-b-lg">
            <div className="w-full flex flex-col items-end space-y-2 border-t pt-4">
              <div className="grid grid-cols-2 gap-x-4 text-right w-full md:w-1/2">
                <span className="font-medium">Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
                <span className="font-medium">Tax ({tax}%):</span>
                <span>₹{taxAmount.toFixed(2)}</span>
                <span className="font-medium">Discount:</span>
                <span>₹{totalDiscount.toFixed(2)}</span>
                <Separator className="col-span-2 my-1" />
                <span className="font-bold text-lg">Total:</span>
                <span className="font-bold text-lg text-blue-700">₹{total.toFixed(2)}</span>
              </div>
            </div>
            <div className="w-full flex gap-4 justify-end">

              <Button onClick={handleGenerateBill} className="bg-green-600 hover:bg-green-700">
                <Save className="mr-2 h-4 w-4" /> Generate Invoice
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
      {currentBillData && (
        <BillPreview
          isOpen={isBillPreviewOpen}
          onClose={() => setIsBillPreviewOpen(false)}
          billData={currentBillData}
        />
      )}
    </div>
  );
};

export default BillingPage;
