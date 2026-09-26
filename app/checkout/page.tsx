import CheckoutView from "../components/CheckoutView";

export const metadata = {
  title: "Checkout — Antique Home",
  description: "Secure checkout — review your order and complete your purchase.",
};

export default function CheckoutPage() {
  return (
    <div className="checkout-body">
      <CheckoutView />
    </div>
  );
}
