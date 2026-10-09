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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Load products from Supabase
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

  // Check logged-in user
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

  // Load cart from browser
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");

    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        localStorage.removeItem("cart");
      }
    }
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
      alert(error.message);
    }
  }

  // Email authentication
  async function handleEmailAuth() {
    if (!email.trim() || !password) {
      alert("Please enter your email and password.");
      return;
    }

    setAuthLoading(true);

    if (isCreatingAccount) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        alert(error.message);
      } else if (data.session) {
        setUser(data.user);
        setShowEmailLogin(false);
        alert("Welcome to LuxeMart! Your account is ready.");
      } else {
        alert(
          "Your account has been created. Please confirm your email before signing in."
        );
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        alert(error.message);
      } else {
        setUser(data.user);
        setShowEmailLogin(false);
        alert("Welcome back to LuxeMart!");
      }
    }

    setAuthLoading(false);
  }

  // Sign out
  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    setUser(null);
  }

  // Add item to shared cart
  async function addToCart(product: Product) {
    if (!user) {
      alert("Please sign in before adding items to your cart.");
      return;
    }

    const { error } = await supabase
      .from("cart_items")
      .upsert(
        {
          user_id: user.id,
          product_id: product.id,
          quantity: 1,
        },
        {
          onConflict: "user_id,product_id",
        }
      );

    if (error) {
      console.error("Cart error:", error);
      alert(`Could not add item: ${error.message}`);
      return;
    }

    const updatedCart = [...cart, product];

    setCart(updatedCart);

    // Keep the existing checkout page working
    localStorage.setItem("cart", JSON.stringify(updatedCart));

    alert(`${product.name} was added to your cart.`);
  }

  // Scroll to products
  function shopNow() {
    document
      .getElementById("products")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  // Format prices
  function formatPrice(price: number) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(price);
  }

  return (
    <main className="min-h-screen bg-[#faf9f7] text-gray-900">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <button
            onClick={() =>
              window.scrollTo({ top: 0, behavior: "smooth" })
            }
          >
            <div className="text-left">
              <h1 className="text-2xl font-bold tracking-tight">
                LuxeMart
              </h1>

              <p className="text-xs text-gray-500">
                Simple shopping. Better finds.
              </p>
            </div>
          </button>

          <nav className="hidden items-center gap-7 md:flex">
            <button
              onClick={() =>
                window.scrollTo({ top: 0, behavior: "smooth" })
              }
              className="text-sm font-medium text-gray-700 hover:text-black"
            >
              Home
            </button>

            <button
              onClick={shopNow}
              className="text-sm font-medium text-gray-700 hover:text-black"
            >
              Shop
            </button>

            <button
              onClick={() =>
                document
                  .getElementById("about")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="text-sm font-medium text-gray-700 hover:text-black"
            >
              About
            </button>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden max-w-[180px] truncate text-sm text-gray-600 lg:block">
                  Hi, {user.email}
                </span>

                <button
                  onClick={signOut}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-100"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={signInWithGoogle}
                  className="hidden rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 sm:block"
                >
                  Google Sign In
                </button>

                <button
                  onClick={() =>
                    setShowEmailLogin(!showEmailLogin)
                  }
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-100"
                >
                  Sign in
                </button>
              </>
            )}

            <button
              onClick={() => router.push("/checkout")}
              className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Cart ({cart.length})
            </button>
          </div>
        </div>

        {/* EMAIL LOGIN PANEL */}
        {showEmailLogin && !user && (
          <div className="border-t border-gray-200 bg-white px-5 py-6">
            <div className="mx-auto max-w-xl">
              <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-gray-500">
                Welcome to LuxeMart
              </p>

              <h2 className="text-2xl font-bold">
                {isCreatingAccount
                  ? "Create your shopping account"
                  : "Welcome back"}
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                {isCreatingAccount
                  ? "Join LuxeMart and make your shopping experience easier."
                  : "Sign in to continue shopping with us."}
              </p>

              <div className="mt-5 grid gap-3">
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-black"
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-black"
                />

                <button
                  onClick={handleEmailAuth}
                  disabled={authLoading}
                  className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white transition hover:bg-gray-800"
                >
                  {authLoading
                    ? "Please wait..."
                    : isCreatingAccount
                      ? "Create Account"
                      : "Sign In"}
                </button>

                <button
                  onClick={() =>
                    setIsCreatingAccount(!isCreatingAccount)
                  }
                  className="text-sm text-gray-600 underline hover:text-black"
                >
                  {isCreatingAccount
                    ? "Already have an account? Sign in"
                    : "New to LuxeMart? Create an account"}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-5 pb-10 pt-8 md:px-8 md:pt-12">
        <div className="overflow-hidden rounded-[2rem] bg-black px-7 py-14 text-white md:px-14 md:py-20">
          <div className="max-w-3xl">
            <span className="inline-block rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-300">
              Curated for everyday living
            </span>

            <h2 className="mt-7 text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
              Little luxuries.
              <br />
              Big everyday wins.
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
              From stylish accessories to modern essentials, LuxeMart brings
              together products that look good, work well, and make everyday
              life a little easier.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <button
                onClick={shopNow}
                className="rounded-full bg-white px-7 py-3 font-semibold text-black transition hover:bg-gray-200"
              >
                Start Shopping
              </button>

              <button
                onClick={() =>
                  document
                    .getElementById("about")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="rounded-full border border-white/30 px-7 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Why LuxeMart?
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="mx-auto max-w-7xl px-5 py-4 md:px-8">
        <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 sm:grid-cols-3">
          <div>
            <p className="font-bold">Carefully Selected</p>
            <p className="mt-1 text-sm text-gray-500">
              Products chosen with everyday value in mind.
            </p>
          </div>

          <div>
            <p className="font-bold">Simple Shopping</p>
            <p className="mt-1 text-sm text-gray-500">
              Browse, choose your favourites, and check out with ease.
            </p>
          </div>

          <div>
            <p className="font-bold">Made for You</p>
            <p className="mt-1 text-sm text-gray-500">
              A clean shopping experience without unnecessary fuss.
            </p>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section
        id="products"
        className="mx-auto max-w-7xl px-5 py-16 md:px-8"
      >
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            Explore our collection
          </p>

          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Things you'll love having around
          </h2>

          <p className="mt-4 leading-7 text-gray-600">
            Take a look through our latest collection of fashion pieces,
            accessories, and tech essentials. Find something useful, stylish,
            or simply worth bringing home.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border bg-white p-10 text-center">
            <p className="text-gray-600">
              Preparing something good for you...
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center">
            <p className="text-red-500">
              We couldn't find any products right now.
            </p>
          </div>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <article
                key={product.id}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative overflow-hidden bg-gray-100">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-gray-700">
                    {product.category}
                  </span>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold">
                    {product.name}
                  </h3>

                  <p className="mt-3 min-h-[48px] text-sm leading-6 text-gray-500">
                    {product.description}
                  </p>

                  <div className="mt-6 flex items-center justify-between gap-4">
                    <span className="text-lg font-bold">
                      {formatPrice(product.price)}
                    </span>

                    <button
                      onClick={() => addToCart(product)}
                      className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ABOUT */}
      <section
        id="about"
        className="mx-auto max-w-7xl px-5 pb-16 md:px-8"
      >
        <div className="grid gap-8 rounded-[2rem] bg-white p-8 md:grid-cols-2 md:p-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              A little about us
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              Shopping should feel easy.
            </h2>
          </div>

          <div>
            <p className="leading-8 text-gray-600">
              LuxeMart was created around one simple idea: finding something
              you love shouldn't feel complicated. We bring useful products,
              timeless style, and modern essentials together in one convenient
              place.
            </p>

            <p className="mt-4 leading-8 text-gray-600">
              Whether you're treating yourself or looking for something
              special, take your time, explore the collection, and enjoy the
              experience.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-16 md:px-8">
        <div className="rounded-[2rem] bg-gray-100 px-7 py-12 text-center md:px-12">
          <h2 className="text-3xl font-bold">
            Ready to find your next favourite?
          </h2>

          <p className="mx-auto mt-4 max-w-xl leading-7 text-gray-600">
            Have a look around LuxeMart and discover something made for your
            everyday life.
          </p>

          <button
            onClick={shopNow}
            className="mt-7 rounded-full bg-black px-7 py-3 font-semibold text-white transition hover:bg-gray-800"
          >
            Explore Products
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-10 text-center md:flex-row md:items-center md:justify-between md:px-8 md:text-left">
          <div>
            <h3 className="font-bold">LuxeMart</h3>

            <p className="mt-1 text-sm text-gray-500">
              Quality products, simple shopping.
            </p>
          </div>

          <p className="text-sm text-gray-500">
            © 2026 LuxeMart. Made with care.
          </p>
        </div>
      </footer>
    </main>
  );
}