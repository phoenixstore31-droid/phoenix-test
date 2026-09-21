/* =========================================================
   PHOENIX STORE - REVIEW.JS
========================================================= */

        import { createClient }
        from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

        const supabase = createClient(
  "https://tvhgxlqqeklrdlgbkosa.supabase.co",
  "sb_publishable_Ep28HPF1SXIXQXBF2i__eg_h_jmjw4I",
        );

        window.supabase = supabase;


/* =========================================================
   ELEMENTS
========================================================= */

const reviewModal = document.getElementById("reviewModal");
const openReviewBtn = document.getElementById("openReviewBtn");
const closeReviewBtn = document.getElementById("closeReviewBtn");
const maybeLaterBtn = document.getElementById("maybeLaterBtn");

const submitReviewBtn = document.getElementById("submitReviewBtn");

const ratingStars = document.querySelectorAll(".rating-star");
const selectedRatingText =
    document.getElementById("selectedRatingText");

const reviewText =
    document.getElementById("reviewText");

const characterCount =
    document.getElementById("characterCount");

const reviewsList =
    document.getElementById("reviewsList");

const reviewsLoading =
    document.getElementById("reviewsLoading");

const noReviews =
    document.getElementById("noReviews");

const reviewToast =
    document.getElementById("reviewToast");

const averageRating =
    document.getElementById("averageRating");

const averageStars =
    document.getElementById("averageStars");

const totalReviews =
    document.getElementById("totalReviews");

const reviewCountLabel =
    document.getElementById("reviewCountLabel");


/* =========================================================
   VARIABLES
========================================================= */

let selectedRating = 0;


/* =========================================================
   BACK BUTTON
========================================================= */

const backBtn = document.getElementById("backBtn");

if (backBtn) {
    backBtn.addEventListener("click", () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = "home.html";
        }
    });
}


/* =========================================================
   OPEN REVIEW MODAL
========================================================= */

openReviewBtn.addEventListener("click", async () => {

    const {
        data: {
            session
        }
    } = await supabase.auth.getSession();

    if (!session) {

        alert("Please login to write a review.");

        window.location.href = "index.html";

        return;
    }

    openModal();
});


/* =========================================================
   OPEN MODAL
========================================================= */

function openModal() {

    reviewModal.style.display = "flex";

    document.body.style.overflow = "hidden";

    resetReviewForm();
}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal() {

    reviewModal.style.display = "none";

    document.body.style.overflow = "";

    resetReviewForm();
}


closeReviewBtn.addEventListener(
    "click",
    closeModal
);


maybeLaterBtn.addEventListener(
    "click",
    closeModal
);


/* =========================================================
   CLOSE WHEN CLICKING OUTSIDE
========================================================= */

reviewModal.addEventListener("click", (event) => {

    if (event.target === reviewModal) {
        closeModal();
    }

});


/* =========================================================
   STAR RATING
========================================================= */

ratingStars.forEach((star) => {

    star.addEventListener("click", () => {

        selectedRating =
            Number(star.dataset.rating);

        updateRatingStars();

        selectedRatingText.textContent =
            getRatingText(selectedRating);

    });

});


/* =========================================================
   STAR HOVER
========================================================= */

ratingStars.forEach((star) => {

    star.addEventListener("mouseenter", () => {

        const hoverRating =
            Number(star.dataset.rating);

        ratingStars.forEach((item) => {

            const rating =
                Number(item.dataset.rating);

            item.classList.toggle(
                "active",
                rating <= hoverRating
            );

        });

    });


    star.addEventListener("mouseleave", () => {

        updateRatingStars();

    });

});


/* =========================================================
   UPDATE SELECTED STARS
========================================================= */

function updateRatingStars() {

    ratingStars.forEach((star) => {

        const rating =
            Number(star.dataset.rating);

        star.classList.toggle(
            "active",
            rating <= selectedRating
        );

    });

}


/* =========================================================
   RATING TEXT
========================================================= */

function getRatingText(rating) {

    const texts = {
        1: "Very Poor",
        2: "Needs Improvement",
        3: "Good",
        4: "Very Good",
        5: "Excellent"
    };

    return texts[rating] || "Select a rating";
}


/* =========================================================
   CHARACTER COUNT
========================================================= */

reviewText.addEventListener(
    "input",
    () => {

        characterCount.textContent =
            reviewText.value.length;

    }
);


/* =========================================================
   RESET FORM
========================================================= */

function resetReviewForm() {

    selectedRating = 0;

    reviewText.value = "";

    characterCount.textContent = "0";

    selectedRatingText.textContent =
        "Select a rating";

    updateRatingStars();

    submitReviewBtn.disabled = false;

    submitReviewBtn.innerHTML =
        '<i class="fa-solid fa-paper-plane"></i> SUBMIT FEEDBACK';
}


/* =========================================================
   SUBMIT REVIEW
========================================================= */

submitReviewBtn.addEventListener(
    "click",
    submitReview
);


async function submitReview() {

    try {

        /* -----------------------------------------
           CHECK LOGIN
        ----------------------------------------- */

        const {
            data: {
                session
            },
            error: sessionError
        } = await supabase.auth.getSession();

        if (sessionError) {
            throw sessionError;
        }

        if (!session) {

            alert(
                "Please login before submitting a review."
            );

            window.location.href =
                "index.html";

            return;
        }


        /* -----------------------------------------
           VALIDATE RATING
        ----------------------------------------- */

        if (
            selectedRating < 1 ||
            selectedRating > 5
        ) {

            alert(
                "Please select a rating from 1 to 5 stars."
            );

            return;
        }


        /* -----------------------------------------
           VALIDATE REVIEW
        ----------------------------------------- */

        const text =
            reviewText.value.trim();

        if (!text) {

            alert(
                "Please write your feedback."
            );

            reviewText.focus();

            return;
        }


        if (text.length > 500) {

            alert(
                "Your review must be 500 characters or less."
            );

            return;
        }


        /* -----------------------------------------
           DISABLE BUTTON
        ----------------------------------------- */

        submitReviewBtn.disabled = true;

        submitReviewBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> SUBMITTING...';


        /* -----------------------------------------
           GET CUSTOMER PROFILE
        ----------------------------------------- */

        const {
            data: profile,
            error: profileError
        } = await supabase
            .from("profiles")
            .select(
                "username, email, avatar_url"
            )
            .eq(
                "id",
                session.user.id
            )
            .maybeSingle();


        if (profileError) {
            throw profileError;
        }


        /* -----------------------------------------
           CUSTOMER NAME
        ----------------------------------------- */

        const customerName =
            profile?.username ||
            profile?.email ||
            session.user.email ||
            "Phoenix Customer";


        const customerAvatar =
            profile?.avatar_url ||
            null;


        /* -----------------------------------------
           INSERT REVIEW
           STATUS = pending
        ----------------------------------------- */

        const {
            error: insertError
        } = await supabase
            .from("reviews")
            .insert({

                user_id:
                    session.user.id,

                customer_name:
                    customerName,

                customer_avatar:
                    customerAvatar,

                rating:
                    selectedRating,

                review_text:
                    text,

                status:
                    "pending"

            });


        if (insertError) {
            throw insertError;
        }


        /* -----------------------------------------
           SUCCESS
        ----------------------------------------- */

        closeModal();

        showToast();

        /*
         * Important:
         * Pending review public list-la
         * show aagathu.
         *
         * Admin approve pannina piragu
         * next load-la public-a varum.
         */

        await loadApprovedReviews();

    } catch (error) {

        console.error(
            "Review submission error:",
            error
        );

        alert(
            error.message ||
            "Something went wrong while submitting your review."
        );

        submitReviewBtn.disabled = false;

        submitReviewBtn.innerHTML =
            '<i class="fa-solid fa-paper-plane"></i> SUBMIT FEEDBACK';
    }

}


/* =========================================================
   TOAST
========================================================= */

function showToast() {

    reviewToast.classList.add("show");

    setTimeout(() => {

        reviewToast.classList.remove("show");

    }, 4000);

}


/* =========================================================
   LOAD APPROVED REVIEWS
========================================================= */

async function loadApprovedReviews() {

    reviewsLoading.style.display = "block";

    reviewsList.innerHTML = "";

    noReviews.style.display = "none";


    try {

        const {
            data,
            error
        } = await supabase
            .from("reviews")
            .select(`
                id,
                customer_name,
                customer_avatar,
                rating,
                review_text,
                created_at
            `)
            .eq(
                "status",
                "approved"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {
            throw error;
        }


        reviewsLoading.style.display =
            "none";


        if (!data || data.length === 0) {

            noReviews.style.display =
                "block";

            updateRatingSummary([]);

            return;
        }


        renderReviews(data);

        updateRatingSummary(data);

    } catch (error) {

        console.error(
            "Loading reviews failed:",
            error
        );

        reviewsLoading.style.display =
            "none";

        reviewsList.innerHTML = `
            <div class="no-reviews">
                <div class="empty-icon">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>

                <h3>Unable to load reviews</h3>

                <p>
                    Please try again later.
                </p>
            </div>
        `;

    }

}


/* =========================================================
   RENDER REVIEWS
========================================================= */

function renderReviews(reviews) {

    reviewsList.innerHTML = "";


    reviews.forEach((review) => {

        const card =
            document.createElement("article");

        card.className =
            "review-card";


        /* -----------------------------------------
           AVATAR
        ----------------------------------------- */

        let avatarHTML = "";

        if (review.customer_avatar) {

            avatarHTML = `
                <img
                    class="review-avatar"
                    src="${escapeHTML(
                        review.customer_avatar
                    )}"
                    alt="${escapeHTML(
                        review.customer_name
                    )}"
                    loading="lazy"
                >
            `;

        } else {

            const firstLetter =
                (review.customer_name || "P")
                    .charAt(0)
                    .toUpperCase();

            avatarHTML = `
                <div class="review-avatar-placeholder">
                    ${escapeHTML(firstLetter)}
                </div>
            `;

        }


        /* -----------------------------------------
           STARS
        ----------------------------------------- */

        const starsHTML =
            createStars(review.rating);


        /* -----------------------------------------
           DATE
        ----------------------------------------- */

        const formattedDate =
            formatDate(review.created_at);


        card.innerHTML = `

            <div class="review-user">

                ${avatarHTML}

                <div class="review-user-info">

                    <h3>
                        ${escapeHTML(
                            review.customer_name
                        )}
                    </h3>

                    <span>
                        Phoenix Store Customer
                    </span>

                </div>

            </div>


            <div class="review-stars">
                ${starsHTML}
            </div>


            <div class="review-text">
                ${escapeHTML(
                    review.review_text
                )}
            </div>


            <div class="review-date">

                <i class="fa-regular fa-calendar"></i>

                Reviewed on ${formattedDate}

            </div>

        `;


        reviewsList.appendChild(card);

    });

}


/* =========================================================
   CREATE STARS
========================================================= */

function createStars(rating) {

    let html = "";

    for (let i = 1; i <= 5; i++) {

        if (i <= rating) {

            html +=
                '<i class="fa-solid fa-star"></i>';

        } else {

            html +=
                '<i class="fa-regular fa-star"></i>';

        }

    }

    return html;
}


/* =========================================================
   UPDATE RATING SUMMARY
========================================================= */

function updateRatingSummary(reviews) {

    const total =
        reviews.length;


    totalReviews.textContent =
        total;

    reviewCountLabel.textContent =
        `${total} Review${total === 1 ? "" : "s"}`;


    if (total === 0) {

        averageRating.textContent =
            "0.0";

        updateAverageStars(0);

        for (let i = 1; i <= 5; i++) {

            updateRatingBar(
                i,
                0,
                0
            );

        }

        return;
    }


    let totalRating = 0;

    const counts = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
    };


    reviews.forEach((review) => {

        const rating =
            Number(review.rating);

        totalRating += rating;

        if (counts[rating] !== undefined) {
            counts[rating]++;
        }

    });


    const average =
        totalRating / total;


    averageRating.textContent =
        average.toFixed(1);


    updateAverageStars(
        average
    );


    for (let i = 1; i <= 5; i++) {

        updateRatingBar(
            i,
            counts[i],
            total
        );

    }

}


/* =========================================================
   AVERAGE STARS
========================================================= */

function updateAverageStars(average) {

    const stars =
        averageStars.querySelectorAll("i");


    stars.forEach((star, index) => {

        const position =
            index + 1;

        if (position <= Math.round(average)) {

            star.className =
                "fa-solid fa-star";

        } else {

            star.className =
                "fa-regular fa-star";

        }

    });

}


/* =========================================================
   RATING BAR
========================================================= */

function updateRatingBar(
    rating,
    count,
    total
) {

    const bar =
        document.getElementById(
            `bar${rating}`
        );

    const countElement =
        document.getElementById(
            `count${rating}`
        );


    if (!bar || !countElement) {
        return;
    }


    const percentage =
        total > 0
            ? (count / total) * 100
            : 0;


    bar.style.width =
        `${percentage}%`;

    countElement.textContent =
        count;

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(dateString) {

    if (!dateString) {
        return "Recently";
    }


    const date =
        new Date(dateString);


    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "2-digit"
        }
    );

}


/* =========================================================
   HTML ESCAPE
   Prevents review text from injecting HTML/JS
========================================================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


/* =========================================================
   INITIAL LOAD
========================================================= */

async function initReviews() {

    if (!supabase) {

        console.error(
            "Supabase client not found."
        );

        return;
    }

    await loadApprovedReviews();

}


/* =========================================================
   START
========================================================= */

initReviews();