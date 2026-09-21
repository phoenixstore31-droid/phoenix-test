import { createClient } from
"https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";


// =========================================
// SUPABASE
// =========================================

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


// =========================================
// ELEMENTS
// =========================================

const playerId =
    document.getElementById("playerId");

const clearPlayerId =
    document.getElementById("clearPlayerId");

const playerIdError =
    document.getElementById("playerIdError");

const productsContainer =
    document.getElementById("productsContainer");

const productsLoading =
    document.getElementById("productsLoading");

const productsEmpty =
    document.getElementById("productsEmpty");

const walletBalance =
    document.getElementById("walletBalance");

const backBtn =
    document.getElementById("backBtn");

const walletBtn =
    document.getElementById("walletBtn");

const selectedProductName =
    document.getElementById(
        "selectedProductName"
    );

const summaryPlayerId =
    document.getElementById(
        "summaryPlayerId"
    );

const summaryAmount =
    document.getElementById(
        "summaryAmount"
    );

const summaryPrice =
    document.getElementById(
        "summaryPrice"
    );

const continueBtn =
    document.getElementById(
        "continueBtn"
    );

const paymentModal =
    document.getElementById(
        "paymentModal"
    );

const closePaymentModal =
    document.getElementById(
        "closePaymentModal"
    );

const cancelPayment =
    document.getElementById(
        "cancelPayment"
    );

const confirmPayment =
    document.getElementById(
        "confirmPayment"
    );

const modalPlayerId =
    document.getElementById(
        "modalPlayerId"
    );

const modalProduct =
    document.getElementById(
        "modalProduct"
    );

const modalAmount =
    document.getElementById(
        "modalAmount"
    );

const modalPrice =
    document.getElementById(
        "modalPrice"
    );

const toast =
    document.getElementById("toast");

const toastIcon =
    document.getElementById(
        "toastIcon"
    );

const toastMessage =
    document.getElementById(
        "toastMessage"
    );


// =========================================
// DATA
// =========================================

let session = null;

let products = [];

let selectedProduct = null;

let currentWalletBalance = 0;

let isOrdering = false;


// =========================================
// GARENA SHELL STOCK
// =========================================

let shellBalance = 0;


// =========================================
// LOAD GARENA SHELL BALANCE
// =========================================

async function loadShellBalance() {

    const {
        data,
        error
    } = await supabase
        .from("garena_shell_stock")
        .select("shell_balance")
        .eq("id", 1)
        .maybeSingle();


    if (error) {

        console.error(
            "Garena Shell Stock Error:",
            error
        );

        shellBalance = 0;

        return;

    }


    shellBalance =
        Number(
            data?.shell_balance || 0
        );


    console.log(
        "🔥 Delta Force Shell Balance:",
        shellBalance
    );

}


// =========================================
// FORMAT PRICE
// =========================================

function formatPrice(value) {

    return Number(value || 0)
        .toFixed(2);

}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHTML(value) {

    return String(value ?? "")

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// =========================================
// TOAST
// =========================================

let toastTimer = null;


function showToast(
    message,
    type = "success"
) {

    if (!toast)
        return;


    clearTimeout(toastTimer);


    toastMessage.textContent =
        message;


    toast.classList.remove(
        "error"
    );


    if (type === "error") {

        toast.classList.add(
            "error"
        );


        toastIcon.className =
            "fa-solid fa-circle-exclamation";

    }
    else {

        toastIcon.className =
            "fa-solid fa-circle-check";

    }


    toast.classList.add(
        "show"
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3500
        );

}


// =========================================
// SESSION
// =========================================

async function loadSession() {

    const {
        data,
        error
    } =
        await supabase.auth.getSession();


    if (error) {

        console.error(
            "Session Error:",
            error
        );

    }


    session =
        data?.session || null;


    if (!session) {

        window.location.href =
            "login.html";

        return false;

    }


    return true;

}


// =========================================
// WALLET
// =========================================

async function loadWallet() {

    if (!session)
        return;


    const {
        data,
        error
    } =
        await supabase
            .from("profiles")
            .select(
                "wallet_balance"
            )
            .eq(
                "id",
                session.user.id
            )
            .single();


    if (error) {

        console.error(
            "Wallet Error:",
            error
        );

        return;

    }


    currentWalletBalance =
        Number(
            data?.wallet_balance || 0
        );


    if (walletBalance) {

        walletBalance.textContent =
            formatPrice(
                currentWalletBalance
            );

    }

}


// =========================================
// LOAD PRODUCTS
// =========================================

async function loadProducts() {

    if (!productsContainer)
        return;


    productsLoading.style.display =
        "flex";


    productsContainer.innerHTML =
        "";


    productsEmpty.style.display =
        "none";


    const {
        data,
        error
    } =
        await supabase
            .from(
                "delta_force_products"
            )
            .select("*")
            .eq(
                "active",
                true
            )
            .order(
                "sort_order",
                {
                    ascending: true
                }
            );


    productsLoading.style.display =
        "none";


    if (error) {

        console.error(
            "Delta Force Products Error:",
            error
        );


        productsEmpty.style.display =
            "block";


        productsEmpty.querySelector(
            "h3"
        ).textContent =
            "Unable to Load Packages";


        productsEmpty.querySelector(
            "p"
        ).textContent =
            "Please refresh the page and try again.";


        return;

    }


products =
    data || [];

await loadShellBalance();

if (!products.length) {

        productsEmpty.style.display =
            "block";

        return;

    }


    renderProducts();

}


// =========================================
// RENDER PRODUCTS
// =========================================

function renderProducts() {

    productsContainer.innerHTML =
        "";


    products.forEach(
        product => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "product-card";


const shellCost =
    Number(
        product.garena_shell_cost || 0
    );

const availableStock =
    shellCost > 0
        ? Math.floor(
            shellBalance / shellCost
          )
        : 0;

const inStock =
    availableStock > 0;


            if (!inStock) {

                card.classList.add(
                    "out-of-stock"
                );

            }


            if (
                selectedProduct &&
                selectedProduct.id ===
                    product.id
            ) {

                card.classList.add(
                    "selected"
                );

            }


            const price =
                Number(
                    product.price || 0
                );


            card.innerHTML = `

                <div class="product-top">

                    <div class="product-icon">

                        <i class="fa-solid fa-crosshairs"></i>

                    </div>

                    <div
                        class="product-stock ${
                            inStock
                                ? ""
                                : "out"
                        }"
                    >

${
    inStock
        ? `${availableStock} AVAILABLE`
        : "OUT OF STOCK"
}

                    </div>

                </div>


                <div class="product-name">

                    ${escapeHTML(
                        product.product_name
                    )}

                </div>


                <div class="product-points">

                    ${Number(
                        product.point_amount || 0
                    ).toLocaleString(
                        "en-US"
                    )} Points

                </div>


                <div class="product-price">

                    <span>Rs.</span>
                    ${formatPrice(price)}

                </div>


                <div class="product-selected">

                    <i class="fa-solid fa-check"></i>

                </div>

            `;


            if (inStock) {

                card.addEventListener(
                    "click",
                    () => {

                        selectProduct(
                            product
                        );

                    }
                );

            }


            productsContainer.appendChild(
                card
            );

        }
    );

}


// =========================================
// SELECT PRODUCT
// =========================================

function selectProduct(
    product
) {

    if (!product)
        return;


const shellCost =
    Number(
        product.garena_shell_cost || 0
    );

const availableStock =
    shellCost > 0
        ? Math.floor(
            shellBalance / shellCost
          )
        : 0;

if (availableStock <= 0) {

    showToast(
        "This package is out of stock.",
        "error"
    );

    return;

}


    selectedProduct =
        product;


    renderProducts();


    updateSummary();

}


// =========================================
// UPDATE SUMMARY
// =========================================

function updateSummary() {

    if (!selectedProduct) {

        selectedProductName.textContent =
            "No package selected";

        summaryPlayerId.textContent =
            "—";

        summaryAmount.textContent =
            "—";

        summaryPrice.textContent =
            "0.00";

        continueBtn.disabled =
            true;

        return;

    }


    selectedProductName.textContent =
        selectedProduct.product_name;


    summaryPlayerId.textContent =
        playerId.value.trim() || "—";


    summaryAmount.textContent =
        `${Number(
            selectedProduct.point_amount || 0
        ).toLocaleString(
            "en-US"
        )} Points`;


    summaryPrice.textContent =
        formatPrice(
            selectedProduct.price
        );


    validateForm();

}


// =========================================
// PLAYER ID VALIDATION
// =========================================

function validatePlayerId() {

    const value =
        playerId.value.trim();


    if (!value) {

        playerIdError.textContent =
            "Please enter your Player ID.";

        return false;

    }


    if (value.length < 3) {

        playerIdError.textContent =
            "Please enter a valid Player ID.";

        return false;

    }


    playerIdError.textContent =
        "";


    return true;

}


// =========================================
// FORM VALIDATION
// =========================================

function validateForm() {

    const validPlayer =
        validatePlayerId();


    const validProduct =
        !!selectedProduct;


    continueBtn.disabled =
        !validPlayer ||
        !validProduct ||
        isOrdering;

}


// =========================================
// PLAYER ID INPUT
// =========================================

playerId?.addEventListener(
    "input",
    () => {

        if (playerId.value.trim()) {

            clearPlayerId.classList.add(
                "show"
            );

        }
        else {

            clearPlayerId.classList.remove(
                "show"
            );

        }


        summaryPlayerId.textContent =
            playerId.value.trim() ||
            "—";


        validateForm();

    }
);


// =========================================
// CLEAR PLAYER ID
// =========================================

clearPlayerId?.addEventListener(
    "click",
    () => {

        playerId.value = "";

        clearPlayerId.classList.remove(
            "show"
        );

        playerId.focus();

        summaryPlayerId.textContent =
            "—";

        validateForm();

    }
);


// =========================================
// OPEN PAYMENT MODAL
// =========================================

function openPaymentModal() {

    if (!selectedProduct)
        return;


    if (!validatePlayerId())
        return;


    const price =
        Number(
            selectedProduct.price || 0
        );


    if (
        currentWalletBalance <
        price
    ) {

        showToast(
            "Insufficient wallet balance.",
            "error"
        );

        return;

    }


    modalPlayerId.textContent =
        playerId.value.trim();


    modalProduct.textContent =
        selectedProduct.product_name;


    modalAmount.textContent =
        `${Number(
            selectedProduct.point_amount || 0
        ).toLocaleString(
            "en-US"
        )} Points`;


    modalPrice.textContent =
        formatPrice(price);


    paymentModal.classList.add(
        "show"
    );


    paymentModal.setAttribute(
        "aria-hidden",
        "false"
    );

}


// =========================================
// CLOSE PAYMENT MODAL
// =========================================

function closeModal() {

    paymentModal.classList.remove(
        "show"
    );


    paymentModal.setAttribute(
        "aria-hidden",
        "true"
    );

}


continueBtn?.addEventListener(
    "click",
    openPaymentModal
);


closePaymentModal?.addEventListener(
    "click",
    closeModal
);


cancelPayment?.addEventListener(
    "click",
    closeModal
);


paymentModal?.addEventListener(
    "click",
    event => {

        if (
            event.target.classList.contains(
                "modal-overlay"
            )
        ) {

            closeModal();

        }

    }
);


// =========================================
// GENERATE ORDER NUMBER
// =========================================

function generateOrderNumber() {

    const now =
        Date.now()
            .toString()
            .slice(-8);


    const random =
        Math.floor(
            100 +
            Math.random() * 900
        );


    return `PNX-DF-${now}${random}`;

}


// =========================================
// CONFIRM PAYMENT
// =========================================

async function confirmOrder() {

    if (isOrdering)
        return;


    if (!session) {

        showToast(
            "Please login again.",
            "error"
        );

        return;

    }


    if (!selectedProduct) {

        showToast(
            "Please select a package.",
            "error"
        );

        return;

    }


    if (!validatePlayerId())
        return;


    isOrdering = true;


    confirmPayment.disabled =
        true;


    confirmPayment.innerHTML = `

        <span>
            PROCESSING...
        </span>

        <i class="fa-solid fa-spinner fa-spin"></i>

    `;


    try {

        // =====================================
        // CALL SECURE SUPABASE FUNCTION
        // =====================================

        const {
            data,
            error
        } =
            await supabase.rpc(
                "purchase_delta_force_product",
                {
                    p_product_id:
                        selectedProduct.id,

                    p_player_id:
                        playerId.value.trim()
                }
            );


        if (error)
            throw error;


        if (!data?.success) {

            throw new Error(
                "Unable to place order."
            );

        }


        // =====================================
        // SUCCESS
        // =====================================

        closeModal();


        showToast(
            `Order ${data.order_number} placed successfully.`
        );


        // =====================================
        // RESET
        // =====================================

        playerId.value = "";


        clearPlayerId.classList.remove(
            "show"
        );


        selectedProduct =
            null;


        renderProducts();

        updateSummary();


        // =====================================
        // REFRESH WALLET
        // =====================================

        await loadWallet();


    }
    catch (error) {

        console.error(
            "Delta Force Order Error:",
            error
        );


        showToast(
            error?.message ||
            "Unable to place order. Please try again.",
            "error"
        );

    }
    finally {

        isOrdering =
            false;


        confirmPayment.disabled =
            false;


        confirmPayment.innerHTML = `

            <span>
                CONFIRM & PAY
            </span>

            <i class="fa-solid fa-arrow-right"></i>

        `;


        validateForm();

    }

}


// =========================================
// CONFIRM BUTTON
// =========================================

confirmPayment?.addEventListener(
    "click",
    confirmOrder
);


// =========================================
// BACK BUTTON
// =========================================

backBtn?.addEventListener(
    "click",
    () => {

        window.history.back();

    }
);


// =========================================
// WALLET BUTTON
// =========================================

walletBtn?.addEventListener(
    "click",
    () => {

        window.location.href =
            "wallet-topup.html";

    }
);


// =========================================
// WALLET REAL-TIME REFRESH
// =========================================

setInterval(
    loadWallet,
    10000
);


// =========================================
// GARENA SHELL STOCK REAL-TIME REFRESH
// =========================================

setInterval(
    async () => {

        await loadShellBalance();

        if (products.length) {

            renderProducts();

        }

    },
    5000
);

// =========================================
// AUTH STATE
// =========================================

supabase.auth.onAuthStateChange(
    (
        event,
        newSession
    ) => {

        if (
            event ===
            "SIGNED_OUT"
        ) {

            window.location.href =
                "login.html";

            return;

        }


        session =
            newSession;

    }
);


// =========================================
// INITIAL LOAD
// =========================================

async function init() {

    const loggedIn =
        await loadSession();


    if (!loggedIn)
        return;


    await loadWallet();

    await loadProducts();

    updateSummary();


    console.log(
        "🔥 Delta Force Top-Up Loaded"
    );

}


await init();