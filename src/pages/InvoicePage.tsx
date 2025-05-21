import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isAfter, isBefore } from "date-fns";
import {
  Calendar,
  Download,
  FileText,
  Info,
  Printer,
  Search,
  Eye,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { fetchInvoices, Invoice } from "@/services/api";
import BillPreview from "@/components/BillPreview";
import { useToast } from "@/hooks/use-toast";

const InvoicePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isBillPreviewOpen, setIsBillPreviewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();

  // Mock invoice data
  const mockInvoices: Invoice[] = [
    {
      _id: "1",
      invoiceNumber: "INV-2023-001",
      customer: {
        _id: "c1",
        name: "sujeeth",
        phone: "555-123-4567",
        address: {
          street: "123 Main St",
          city: "Anytown",
          state: "CA",
          zipCode: "12345",
          country: "USA"
        }
      },
      items: [
        {
          partId: "1",
          partName: "Brake Pad",
          partNumber: "BP-1234",
          quantity: 2,
          unitPrice: 49.99,
          discount: 0,
          total: 99.98
        },
        {
          partId: "2",
          partName: "Oil Filter",
          partNumber: "OF-5678",
          quantity: 1,
          unitPrice: 12.99,
          discount: 0,
          total: 12.99
        }
      ],
      subtotal: 112.97,
      tax: 9.04,
      discount: 0,
      total: 122.01,
      paymentMethod: "Credit Card",
      notes: "Customer requested fast delivery",
      createdAt: new Date("2023-12-15"),
      dueDate: new Date("2024-01-15")
    },
    {
      _id: "2",
      invoiceNumber: "INV-2023-002",
      customer: {
        _id: "c2",
        name: "sujeeth",
        phone: "555-987-6543",
        address: {
          street: "456 Oak Ave",
          city: "Somewhere",
          state: "CA",
          zipCode: "54321",
          country: "USA"
        }
      },
      items: [
        {
          partId: "3",
          partName: "Spark Plug",
          partNumber: "SP-9012",
          quantity: 4,
          unitPrice: 8.99,
          discount: 5.00,
          total: 30.96
        }
      ],
      subtotal: 35.96,
      tax: 2.88,
      discount: 5.00,
      total: 33.84,
      paymentMethod: "Cash",
      notes: "",
      createdAt: new Date("2023-12-20"),
      dueDate: new Date("2024-01-20")
    },
    {
      _id: "3",
      invoiceNumber: "INV-2023-003",
      customer: {
        _id: "c3",
        name: "yella",
        phone: "555-555-5555",
        address: {
          street: "789 Pine Rd",
          city: "Elsewhere",
          state: "CA",
          zipCode: "67890",
          country: "USA"
        }
      },
      items: [
        {
          partId: "4",
          partName: "Transmission Fluid",
          partNumber: "TF-1234",
          quantity: 2,
          unitPrice: 22.50,
          discount: 0,
          total: 45.00
        }
      ],
      subtotal: 45.00,
      tax: 3.60,
      discount: 0,
      total: 48.60,
      paymentMethod: "Bank Transfer",
      notes: "Called customer about late payment",
      createdAt: new Date("2023-11-10"),
      dueDate: new Date("2023-12-10")
    }
  ];

  // Fetch invoices
  const {
    data: invoices = mockInvoices,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["invoices"],
    queryFn: fetchInvoices,
    refetchOnWindowFocus: false,
  });

  // Handle view invoice
  const handleViewInvoice = (invoice: Invoice) => {
    // Make sure invoice.items is defined before opening the preview
    if (!invoice || !invoice.items) {
      toast({
        title: "Error",
        description: "Invoice data is incomplete",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedInvoice(invoice);
    setIsBillPreviewOpen(true);
  };

  // Handle download invoice
  const handleDownloadInvoice = () => {
    toast({
      title: "Download Started",
      description: "Your invoice download has started",
    });
    // Implementation would go here in a real application
  };

  // Handle print invoice
  const handlePrintInvoice = () => {
    toast({
      title: "Print Prepared",
      description: "Your invoice is ready to print",
    });
    // Implementation would go here in a real application
  };

  // Filter invoices based on search query, status, and date range
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchQuery
      ? invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
   

    
    const matchesDateRange = (startDate && endDate)
      ? isAfter(invoice.createdAt, startDate) && isBefore(invoice.createdAt, endDate)
      : true;
    
    return matchesSearch &&  matchesDateRange;
  });

  // Date range selection handler
  const handleDateSelect = (date: Date | null) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else {
      if (date && date < startDate) {
        // If user selects a date before start date, swap them
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
    }
  };

  // Clear date filter
  const clearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
  };

  // Status badge component
  
    
    

  // Helper function to format address
  const formatAddress = (address: { 
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }): string => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Invoice Management</h1>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          


          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[230px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {startDate && endDate
                  ? `${format(startDate, "MMM dd")} - ${format(endDate, "MMM dd")}`
                  : startDate
                  ? `${format(startDate, "MMM dd")} - Select end`
                  : "Filter by date range"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Date Range</h4>
                  <Button variant="ghost" size="sm" onClick={clearDateFilter}>
                    Clear
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {startDate && !endDate 
                    ? "Select end date" 
                    : "Select start and end dates"}
                </p>
              </div>
              <CalendarComponent
                initialFocus
                mode="single"
                selected={startDate || undefined}
                onSelect={handleDateSelect}
                numberOfMonths={1}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Invoices
            <span className="ml-2 text-sm text-muted-foreground font-normal">
              ({filteredInvoices.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">Loading invoices...</div>
          ) : isError ? (
            <div className="flex justify-center py-8 text-red-500">Error loading invoices</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-lg font-medium">No invoices found</p>
              <p className="text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInvoices.map((invoice) => (
                    <TableRow key={invoice._id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{invoice.customer.name}</TableCell>

                      <TableCell className="text-right">
                      ₹{invoice.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleViewInvoice(invoice)}
                            title="View Invoice"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={handleDownloadInvoice}
                            title="Download Invoice"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={handlePrintInvoice}
                            title="Print Invoice"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Invoice details tooltip */}
          
        </CardContent>
      </Card>

      {/* Bill Preview Dialog - Only render when we have valid data */}
      {selectedInvoice && selectedInvoice.items && (
        <BillPreview
          isOpen={isBillPreviewOpen}
          onClose={() => setIsBillPreviewOpen(false)}
          billData={{
            customer: selectedInvoice.customer,
            items: selectedInvoice.items,
            total: selectedInvoice.total,
            date: format(new Date(selectedInvoice.createdAt), "MMMM dd, yyyy"),
          }}
        />
      )}
    </div>
  );
};

export default InvoicePage;