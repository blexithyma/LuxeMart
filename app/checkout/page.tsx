"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Product = {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category: string;
};

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");

    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setEmail(data.user.email);
      }

      const googleName =
        data.user?.user_metadata?.full_name ||
        data.user?.user_metadata?.name;

      if (googleName) {
        setName(googleName);
      }
    });
  }, []);

  const total = cart.reduce((sum, product) => sum + product.price, 0);

  function formatPrice(price: number) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(price);
  }

  async function placeOrder() {
    setMessage("");

    if (!name || !email || !address) {
      setMessage("Please complete all fields.");
      return;
    }

    if (cart.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please sign in with Google before checking out.");
      setLoading(false);
      return;
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        customer_name: name,
        customer_email: email,
        customer_address: address,
        total_amount: total,
        status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      console.error(orderError);
      setMessage(orderError.message);
      setLoading(false);
      return;
    }

    const items = cart.map((product) => ({
      order_id: order.id,
      product_id: product.id,
      quantity: 1,
      price: product.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(items);

    if (itemsError) {
      console.error(itemsError);
      setMessage(itemsError.message);
      setLoading(false);
      return;
    }

    const emailResponse = await fetch("/api/send-confirmation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        name,
        orderId: order.id,
        total,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Mailgun error:", emailResult);

      localStorage.removeItem("cart");
      setCart([]);
      setMessage(
        `Order placed, but email failed: ${
          emailResult.error || "Unknown error"
        }`
      );

      setLoading(false);
      return;
    }

    console.log("Mailgun success:", emailResult);

    localStorage.removeItem("cart");
    setCart([]);
    setMessage("Order placed successfully! Confirmation email sent.");

    setLoading(false);

    setTimeout(() => {
      router.push("/");
    }, 2000);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12 text-gray-900">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => router.push("/")}
          className="mb-6 text-sm font-medium text-gray-900"
        >
          ← Back to shop
        </button>

        <h1 className="mb-8 text-4xl font-bold">Checkout</h1>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-bold">
              Customer Information
            </h2>

            <div className="space-y-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-xl border p-3 text-gray-900"
              />

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                className="w-full rounded-xl border p-3 text-gray-900"
              />

              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Delivery address"
                rows={4}
                className="w-full rounded-xl border p-3 text-gray-900"
              />

              <button
                onClick={placeOrder}
                disabled={loading}
                className="w-full rounded-xl bg-black px-5 py-3 font-semibold text-white"
              >
                {loading ? "Processing..." : "Place Order"}
              </button>

              {message && (
                <p className="text-sm font-medium text-gray-900">
                  {message}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-bold">
              Order Summary
            </h2>

            {cart.length === 0 ? (
              <p className="text-gray-500">Your cart is empty.</p>
            ) : (
              <div className="space-y-4">
                {cart.map((product, index) => (
                  <div
                    key={`${product.id}-${index}`}
                    className="flex items-center justify-between border-b pb-4"
                  >
                    <div>
                      <p className="font-semibold">
                        {product.name}
                      </p>

                      <p className="text-sm text-gray-500">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between pt-4 text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}