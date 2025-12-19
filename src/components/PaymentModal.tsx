import React, { useState } from 'react';
import { X, CreditCard, Smartphone, Truck, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PaymentMethod } from '@/contexts/CartContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSelect: (method: PaymentMethod) => void;
  total: number;
  itemCount: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSelect,
  total,
  itemCount,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const paymentMethods = [
    {
      id: 'cash-on-delivery' as PaymentMethod,
      name: 'Cash on Delivery',
      description: 'Pay when your order arrives',
      icon: Truck,
      popular: false,
    },
    {
      id: 'debit-credit' as PaymentMethod,
      name: 'Debit/Credit Card',
      description: 'Secure payment with your card',
      icon: CreditCard,
      popular: true,
      disabled: true,
    },
  ];

  const handlePaymentSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
  };

  const handleConfirmPayment = async () => {
    if (!selectedMethod) return;

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);

      // Auto close after success
      setTimeout(() => {
        onPaymentSelect(selectedMethod);
        onClose();
        setIsSuccess(false);
        setSelectedMethod(null);
      }, 2000);
    }, 1500);
  };

  if (!isOpen) return null;

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            <h3 className="font-nunito font-bold text-xl text-foreground mb-2">
              Order Placed Successfully!
            </h3>
            <p className="text-muted-foreground">
              Your order will be processed shortly.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-nunito font-bold text-xl text-foreground">
            Choose Payment Method
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <CardContent className="p-6">
          {/* Order Summary */}
          <div className="bg-secondary rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-inter text-sm text-muted-foreground">
                {itemCount} item{itemCount > 1 ? 's' : ''}
              </span>
              <span className="font-nunito font-bold text-lg text-primary">
                ₹{total}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Including all taxes and delivery charges
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3 mb-6">
            <h3 className="font-nunito font-semibold text-foreground mb-3">
              Select Payment Method
            </h3>

            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;
              const isDisabled = (method as any).disabled;

              return (
                <div
                  key={method.id}
                  onClick={() => !isDisabled && handlePaymentSelect(method.id)}
                  className={`relative p-4 border-2 rounded-lg transition-all ${isDisabled
                      ? 'opacity-50 cursor-not-allowed border-muted bg-muted/20'
                      : isSelected
                        ? 'border-primary bg-primary/5 cursor-pointer'
                        : 'border-border hover:border-primary/50 cursor-pointer'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${isSelected ? 'bg-primary text-white' : 'bg-muted'
                      }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-nunito font-semibold text-foreground">
                          {method.name}
                        </span>
                        {method.popular && (
                          <Badge variant="secondary" className="text-xs">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {method.description}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Confirm Button */}
          <Button
            onClick={handleConfirmPayment}
            disabled={!selectedMethod || isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              `Confirm Payment - ₹${total}`
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-3">
            Your payment information is secure and encrypted
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentModal;
