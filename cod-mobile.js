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

const backButton =
    document.getElementById("backButton");

const walletButton =
    document.getElementById("walletButton");

const walletBalance =
    document.getElementById("walletBalance");

const playerId =
    document.getElementById("playerId");

const continueButton =
    document.getElementById("continueButton");

const playerSection =
    document.getElementById("playerSection");

const productsSection =
    document.getElementById("productsSection");

const playerIdDisplay =
    document.getElementById("playerIdDisplay");

const productsLoading =
    document.getElementById("productsLoading");

const codProducts =
    document.getElementById("codProducts");


// =========================================
// POPUPS
// =========================================

const playerIdPopup =
    document.getElementById("playerIdPopup");

const playerPopupClose =
    document.getElementById("playerPopupClose");

const playerPopupOk =
    document.getElementById("playerPopupOk");


const outOfStockPopup =
    document.getElementById("outOfStockPopup");

const outStockClose =
    document.getElementById("outStockClose");

const outStockOk =
    document.getElementById("outStockOk");

const outStockProductName =
    document.getElementById("outStockProductName");


const purchasePopup =
    document.getElementById("purchasePopup");

const purchaseClose =
    document.getElementById("purchaseClose");

const confirmPlayerId =
    document.getElementById("confirmPlayerId");

const confirmProduct =
    document.getElementById("confirmProduct");

const confirmPrice =
    document.getElementById("confirmPrice");

const confirmWallet =
    document.getElementById("confirmWallet");

const purchaseError =
    document.getElementById("purchaseError");

const confirmPurchase =
    document.getElementById("confirmPurchase");


const successPopup =
    document.getElementById("successPopup");

const successOrderNumber =
    document.getElementById("successOrderNumber");

const successOk =
    document.getElementById("successOk");


const errorPopup =
    document.getElementById("errorPopup");

const errorClose =
    document.getElementById("errorClose");

const errorOk =
    document.getElementById("errorOk");

const errorTitle =
    document.getElementById("errorTitle");

const errorMessage =
    document.getElementById("errorMessage");


// =========================================
// DATA
// =========================================

let session = null;

let currentWalletBalance = 0;

let products = [];

let selectedProduct = null;

let currentPlayerId = "";


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
        "🔥 COD Mobile Shell Balance:",
        shellBalance
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
            "Session error:",
            error
        );

        return null;

    }


    session =
        data?.session || null;


    return session;

}


// =========================================
// WALLET
// =========================================

async function loadWallet() {

    if (!session) {

        currentWalletBalance = 0;

        if (walletBalance) {

            walletBalance.textContent =
                "Rs. 0.00";

        }

        return;

    }


    const {
        data,
        error
    } =
        await supabase
            .from("profiles")
            .select("wallet_balance")
            .eq(
                "id",
                session.user.id
            )
            .single();


    if (error) {

        console.error(
            "Wallet error:",
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
            "Rs. " +
            currentWalletBalance.toFixed(2);

    }

}


// =========================================
// LOAD PRODUCTS
// =========================================

async function loadProducts() {

    if (!codProducts)
        return;


    productsLoading.style.display =
        "flex";

    codProducts.innerHTML =
        "";


    const {
        data,
        error
    } =
        await supabase
            .from("cod_mobile_products")
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
            "COD Mobile products error:",
            error
        );


        codProducts.innerHTML = `

            <div class="products-error">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>
                    Unable to Load Packages
                </h3>

                <p>
                    Please refresh the page and try again.
                </p>

            </div>

        `;

        return;

    }


products =
    data || [];

await loadShellBalance();

renderProducts();

}


// =========================================
// RENDER PRODUCTS
// =========================================

function renderProducts() {

    codProducts.innerHTML = "";


    if (!products.length) {

        codProducts.innerHTML = `

            <div class="products-error">

                <i class="fa-solid fa-box-open"></i>

                <h3>
                    No Packages Available
                </h3>

                <p>
                    COD Mobile packages are currently unavailable.
                </p>

            </div>

        `;

        return;

    }


    products.forEach(product => {

        const card =
            document.createElement("article");


const price =
    Number(
        product.price || 0
    );

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


        card.className =
            "cod-product-card";


        if (!inStock) {

            card.classList.add(
                "out-of-stock"
            );

        }


        const cpAmount =
            Number(
                product.cp_amount || 0
            ).toLocaleString();


        card.innerHTML = `

            <div class="product-icon">

                <i class="fa-solid fa-crosshairs"></i>

            </div>


            <h3>
                ${cpAmount} CP
            </h3>


            <p class="product-subtitle">

                Call of Duty: Mobile

            </p>


            <div class="product-price">

                Rs. ${price.toFixed(2)}

            </div>


            <div
                class="
                    product-stock
                    ${
                        inStock
                            ? "in-stock"
                            : "out-stock"
                    }
                "
            >

                <span></span>

${
    inStock
        ? `${availableStock} AVAILABLE`
        : "OUT OF STOCK"
}

            </div>


            <button
                type="button"
                class="
                    buy-button
                    ${
                        inStock
                            ? ""
                            : "out-of-stock-button"
                    }
                "
                data-product-id="${product.id}"
            >

                ${
                    inStock
                        ? "Buy Now"
                        : "Out of Stock"
                }

                <i
                    class="
                        fa-solid
                        ${
                            inStock
                                ? "fa-arrow-right"
                                : "fa-ban"
                        }
                    "
                ></i>

            </button>

        `;


        const button =
            card.querySelector(
                ".buy-button"
            );


        button.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                handleProductClick(
                    product
                );

            }
        );


        codProducts.appendChild(
            card
        );

    });

}


// =========================================
// PRODUCT CLICK
// =========================================

function handleProductClick(product) {

    if (!currentPlayerId) {

        showPlayerIdPopup();

        return;

    }


const shellCost =
    Number(
        product.garena_shell_cost || 0
    );

const liveAvailableStock =
    shellCost > 0
        ? Math.floor(
            shellBalance / shellCost
        )
        : 0;

const inStock =
    liveAvailableStock > 0;


if (!inStock) {

    showOutOfStock(
        product
    );

    return;

}


    openPurchasePopup(
        product
    );

}


// =========================================
// PLAYER ID VALIDATION
// =========================================

function validatePlayerId() {

    const value =
        playerId.value
            .trim();


    if (!value) {

        showPlayerIdPopup();

        return false;

    }


    if (
        value.length < 3 ||
        value.length > 30
    ) {

        showError(
            "Invalid Player ID",
            "Please enter a valid Call of Duty: Mobile Player ID."
        );

        playerId.focus();

        return false;

    }


    currentPlayerId =
        value;


    return true;

}


// =========================================
// CONTINUE
// =========================================

continueButton?.addEventListener(
    "click",
    async () => {

        if (!validatePlayerId())
            return;


        playerIdDisplay.textContent =
            currentPlayerId;


        playerSection.style.display =
            "none";


        productsSection.style.display =
            "block";


        await loadWallet();

        await loadProducts();


        productsSection.scrollIntoView({
            behavior:"smooth",
            block:"start"
        });

    }
);


// =========================================
// PLAYER ID ENTER KEY
// =========================================

playerId?.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Enter"
        ) {

            event.preventDefault();

            continueButton?.click();

        }

    }
);


// =========================================
// PURCHASE POPUP
// =========================================

function openPurchasePopup(
    product
) {

    selectedProduct =
        product;


    const price =
        Number(
            product.price || 0
        );


    const cpAmount =
        Number(
            product.cp_amount || 0
        ).toLocaleString();


    confirmPlayerId.textContent =
        currentPlayerId;


    confirmProduct.textContent =
        `${cpAmount} CP`;


    confirmPrice.textContent =
        `Rs. ${price.toFixed(2)}`;


    confirmWallet.textContent =
        `Rs. ${currentWalletBalance.toFixed(2)}`;


    purchaseError.textContent =
        "";


    confirmPurchase.disabled =
        false;


    confirmPurchase.innerHTML = `

        Buy Now

        <i class="fa-solid fa-arrow-right"></i>

    `;


    showPopup(
        purchasePopup
    );

}


// =========================================
// CONFIRM PURCHASE
// =========================================

confirmPurchase?.addEventListener(
    "click",
    async () => {

        if (!selectedProduct)
            return;


        if (!currentPlayerId) {

            closePopup(
                purchasePopup
            );

            showPlayerIdPopup();

            return;

        }


        if (!session) {

            showPurchaseError(
                "Please login before placing an order."
            );

            return;

        }


        const price =
            Number(
                selectedProduct.price || 0
            );


        if (
            currentWalletBalance <
            price
        ) {

            showPurchaseError(
                `Insufficient wallet balance. You need Rs. ${price.toFixed(2)} to purchase this package.`
            );

            return;

        }


        confirmPurchase.disabled =
            true;


        confirmPurchase.innerHTML = `

            Processing...

            <i class="fa-solid fa-spinner fa-spin"></i>

        `;


        purchaseError.textContent =
            "";


        try {

            const {
                data,
                error
            } =
                await supabase.rpc(
                    "purchase_cod_mobile_product",
                    {
                        p_product_id:
                            selectedProduct.id,

                        p_player_id:
                            currentPlayerId
                    }
                );


            if (error) {

                throw error;

            }


            let result =
                data;


            if (
                Array.isArray(data)
            ) {

                result =
                    data[0];

            }


            if (
                !result ||
                result.success !== true
            ) {

                const message =
                    result?.message ||
                    "Unable to complete the purchase.";

                throw new Error(
                    message
                );

            }


            const orderNumber =
                result.order_number ||
                result.order_id ||
                "Pending";


            closePopup(
                purchasePopup
            );


            successOrderNumber.textContent =
                orderNumber;


            showPopup(
                successPopup
            );


            await loadWallet();

        }
        catch(error) {

            console.error(
                "COD Mobile purchase error:",
                error
            );


            confirmPurchase.disabled =
                false;


            confirmPurchase.innerHTML = `

                Buy Now

                <i class="fa-solid fa-arrow-right"></i>

            `;


            const message =
                getFriendlyError(
                    error
                );


            showPurchaseError(
                message
            );

        }

    }
);


// =========================================
// FRIENDLY ERROR
// =========================================

function getFriendlyError(error) {

    const message =
        String(
            error?.message || ""
        ).toLowerCase();


    if (
        message.includes(
            "insufficient"
        ) ||
        message.includes(
            "balance"
        )
    ) {

        return "Your wallet balance is insufficient for this purchase.";

    }


    if (
        message.includes(
            "out of stock"
        ) ||
        message.includes(
            "stock"
        )
    ) {

        return "This package is currently out of stock.";

    }


    if (
        message.includes(
            "not authenticated"
        ) ||
        message.includes(
            "jwt"
        )
    ) {

        return "Your session has expired. Please login again.";

    }


    if (
        message.includes(
            "player"
        ) &&
        message.includes(
            "id"
        )
    ) {

        return "Please check your Player ID and try again.";

    }


    return (
        error?.message ||
        "We couldn't complete your order. Please try again."
    );

}


// =========================================
// PLAYER ID POPUP
// =========================================

function showPlayerIdPopup() {

    showPopup(
        playerIdPopup
    );

}


// =========================================
// OUT OF STOCK
// =========================================

function showOutOfStock(
    product
) {

    const cpAmount =
        Number(
            product.cp_amount || 0
        ).toLocaleString();


    outStockProductName.textContent =
        `${cpAmount} CP package is currently unavailable.`;


    showPopup(
        outOfStockPopup
    );

}


// =========================================
// PURCHASE ERROR
// =========================================

function showPurchaseError(
    message
) {

    purchaseError.textContent =
        message;

}


// =========================================
// GENERAL ERROR
// =========================================

function showError(
    title,
    message
) {

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

function closePopup(
    popup
) {

    if (!popup)
        return;


    popup.classList.remove(
        "show"
    );


    popup.setAttribute(
        "aria-hidden",
        "true"
    );


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
// PLAYER POPUP EVENTS
// =========================================

playerPopupClose?.addEventListener(
    "click",
    () => {

        closePopup(
            playerIdPopup
        );

    }
);


playerPopupOk?.addEventListener(
    "click",
    () => {

        closePopup(
            playerIdPopup
        );

        playerId.focus();

        playerId.scrollIntoView({
            behavior:"smooth",
            block:"center"
        });

    }
);


// =========================================
// OUT OF STOCK EVENTS
// =========================================

outStockClose?.addEventListener(
    "click",
    () => {

        closePopup(
            outOfStockPopup
        );

    }
);


outStockOk?.addEventListener(
    "click",
    () => {

        closePopup(
            outOfStockPopup
        );

    }
);


// =========================================
// PURCHASE CLOSE
// =========================================

purchaseClose?.addEventListener(
    "click",
    () => {

        closePopup(
            purchasePopup
        );

    }
);


// =========================================
// ERROR CLOSE
// =========================================

errorClose?.addEventListener(
    "click",
    () => {

        closePopup(
            errorPopup
        );

    }
);


errorOk?.addEventListener(
    "click",
    () => {

        closePopup(
            errorPopup
        );

    }
);


// =========================================
// SUCCESS → HISTORY
// =========================================

successOk?.addEventListener(
    "click",
    () => {

        localStorage.setItem(
            "openTopupHistory",
            "true"
        );


        location.href =
            "history.html";

    }
);


// =========================================
// CLOSE POPUP BY BACKDROP
// =========================================

document
    .querySelectorAll(
        ".popup-overlay"
    )
    .forEach(popup => {

        popup.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    popup
                ) {

                    closePopup(
                        popup
                    );

                }

            }
        );

    });


// =========================================
// BACK BUTTON
// =========================================

backButton?.addEventListener(
    "click",
    () => {

        history.back();

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
// AUTH CHECK
// =========================================

async function initialize() {

    await loadSession();


    if (!session) {

        window.location.href =
            "login.html";

        return;

    }


    await loadWallet();

}


await initialize();


// =========================================
// WALLET AUTO REFRESH
// =========================================

setInterval(
    loadWallet,
    10000
);


console.log(
    "🔥 Phoenix COD Mobile Top Up Loaded"
);