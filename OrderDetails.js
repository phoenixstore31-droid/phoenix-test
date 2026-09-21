import { createClient } from
"https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://tvhgxlqqeklrdlgbkosa.supabase.co",
  "sb_publishable_Ep28HPF1SXIXQXBF2i__eg_h_jmjw4I",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

/* ===========================================
   MAINTENANCE CHECK
=========================================== */

const {
  data: { session }
} = await supabase.auth.getSession();

let isAdmin = false;

if (session) {

  const { data: admin } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", session.user.id)
    .maybeSingle();

  if (admin) {
    isAdmin = true;
  }
}


/* ===========================================
   MAINTENANCE REDIRECT
=========================================== */

const { data: settings } = await supabase
  .from("settings")
  .select("maintenance")
  .eq("id", 1)
  .single();


if (
  settings?.maintenance === true &&
  !isAdmin
) {

  window.location.replace("maintenance.html");

  // Stop remaining home.js code
  throw new Error("Maintenance mode active");

}

// ----------------------------
// Login Check
// ----------------------------


if (!session) {

    location.href = "login.html";

    throw new Error("User not authenticated");

}

// ----------------------------
// Load User Profile
// ----------------------------

const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_balance")
    .eq("id", session.user.id)
    .single();

const walletBalance =
    Number(profile?.wallet_balance || 0);

// Header Wallet
const walletBalanceElement =
    document.getElementById("walletBalance");

if (walletBalanceElement) {
    walletBalanceElement.textContent =
        "Rs. " + walletBalance.toFixed(2);
}

// Card Wallet
const walletBalanceCardElement =
    document.getElementById("walletBalanceCard");

if (walletBalanceCardElement) {
    walletBalanceCardElement.textContent =
        "Rs. " + walletBalance.toFixed(2);
}

// ----------------------------
// Load Selected Product
// ----------------------------

const product =
    JSON.parse(localStorage.getItem("selectedProduct"));

if (!product) {
    location.href = "topup.html";
    throw new Error("No selected product");
}

const productImage =
    document.getElementById("productImage");

const productName =
    document.getElementById("productName");

const productPrice =
    document.getElementById("productPrice");

productImage.src = product.image;

productName.textContent =
    product.title;

productPrice.textContent =
    "Rs. " + Number(product.price).toFixed(2);

productImage.src = product.image;

productName.textContent =
    product.title;

productPrice.textContent =
    "Rs. " + Number(product.price).toFixed(2);

// Quantity
let quantity = 1;

const minusBtn = document.getElementById("minusBtn");
const plusBtn = document.getElementById("plusBtn");
const quantityText = document.getElementById("quantity");
const totalPrice = document.getElementById("totalPrice");

function updateTotal() {
    quantityText.textContent = quantity;
    totalPrice.textContent =
        "Rs. " + (product.price * quantity).toFixed(2);
}

updateTotal();

plusBtn.addEventListener("click", () => {
    if (quantity < 5) {
        quantity++;
        updateTotal();
    }
});

minusBtn.addEventListener("click", () => {
    if (quantity > 1) {
        quantity--;
        updateTotal();
    }
});

// ----------------------------
// Submit Button
// ----------------------------

const submitBtn =
document.getElementById("submitBtn");

const uidInput =
document.getElementById("uid");

const msg =
document.getElementById("msg");

submitBtn.addEventListener(
"click",
async () => {

    const uid =
    uidInput.value.trim();

    // UID Check

    if (uid === "") {

        msg.style.color = "red";
        msg.textContent =
        "⚠ Please enter your Game UID";

        uidInput.focus();

        return;

    }

    // Wallet Check

msg.style.color = "limegreen";
msg.textContent = "✅ Checking order...";

const { data, error } = await supabase.rpc(
    "place_order_with_wallet",
    {
        p_product_id: Number(product.id),
        p_uid: uid,
        p_quantity: quantity
    }
);

if (error) {

    console.error(error);

    msg.style.color = "red";

    if (
        error.message.includes(
            "Insufficient wallet balance"
        )
    ) {

        msg.textContent =
            "❌ Wallet balance is not enough.";

    } else {

        msg.textContent =
            "❌ Order failed. Please try again.";

    }

    return;
}

if (!data?.success) {

    msg.style.color = "red";

    msg.textContent =
        "❌ Order failed.";

    return;
}

// =====================================
// DISCORD NEW PENDING ORDER
// =====================================

try {

    await fetch("/.netlify/functions/discord-pending", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            productName: product.title,

            uid: uid,

            quantity: quantity,

            totalPrice: Number(data.total_price || 0)

        })

    });

} catch (discordError) {


    console.error(
        "Discord notification failed:",
        discordError
    );

}


// =====================================
// ORDER SUCCESS
// =====================================

msg.style.color = "limegreen";

msg.textContent =
    "✅ Order submitted successfully";

setTimeout(() => {

    location.href = "history.html";

}, 1200);

});