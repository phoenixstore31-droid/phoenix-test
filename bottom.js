// =========================================
// PHOENIX STORE — GLOBAL BOTTOM NAV
// =========================================

document.addEventListener("DOMContentLoaded", async () => {

    const container =
        document.getElementById("bottomNav");

    if (!container) return;

    try {

        const response =
            await fetch("bottom.html");

        if (!response.ok) {
            throw new Error("Bottom navigation not found");
        }

        container.innerHTML =
            await response.text();


        // =====================================
        // GET CURRENT HTML PAGE
        // =====================================

        const currentPage =
            location.pathname
                .split("/")
                .pop()
                .toLowerCase();


        // =====================================
        // ACTIVE NAV ITEM
        // =====================================

        const navItems =
            container.querySelectorAll(".nav-item");


        navItems.forEach(item => {

            item.classList.remove("active");

            const link =
                item.getAttribute("href");

            if (!link) return;


            const linkPage =
                link
                    .split("/")
                    .pop()
                    .toLowerCase();


            if (linkPage === currentPage) {

                item.classList.add("active");

            }

        });

    }

    catch (error) {

        console.error(
            "Bottom Nav Error:",
            error
        );

    }

});