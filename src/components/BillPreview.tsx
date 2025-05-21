
import React from 'react';
import { X, Printer, FileDown } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Customer, CustomerAddress } from '@/services/api';

interface BillPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  billData: {
    customer: any;
    items: any[];
    total: number;
    date: string;
  };
}


const BillPreview = ({ isOpen, onClose, billData }: BillPreviewProps) => {
  const handlePrint = () => {
    const printContent = document.getElementById('bill-content');
    if (printContent) {
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  const handlePrintAsPDF = () => {
    const printContent = document.getElementById('bill-content');
    if (printContent) {
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };
  const defaultAddress: CustomerAddress = {
    street: 'N/A',
    city: 'N/A',
    state: 'N/A',
    zipCode: 'N/A',
    country: 'N/A'
  };
  
  const customer: Customer = billData?.customer || { 
    name: 'N/A', 
    address: defaultAddress, 
    phone: 'N/A', 
    email: 'N/A' 
  };
  const formatAddress = (customer: Customer) => {
        if (!customer || !customer.address) return 'N/A';
        
        const { address } = customer;
        const addressParts = [
          address.street,
          address.city,
          `${address.state} ${address.zipCode}`,
          address.country
        ].filter(Boolean);
        
        return addressParts.join(', ');
      };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Bill Preview</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrintAsPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              Save as PDF
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[600px] rounded-md border p-4 pt-1">
          <div id="bill-content" className="p-6 bg-white">
            <div className="text-right mb-6 border-b pb-3">
              <h1 className="text-2xl font-bold mb-2">Balakumar Automobiles</h1>
              <p className="text-gray-500">212, UTHUKULLI MAIN ROAD ,</p>
              <p className="text-gray-500">KUNNATHUR - 638103</p>
              <p className="text-gray-500"><strong>GSTIN:</strong>33AMOPC5336M1ZV</p>
              <p className="text-gray-500"></p>

            </div>
            <div className="grid grid-cols-2 gap-6 mb-6 ">
              <div>
                <h3 className="font-semibold mb-2">Bill To:</h3>
                <p className='ml-3'><strong>Name:</strong>{billData.customer.name}</p>
                <p className='ml-3'><strong>Address:</strong>{formatAddress(customer)}</p>
                <p className='ml-3'><strong>Phone:</strong>{billData.customer.phone}</p>
              </div>
              <div className="text-right">
                <p><strong>Date:</strong> {billData.date}</p>
                <p><strong>Invoice #:</strong> {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
              </div>
            </div>

            <table className="w-full mb-6 border-t">
              <thead className="border-b">
                <tr>
                  <th className="py-2 text-left">Item</th>
                  <th className="py-2 text-right">Quantity</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Discount</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {billData.items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{item.partName}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">₹{item.unitPrice.toFixed(2)}</td>
                    <td className="py-2 text-right">₹{item.discount.toFixed(2)}</td>
                    <td className="py-2 text-right">₹{(item.quantity * item.unitPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            
            <div className="text-right">
              <p className="text-xl font-bold">Total: ₹{billData.total.toFixed(2)}</p>
            </div>

            <div className="mt-8 pt-8 border-t text-center text-gray-500">
              <p>Thank you for your business!</p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default BillPreview;