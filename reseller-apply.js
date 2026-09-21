import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* =========================================================
   SUPABASE
========================================================= */

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


/* =========================================================
   HTML ELEMENTS
========================================================= */

const usernameInput =
    document.getElementById("username");

const emailInput =
    document.getElementById("email");

const whatsappInput =
    document.getElementById("whatsapp");

const ageInput =
    document.getElementById("age");

const countryInput =
    document.getElementById("country");

const businessNameInput =
    document.getElementById("businessName");

const monthlyProfitInput =
    document.getElementById("monthlyProfit");

const addressInput =
    document.getElementById("address");

const websiteOrAppInput =
    document.getElementById("websiteOrApp");

const businessDetailsInput =
    document.getElementById("businessDetails");

const plansContainer =
    document.querySelector(".plans");

const submitBtn =
    document.getElementById("submitBtn");

const messageBox =
    document.getElementById("message");


/* =========================================================
   CURRENT USER
========================================================= */

let currentUser = null;


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(message, type = "error") {

    if (!messageBox) return;

    messageBox.textContent = message;

    messageBox.className = "";

    messageBox.classList.add(type);

    messageBox.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


function clearMessage() {

    if (!messageBox) return;

    messageBox.textContent = "";

    messageBox.className = "";
}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setLoading(loading) {

    if (!submitBtn) return;

    submitBtn.disabled = loading;

    if (loading) {

        submitBtn.innerHTML = `
            <span>
                <i class="fa-solid fa-spinner fa-spin"></i>
            </span>
            Submitting Application...
        `;

    } else {

        submitBtn.innerHTML = `
            <span>
                <i class="fa-solid fa-paper-plane"></i>
            </span>
            Submit Reseller Application
            <i class="fa-solid fa-arrow-right"></i>
        `;
    }
}

/* =========================================================
   LOAD LOGGED-IN USER
========================================================= */

async function loadUser() {

    const {
        data,
        error
    } = await supabase.auth.getSession();


    if (error) {

        console.error(
            "Session error:",
            error
        );

        showMessage(
            "Unable to check your login session.",
            "error"
        );

        return false;
    }


    currentUser =
        data?.session?.user || null;


    /* =====================================================
       NOT LOGGED IN
    ===================================================== */

    if (!currentUser) {

        window.location.href =
            "login.html";

        return false;
    }


    /* =====================================================
       LOAD PROFILE
    ===================================================== */

    const {
        data: profile,
        error: profileError
    } = await supabase
        .from("profiles")
        .select("username,email")
        .eq("id", currentUser.id)
        .maybeSingle();


    if (profileError) {

        console.error(
            "Profile error:",
            profileError
        );
    }


    /* =====================================================
       USERNAME
    ===================================================== */

    if (usernameInput) {

        usernameInput.value =
            profile?.username ||
            currentUser.user_metadata?.username ||
            "User";
    }


    /* =====================================================
       EMAIL
    ===================================================== */

    if (emailInput) {

        emailInput.value =
            profile?.email ||
            currentUser.email ||
            "";
    }


    return true;
}

/* =========================================================
   LOAD RESELLER PLANS
========================================================= */

async function loadPlans() {

    if (!plansContainer) {

        console.error(
            "❌ Plans container not found."
        );

        return false;
    }


    /* =====================================================
       LOADING
    ===================================================== */

    plansContainer.innerHTML = `
        <div class="plans-loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Loading reseller plans...</span>
        </div>
    `;


    /* =====================================================
       GET PLANS FROM SUPABASE
    ===================================================== */

    const {
        data: plans,
        error
    } = await supabase
        .from("reseller_plans")
        .select(`
            id,
            plan_name,
            price,
            duration_months,
            discount_percentage,
            reward_percentage,
            redemption_limit,
            description,
            is_active
        `)
        .eq("is_active", true)
        .order("price", {
            ascending: true
        });


    /* =====================================================
       ERROR
    ===================================================== */

    if (error) {

        console.error(
            "❌ Plan loading error:",
            error
        );

        plansContainer.innerHTML = `
            <div class="plans-error">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <strong>
                    Unable to load reseller plans
                </strong>

                <small>
                    Please refresh the page and try again.
                </small>

            </div>
        `;

        return false;
    }


    /* =====================================================
       NO PLANS
    ===================================================== */

    if (!plans || plans.length === 0) {

        plansContainer.innerHTML = `
            <div class="plans-error">

                <i class="fa-solid fa-box-open"></i>

                <strong>
                    No reseller plans available
                </strong>

                <small>
                    Please try again later.
                </small>

            </div>
        `;

        return false;
    }


    /* =====================================================
       CLEAR LOADING
    ===================================================== */

    plansContainer.innerHTML = "";


    /* =====================================================
       CREATE PLAN CARDS
    ===================================================== */

    plans.forEach(plan => {

        const label =
            document.createElement("label");


        label.className =
            "plan-card";


        label.innerHTML = `

            <input
                type="radio"
                name="plan"
                value="${plan.id}"
            >


            <div class="plan-card-inner">


                <div class="plan-top">

                    <div class="plan-name">

                        ${plan.plan_name.toUpperCase()}

                    </div>


                    <div class="plan-check">

                        <i class="fa-solid fa-check"></i>

                    </div>

                </div>


                <div class="plan-price">

                    Rs.
                    ${Number(plan.price).toLocaleString()}

                </div>


                <div class="plan-duration">

                    ${Number(plan.duration_months)}
                    Months

                </div>


                <div class="plan-benefits">


                    <div>

                        <i class="fa-solid fa-percent"></i>

                        ${Number(
                            plan.discount_percentage
                        )}% Discount

                    </div>


                    <div>

                        <i class="fa-solid fa-star"></i>

                        ${Number(
                            plan.reward_percentage
                        )}% Rewards

                    </div>


                </div>


                ${
                    plan.description
                    ? `
                        <div class="plan-description">

                            ${plan.description}

                        </div>
                    `
                    : ""
                }


            </div>

        `;


        /* =================================================
           PLAN CLICK
        ================================================= */

        label.addEventListener(
            "click",
            () => {


                document
                    .querySelectorAll(".plan-card")
                    .forEach(card => {

                        card.classList.remove(
                            "active"
                        );

                    });


                label.classList.add(
                    "active"
                );


                const radio =
                    label.querySelector(
                        'input[type="radio"]'
                    );


                if (radio) {

                    radio.checked = true;

                }

            }
        );


        plansContainer.appendChild(
            label
        );

    });


    console.log(
        "✅ Reseller plans loaded:",
        plans
    );


    return true;
}

/* =========================================================
   GET SELECTED PLAN
========================================================= */

function getSelectedPlanId() {

    const selected =
        document.querySelector(
            'input[name="plan"]:checked'
        );


    if (!selected) {

        return null;

    }


    return selected.value;

}


/* =========================================================
   GET PLAN FROM SUPABASE
========================================================= */

async function getPlan(planId) {

    if (!planId) {

        return {
            data: null,
            error: new Error(
                "No reseller plan selected."
            )
        };

    }


    const {
        data,
        error
    } = await supabase
        .from("reseller_plans")
        .select(`
            id,
            plan_name,
            price,
            duration_months,
            discount_percentage,
            reward_percentage,
            redemption_limit,
            description,
            is_active
        `)
        .eq(
            "id",
            planId
        )
        .eq(
            "is_active",
            true
        )
        .maybeSingle();


    return {
        data,
        error
    };

}


/* =========================================================
   CHECK EXISTING APPLICATION
========================================================= */

async function checkExistingApplication() {

    if (!currentUser) {

        return {
            exists: false,
            application: null,
            error: null
        };

    }


    const {
        data,
        error
    } = await supabase
        .from("reseller_applications")
        .select(`
            id,
            user_id,
            status,
            plan_id,
            plan_name,
            plan_price,
            submitted_at,
            reviewed_at,
            reviewed_by,
            rejection_reason,
            expires_at,
            reseller_plans (
                plan_name,
                price,
                duration_months,
                discount_percentage,
                reward_percentage
            )
        `)
        .eq(
            "user_id",
            currentUser.id
        )
        .order(
            "submitted_at",
            {
                ascending: false
            }
        )
        .limit(1)
        .maybeSingle();


    if (error) {

        console.error(
            "Application check error:",
            error
        );

        return {
            exists: false,
            application: null,
            error
        };

    }


    return {

        exists:
            !!data,

        application:
            data || null,

        error:
            null

    };

}

/* =========================================================
   VALIDATE FORM
========================================================= */

function validateForm() {

    const whatsapp =
        whatsappInput?.value.trim() || "";


    const age =
        Number(
            ageInput?.value || 0
        );


    const country =
        countryInput?.value.trim() || "";


    const businessName =
        businessNameInput?.value.trim() || "";


    const monthlyProfitText =
        monthlyProfitInput?.value.trim() || "";


    const monthlyProfit =
        Number(
            monthlyProfitText
        );


    const address =
        addressInput?.value.trim() || "";


    const businessDetails =
        businessDetailsInput?.value.trim() || "";


    /* =====================================================
       WHATSAPP
    ===================================================== */

    if (!whatsapp) {

        showMessage(
            "Please enter your WhatsApp number.",
            "error"
        );

        whatsappInput?.focus();

        return false;
    }


    if (whatsapp.length < 8) {

        showMessage(
            "Please enter a valid WhatsApp number.",
            "error"
        );

        whatsappInput?.focus();

        return false;
    }


    /* =====================================================
       AGE
    ===================================================== */

    if (!age) {

        showMessage(
            "Please enter your age.",
            "error"
        );

        ageInput?.focus();

        return false;
    }


    if (
        age < 18 ||
        age > 100
    ) {

        showMessage(
            "You must be between 18 and 100 years old.",
            "error"
        );

        ageInput?.focus();

        return false;
    }


    /* =====================================================
       COUNTRY
    ===================================================== */

    if (!country) {

        showMessage(
            "Please select your country.",
            "error"
        );

        countryInput?.focus();

        return false;
    }


    /* =====================================================
       BUSINESS NAME
    ===================================================== */

    if (!businessName) {

        showMessage(
            "Please enter your business name.",
            "error"
        );

        businessNameInput?.focus();

        return false;
    }


    /* =====================================================
       MONTHLY PROFIT
    ===================================================== */

    if (!monthlyProfitText) {

        showMessage(
            "Please enter your estimated monthly profit.",
            "error"
        );

        monthlyProfitInput?.focus();

        return false;
    }


    if (
        Number.isNaN(monthlyProfit) ||
        monthlyProfit < 0
    ) {

        showMessage(
            "Please enter a valid monthly profit.",
            "error"
        );

        monthlyProfitInput?.focus();

        return false;
    }


    /* =====================================================
       ADDRESS
    ===================================================== */

    if (!address) {

        showMessage(
            "Please enter your business address.",
            "error"
        );

        addressInput?.focus();

        return false;
    }


    /* =====================================================
       BUSINESS DETAILS
    ===================================================== */

    if (!businessDetails) {

        showMessage(
            "Please tell us about your business.",
            "error"
        );

        businessDetailsInput?.focus();

        return false;
    }


    /* =====================================================
       PLAN
    ===================================================== */

    const selectedPlan =
        getSelectedPlanId();


    if (!selectedPlan) {

        showMessage(
            "Please select a reseller plan.",
            "error"
        );

        return false;
    }


    /* =====================================================
       EVERYTHING VALID
    ===================================================== */

    return true;
}

/* =========================================================
   DISABLE FORM
========================================================= */

function disableForm() {

    const inputs = [

        whatsappInput,
        ageInput,
        countryInput,
        businessNameInput,
        monthlyProfitInput,
        addressInput,
        websiteOrAppInput,
        businessDetailsInput

    ];


    inputs.forEach(input => {

        if (input) {

            input.disabled = true;

        }

    });


    document
        .querySelectorAll(
            'input[name="plan"]'
        )
        .forEach(input => {

            input.disabled = true;

        });


    document
        .querySelectorAll(".plan-card")
        .forEach(card => {

            card.style.pointerEvents =
                "none";

        });
}


/* =========================================================
   CHECK RESELLER EXPIRY
========================================================= */

function isResellerExpired(application) {

    if (
        application?.status !== "approved"
    ) {

        return false;

    }


    if (!application.expires_at) {

        return true;

    }


    const expiry =
        new Date(
            application.expires_at
        ).getTime();


    return (
        Date.now() >= expiry
    );

}

/* =========================================================
   AUTO EXPIRE RESELLER
========================================================= */

async function autoExpireReseller(application) {

    if (
        !application ||
        application.status !== "approved"
    ) {
        return application;
    }

    if (!application.expires_at) {
        return application;
    }

    const expired =
        new Date(application.expires_at) <= new Date();

    if (!expired) {
        return application;
    }

    console.log(
        "⚠️ Reseller membership expired. Updating status..."
    );

    const { data, error } = await supabase
        .from("reseller_applications")
        .update({
            status: "expired"
        })
        .eq("id", application.id)
        .eq("status", "approved")
        .select()
        .single();

    if (error) {

        console.error(
            "❌ Failed to expire reseller:",
            error
        );

        return application;
    }

    console.log(
        "✅ Reseller automatically expired."
    );

    return data;
}

/* =========================================================
   HANDLE EXISTING APPLICATION
========================================================= */

function handleExistingApplication(application) {

    if (!application) return;


    const status =
        application.status;


    /* =====================================================
       PENDING
    ===================================================== */

    if (status === "pending") {

        showMessage(
            "Your reseller application is currently under review.",
            "error"
        );


        if (submitBtn) {

            submitBtn.disabled = true;

            submitBtn.innerHTML = `
                <span>
                    <i class="fa-solid fa-clock"></i>
                </span>
                Application Under Review
            `;

        }


        disableForm();

        return;
    }


    /* =====================================================
       APPROVED
    ===================================================== */

if (status === "approved") {

    /* =========================================
       CHECK EXPIRY
    ========================================= */

    if (
        isResellerExpired(application)
    ) {

        showMessage(
            "Your reseller membership has expired. You can submit a new application.",
            "error"
        );

        return;

    }


    /* =========================================
       ACTIVE RESELLER
    ========================================= */

    showApprovedPopup(
        application
    );


    if (submitBtn) {

        submitBtn.disabled = true;

        submitBtn.innerHTML = `
            <span>
                <i class="fa-solid fa-circle-check"></i>
            </span>
            Reseller Approved
        `;

    }


    disableForm();

    return;
}


    /* =====================================================
       REJECTED
    ===================================================== */

    if (status === "rejected") {

        showRejectedPopup(
            application
        );


        /*
         * Rejected users can submit
         * a new application.
         */

        return;
    }

}


/* =========================================================
   APPROVED POPUP
   WITH RESELLER SYSTEM PAUSE
========================================================= */

async function showApprovedPopup(application) {

    const plan =
        application.reseller_plans || {};


    const planName =
        application.plan_name ||
        plan.plan_name ||
        "Reseller Plan";


    const planPrice =
        Number(
            application.plan_price ||
            plan.price ||
            0
        );


    const discount =
        Number(
            plan.discount_percentage ||
            0
        );


    const duration =
        Number(
            plan.duration_months ||
            6
        );


    let expiresAt =
        application.expires_at;


    /* =====================================================
       GET RESELLER SYSTEM STATUS
    ===================================================== */

    const {
        data: systemSettings,
        error: systemError
    } = await supabase
        .from("reseller_system_settings")
        .select(`
            enabled,
            paused_at
        `)
        .eq("id", 1)
        .maybeSingle();


    if (systemError) {

        console.error(
            "Reseller System Status Error:",
            systemError
        );

    }


    const resellerSystemEnabled =
        systemSettings?.enabled !== false;


    /* =====================================================
       CREATE POPUP
    ===================================================== */

    const popup =
        document.createElement("div");


    popup.className =
        "reseller-status-popup approved-popup";


    popup.innerHTML = `

        <div class="reseller-popup-overlay"></div>


        <div class="reseller-popup-box">

            <button
                class="reseller-popup-close"
                type="button"
            >
                &times;
            </button>


            <div class="reseller-popup-icon approved">

                <i class="fa-solid fa-circle-check"></i>

            </div>


            <h2>
                Application Approved
            </h2>


            <p class="reseller-popup-subtitle">

                Congratulations! 🎉

                <br>

                Your Phoenix Store reseller
                application has been approved.

            </p>


            <div class="reseller-plan-summary">

                <div class="summary-row">

                    <span>
                        Reseller Plan
                    </span>

                    <strong>
                        ${planName}
                    </strong>

                </div>


                <div class="summary-row">

                    <span>
                        Plan Price
                    </span>

                    <strong>
                        Rs.
                        ${planPrice.toLocaleString()}
                    </strong>

                </div>


                <div class="summary-row discount">

                    <span>
                        Your Discount
                    </span>

                    <strong>
                        ${discount}%
                    </strong>

                </div>


                <div class="summary-row">

                    <span>
                        Validity
                    </span>

                    <strong>
                        ${duration} Months
                    </strong>

                </div>

            </div>


            <div class="reseller-validity">

                <div class="validity-title">

                    <i class="fa-solid fa-clock"></i>

                    Reseller Membership

                </div>


                ${
                    resellerSystemEnabled
                    ? `

                        <div
                            class="countdown"
                            id="resellerCountdown"
                        >
                            Calculating...
                        </div>


                        <small id="resellerValidUntil">

                            Valid until

                            <strong>
                                ${
                                    expiresAt
                                    ? new Date(
                                        expiresAt
                                      ).toLocaleDateString(
                                        undefined,
                                        {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric"
                                        }
                                      )
                                    : "N/A"
                                }
                            </strong>

                        </small>

                    `
                    : `

                        <div
                            class="countdown"
                            id="resellerCountdown"
                        >
                            Calculating...
                        </div>


                        <div
                            class="reseller-paused-warning"
                            id="resellerPausedWarning"
                        >

                            <i class="fa-solid fa-pause"></i>

                            <div>

                                <strong>
                                    Reseller Membership Temporarily Paused
                                </strong>

                                <small>
                                    Your reseller membership timer is
                                    currently paused by the administrator.
                                </small>

                            </div>

                        </div>

                    `
                }

            </div>


            <button
                type="button"
                class="reseller-popup-button"
                id="approvedPopupButton"
            >

                Continue

                <i class="fa-solid fa-arrow-right"></i>

            </button>

        </div>

    `;


    document.body.appendChild(
        popup
    );


    /* =====================================================
       CLOSE POPUP
    ===================================================== */

    const closePopup = () => {

        popup.classList.remove(
            "show"
        );


        setTimeout(() => {

            popup.remove();

        }, 300);

    };


    popup
        .querySelector(
            ".reseller-popup-close"
        )
        ?.addEventListener(
            "click",
            closePopup
        );


    popup
        .querySelector(
            ".reseller-popup-overlay"
        )
        ?.addEventListener(
            "click",
            closePopup
        );


    popup
        .querySelector(
            "#approvedPopupButton"
        )
        ?.addEventListener(
            "click",
            closePopup
        );


    /* =====================================================
       SHOW POPUP
    ===================================================== */

    requestAnimationFrame(() => {

        popup.classList.add(
            "show"
        );

    });


    /* =====================================================
       START COUNTDOWN
    ===================================================== */

    if (expiresAt) {

        startResellerCountdown(
            expiresAt,
            popup,
            !resellerSystemEnabled
        );

    }


    /* =====================================================
       LIVE SYSTEM STATUS CHECK
    ===================================================== */

    let systemTimer = null;


    systemTimer =
        setInterval(
            async () => {

                const {
                    data: latestSettings,
                    error
                } = await supabase
                    .from(
                        "reseller_system_settings"
                    )
                    .select(`
                        enabled,
                        paused_at
                    `)
                    .eq(
                        "id",
                        1
                    )
                    .maybeSingle();


                if (error) {

                    console.error(
                        "Live reseller system check error:",
                        error
                    );

                    return;

                }


                /* =====================================
                   SYSTEM OFF
                ===================================== */

                if (
                    latestSettings?.enabled === false
                ) {

                    const countdown =
                        popup.querySelector(
                            "#resellerCountdown"
                        );

/* =====================================
   STOP COUNTDOWN WHILE SYSTEM IS OFF
===================================== */

if (popup._resellerCountdownTimer) {

    clearInterval(
        popup._resellerCountdownTimer
    );

    popup._resellerCountdownTimer =
        null;

}


                    const warning =
                        popup.querySelector(
                            "#resellerPausedWarning"
                        );


                    const validUntil =
                        popup.querySelector(
                            "#resellerValidUntil"
                        );


                    if (countdown) {

                        countdown.innerHTML = `
                            <span>
                                Membership Paused
                            </span>
                        `;

                    }


                    if (validUntil) {

                        validUntil.style.display =
                            "none";

                    }


                    if (!warning) {

                        const validity =
                            popup.querySelector(
                                ".reseller-validity"
                            );


                        if (validity) {

                            const warningBox =
                                document.createElement(
                                    "div"
                                );


                            warningBox.className =
                                "reseller-paused-warning";


                            warningBox.id =
                                "resellerPausedWarning";


                            warningBox.innerHTML = `

                                <i class="fa-solid fa-pause"></i>

                                <div>

                                    <strong>
                                        Reseller Membership Temporarily Paused
                                    </strong>

                                    <small>
                                        Your reseller membership timer is
                                        currently paused by the administrator.
                                    </small>

                                </div>

                            `;


                            validity.appendChild(
                                warningBox
                            );

                        }

                    }

                }


                /* =====================================
                   SYSTEM ON
                ===================================== */

                else {

                    const warning =
                        popup.querySelector(
                            "#resellerPausedWarning"
                        );


                    if (warning) {

                        warning.remove();

                    }


                    const validUntil =
                        popup.querySelector(
                            "#resellerValidUntil"
                        );


                    if (validUntil) {

                        validUntil.style.display =
                            "";

                    }


                    const countdown =
                        popup.querySelector(
                            "#resellerCountdown"
                        );


                    if (countdown) {

                        startResellerCountdown(
                            expiresAt,
                            popup,
                            false
                        );

                    }

                }

            },
            5000
        );


    /* =====================================================
       STOP LIVE CHECK WHEN POPUP CLOSES
    ===================================================== */

    const originalClose =
        closePopup;


    popup
        .querySelector(
            ".reseller-popup-close"
        )
        ?.addEventListener(
            "click",
            () => {

                if (systemTimer) {

                    clearInterval(
                        systemTimer
                    );

                }

            }
        );


    popup
        .querySelector(
            ".reseller-popup-overlay"
        )
        ?.addEventListener(
            "click",
            () => {

                if (systemTimer) {

                    clearInterval(
                        systemTimer
                    );

                }

            }
        );


    popup
        .querySelector(
            "#approvedPopupButton"
        )
        ?.addEventListener(
            "click",
            () => {

                if (systemTimer) {

                    clearInterval(
                        systemTimer
                    );

                }

            }
        );

}


/* =========================================================
   REJECTED POPUP
========================================================= */

function showRejectedPopup(application) {

    const reason =
        application.rejection_reason ||
        "No specific reason was provided.";


    const popup =
        document.createElement("div");

    popup.className =
        "reseller-status-popup rejected-popup";


    popup.innerHTML = `

        <div class="reseller-popup-overlay"></div>

        <div class="reseller-popup-box">

            <button
                class="reseller-popup-close"
                type="button"
            >
                &times;
            </button>


            <div class="reseller-popup-icon rejected">

                <i class="fa-solid fa-circle-xmark"></i>

            </div>


            <h2>
                Application Not Approved
            </h2>


            <p class="reseller-popup-subtitle">

                Unfortunately, your Phoenix Store
                reseller application was not approved.

            </p>


            <div class="rejection-box">

                <div class="rejection-title">

                    <i class="fa-solid fa-circle-info"></i>

                    Reason for rejection

                </div>


                <p>
                    ${reason}
                </p>

            </div>


            <div class="rejection-note">

                You may review your application details
                and submit a new application.

            </div>


            <button
                type="button"
                class="reseller-popup-button rejected-button"
                id="rejectedPopupButton"
            >

                Close

                <i class="fa-solid fa-check"></i>

            </button>

        </div>

    `;


    document.body.appendChild(
        popup
    );


    /* =====================================================
       CLOSE
    ===================================================== */

    const closePopup = () => {

        popup.classList.remove(
            "show"
        );

        setTimeout(() => {

            popup.remove();

        }, 300);

    };


    popup
        .querySelector(
            ".reseller-popup-close"
        )
        ?.addEventListener(
            "click",
            closePopup
        );


    popup
        .querySelector(
            ".reseller-popup-overlay"
        )
        ?.addEventListener(
            "click",
            closePopup
        );


    popup
        .querySelector(
            "#rejectedPopupButton"
        )
        ?.addEventListener(
            "click",
            closePopup
        );


    /* =====================================================
       SHOW
    ===================================================== */

    requestAnimationFrame(() => {

        popup.classList.add(
            "show"
        );

    });

}


/* =========================================================
   LIVE RESELLER COUNTDOWN
   RESELLER SYSTEM PAUSE AWARE
========================================================= */

function startResellerCountdown(
    expiresAt,
    popup,
    isPaused = false
) {

    const countdown =
        popup.querySelector(
            "#resellerCountdown"
        );


    const validUntil =
        popup.querySelector(
            "#resellerValidUntil"
        );


    if (!countdown || !expiresAt) {

        if (countdown) {

            countdown.textContent =
                "Validity information unavailable";

        }

        return;

    }


    /* =========================================
       PREVENT MULTIPLE TIMERS
    ========================================= */

    if (popup._resellerCountdownTimer) {

        clearInterval(
            popup._resellerCountdownTimer
        );

        popup._resellerCountdownTimer = null;

    }


    const expiry =
        new Date(
            expiresAt
        ).getTime();


    /* =========================================
       UPDATE COUNTDOWN
    ========================================= */

    const updateCountdown = () => {

        /* =====================================
           PAUSED
        ===================================== */

        if (isPaused) {

            countdown.innerHTML = `
                <span>
                    Membership Paused
                </span>
            `;

            if (validUntil) {

                validUntil.style.display =
                    "none";

            }

            return;

        }


        /* =====================================
           ACTIVE
        ===================================== */

        if (validUntil) {

            validUntil.style.display =
                "";

        }


        const now =
            Date.now();


        const difference =
            expiry - now;


        /* =====================================
           EXPIRED
        ===================================== */

        if (difference <= 0) {

            countdown.innerHTML = `
                <span>
                    Membership Expired
                </span>
            `;


            if (validUntil) {

                validUntil.style.display =
                    "none";

            }


            if (
                popup._resellerCountdownTimer
            ) {

                clearInterval(
                    popup._resellerCountdownTimer
                );

                popup._resellerCountdownTimer =
                    null;

            }


            return;

        }


        /* =====================================
           TIME CALCULATION
        ===================================== */

        const totalSeconds =
            Math.floor(
                difference / 1000
            );


        const days =
            Math.floor(
                totalSeconds / 86400
            );


        const hours =
            Math.floor(
                (totalSeconds % 86400) / 3600
            );


        const minutes =
            Math.floor(
                (totalSeconds % 3600) / 60
            );


        const seconds =
            totalSeconds % 60;


        /* =====================================
           DISPLAY
        ===================================== */

        countdown.innerHTML = `

            <span>
                ${days}
            </span>

            <small>
                Days
            </small>


            <span>
                ${hours}
            </span>

            <small>
                Hours
            </small>


            <span>
                ${minutes}
            </span>

            <small>
                Min
            </small>


            <span>
                ${seconds}
            </span>

            <small>
                Sec
            </small>

        `;

    };


    /* =========================================
       FIRST UPDATE
    ========================================= */

    updateCountdown();


    /* =========================================
       START TIMER ONLY WHEN ACTIVE
    ========================================= */

    if (!isPaused) {

        popup._resellerCountdownTimer =
            setInterval(
                updateCountdown,
                1000
            );

    }

}


/* =========================================================
   SUBMIT APPLICATION
========================================================= */

async function submitApplication() {

    clearMessage();


    /* =====================================================
       CHECK LOGIN
    ===================================================== */

    if (!currentUser) {

        showMessage(
            "Your session has expired. Please login again.",
            "error"
        );

        return;
    }


    /* =====================================================
       VALIDATE FORM
    ===================================================== */

    if (!validateForm()) {

        return;
    }


    setLoading(true);


    /* =====================================================
       CHECK EXISTING APPLICATION
    ===================================================== */

    const existing =
        await checkExistingApplication();


    if (existing.error) {

        setLoading(false);

        showMessage(
            "Unable to check your previous application. Please try again.",
            "error"
        );

        return;
    }


    /* =====================================================
       BLOCK PENDING / APPROVED
    ===================================================== */

    if (
        existing.exists &&
        (
            existing.application?.status === "pending" ||
            existing.application?.status === "approved"
        )
    ) {

        setLoading(false);

        handleExistingApplication(
            existing.application
        );

        return;
    }


    /* =====================================================
       SELECT PLAN
    ===================================================== */

    const selectedPlanId =
        getSelectedPlanId();


    /* =====================================================
       GET PLAN
    ===================================================== */

    const {
        data: plan,
        error: planError
    } = await getPlan(
        selectedPlanId
    );


    if (
        planError ||
        !plan
    ) {

        console.error(
            "Plan error:",
            planError
        );

        setLoading(false);

        showMessage(
            "Selected reseller plan is currently unavailable.",
            "error"
        );

        return;
    }


    /* =====================================================
       FORM VALUES
    ===================================================== */

    const age =
        Number(
            ageInput.value
        );


    const monthlyProfit =
        Number(
            monthlyProfitInput.value
        );


    const country =
        countryInput.value.trim();


    const websiteOrApp =
        websiteOrAppInput.value.trim();


    /* =====================================================
       APPLICATION DATA
    ===================================================== */

    const applicationData = {

        user_id:
            currentUser.id,


        /* Applicant */

        real_name:
            usernameInput.value.trim(),


        branch_name:
            businessNameInput.value.trim(),


        email:
            currentUser.email ||
            emailInput.value.trim(),


        whatsapp:
            whatsappInput.value.trim(),


        address:
            addressInput.value.trim(),


        country:
            country,


        /* Business */

        website_or_app:
            websiteOrApp ||
            null,


        age:
            age,


        monthly_profit:
            monthlyProfit,


        /* Plan */

        plan_id:
            plan.id,


        plan_name:
            plan.plan_name,


        plan_price:
            Number(
                plan.price
            ),


        /* Status */

        status:
            "pending"

    };


    console.log(
        "📤 Submitting reseller application:",
        applicationData
    );


    /* =====================================================
       INSERT INTO SUPABASE
    ===================================================== */

    const {
        data,
        error
    } = await supabase
        .from(
            "reseller_applications"
        )
        .insert(
            applicationData
        )
        .select()
        .single();


    /* =====================================================
       INSERT ERROR
    ===================================================== */

    if (error) {

        console.error(
            "❌ Application submit error:",
            error
        );


        setLoading(false);


        showMessage(
            error.message ||
            "Application submission failed. Please try again.",
            "error"
        );


        return;
    }


    /* =====================================================
       SUCCESS
    ===================================================== */

    console.log(
        "✅ Reseller application submitted:",
        data
    );

    /* =====================================================
   SEND APPLICATION TO DISCORD
===================================================== */

try {

    const discordResponse = await fetch(
        "/.netlify/functions/reseller-application",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)
        }
    );


    const discordResult =
        await discordResponse.json();


    if (!discordResponse.ok) {

        console.error(
            "❌ Discord notification failed:",
            discordResult
        );

    } else {

        console.log(
            "✅ Discord notification sent:",
            discordResult
        );

    }

} catch (discordError) {

    console.error(
        "❌ Discord notification error:",
        discordError
    );

}


    setLoading(false);


    showMessage(
        "Your reseller application has been submitted successfully! Our team will review it shortly.",
        "success"
    );


    /* =====================================================
       DISABLE AFTER SUCCESS
    ===================================================== */

    disableForm();


    if (submitBtn) {

        submitBtn.disabled = true;

        submitBtn.innerHTML = `
            <span>
                <i class="fa-solid fa-circle-check"></i>
            </span>
            Application Submitted
        `;

    }

}


/* =========================================================
   SUBMIT BUTTON EVENT
========================================================= */

if (submitBtn) {

    submitBtn.addEventListener(
        "click",
        submitApplication
    );
}

/* =========================================================
   INITIALIZE PAGE
========================================================= */

async function init() {

    console.log(
        "🚀 Initializing Phoenix Reseller Application..."
    );


    /* =====================================================
       LOAD LOGGED-IN USER
    ===================================================== */

    const loggedIn =
        await loadUser();


    if (!loggedIn) {

        return;

    }


    /* =====================================================
       LOAD RESELLER PLANS
    ===================================================== */

    await loadPlans();


    /* =====================================================
       CHECK EXISTING APPLICATION
    ===================================================== */

    const existing =
        await checkExistingApplication();


    if (existing.error) {

        console.error(
            "Application check error:",
            existing.error
        );

        return;
    }


    /* =====================================================
       EXISTING APPLICATION
    ===================================================== */

if (existing.exists) {

    let application =
        existing.application;


    /* =====================================
       AUTO EXPIRE APPROVED RESELLER
    ===================================== */

    application =
        await autoExpireReseller(
            application
        );


    /* =====================================
       HANDLE APPLICATION
    ===================================== */

    handleExistingApplication(
        application
    );

}


    console.log(
        "✅ Phoenix Reseller Application Ready"
    );
}


/* =========================================================
   START
========================================================= */

init();