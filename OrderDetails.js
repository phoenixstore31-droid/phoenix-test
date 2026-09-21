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
   GET SESSION
=========================================== */

const {
    data: { session }
} = await supabase.auth.getSession();


let isAdmin = false;


/* ===========================================
   ADMIN CHECK
=========================================== */

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
   MAINTENANCE CHECK
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
   LOGIN CHECK
=========================================== */

if (!session) {

    location.href = "login.html";

    throw new Error("User not authenticated");
}


/* ===========================================
   LOAD USER PROFILE
=========================================== */

const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_balance")
    .eq("id", session.user.id)
    .single();


const walletBalance =
    Number(profile?.wallet_balance || 0);


/* ===========================================
   HEADER WALLET
=========================================== */

const walletBalanceElement =
    document.getElementById("walletBalance");


if (walletBalanceElement) {

    walletBalanceElement.textContent =
        "Rs. " + walletBalance.toFixed(2);
}


/* ===========================================
   CARD WALLET
=========================================== */

const walletBalanceCardElement =
    document.getElementById("walletBalanceCard");


if (walletBalanceCardElement) {

    walletBalanceCardElement.textContent =
        "Rs. " + walletBalance.toFixed(2);
}


/* ===========================================
   LOAD SELECTED PRODUCT
=========================================== */

const selectedProduct =
    localStorage.getItem("selectedProduct");


if (!selectedProduct) {

    location.href = "topup.html";

    throw new Error("No selected product");
}


let product;


try {

    product = JSON.parse(selectedProduct);

} catch (error) {

    console.error(
        "Invalid selectedProduct:",
        error
    );

    localStorage.removeItem("selectedProduct");

    location.href = "topup.html";

    throw new Error("Invalid selected product");
}


/* ===========================================
   PRODUCT ELEMENTS
=========================================== */

const productImage =
    document.getElementById("productImage");

const productName =
    document.getElementById("productName");

const productPrice =
    document.getElementById("productPrice");


if (productImage) {

    productImage.src =
        product.image || "image/default-avatar.jpg";
}


if (productName) {

    productName.textContent =
        product.title || "Product";
}


const unitPrice =
    Number(product.price || 0);


if (productPrice) {

    productPrice.textContent =
        "Rs. " + unitPrice.toFixed(2);
}


/* ===========================================
   QUANTITY
=========================================== */

let quantity = 1;


const minusBtn =
    document.getElementById("minusBtn");

const plusBtn =
    document.getElementById("plusBtn");

const quantityText =
    document.getElementById("quantity");

const totalPrice =
    document.getElementById("totalPrice");


function updateTotal() {

    const total =
        unitPrice * quantity;

    if (quantityText) {

        quantityText.textContent =
            quantity;
    }

    if (totalPrice) {

        totalPrice.textContent =
            "Rs. " + total.toFixed(2);
    }
}


updateTotal();


/* ===========================================
   PLUS BUTTON
=========================================== */

if (plusBtn) {

    plusBtn.addEventListener(
        "click",
        () => {

            if (quantity < 5) {

                quantity++;

                updateTotal();
            }
        }
    );
}


/* ===========================================
   MINUS BUTTON
=========================================== */

if (minusBtn) {

    minusBtn.addEventListener(
        "click",
        () => {

            if (quantity > 1) {

                quantity--;

                updateTotal();
            }
        }
    );
}


/* ===========================================
   SUBMIT ELEMENTS
=========================================== */

const submitBtn =
    document.getElementById("submitBtn");

const uidInput =
    document.getElementById("uid");

const msg =
    document.getElementById("msg");


/* ===========================================
   MESSAGE HELPER
=========================================== */

function showMessage(
    message,
    type = "error"
) {

    if (!msg) {
        return;
    }


    if (type === "success") {

        msg.style.color = "limegreen";

    } else if (type === "warning") {

        msg.style.color = "orange";

    } else {

        msg.style.color = "red";
    }


    msg.textContent = message;
}


/* ===========================================
   SUBMIT ORDER
=========================================== */

if (submitBtn) {

    submitBtn.addEventListener(
        "click",
        async () => {

            /* ---------------------------------
               PREVENT DOUBLE CLICK
            --------------------------------- */

            if (submitBtn.disabled) {
                return;
            }


            /* ---------------------------------
               UID
            --------------------------------- */

            const uid =
                uidInput?.value.trim() || "";


            if (uid === "") {

                showMessage(
                    "⚠️ Please enter your Game UID"
                );

                uidInput?.focus();

                return;
            }


            /* ---------------------------------
               BASIC PRODUCT VALIDATION
            --------------------------------- */

            if (
                !product.id ||
                !Number.isFinite(Number(product.id))
            ) {

                showMessage(
                    "❌ Invalid product. Please select the product again."
                );

                return;
            }


            /* ---------------------------------
               SESSION REFRESH
            --------------------------------- */

            const {
                data: {
                    session: currentSession
                }
            } = await supabase.auth.getSession();


            if (!currentSession) {

                location.href =
                    "login.html";

                return;
            }


            /* ---------------------------------
               DISABLE BUTTON
            --------------------------------- */

            submitBtn.disabled = true;

            const originalButtonText =
                submitBtn.textContent;

            submitBtn.textContent =
                "⏳ Processing...";


            try {

                /* =================================
                   STEP 1
                   CREATE PENDING PHOENIX ORDER

                   This RPC:
                   - validates product
                   - checks wallet
                   - deducts wallet
                   - creates Pending order
                   - creates unique clientKey
                ================================= */

                showMessage(
                    "⏳ Creating your order...",
                    "warning"
                );


                const {
                    data: orderData,
                    error: orderError
                } = await supabase.rpc(
                    "create_shelltopup_order",
                    {
                        p_product_id:
                            Number(product.id),

                        p_uid:
                            uid,

                        p_quantity:
                            quantity
                    }
                );


                /* ---------------------------------
                   RPC ERROR
                --------------------------------- */

                if (orderError) {

                    console.error(
                        "create_shelltopup_order error:",
                        orderError
                    );


                    const errorMessage =
                        String(
                            orderError.message || ""
                        );


                    if (
                        errorMessage.toLowerCase()
                            .includes(
                                "insufficient wallet balance"
                            )
                    ) {

                        showMessage(
                            "❌ Wallet balance is not enough."
                        );

                    } else {

                        showMessage(
                            "❌ Order could not be created. Please try again."
                        );
                    }


                    submitBtn.disabled = false;

                    submitBtn.textContent =
                        originalButtonText;

                    return;
                }


                /* ---------------------------------
                   RPC RESPONSE VALIDATION
                --------------------------------- */

                if (
                    !orderData ||
                    !orderData.success ||
                    !orderData.order_id
                ) {

                    console.error(
                        "Invalid order response:",
                        orderData
                    );


                    showMessage(
                        "❌ Order could not be created."
                    );


                    submitBtn.disabled = false;

                    submitBtn.textContent =
                        originalButtonText;

                    return;
                }


                const orderId =
                    orderData.order_id;


                /* =================================
                   STEP 2
                   DISCORD PENDING NOTIFICATION

                   This is only notification.
                   It must NOT control payment.
                ================================= */

                try {

                    await fetch(
                        "/.netlify/functions/discord-pending",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                productName:
                                    product.title,

                                uid:
                                    uid,

                                quantity:
                                    quantity,

                                totalPrice:
                                    Number(
                                        orderData.total_price ||
                                        0
                                    )
                            })
                        }
                    );

                } catch (discordError) {

                    console.error(
                        "Discord pending notification failed:",
                        discordError
                    );
                }


                /* =================================
                   STEP 3
                   CALL NETLIFY BACKEND

                   The backend:
                   - verifies user
                   - reads Phoenix order
                   - gets ShellTopup mapping
                   - sends API request
                   - handles retry
                   - handles success
                   - handles refund
                ================================= */

                showMessage(
                    "🚀 Processing your top-up...",
                    "warning"
                );


                const {
                    data: {
                        session: latestSession
                    }
                } = await supabase.auth.getSession();


                if (!latestSession) {

                    showMessage(
                        "❌ Your login session expired."
                    );

                    return;
                }


                const accessToken =
                    latestSession.access_token;


                const providerResponse =
                    await fetch(
                        "/.netlify/functions/shelltopup-order",
                        {
                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${accessToken}`
                            },

                            body: JSON.stringify({

                                orderId:
                                    orderId
                            })
                        }
                    );


                let providerData = null;


                try {

                    providerData =
                        await providerResponse.json();

                } catch {

                    providerData = {
                        ok: false,
                        error:
                            "Invalid server response."
                    };
                }


                console.log(
                    "ShellTopup response:",
                    providerData
                );


                /* =================================
                   STEP 4
                   SUCCESS
                ================================= */

                if (
                    providerResponse.ok &&
                    providerData?.ok === true &&
                    providerData?.status === "Success"
                ) {

                    showMessage(
                        "✅ Top-up completed successfully!",
                        "success"
                    );


                    setTimeout(
                        () => {

                            location.href =
                                "history.html";

                        },
                        1200
                    );


                    return;
                }


                /* =================================
                   STEP 5
                   PROCESSING

                   Do NOT tell customer it failed.
                   Wallet should NOT be refunded.
                ================================= */

                if (
                    providerResponse.status === 202 ||
                    providerData?.status === "Processing"
                ) {

                    showMessage(
                        "⏳ Your top-up is being processed. Please check your order history.",
                        "warning"
                    );


                    setTimeout(
                        () => {

                            location.href =
                                "history.html";

                        },
                        1800
                    );


                    return;
                }


                /* =================================
                   STEP 6
                   RATE LIMIT / RETRY
                ================================= */

                if (
                    providerResponse.status === 429 ||
                    providerData?.retryable === true
                ) {

                    showMessage(
                        "⏳ Top-up service is temporarily busy. Your order is safe. Please check history and retry if needed.",
                        "warning"
                    );


                    setTimeout(
                        () => {

                            location.href =
                                "history.html";

                        },
                        2200
                    );


                    return;
                }


                /* =================================
                   STEP 7
                   FAILED + REFUNDED
                ================================= */

                if (
                    providerData?.refunded === true
                ) {

                    showMessage(
                        "❌ Top-up failed. Your wallet has been refunded."
                    );


                    setTimeout(
                        () => {

                            location.href =
                                "history.html";

                        },
                        2200
                    );


                    return;
                }


                /* =================================
                   STEP 8
                   UNKNOWN ERROR

                   Don't claim refund if backend
                   didn't confirm refund.
                ================================= */

                showMessage(
                    providerData?.error ||
                    "❌ Top-up could not be completed. Please check your order history."
                );


                setTimeout(
                    () => {

                        location.href =
                            "history.html";

                    },
                    2500
                );


            } catch (error) {

                console.error(
                    "Order processing error:",
                    error
                );


                showMessage(
                    "⚠️ Unable to confirm the top-up status. Please check your order history."
                );


                /*
                 IMPORTANT:
                 We do NOT refund here from frontend.

                 If the request reached ShellTopup
                 but the response was lost, the same
                 clientKey must be used for retry.
                */


                setTimeout(
                    () => {

                        location.href =
                            "history.html";

                    },
                    2500
                );


            } finally {

                /*
                 Don't re-enable after success/processing
                 because page will redirect.
                */

                if (
                    submitBtn &&
                    !submitBtn.disabled
                ) {

                    submitBtn.textContent =
                        originalButtonText;
                }
            }
        }
    );
}

