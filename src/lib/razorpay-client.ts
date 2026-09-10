declare global {
  interface Window {
    Razorpay: any;
  }
}

/**
  Loads the Razorpay Checkout script asynchronously into the browser
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

export interface RazorpayOptions {
  keyId: string;
  razorpayOrderId: string;
  amount: number; // in paise
  currency?: string;
  name?: string;
  description?: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  preferredMethod?: string;
  onSuccess: (data: { orderId?: string; subscriptionId?: string; paymentId: string }) => void;
  onError: (errorMsg: string) => void;
}

const RAZORPAY_METHOD_MAP: Record<string, string> = {
  UPI: "upi",
  CREDIT_CARD: "card",
  DEBIT_CARD: "card",
  CARD: "card",
  NET_BANKING: "netbanking",
  NETBANKING: "netbanking",
  WALLET: "wallet",
  PAY_LATER: "paylater",
  PAYLATER: "paylater",
};

/**
 * Opens Razorpay modal and handles server-side signature verification upon payment completion
 */
export const openRazorpayModal = async (options: RazorpayOptions) => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    options.onError("Failed to load Razorpay SDK. Please check your network connection.");
    return;
  }

  const preferredRazorpayMethod = options.preferredMethod
    ? RAZORPAY_METHOD_MAP[options.preferredMethod.toUpperCase()] || options.preferredMethod.toLowerCase()
    : undefined;

  const razorpayConfig: any = {
    key: options.keyId,
    amount: options.amount,
    currency: options.currency || "INR",
    name: options.name || "The Q Bowl",
    description: options.description || "Fresh Artisan Food Bowl & Fast Delivery",
    order_id: options.razorpayOrderId,
    prefill: {
      name: options.userName || "",
      email: options.userEmail || "",
      contact: options.userPhone || "",
      ...(preferredRazorpayMethod ? { method: preferredRazorpayMethod } : {}),
    },
    config: {
      display: {
        language: "en",
        blocks: {
          upi: {
            name: "Pay via UPI (PhonePe, GPay, Paytm, Navi, Amazon Pay)",
            instruments: [
              {
                method: "upi",
                flows: ["intent", "qr", "collect"],
                apps: ["google_pay", "phonepe", "paytm", "bhim", "cred", "amazonpay", "navi"],
              },
            ],
          },
          cards: {
            name: "Cards (Credit / Debit)",
            instruments: [
              {
                method: "card",
              },
            ],
          },
          netbanking: {
            name: "Net Banking & Bank Transfer",
            instruments: [
              {
                method: "netbanking",
              },
            ],
          },
        },
        sequence:
          preferredRazorpayMethod === "card"
            ? ["block.cards", "block.upi", "block.netbanking"]
            : preferredRazorpayMethod === "netbanking"
            ? ["block.netbanking", "block.upi", "block.cards"]
            : ["block.upi", "block.cards", "block.netbanking"],
        preferences: {
          show_default_blocks: true,
        },
      },
    },
    theme: {
      color: "#E5A00D",
      backdrop_color: "rgba(0, 0, 0, 0.75)",
    },
    handler: async (response: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => {
      try {
        // Send signature to backend for cryptographic verification
        const verifyRes = await fetch("/api/payments/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });

        const verifyData = await verifyRes.json();

        if (verifyRes.ok && verifyData.success) {
          options.onSuccess({
            orderId: verifyData.orderId,
            subscriptionId: verifyData.subscriptionId,
            paymentId: verifyData.paymentId,
          });
        } else {
          options.onError(verifyData.error || "Payment verification failed.");
        }
      } catch (err: any) {
        options.onError(err?.message || "Failed to verify payment with server.");
      }
    },
    modal: {
      ondismiss: async () => {
        try {
          await fetch("/api/payments/razorpay/fail", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ razorpay_order_id: options.razorpayOrderId }),
          });
        } catch (e) {}
        options.onError("Payment popup was closed by user.");
      },
    },
  };

  const rzp = new window.Razorpay(razorpayConfig);
  rzp.on("payment.failed", async (response: any) => {
    try {
      await fetch("/api/payments/razorpay/fail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razorpay_order_id: options.razorpayOrderId }),
      });
    } catch (e) {}
    options.onError(response.error?.description || "Payment transaction failed.");
  });

  rzp.open();
};
