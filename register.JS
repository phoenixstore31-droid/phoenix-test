import { createClient } from
"https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl =
"https://tvhgxlqqeklrdlgbkosa.supabase.co";

const supabaseKey =
"sb_publishable_Ep28HPF1SXIXQXBF2i__eg_h_jmjw4I";

const supabase =
createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});


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

  throw new Error("Maintenance mode active");

}


/* ===========================================
   ELEMENTS
=========================================== */

const form =
document.getElementById("registerForm");

const popup =
document.getElementById("otpPopup");

const verifyBtn =
document.getElementById("verifyOtpBtn");

const createBtn =
document.querySelector(
  "#registerForm button[type='submit']"
);

const resendBtn =
document.getElementById("resendOtpBtn");

const timerText =
document.getElementById("otpTimer");


let timerInterval;

/* ===========================================
   PREMIUM ALERT
=========================================== */

const premiumAlert =
  document.getElementById("premiumAlert");

const premiumAlertTitle =
  document.getElementById("premiumAlertTitle");

const premiumAlertMessage =
  document.getElementById("premiumAlertMessage");

const premiumAlertBtn =
  document.getElementById("premiumAlertBtn");


function showPremiumAlert(
  title,
  message
) {

  premiumAlertTitle.innerText = title;

  premiumAlertMessage.innerText = message;

  premiumAlert.style.display = "flex";

}


function closePremiumAlert() {

  premiumAlert.style.display = "none";

}


premiumAlertBtn.addEventListener(
  "click",
  closePremiumAlert
);


premiumAlert.addEventListener(
  "click",
  (event) => {

    if (event.target === premiumAlert) {
      closePremiumAlert();
    }

  }
);


/* ===========================================
   REGISTER
=========================================== */

form.addEventListener("submit", async (e) => {

  e.preventDefault();

  createBtn.disabled = true;
  createBtn.innerText = "Verifying Account...";


  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value.trim();


  /* =========================================
     PASSWORD VALIDATION
  ========================================= */

if (password.length < 8) {

  showPremiumAlert(
    "Password Requirement",
    "Your password must contain at least 8 characters."
  );

  createBtn.disabled = false;
  createBtn.innerText = "Create Account";

  return;
}


  try {

    /* =========================================
       CHECK EXISTING USER
    ========================================= */

    const checkResponse =
      await fetch(
        "/.netlify/functions/check-user",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email: email
          })
        }
      );


    const checkResult =
      await checkResponse.json();


    if (checkResult.exists) {

      alert(
        "Email already used. Please login."
      );

      createBtn.disabled = false;
      createBtn.innerText = "Create Account";

      return;
    }


    /* =========================================
       SEND OTP
    ========================================= */

    const response =
      await fetch(
        "/.netlify/functions/send",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email: email
          })
        }
      );


    const result =
      await response.json();


    if (result.success) {

      popup.style.display = "flex";

      startOtpTimer();

      createBtn.disabled = false;
      createBtn.innerText = "Create Account";

    }

    else {

      alert(
        result.error ||
        "Failed to send OTP."
      );

      createBtn.disabled = false;
      createBtn.innerText = "Create Account";

    }


  } catch (error) {

    console.error(error);

    createBtn.disabled = false;
    createBtn.innerText = "Create Account";

    alert(
      error.message ||
      "Something went wrong."
    );

  }

});


/* ===========================================
   OTP TIMER
=========================================== */

function startOtpTimer() {

  if (timerInterval) {
    clearInterval(timerInterval);
  }

  let time = 120;

  resendBtn.disabled = true;


  timerInterval = setInterval(() => {

    const minutes =
      Math.floor(time / 60);

    const seconds =
      time % 60;


    timerText.innerText =
      `Resend OTP in ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;


    time--;


    if (time < 0) {

      clearInterval(timerInterval);

      timerText.innerText = "";

      resendBtn.disabled = false;

    }

  }, 1000);

}


/* ===========================================
   VERIFY OTP
=========================================== */

verifyBtn.addEventListener(
  "click",
  async () => {

    verifyBtn.disabled = true;
    verifyBtn.innerText = "Wait...";


    const email =
      document.getElementById("email").value.trim();

    const otp =
      document.getElementById("otpInput").value.trim();


    /* =========================================
       OTP VALIDATION
    ========================================= */

    if (otp.length !== 6) {

      alert(
        "Enter 6 digit OTP."
      );

      verifyBtn.disabled = false;
      verifyBtn.innerText = "Verify OTP";

      return;
    }


    try {

      /* =======================================
         VERIFY OTP
      ======================================= */

      const response =
        await fetch(
          "/.netlify/functions/verify-otp",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify({
              email: email,
              otp: otp
            })
          }
        );


      const result =
        await response.json();


      if (!result.success) {

        alert(
          result.error ||
          "Wrong OTP."
        );

        verifyBtn.disabled = false;
        verifyBtn.innerText = "Verify OTP";

        return;
      }


      /* =======================================
         GET USER DETAILS
      ======================================= */

      const username =
        document
          .getElementById("username")
          .value
          .trim();

      const password =
        document
          .getElementById("password")
          .value
          .trim();


      /* =======================================
         FINAL PASSWORD CHECK
      ======================================= */

if (password.length < 8) {

  showPremiumAlert(
    "Password Requirement",
    "Your password must contain at least 8 characters."
  );

  verifyBtn.disabled = false;
  verifyBtn.innerText = "Verify OTP";

  return;
}


      /* =======================================
         CREATE SUPABASE ACCOUNT
      ======================================= */

      const {
        data,
        error
      } = await supabase.auth.signUp({
        email,
        password
      });


      if (error) {

        console.error(
          "Supabase signup error:",
          error
        );

        alert(
          error.message ||
          "Account creation failed."
        );

        verifyBtn.disabled = false;
        verifyBtn.innerText = "Verify OTP";

        return;
      }


      /* =======================================
         CHECK USER
      ======================================= */

      if (!data.user) {

        alert(
          "Account creation failed. Please try again."
        );

        verifyBtn.disabled = false;
        verifyBtn.innerText = "Verify OTP";

        return;
      }


      /* =======================================
         CREATE PROFILE
      ======================================= */

      const {
        error: profileError
      } = await supabase
        .from("profiles")
        .insert({

          id: data.user.id,

          username: username,

          email: email

        });


      if (profileError) {

        console.error(
          "Profile creation error:",
          profileError
        );

        alert(
          "Account created, but profile creation failed. Please contact support."
        );

        verifyBtn.disabled = false;
        verifyBtn.innerText = "Verify OTP";

        return;
      }


      /* =======================================
         SUCCESS
      ======================================= */

      popup.style.display = "none";

      document
        .getElementById("successMsg")
        .style.display = "block";


      setTimeout(() => {

        window.location.href =
          "login.html";

      }, 2000);


    } catch (error) {

      console.error(error);

      alert(
        error.message ||
        "Something went wrong."
      );

      verifyBtn.disabled = false;
      verifyBtn.innerText = "Verify OTP";

    }

  }
);


/* ===========================================
   RESEND OTP
=========================================== */

resendBtn.addEventListener(
  "click",
  async () => {

    const email =
      document
        .getElementById("email")
        .value
        .trim();


    resendBtn.disabled = true;


    try {

      const response =
        await fetch(
          "/.netlify/functions/send",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify({
              email: email
            })
          }
        );


      const result =
        await response.json();


      if (result.success) {

        alert("New OTP sent.");

        startOtpTimer();

      }

      else {

        alert(
          result.error ||
          "Failed to resend OTP."
        );

        resendBtn.disabled = false;

      }


    } catch (error) {

      console.error(error);

      alert(
        error.message ||
        "Something went wrong."
      );

      resendBtn.disabled = false;

    }

  }
);