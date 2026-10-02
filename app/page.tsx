"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
};

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Get products from Supabase
  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("id");

      if (error) {
        console.error("Product error:", error);
        setLoading(false);
        return;
      }

      setProducts(data || []);
      setLoading(false);
    }

    loadProducts();
  }, []);

  // Check whether the customer is logged in
  useEffect(() => {
    async function getCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    }

    getCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Google login
  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error("Google login error:", error);
      alert(error.message);
    }
  }

  // Logout
  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return;
    }

    setUser(null);
  }

  // Format prices as Nigerian Naira
  function formatPrice(price: number) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(price);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              LuxeMart
            </h1>

            <p className="text-sm text-gray-500">
              Quality products, simple shopping.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden text-sm text-gray-600 md:block">
                  {user.email}
                </span>

                <button
                  onClick={signOut}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Sign in with Google
              </button>
            )}

            <button 
            onClick={() => router.push("/checkout")}
            className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
            >
              Cart ({cart.length})
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-3xl bg-black px-8 py-14 text-white md:px-16">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-300">
            Welcome to LuxeMart
          </p>

          <h2 className="max-w-2xl text-4xl font-bold leading-tight md:text-6xl">
            Everything you need, all in one place.
          </h2>

          <p className="mt-6 max-w-xl text-gray-300">
            Discover stylish fashion, useful accessories and modern
            electronics at great prices.
          </p>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <h2 className="text-3xl font-bold text-gray-900">
          Featured Products
        </h2>

        <p className="mt-2 mb-8 text-gray-500">
          Shop our latest products.
        </p>

        {loading ? (
          <p className="text-gray-600">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-red-500">No products found.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-2xl border bg-white shadow-sm"
              >
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-56 w-full object-cover"
                />

                <div className="p-6">
                  <p className="text-sm text-gray-500">
                    {product.category}
                  </p>

                  <h3 className="mt-2 text-xl font-bold text-gray-900">
                    {product.name}
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    {product.description}
                  </p>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </span>

                    <button
                      onClick={() => {
                        const updatedCart = [...cart, product];
                        setCart(updatedCart);
                        localStorage.setItem("cart", JSON.stringify(updatedCart));
                      }}
                      className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-white py-8 text-center text-sm text-gray-500">
        © 2026 LuxeMart. All rights reserved.
      </footer>
    </main>
  );
}