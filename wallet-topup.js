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

// Current User
const {
  data: { session: currentSession }
} = await supabase.auth.getSession();

if (!currentSession) {
  window.location.href = "login.html";
}

const currentUser = currentSession.user;

// Receipt Preview
const receipt = document.getElementById("receipt");
const preview = document.getElementById("previewImage");
const fileText = document.getElementById("fileText");

document.querySelector(".upload-btn").onclick = () => {
  receipt.click();
};

receipt.addEventListener("change", () => {

  const file = receipt.files[0];

  if (!file) return;

  fileText.innerText = "Receipt Selected ✅";

  const reader = new FileReader();

  reader.onload = e => {
    preview.src = e.target.result;
    preview.style.display = "block";
  };

  reader.readAsDataURL(file);

});

// Submit

const submitBtn = document.getElementById("submitBtn");

submitBtn.onclick = async () => {

  submitBtn.disabled = true;
  submitBtn.innerText = "Wait...";

  const amount =
    document.getElementById("amount").value.trim();

  const whatsapp =
    document.getElementById("whatsapp").value.trim();

  const file =
    receipt.files[0];

  const msg =
    document.getElementById("msg");

if (!amount || !whatsapp || !file) {

  msg.innerText = "Fill all fields ⚠️";

  submitBtn.disabled = false;
  submitBtn.innerText = "Submit Wallet Top Up";

  return;

}

  msg.innerText = "Uploading...";

  const fileName =
    Date.now() + "_" + file.name;

  const { error: uploadError } =
    await supabase.storage
      .from("uploads")
      .upload(fileName, file);

if (uploadError) {

  msg.innerText = "Upload Failed ❌";

  submitBtn.disabled = false;
  submitBtn.innerText = "Submit Wallet Top Up";

  return;

}

  const { data: urlData } =
    supabase.storage
      .from("uploads")
      .getPublicUrl(fileName);

  const receipt_url =
    urlData.publicUrl;

  // Save Database
  const { error } =
    await supabase
      .from("wallet_topups")
      .insert({

        user_id: currentUser.id,

        email: currentUser.email,

        whatsapp: whatsapp,

        amount: amount,

        receipt_url: receipt_url,

        status: "pending"

      });

if (error) {

  msg.innerText = error.message;

  submitBtn.disabled = false;
  submitBtn.innerText = "Submit Wallet Top Up";

  return;

}

  // Discord
  const form = new FormData();

  form.append(
    "content",
`💰 Wallet Topup Request

Email : ${currentUser.email}

WhatsApp : ${whatsapp}

Amount : Rs.${amount}

Receipt :
${receipt_url}`
  );

  await fetch(
    "https://discord.com/api/webhooks/1531970544776511540/j0ufnoAuGXDCgyHkwnE_MbgYZZcO-CtYwn4tgY2Ec4nTn-qw0cbkgGYgNVNHvjN9PPjy",
    {
      method: "POST",
      body: form
    }
  );

  msg.innerText = "Wallet Request Submitted ✅";

  submitBtn.innerText = "Submitted ✅";

localStorage.setItem("openWalletHistory", "true");

setTimeout(() => {
    window.location.href = "history.html";
}, 1000);

};

/* ===========================================
   REDEEM CODE
=========================================== */

const redeemBtn =
  document.getElementById("redeemBtn");

const redeemCodeInput =
  document.getElementById("redeemCode");

const redeemMsg =
  document.getElementById("redeemMsg");


if (redeemBtn) {

  redeemBtn.onclick = async () => {

    const code =
      redeemCodeInput?.value.trim();

    /* =====================================
       VALIDATE
    ===================================== */

    if (!code) {

      redeemMsg.innerText =
        "Please enter a redeem code ⚠️";

      redeemMsg.style.color =
        "#ef4444";

      return;

    }


    /* =====================================
       LOADING
    ===================================== */

    redeemBtn.disabled = true;

    redeemBtn.innerText =
      "Verifying...";

    redeemMsg.innerText =
      "";


    try {

      /* ===================================
         CHECK LOGIN
      =================================== */

      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();


      if (!session) {

        throw new Error(
          "Please login again."
        );

      }


      /* ===================================
         REDEEM RPC
      =================================== */

      const {
        data,
        error
      } = await supabase.rpc(
        "redeem_wallet_code",
        {
          p_code: code
        }
      );


      if (error) {

        console.error(
          "Redeem error:",
          error
        );

        throw new Error(
          error.message ||
          "Unable to redeem code."
        );

      }


      /* ===================================
         RPC RESULT
      =================================== */

      if (!data?.success) {

        redeemMsg.innerText =
          data?.message ||
          "Invalid redeem code ❌";

        redeemMsg.style.color =
          "#ef4444";

        return;

      }


      /* ===================================
         SUCCESS
      =================================== */

      const amount =
        Number(
          data.amount || 0
        );


      redeemMsg.innerText =
        `Rs. ${amount.toFixed(2)} added to your wallet successfully! ✅`;

      redeemMsg.style.color =
        "#22c55e";


      redeemCodeInput.value = "";


      console.log(
        "✅ Redeem successful:",
        data
      );


    } catch (error) {

      console.error(
        "Redeem code error:",
        error
      );

      redeemMsg.innerText =
        error.message ||
        "Redeem failed ❌";

      redeemMsg.style.color =
        "#ef4444";

    } finally {

      redeemBtn.disabled = false;

      redeemBtn.innerText =
        "Redeem Code";

    }

  };

}

/* ===========================================
   WALLET / REDEEM TAB SWITCH
=========================================== */

const walletTab =
  document.getElementById("walletTab");

const redeemTab =
  document.getElementById("redeemTab");

const walletTopupSection =
  document.getElementById("walletTopupSection");

const redeemSection =
  document.getElementById("redeemSection");


walletTab.onclick = () => {

  walletTopupSection.style.display =
    "block";

  redeemSection.style.display =
    "none";

  walletTab.classList.add("active");

  redeemTab.classList.remove("active");

};


redeemTab.onclick = () => {

  walletTopupSection.style.display =
    "none";

  redeemSection.style.display =
    "block";

  redeemTab.classList.add("active");

  walletTab.classList.remove("active");

};