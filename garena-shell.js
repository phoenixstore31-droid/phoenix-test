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

const productsContainer =
    document.getElementById(
        "shellProducts"
    );

const productsLoading =
    document.getElementById(
        "productsLoading"
    );

const walletBalance =
    document.getElementById(
        "walletBalance"
    );

const walletButton =
    document.getElementById(
        "walletButton"
    );

const backButton =
    document.getElementById(
        "backButton"
    );


// =========================================
// POPUPS
// =========================================

const outOfStockPopup =
    document.getElementById(
        "outOfStockPopup"
    );

const purchasePopup =
    document.getElementById(
        "purchasePopup"
    );

const successPopup =
    document.getElementById(
        "successPopup"
    );

const errorPopup =
    document.getElementById(
        "errorPopup"
    );


// =========================================
// POPUP ELEMENTS
// =========================================

const outStockProductName =
    document.getElementById(
        "outStockProductName"
    );

const confirmShellAmount =
    document.getElementById(
        "confirmShellAmount"
    );

const confirmPrice =
    document.getElementById(
        "confirmPrice"
    );

const confirmWallet =
    document.getElementById(
        "confirmWallet"
    );

const purchaseError =
    document.getElementById(
        "purchaseError"
    );

const redeemCode =
    document.getElementById(
        "redeemCode"
    );

const successOrderNumber =
    document.getElementById(
        "successOrderNumber"
    );

const copyMessage =
    document.getElementById(
        "copyMessage"
    );

const errorTitle =
    document.getElementById(
        "errorTitle"
    );

const errorMessage =
    document.getElementById(
        "errorMessage"
    );


// =========================================
// STATE
// =========================================

let currentSession = null;

let products = [];

let selectedProduct = null;

let currentWalletBalance = 0;

let purchaseLoading = false;


// =========================================
// PRODUCT IMAGES
// =========================================
//
// Put your Garena Shell images here.
// If you have only one image, it can be
// reused for all packages.
//

const shellImages = {

    320:
        "../image/garena-shells.jpg",

    640:
        "../image/garena-shells.jpg",

    960:
        "../image/garena-shells.jpg",

    1600:
        "../image/garena-shells.jpg",

    3200:
        "../image/garena-shells.jpg",

    24000:
        "../image/garena-shells.jpg"

};


// =========================================
// LOGIN CHECK
// =========================================

async function checkLogin() {

    const {
        data: {
            session
        },
        error
    } =
        await supabase.auth.getSession();


    if (error) {

        console.error(
            "Session error:",
            error
        );

        window.location.replace(
            "login.html"
        );

        throw new Error(
            "Unable to verify login"
        );

    }


    if (!session) {

        window.location.replace(
            "login.html"
        );

        throw new Error(
            "Login required"
        );

    }


    currentSession =
        session;


    return session;

}


// =========================================
// LOAD WALLET
// =========================================

async function loadWallet() {

    if (!currentSession)
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
                currentSession.user.id
            )
            .single();


    if (error) {

        console.error(
            "Wallet error:",
            error
        );

        currentWalletBalance =
            0;

        walletBalance.textContent =
            "Rs. 0.00";

        return;

    }


    currentWalletBalance =
        Number(
            data?.wallet_balance || 0
        );


    walletBalance.textContent =
        "Rs. " +
        currentWalletBalance.toFixed(2);

}


// =========================================
// LOAD GARENA PRODUCTS
// =========================================

let productsFirstLoad = true;

async function loadProducts() {

    if (!productsContainer)
        return;


    // First page load மட்டும் loading காட்டும்
    if (productsFirstLoad) {

        productsLoading.style.display =
            "flex";

    }


    const {
        data,
        error
    } =
        await supabase.rpc(
            "get_garena_shell_products"
        );


    if (productsFirstLoad) {

        productsLoading.style.display =
            "none";

        productsFirstLoad = false;

    }


    if (error) {

        console.error(
            "Garena products error:",
            error
        );


        productsFirstLoad = true;


        showError(
            "Unable to Load",
            "We couldn't load the Garena Shell packages. Please try again."
        );


        return;

    }


    products =
        data || [];


    renderProducts();

}


// =========================================
// RENDER PRODUCTS - SMOOTH LIVE STOCK
// =========================================

function renderProducts() {

    if (!productsContainer)
        return;


    // -----------------------------------------
    // NO PRODUCTS
    // -----------------------------------------

    if (!products.length) {

        productsContainer.innerHTML = `

            <div class="empty-products">

                <i class="fa-solid fa-box-open"></i>

                <h3>
                    No Packages Available
                </h3>

                <p>
                    Please check again later.
                </p>

            </div>

        `;

        return;
    }


    // -----------------------------------------
    // REMOVE OLD EMPTY MESSAGE
    // -----------------------------------------

    const emptyMessage =
        productsContainer.querySelector(
            ".empty-products"
        );

    if (emptyMessage) {
        emptyMessage.remove();
    }


    // -----------------------------------------
    // EXISTING CARDS
    // -----------------------------------------

    const existingCards =
        new Map();

    productsContainer
        .querySelectorAll(".product-card")
        .forEach(card => {

            const id =
                card.dataset.productId;

            if (id) {
                existingCards.set(
                    id,
                    card
                );
            }

        });


    // -----------------------------------------
    // UPDATE / CREATE PRODUCTS
    // -----------------------------------------

    products.forEach(product => {

        const productId =
            String(product.id);

        const shellAmount =
            Number(
                product.shell_amount
            );

        const stock =
            Number(
                product.stock || 0
            );

        const price =
            Number(
                product.price || 0
            );

        const isOutOfStock =
            stock <= 0;

        const image =
            getShellImage(
                shellAmount
            );

        const formattedAmount =
            shellAmount.toLocaleString(
                "en-US"
            );

        const formattedPrice =
            price.toFixed(2);


        let card =
            existingCards.get(
                productId
            );


        // -------------------------------------
        // CREATE CARD ONLY IF NEW
        // -------------------------------------

        if (!card) {

            card =
                document.createElement(
                    "article"
                );

            card.className =
                "product-card";

            card.dataset.productId =
                productId;


            card.innerHTML = `

                <div class="product-image">

                    <img
                        src="${escapeHTML(image)}"
                        alt="${formattedAmount} Garena Shells"
                        loading="lazy"
                    >

                </div>


                <div class="product-name">
                    ${formattedAmount} Shells
                </div>


                <div class="stock-status">

                    <span class="stock-dot"></span>

                    <span class="stock-text"></span>

                </div>


                <div class="product-price">

                    Rs. ${formattedPrice}

                    <small>/=</small>

                </div>


                <button
                    type="button"
                    class="buy-button"
                ></button>

            `;


            // ---------------------------------
            // CLICK HANDLER
            // ---------------------------------

            card.addEventListener(
                "click",
                event => {

                    const button =
                        event.target.closest(
                            ".buy-button"
                        );

                    if (!button) {

                        handleProductClick(
                            card._product
                        );

                    }

                }
            );


            productsContainer.appendChild(
                card
            );

        }


        // -------------------------------------
        // STORE CURRENT PRODUCT
        // -------------------------------------

        card._product =
            product;


        // -------------------------------------
        // UPDATE STOCK ONLY
        // -------------------------------------

        const stockStatus =
            card.querySelector(
                ".stock-status"
            );

        const stockText =
            card.querySelector(
                ".stock-text"
            );

        const buyButton =
            card.querySelector(
                ".buy-button"
            );


        stockStatus.classList.toggle(
            "out-of-stock",
            isOutOfStock
        );

        stockStatus.classList.toggle(
            "in-stock",
            !isOutOfStock
        );


        stockText.textContent =
            isOutOfStock
                ? "OUT OF STOCK"
                : `${stock} AVAILABLE`;


        // -------------------------------------
        // UPDATE PRICE
        // -------------------------------------

        const priceElement =
            card.querySelector(
                ".product-price"
            );

        if (priceElement) {

            priceElement.innerHTML = `
                Rs. ${formattedPrice}
                <small>/=</small>
            `;

        }


        // -------------------------------------
        // UPDATE BUY BUTTON
        // -------------------------------------

        buyButton.classList.toggle(
            "out-of-stock-button",
            isOutOfStock
        );


        buyButton.innerHTML =
            isOutOfStock

                ? `
                    <i class="fa-solid fa-ban"></i>
                    Out of Stock
                  `

                : `
                    Buy Now
                    <i class="fa-solid fa-arrow-right"></i>
                  `;


        // -------------------------------------
        // BUTTON CLICK
        // -------------------------------------

        buyButton.onclick =
            event => {

                event.stopPropagation();

                handleProductClick(
                    card._product
                );

            };

    });


    // -----------------------------------------
    // REMOVE PRODUCTS NO LONGER IN DATABASE
    // -----------------------------------------

    const currentIds =
        new Set(
            products.map(
                product =>
                    String(product.id)
            )
        );


    productsContainer
        .querySelectorAll(".product-card")
        .forEach(card => {

            if (
                !currentIds.has(
                    card.dataset.productId
                )
            ) {

                card.remove();

            }

        });

}


// =========================================
// PRODUCT CLICK
// =========================================

function handleProductClick(
    product
) {

    const stock =
        Number(
            product.stock || 0
        );


    if (stock <= 0) {

        showOutOfStock(
            product
        );

        return;

    }


    selectedProduct =
        product;


    openPurchasePopup(
        product
    );

}


// =========================================
// OPEN PURCHASE POPUP
// =========================================

function openPurchasePopup(
    product
) {

    const amount =
        Number(
            product.shell_amount
        );


    const price =
        Number(
            product.price || 0
        );


    confirmShellAmount.textContent =
        amount.toLocaleString(
            "en-US"
        ) +
        " Shells";


    confirmPrice.textContent =
        "Rs. " +
        price.toFixed(2);


    confirmWallet.textContent =
        "Rs. " +
        currentWalletBalance.toFixed(2);


    purchaseError.textContent =
        "";


    purchaseError.style.display =
        "none";


    const confirmButton =
        document.getElementById(
            "confirmPurchase"
        );


    confirmButton.disabled =
        false;


    confirmButton.innerHTML = `

        Buy Now

        <i class="fa-solid fa-arrow-right"></i>

    `;


    showPopup(
        purchasePopup
    );

}


// =========================================
// PURCHASE
// =========================================

async function purchaseProduct() {

    if (
        purchaseLoading ||
        !selectedProduct
    ) {

        return;

    }


    purchaseLoading =
        true;


    const confirmButton =
        document.getElementById(
            "confirmPurchase"
        );


    confirmButton.disabled =
        true;


    confirmButton.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        Processing...

    `;


    purchaseError.style.display =
        "none";


    try {

        /*
         * Secure Supabase RPC.
         *
         * The actual wallet deduction,
         * redeem code selection,
         * order creation and code deletion
         * happen inside the database transaction.
         */

        const {
            data,
            error
        } =
        await supabase.rpc(
            "buy_garena_shell",
            {
                p_product_id:
                    selectedProduct.id
            }
        );


        if (error) {

            console.error(
                "Purchase RPC error:",
                error
            );


            handlePurchaseError(
                error
            );


            return;

        }


        if (
            !data ||
            data.success !== true
        ) {

            showError(
                "Purchase Failed",
                "We couldn't complete your purchase. Please try again."
            );

            return;

        }


        /*
         * Close confirmation popup
         */

        hidePopup(
            purchasePopup
        );


        /*
         * Refresh wallet
         */

        await loadWallet();


        /*
         * Refresh stock
         */

        await loadProducts();


        /*
         * Show redeem code
         */

        showSuccess(
            data
        );

    }

    catch(error) {

        console.error(
            "Purchase error:",
            error
        );


        showError(
            "Purchase Failed",
            "Something went wrong. Please try again."
        );

    }

    finally {

        purchaseLoading =
            false;


        confirmButton.disabled =
            false;


        confirmButton.innerHTML = `

            Buy Now

            <i class="fa-solid fa-arrow-right"></i>

        `;

    }

}


// =========================================
// PURCHASE ERROR HANDLER
// =========================================

function handlePurchaseError(
    error
) {

    const message =
        String(
            error?.message ||
            ""
        ).toUpperCase();


    /*
     * OUT OF STOCK
     */

    if (
        message.includes(
            "OUT_OF_STOCK"
        )
    ) {

        hidePopup(
            purchasePopup
        );


        /*
         * Refresh live stock first.
         */

        loadProducts();


        showOutOfStock(
            selectedProduct
        );


        return;

    }


    /*
     * INSUFFICIENT BALANCE
     */

    if (
        message.includes(
            "INSUFFICIENT_BALANCE"
        )
    ) {

        purchaseError.textContent =
            "Insufficient wallet balance. Please add funds and try again.";


        purchaseError.style.display =
            "block";


        confirmButtonReset();

        return;

    }


    /*
     * LOGIN REQUIRED
     */

    if (
        message.includes(
            "LOGIN_REQUIRED"
        )
    ) {

        window.location.replace(
            "login.html"
        );

        return;

    }


    /*
     * PRODUCT NOT AVAILABLE
     */

    if (
        message.includes(
            "PRODUCT_NOT_AVAILABLE"
        )
    ) {

        hidePopup(
            purchasePopup
        );


        showError(
            "Product Unavailable",
            "This Shell package is no longer available."
        );


        loadProducts();

        return;

    }


    /*
     * GENERIC ERROR
     */

    showError(
        "Purchase Failed",
        "We couldn't complete your purchase. Please try again."
    );


    confirmButtonReset();

}


// =========================================
// RESET CONFIRM BUTTON
// =========================================

function confirmButtonReset() {

    const confirmButton =
        document.getElementById(
            "confirmPurchase"
        );


    confirmButton.disabled =
        false;


    confirmButton.innerHTML = `

        Buy Now

        <i class="fa-solid fa-arrow-right"></i>

    `;


    purchaseLoading =
        false;

}


// =========================================
// OUT OF STOCK POPUP
// =========================================

function showOutOfStock(
    product
) {

    if (!outOfStockPopup)
        return;


    const amount =
        Number(
            product?.shell_amount || 0
        );


    outStockProductName.textContent =

        amount.toLocaleString(
            "en-US"
        ) +

        " Shells is currently out of stock.";


    showPopup(
        outOfStockPopup
    );

}


// =========================================
// SUCCESS POPUP
// =========================================

function showSuccess(
    result
) {

    const code =
        result?.redeem_code ||
        "";


    const orderNumber =
        result?.order_number ||
        "—";


    redeemCode.textContent =
        code;


    successOrderNumber.textContent =
        orderNumber;


    copyMessage.classList.remove(
        "show"
    );


    showPopup(
        successPopup
    );

}


// =========================================
// COPY REDEEM CODE
// =========================================

async function copyRedeemCode() {

    const code =
        redeemCode.textContent.trim();


    if (!code)
        return;


    try {

        await navigator.clipboard.writeText(
            code
        );


        copyMessage.textContent =
            "Code copied!";


        copyMessage.classList.add(
            "show"
        );


        setTimeout(
            () => {

                copyMessage.classList.remove(
                    "show"
                );

            },
            2000
        );

    }

    catch(error) {

        console.error(
            "Clipboard error:",
            error
        );


        /*
         * Fallback for browsers where
         * navigator.clipboard is unavailable.
         */

        const textarea =
            document.createElement(
                "textarea"
            );


        textarea.value =
            code;


        textarea.style.position =
            "fixed";

        textarea.style.opacity =
            "0";


        document.body.appendChild(
            textarea
        );


        textarea.select();


        try {

            document.execCommand(
                "copy"
            );


            copyMessage.textContent =
                "Code copied!";


            copyMessage.classList.add(
                "show"
            );

        }

        catch(copyError) {

            console.error(
                copyError
            );

            copyMessage.textContent =
                "Please copy the code manually.";

            copyMessage.classList.add(
                "show"
            );

        }


        textarea.remove();

    }

}


// =========================================
// ERROR POPUP
// =========================================

function showError(
    title,
    message
) {

    if (!errorPopup)
        return;


    errorTitle.textContent =
        title;


    errorMessage.textContent =
        message;


    showPopup(
        errorPopup
    );

}


// =========================================
// POPUP OPEN
// =========================================

function showPopup(
    popup
) {

    if (!popup)
        return;


    popup.classList.add(
        "show"
    );


    popup.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "popup-open"
    );

}


// =========================================
// POPUP CLOSE
// =========================================

function hidePopup(popup) {

    if (!popup)
        return;

    // Remove focus before hiding the popup
    if (
        popup.contains(document.activeElement)
    ) {
        document.activeElement.blur();
    }

    popup.classList.remove("show");

    popup.setAttribute(
        "aria-hidden",
        "true"
    );

    /*
     * Remove popup-open only if
     * no popup is currently visible.
     */

    const anyOpenPopup =
        document.querySelector(
            ".popup-overlay.show"
        );

    if (!anyOpenPopup) {

        document.body.classList.remove(
            "popup-open"
        );

    }
}


// =========================================
// CLOSE ALL POPUPS
// =========================================

function closeAllPopups() {

    document
        .querySelectorAll(
            ".popup-overlay.show"
        )
        .forEach(
            popup => {

                hidePopup(
                    popup
                );

            }
        );

}


// =========================================
// IMAGE
// =========================================

function getShellImage(
    amount
) {

    return (
        shellImages[amount] ||
        "../image/garena-shells.jpg"
    );

}


// =========================================
// BACK BUTTON
// =========================================

backButton?.addEventListener(
    "click",
    () => {

        if (
            document.referrer &&
            document.referrer
                .includes(
                    window.location.hostname
                )
        ) {

            history.back();

        }

        else {

            location.href =
                "games.html";

        }

    }
);


// =========================================
// WALLET BUTTON
// =========================================

walletButton?.addEventListener(
    "click",
    () => {

        location.href =
            "wallet-topup.html";

    }
);


// =========================================
// PAYMENT METHODS
// =========================================

document
    .getElementById(
        "paymentMethods"
    )
    ?.addEventListener(
        "click",
        () => {

            location.href =
                "payment.html";

        }
    );


// =========================================
// SUPPORT
// =========================================

document
    .getElementById(
        "supportCard"
    )
    ?.addEventListener(
        "click",
        () => {

            location.href =
                "whatsapp.html";

        }
    );


// =========================================
// PURCHASE BUTTON
// =========================================

document
    .getElementById(
        "confirmPurchase"
    )
    ?.addEventListener(
        "click",
        purchaseProduct
    );


// =========================================
// OUT OF STOCK CLOSE
// =========================================

document
    .getElementById(
        "outStockClose"
    )
    ?.addEventListener(
        "click",
        () => {

            hidePopup(
                outOfStockPopup
            );

        }
    );


document
    .getElementById(
        "outStockOk"
    )
    ?.addEventListener(
        "click",
        () => {

            hidePopup(
                outOfStockPopup
            );

        }
    );


// =========================================
// PURCHASE CLOSE
// =========================================

document
    .getElementById(
        "purchaseClose"
    )
    ?.addEventListener(
        "click",
        () => {

            if (!purchaseLoading) {

                hidePopup(
                    purchasePopup
                );

            }

        }
    );


// =========================================
// SUCCESS CLOSE
// =========================================

document
    .getElementById(
        "successOk"
    )
    ?.addEventListener(
        "click",
        () => {

            hidePopup(
                successPopup
            );

        }
    );


// =========================================
// ERROR CLOSE
// =========================================

document
    .getElementById(
        "errorClose"
    )
    ?.addEventListener(
        "click",
        () => {

            hidePopup(
                errorPopup
            );

        }
    );


document
    .getElementById(
        "errorOk"
    )
    ?.addEventListener(
        "click",
        () => {

            hidePopup(
                errorPopup
            );

        }
    );


// =========================================
// COPY
// =========================================

document
    .getElementById(
        "copyRedeemCode"
    )
    ?.addEventListener(
        "click",
        copyRedeemCode
    );


// =========================================
// CLICK OUTSIDE POPUPS
// =========================================

document
    .querySelectorAll(
        ".popup-overlay"
    )
    .forEach(
        popup => {

            popup.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        popup
                    ) {

                        if (
                            popup ===
                            purchasePopup &&
                            purchaseLoading
                        ) {

                            return;

                        }


                        hidePopup(
                            popup
                        );

                    }

                }
            );

        }
    );


// =========================================
// ESC KEY
// =========================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !== "Escape"
        ) {

            return;

        }


        if (purchaseLoading) {

            return;

        }


        closeAllPopups();

    }
);


// =========================================
// HTML ESCAPE
// =========================================

function escapeHTML(
    value
) {

    return String(value)

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
// LIVE STOCK REFRESH
// =========================================
//
// Refresh every 10 seconds.
// This only receives stock counts,
// never redeem codes.
//

setInterval(
    async () => {

        if (!currentSession)
            return;


        await loadProducts();

    },
    10000
);


// =========================================
// WALLET AUTO REFRESH
// =========================================
//
// Keeps displayed wallet balance
// reasonably fresh.
//

setInterval(
    async () => {

        if (!currentSession)
            return;


        await loadWallet();

    },
    15000
);


// =========================================
// AUTH STATE
// =========================================

supabase.auth.onAuthStateChange(
    (
        event,
        session
    ) => {

        if (
            event ===
                "SIGNED_OUT" ||
            !session
        ) {

            window.location.replace(
                "login.html"
            );

        }

    }
);


// =========================================
// INITIALIZE
// =========================================

async function initialize() {

    try {

        /*
         * Login is mandatory for this page.
         */

        await checkLogin();


        /*
         * Load wallet.
         */

        await loadWallet();


        /*
         * Load Shell packages.
         */

        await loadProducts();


        console.log(
            "🔥 Phoenix Garena Shells Loaded"
        );

    }

    catch(error) {

        console.error(
            "Garena Shell initialization error:",
            error
        );

    }

}


await initialize();