import { useToast } from "@/components/ui/use-toast";


export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
}
}

export interface Part {
  _id?: string;
  name: string;
  partNumber: string;
  description: string;
  category: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  manufacturer: string;
  location: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Customer {
  _id?: string;
  id?: string;
  name: string;
  phone: string;
  address: CustomerAddress;
}

export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}




export interface InvoiceItem {
  partId: string;
  partName: string;
  partNumber: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Invoice {
  _id?: string;
  invoiceNumber: string;
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  notes: string;
  createdAt?: Date;
  dueDate: Date;
}


export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

export interface LoginFormData {
  username: string;
  password: string;
}



const BASE_URL =  import.meta.env.BASE;;


const apiRequest = async <T>(
  endpoint: string,
  method: string = 'GET',
  data?: any
): Promise<T> => {
  const token = localStorage.getItem('authToken');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    console.log(BASE_URL+endpoint);
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request error: ${endpoint}`, error);
    throw error;
  }
};




  

// login and register requests
export const loginUser = async (credentials: LoginFormData): Promise<AuthResponse> => {
  console.log("Logging in user:", credentials.username);
  return await apiRequest<AuthResponse>('/auth/login', 'POST', credentials);
};

export const registerUser = async (userData: RegisterFormData): Promise<AuthResponse> => {
  console.log("Registering new user:", userData.email);
  return await apiRequest<AuthResponse>('/auth/register', 'POST', userData);
};

export const requestOtp = async (email: string): Promise<{ success: boolean }> => {
  console.log("Verifying OTP for:", email);
  return await apiRequest<{ success: boolean }>('/auth/request-otp', 'POST', { email });
};

export const verifyOtp = async (email: string, otp: string): Promise<{
  status: any 
}> => {
  console.log("Verifying OTP for:", email, otp);
  return await apiRequest<{ status: boolean }>('/auth/verify-otp', 'POST', { email, otp });
};

export const resetPassword = async (email: string): Promise<{ success: boolean }> => {
  console.log("Requesting password reset for:", email);
  return await apiRequest<{ success: boolean }>('/auth/reset-password', 'POST', { email });
};

export const updatePassword = async (token: string, password: string): Promise<{ success: boolean }> => {
  console.log("Updating password with token");
  return await apiRequest<{ success: boolean }>('/auth/update-password', 'POST', { token, password });
};

export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('userData');
};







// Parts API
export const fetchParts = async (): Promise<Part[]> => {
  const res = await fetch(`${BASE_URL}/products`);
  if (!res.ok) throw new Error("Failed to fetch parts");
  return res.json();
};

export const addPart = async (part: Omit<Part, "_id" | "createdAt" | "updatedAt">): Promise<Part> => {
  const res = await fetch(`${BASE_URL}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(part)
  });
  if (!res.ok) throw new Error("Failed to add part");
  return res.json();
};

export const updatePart = async (part: Partial<Part> & { _id: string }): Promise<Part> => {
  const res = await fetch(`${BASE_URL}/products/${part._id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(part)
  });
  if (!res.ok) throw new Error("Failed to update part");
  return res.json();
};

export const deletePart = async (id: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/products/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete part");
  }
};


// Customers API
export const fetchCustomers = async (): Promise<Customer[]> => {
  return await apiRequest<Customer[]>('/customers');
};
export const fetchCustomer = async (id:any): Promise<Customer[]> => {
  console.log("Searching for customer by name:", id);
  return await apiRequest<Customer[]>(`/customers/search?name=${encodeURIComponent(id)}`);
};

export const addCustomer = async (
  customer: Omit<Customer, "_id">
): Promise<Customer> => {
  if (!customer.name || !customer.phone || 
    !customer.address || !customer.address.street || !customer.address.zipCode) {
  throw new Error("All required customer fields are missing");
}
  return await apiRequest<Customer>('/customers', 'POST', customer);
};

export const updateCustomer = async (customer: Partial<Customer> & { _id: string }): Promise<Customer> => {

    console.log("Updating customer through API:", customer);

    
    return await apiRequest<Customer>(`/customers/${customer._id}`, 'PUT', customer);
  };
  
  

export const deleteCustomer = async (customerId: string): Promise<boolean> => {

    console.log("Deleting customer through API:", customerId);

    
      await apiRequest<void>(`/customers/${customerId}`, 'DELETE');
  return true;
  };




// Invoices API
export const fetchInvoices = async (): Promise<Invoice[]> => {
  console.log("Fetching invoices from API...");
  return await apiRequest<Invoice[]>('/invoices');
};

export const createInvoice = async (invoice: Omit<Invoice, '_id' | 'createdAt'>): Promise<Invoice> => {
  console.log("Creating invoice through API:", invoice);
  return await apiRequest<Invoice>('/invoices', 'POST', invoice);
};

export const getInvoiceById = async (invoiceId: string): Promise<Invoice> => {
  console.log("Fetching invoice details from API:", invoiceId);
  return await apiRequest<Invoice>(`/invoices/${invoiceId}`);
};

export const updateInvoiceStatus = async (invoiceId: string, status: "paid" | "pending" | "overdue"): Promise<Invoice> => {
  console.log(`Updating invoice ${invoiceId} status to ${status}`);
  return await apiRequest<Invoice>(`/invoices/${invoiceId}/status`, 'PUT', { status });
};

export const deleteInvoice = async (invoiceId: string): Promise<boolean> => {
  console.log("Deleting invoice:", invoiceId);
  await apiRequest<void>(`/invoices/${invoiceId}`, 'DELETE');
  return true;
};

export const getInvoicesByCustomerId = async (customerId: string): Promise<Invoice[]> => {
  console.log("Fetching invoices for customer:", customerId);
  return await apiRequest<Invoice[]>(`/invoices/customer/${customerId}`);
};

export const getDashboardStats = async (): Promise<{
  totalSales: number;
  totalInvoices: number;
  totalCustomers: number;
  lowStockItems: Part[];
  recentInvoices: Invoice[];
  salesByMonth: { month: string; sales: number }[];
}> => {
  console.log("Fetching dashboard statistics");
  return await apiRequest<any>('/dashboard/stats');
};
 

// Toast API Wrapper
export const useApiWithToast = () => {
  const { toast } = useToast();

  const withToastHandling = async <T>(
    apiCall: () => Promise<T>,
    successMessage?: string,
    errorMessage?: string
  ) => {
    try {
      const result = await apiCall();
      if (successMessage) {
        toast({ title: "Success", description: successMessage, variant: "default" });
      }
      return result;
    } catch (error: any) {
      toast({
        title: "Error",
        description: errorMessage || error.message || "An error occurred",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {

    loginWithToast: (credentials: LoginFormData, successMessage = "Login successful") =>
      withToastHandling(() => loginUser(credentials), successMessage, "Login failed"),
    
    registerWithToast: (userData: RegisterFormData, successMessage = "Registration successful") =>
      withToastHandling(() => registerUser(userData), successMessage, "Registration failed"),
    


    fetchPartsWithToast: (successMessage?: string) =>
      withToastHandling(() => fetchParts(), successMessage, "Failed to fetch parts"),

    addPartWithToast: (part: Omit<Part, '_id' | 'createdAt' | 'updatedAt'>, successMessage = "Part added successfully") =>
      withToastHandling(() => addPart(part), successMessage, "Failed to add part"),

    updatePartWithToast: (part: Partial<Part> & { _id: string }, successMessage = "Part updated successfully") =>
      withToastHandling(() => updatePart(part), successMessage, "Failed to update part"),




    fetchCustomersWithToast: (successMessage?: string) =>
      withToastHandling(() => fetchCustomers(), successMessage, "Failed to fetch customers"),

    addCustomerWithToast: (customer: Omit<Customer, '_id' >,
      successMessage = "Customer added successfully") => 
      withToastHandling(() => addCustomer(customer), successMessage, "Failed to add customer"),
    
      updateCustomerWithToast: (customer: Partial<Customer> & { _id: string }, successMessage = "Customer updated successfully") =>
        withToastHandling(() => updateCustomer(customer), successMessage, "Failed to update customer"),
      
      deleteCustomerWithToast: (customerId: string, successMessage = "Customer deleted successfully") =>
        withToastHandling(() => deleteCustomer(customerId), successMessage, "Failed to delete customer"),



      deletedataWithToast: (id:any,successMessage?: string) =>
        withToastHandling(() => deletePart(id), successMessage, "Failed to delete data"),
  
   
    fetchInvoicesWithToast: (successMessage?: string) =>
      withToastHandling(() => fetchInvoices(), successMessage, "Failed to fetch invoices"),

    createInvoiceWithToast: (invoice: Omit<Invoice, '_id' | 'createdAt'>, successMessage = "Invoice created successfully") =>
      withToastHandling(() => createInvoice(invoice), successMessage, "Failed to create invoice"),

    updateInvoiceStatusWithToast: (invoiceId: string, status: "paid" | "pending" | "overdue", successMessage = "Invoice status updated") =>
      withToastHandling(() => updateInvoiceStatus(invoiceId, status), successMessage, "Failed to update invoice status"),
    
    deleteInvoiceWithToast: (invoiceId: string, successMessage = "Invoice deleted successfully") =>
      withToastHandling(() => deleteInvoice(invoiceId), successMessage, "Failed to delete invoice"),
    
  };
};
