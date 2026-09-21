import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ===========================================
   PHOENIX ADMIN PANEL V3
=========================================== */

const supabase = createClient(
  "https://tvhgxlqqeklrdlgbkosa.supabase.co",
  "sb_publishable_Ep28HPF1SXIXQXBF2i__eg_h_jmjw4I"
);

window.supabaseClient = supabase;

const {
  data: { session }
} = await supabase.auth.getSession();

console.log("CURRENT ADMIN USER ID:", session?.user?.id);

const { data: adminCheck, error: adminCheckError } =
    await supabase.rpc("is_admin");

console.log("BROWSER is_admin:", adminCheck, adminCheckError);

/* ===========================================
   GLOBAL ELEMENTS
=========================================== */

const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const contentBox = document.getElementById("contentBox");

const loading = document.getElementById("loadingScreen");

const toast = document.getElementById("toast");

const walletPopup = document.getElementById("walletPopup");
const walletAmount = document.getElementById("walletAmount");
const walletOk = document.getElementById("walletOk");
const walletCancel = document.getElementById("walletCancel");

let currentAdmin = null;

/* ===========================================
   LOADING
=========================================== */

function showLoading() {
  if (loading) loading.style.display = "flex";
}

function hideLoading() {
  if (loading) loading.style.display = "none";
}

/* ===========================================
   TOAST
=========================================== */

function showToast(message, color = "#16a34a") {

  if (!toast) return;

  toast.innerText = message;
  toast.style.background = color;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);

}

/* ===========================================
   SIDEBAR
=========================================== */

window.openSidebar = () => {

  sidebar.classList.add("active");
  overlay.classList.add("active");

};

window.closeSidebar = () => {

  sidebar.classList.remove("active");
  overlay.classList.remove("active");

};

overlay.onclick = () => {
  closeSidebar();
};

/* ===========================================
   AUTH CHECK
=========================================== */

async function checkAdmin() {

  showLoading();

  try {

    // =============================
    // CHECK SUPABASE SESSION
    // =============================

    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError || !session) {

      location.replace("adminlogin.html");
      return;

    }

    // =============================
    // CHECK ADMIN_USERS
    // =============================

    const { data: admin, error: adminError } =
      await supabase
        .from("admin_users")
        .select("id")
        .eq("id", session.user.id)
        .maybeSingle();

    // =============================
    // NOT ADMIN
    // =============================

    if (adminError || !admin) {

      await supabase.auth.signOut();

      location.replace("adminlogin.html");

      return;

    }

    // =============================
    // ADMIN VERIFIED
    // =============================

    currentAdmin = session.user;

    const adminEmail =
      document.getElementById("adminEmail");

    const adminAvatar =
      document.getElementById("adminAvatar");

    if (adminEmail) {

      adminEmail.innerText =
        currentAdmin.email || "Administrator";

    }

    if (adminAvatar) {

      adminAvatar.innerText =
        (currentAdmin.email || "A")
          .charAt(0)
          .toUpperCase();

    }

    hideLoading();

    // Load dashboard only AFTER admin verification

    await loadCounts();

    await showDashboard();

  }

  catch (error) {

    console.error(
      "Admin authentication error:",
      error
    );

    await supabase.auth.signOut();

    location.replace("adminlogin.html");

  }

}

/* ===========================================
   LOGOUT
=========================================== */

window.logout = async () => {

  await supabase.auth.signOut();

  location.replace("adminlogin.html");

};

/* ===========================================
   DASHBOARD COUNTS
=========================================== */

async function loadCounts() {

  try {

    // =====================================
    // TOTAL USERS
    // =====================================

    const { count: users } = await supabase
      .from("profiles")
      .select("*", {
        count: "exact",
        head: true
      });

    document.getElementById("usersCount").innerText =
      users || 0;


// =====================================
// ALL ORDERS + LIFETIME TOTALS
// =====================================

const { data: orders = [] } = await supabase
  .from("orders")
  .select("*");

// Lifetime totals from profiles
const { data: lifetimeProfiles = [], error: lifetimeError } =
  await supabase
    .from("profiles")
    .select("total_orders, total_spent");

if (lifetimeError) throw lifetimeError;

// Total Orders = all users' lifetime order quantity
const lifetimeOrders = lifetimeProfiles.reduce(
  (sum, profile) =>
    sum + Number(profile.total_orders || 0),
  0
);

// Total Revenue = all users' lifetime spending
const lifetimeRevenue = lifetimeProfiles.reduce(
  (sum, profile) =>
    sum + Number(profile.total_spent || 0),
  0
);

// Dashboard numbers
document.getElementById("ordersCount").innerText =
  lifetimeOrders;

document.getElementById("totalRevenue").innerText =
  `Rs.${lifetimeRevenue.toFixed(2)}`;

document.getElementById("topupCount").innerText =
  lifetimeOrders;


    // =====================================
    // LAST 1 MONTH DATE
    // =====================================

    const oneMonthAgo = new Date();

    oneMonthAgo.setMonth(
      oneMonthAgo.getMonth() - 1
    );

    const oneMonthAgoISO =
      oneMonthAgo.toISOString();


    // =====================================
    // LAST 1 MONTH USERS
    // =====================================

    const { count: monthlyUsers } = await supabase
      .from("profiles")
      .select("*", {
        count: "exact",
        head: true
      })
      .gte("created_at", oneMonthAgoISO);

    document.getElementById("quickUsers").innerText =
      monthlyUsers || 0;


    // =====================================
    // LAST 1 MONTH ORDERS
    // =====================================

    const { count: monthlyOrders } = await supabase
      .from("orders")
      .select("*", {
        count: "exact",
        head: true
      })
      .gte("created_at", oneMonthAgoISO);

    document.getElementById("quickOrders").innerText =
      monthlyOrders || 0;


    // =====================================
    // LAST 1 MONTH WALLET
    // =====================================

    const { count: monthlyWallet } = await supabase
      .from("wallet_topups")
      .select("*", {
        count: "exact",
        head: true
      })
      .gte("created_at", oneMonthAgoISO);

    document.getElementById("quickWallet").innerText =
      monthlyWallet || 0;


    // =====================================
    // REVENUE
    // =====================================

    const successOrders = orders.filter(
      x => x.status === "success"
    );


    const today = new Date()
      .toISOString()
      .split("T")[0];


    const todayRevenue = successOrders
      .filter(order =>
        order.created_at.startsWith(today)
      )
      .reduce(
        (sum, order) =>
          sum + Number(
            order.total_price ||
            order.price ||
            0
          ),
        0
      );


    // =====================================
    // PENDING ORDERS
    // =====================================

    const pendingOrders = orders.filter(
      x =>
        !x.status ||
        x.status === "pending" ||
        x.status === "Pending"
    ).length;

    // =====================================
    // UPDATE DASHBOARD
    // =====================================

    document.getElementById("todayRevenue").innerText =
      `Rs.${todayRevenue.toFixed(2)}`;

    document.getElementById("pendingOrders").innerText =
      pendingOrders;


    // =====================================
    // SUCCESS COUNT
    // =====================================

document.getElementById("topupCount").innerText =
  lifetimeOrders;


    // =====================================
    // WALLET PENDING
    // =====================================

    const { data: wallet = [] } = await supabase
      .from("wallet_topups")
      .select("*")
      .eq("status", "pending");

    document.getElementById("walletPendingCount").innerText =
      wallet.length;


  }

  catch (err) {

    console.error(err);

    showToast(
      "Dashboard Load Failed",
      "#dc2626"
    );

  }

}

/* Start */

checkAdmin();

/* ===========================================
   DASHBOARD
=========================================== */

window.showDashboard = async () => {

  closeSidebar();

  try {

    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", {
        count: "exact",
        head: true
      });

    const { data: orders = [] } = await supabase
      .from("orders")
      .select("*");

      const successOrders = orders.filter(
  x => x.status === "success"
);

    const { data: lifetimeProfiles = [], error: lifetimeError } =
  await supabase
    .from("profiles")
    .select("total_orders, total_spent");

if (lifetimeError) throw lifetimeError;

const lifetimeOrders = lifetimeProfiles.reduce(
  (sum, profile) =>
    sum + Number(profile.total_orders || 0),
  0
);

const lifetimeRevenue = lifetimeProfiles.reduce(
  (sum, profile) =>
    sum + Number(profile.total_spent || 0),
  0
);

    const success =
       successOrders;

    const rejected =
      orders.filter(x => x.status === "reject").length;

    const pending =
      orders.filter(x =>
        !x.status ||
        x.status === "pending" ||
        x.status === "Pending"
      ).length;

    const { count: walletPending } = await supabase
        .from("wallet_topups")
        .select("*", {
         count: "exact",
         head: true
    })
  .eq("status", "pending");

    contentBox.innerHTML = `

<div class="dashboardCards">

<div class="statCard">
<div class="icon">👤</div>
<div class="info">
<h4>Total Users</h4>
<h2>${totalUsers || 0}</h2>
</div>
</div>

<div class="statCard">
<div class="icon">📦</div>
<div class="info">
<h4>Total Orders</h4>
<h2>${lifetimeOrders}</h2>
</div>
</div>

<div class="statCard">
<div class="icon">💰</div>
<div class="info">
<h4>Wallet Pending</h4>
<h2>${walletPending}</h2>
</div>
</div>

<div class="statCard">
<div class="icon">✅</div>
<div class="info">
<h4>Success Orders</h4>
<h2>${success.length}</h2>
</div>
</div>

</div>

<div class="contentLayout">

<div class="panel">

<div class="panelHeader">

<h2>📊 Live Analytics</h2>

</div>

<div class="panelBody">

<div class="analyticsGrid">

<div class="analyticsCard">
<h3>Success</h3>
<h1>${success.length}</h1>
<p>Completed Orders</p>
</div>

<div class="analyticsCard">
<h3>Pending</h3>
<h1>${pending}</h1>
<p>Waiting Orders</p>
</div>

<div class="analyticsCard">
<h3>Rejected</h3>
<h1>${rejected}</h1>
<p>Cancelled Orders</p>
</div>

</div>

</div>

</div>

<div class="panel">

<div class="panelHeader">

<h2>⚡ Server Status</h2>

</div>

<div class="serverStatus">

<div class="statusItem">

<div class="dot green"></div>

Supabase Connected

</div>

<div class="statusItem">

<div class="dot green"></div>

Authentication Active

</div>

<div class="statusItem">

<div class="dot green"></div>

Admin Panel Online

</div>

</div>

</div>

</div>

`;

  }

  catch (err) {

    console.error(err);

    showToast(
      "Dashboard Error",
      "#dc2626"
    );

  }

};

/* ===========================================
   USERS PAGE
=========================================== */

window.viewUsers = async () => {

  closeSidebar();


  try {

    const { data: users, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    let html = `

<div class="panel">

<div class="panelHeader">

<h2>👥 Registered Users</h2>

</div>

<div class="panelBody">

<div class="usersScrollBox">

`;

    if (!users || users.length === 0) {

      html += `

<div class="statCard">

<div class="icon">❌</div>

<div class="info">

<h4>No Users Found</h4>

<h2>0</h2>

</div>

</div>

</div>

`;

    } else {

      users.forEach(user => {

        html += `

<div class="statCard" style="margin-bottom:18px;">


<div class="info">

<h4>${user.username || "Unknown User"}</h4>

<p><b>📧</b> ${user.email}</p>

<p><b>🆔</b> ${user.id}</p>

<p><b>💰 Wallet :</b> Rs. ${Number(user.wallet_balance || 0).toFixed(2)}</p>

<p><b>📅 Joined :</b> ${new Date(user.created_at).toLocaleString()}</p>

</div>

</div>

`;

      });

    }

    html += `

</div>

</div>

`;

    contentBox.innerHTML = html;

  }

  catch (err) {

    console.error(err);

    showToast("Failed To Load Users", "#dc2626");

  }


};

/* ===========================================
   ORDERS PAGE
=========================================== */

window.viewOrders = async () => {

  closeSidebar();

  try {

const [
    { data: orders, error: ordersError },
    { data: codOrders, error: codError },
    { data: garenaOrders, error: garenaError },
    { data: deltaOrders, error: deltaError }
] = await Promise.all([

      supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("cod_mobile_orders")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("garena_shell_orders")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
       .from("delta_force_orders")
       .select("*")
       .order("created_at", { ascending: false })

    ]);


    if (ordersError) throw ordersError;
    if (codError) throw codError;
    if (garenaError) throw garenaError;
    if (deltaError) throw deltaError;


    /* =====================================
       GET USER EMAILS
    ===================================== */

    const allUserIds = [
      ...(orders || []).map(x => x.user_id),
      ...(codOrders || []).map(x => x.user_id),
      ...(garenaOrders || []).map(x => x.user_id),
      ...(deltaOrders || []).map(x => x.user_id)
    ].filter(Boolean);


    const uniqueUserIds = [
      ...new Set(allUserIds)
    ];


    let emailMap = {};


    if (uniqueUserIds.length) {

      const {
        data: profiles,
        error
      } = await supabase
        .from("profiles")
        .select("id,email")
        .in("id", uniqueUserIds);


      if (error) throw error;


      (profiles || []).forEach(profile => {

        emailMap[profile.id] =
          profile.email || "N/A";

      });

    }


    /* =====================================
       MERGE
    ===================================== */

    const allOrders = [

      ...(orders || []).map(order => ({
        ...order,
        orderType: "freefire"
      })),

      ...(codOrders || []).map(order => ({
        ...order,
        orderType: "cod"
      })),

      ...(garenaOrders || []).map(order => ({
        ...order,
        orderType: "garena"
      })),

      ...(deltaOrders || []).map(order => ({
      ...order,
       orderType: "delta_force"
      }))

    ];


    allOrders.sort((a, b) => {

      return new Date(b.created_at) -
             new Date(a.created_at);

    });


    /* =====================================
       PANEL
    ===================================== */

    let html = `

      <div class="panel">

        <div class="panelHeader">

          <h2>📦 Orders Management</h2>

        </div>

        <div class="panelBody">

          <div class="ordersScrollBox">

            <input
              id="searchUser"
              type="text"
              placeholder="🔍 Search UID / Player ID / Gmail / Product..."
              onkeyup="searchOrder()"
            >

    `;


    if (!allOrders.length) {

      html += `

        <div class="statCard">

          <div class="icon">📦</div>

          <div class="info">

            <h4>No Orders Found</h4>

            <h2>0</h2>

          </div>

        </div>

      `;

    }


    /* =====================================
       RENDER ORDERS
    ===================================== */

    allOrders.forEach(order => {

      const userEmail =
        emailMap[order.user_id] || "N/A";


      let statusColor = "#f59e0b";


      if (order.status === "success")
        statusColor = "#22c55e";


      if (
        order.status === "reject" ||
        order.status === "rejected"
      )
        statusColor = "#ef4444";


      /* =================================
         FREE FIRE
      ================================= */

      if (order.orderType === "freefire") {

        html += `

          <div class="card">

            <h3>
              🎮 ${order.product_name || "Free Fire"}
            </h3>

            <p>
              <b>UID :</b>
              ${order.uid || "N/A"}
            </p>

            <p>
              <b>Category :</b>
              ${order.category || "N/A"}
            </p>

            <p>
             <b>Price :</b>
             Rs. ${Number(
             order.total_price || 0
              ).toFixed(2)}
            ${
             (order.quantity || 1) > 1
               ? ` × ${order.quantity}`
               : ""
               }
            </p>

            <p>
              <b>Order ID :</b>
              ${order.order_number || "N/A"}
            </p>

            <p>
              <b>Gmail :</b>
              <span style="color:#38bdf8;">
                ${userEmail}
              </span>
            </p>

            <p>
              <b>Status :</b>

              <span style="
                color:${statusColor};
                font-weight:bold;
              ">
                ${order.status || "pending"}
              </span>

            </p>

            ${
              order.receipt_url
              ? `
                <a
                  href="${order.receipt_url}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📷 View Receipt
                </a>
              `
              : ""
            }

${
  order.status?.trim().toLowerCase() === "pending"
    ? `
      <div>

        <button
          onclick="setStatus(
            '${order.id}',
            'success'
          )"
        >
          ✅ Success
        </button>

        <button
          onclick="setStatus(
            '${order.id}',
            'reject'
          )"
        >
          ❌ Reject
        </button>

      </div>
    `
    : ""
}

          </div>

        `;

        return;

      }


      /* =================================
         COD MOBILE
      ================================= */

      if (order.orderType === "cod") {

        const cpAmount =
          Number(
            order.cp_amount || 0
          ).toLocaleString();


        html += `

          <div class="card">

            <h3>
              🎯 Call of Duty: Mobile
            </h3>

            <p>
              <b>Player ID :</b>
              ${order.player_id || "N/A"}
            </p>

            <p>
              <b>Package :</b>
              ${cpAmount} CP
            </p>

            <p>
              <b>Price :</b>
              Rs. ${Number(
                order.price || 0
              ).toFixed(2)}
            </p>

            <p>
              <b>Order ID :</b>
              ${order.order_number || "N/A"}
            </p>

            <p>
              <b>Gmail :</b>
              <span style="color:#38bdf8;">
                ${userEmail}
              </span>
            </p>

            <p>
              <b>Status :</b>

              <span style="
                color:${statusColor};
                font-weight:bold;
              ">
                ${order.status || "pending"}
              </span>

            </p>

            ${
              order.status === "pending"
              ? `
                <div>

                  <button
                    onclick="setCodMobileStatus(
                      '${order.id}',
                      'success'
                    )"
                  >
                    ✅ Success
                  </button>

                  <button
                    onclick="setCodMobileStatus(
                      '${order.id}',
                      'reject'
                    )"
                  >
                    ❌ Reject
                  </button>

                </div>
              `
              : ""
            }

          </div>

        `;

        return;

      }


      /* =================================
   DELTA FORCE
================================= */

if (order.orderType === "delta_force") {

  const pointAmount =
    Number(
      order.point_amount || 0
    ).toLocaleString();


  html += `

    <div class="card">

      <h3>
        🎯 Delta Force
      </h3>

      <p>
        <b>Player ID :</b>
        ${order.player_id || "N/A"}
      </p>

      <p>
        <b>Package :</b>
        ${pointAmount} Points
      </p>

      <p>
        <b>Price :</b>
        Rs. ${Number(
          order.price || 0
        ).toFixed(2)}
      </p>

      <p>
        <b>Order ID :</b>
        ${order.order_number || "N/A"}
      </p>

      <p>
        <b>Gmail :</b>
        <span style="color:#38bdf8;">
          ${userEmail}
        </span>
      </p>

      <p>
        <b>Status :</b>

        <span style="
          color:${statusColor};
          font-weight:bold;
        ">
          ${order.status || "pending"}
        </span>

      </p>

      ${
        order.status === "pending"
        ? `
          <div>

            <button
              onclick="setDeltaForceStatus(
                '${order.id}',
                'success'
              )"
            >
              ✅ Success
            </button>

            <button
              onclick="setDeltaForceStatus(
                '${order.id}',
                'reject'
              )"
            >
              ❌ Reject
            </button>

          </div>
        `
        : ""
      }

    </div>

  `;

  return;

}


      /* =================================
         GARENA SHELLS
      ================================= */

      if (order.orderType === "garena") {

        const shellAmount =
          Number(
            order.shell_amount || 0
          ).toLocaleString();


        const redeemCode =
          order.redeem_code ||
          order.code ||
          "";


        html += `

          <div class="card">

            <h3>
              🔥 Garena Shells
            </h3>

            <p>
              <b>Shells :</b>
              ${shellAmount}
            </p>

            <p>
              <b>Price :</b>
              Rs. ${Number(
                order.price || 0
              ).toFixed(2)}
            </p>

            <p>
              <b>Order ID :</b>
              ${order.order_number || "N/A"}
            </p>

            <p>
              <b>Gmail :</b>
              <span style="color:#38bdf8;">
                ${userEmail}
              </span>
            </p>

            <p>
              <b>Redeem Code :</b>

              ${
                redeemCode
                ? `
                  <span style="
                    color:#39ff88;
                    font-weight:900;
                    letter-spacing:1px;
                  ">
                    ${redeemCode}
                  </span>
                `
                : `
                  <span style="
                    color:#f59e0b;
                    font-weight:bold;
                  ">
                    Redeem code not available
                  </span>
                `
              }

            </p>

          </div>

        `;

      }

    });


    html += `

          </div>

        </div>

      </div>

    `;


    contentBox.innerHTML = html;

  }

  catch (err) {

    console.error(
      "Orders loading error:",
      err
    );

    showToast(
      "Failed To Load Orders",
      "#dc2626"
    );

  }

};

window.setCodMobileStatus = async (id, status) => {

    try {

        const { data, error } =
        await supabase.rpc(
          "admin_update_cod_mobile_order_status",
    {
        p_order_id: id,
        p_status: status
    }
);

        if (error) {
            throw error;
        }

        if (!data?.success) {
            throw new Error(
                data?.message ||
                "Unable to update COD Mobile order."
            );
        }

        showToast(
            status === "success"
                ? "COD Mobile order completed."
                : "COD Mobile order rejected and refunded.",
            status === "success"
                ? "#16a34a"
                : "#dc2626"
        );

        await loadCounts();
        await viewOrders();

    } catch (error) {

        console.error(
            "COD Mobile status error:",
            error
        );

        showToast(
            error.message ||
            "Failed to update COD Mobile order.",
            "#dc2626"
        );
    }
};

window.setDeltaForceStatus = async (id, status) => {

    try {

        const { data, error } =
            await supabase.rpc(
                "admin_update_delta_force_order_status",
                {
                    p_order_id: id,
                    p_status: status
                }
            );

        if (error) {
            throw error;
        }

        if (!data?.success) {
            throw new Error(
                data?.message ||
                "Unable to update Delta Force order."
            );
        }

        showToast(
            status === "success"
                ? "Delta Force order completed."
                : "Delta Force order rejected and refunded.",
            status === "success"
                ? "#16a34a"
                : "#dc2626"
        );

        await loadCounts();
        await viewOrders();

    } catch (error) {

        console.error(
            "Delta Force status error:",
            error
        );

        showToast(
            error.message ||
            "Failed to update Delta Force order.",
            "#dc2626"
        );
    }
};

/* ===========================================
   UPDATE ORDER STATUS
=========================================== */

window.setStatus = async (id, status) => {

  try {

    // =====================================
    // GET ORDER
    // =====================================

    const { data: order, error: orderError } =
      await supabase
        .from("orders")
.select(`
  user_id,
  quantity,
  total_price,
  status,
  product_name,
  category
`)
        .eq("id", id)
        .single();

    if (orderError) throw orderError;


    // =====================================
    // SUCCESS
    // =====================================

    if (
      status === "success" &&
      order.status !== "success"
    ) {

      const quantity =
        Number(order.quantity || 1);

      const totalPrice =
        Number(order.total_price || 0);


      // =====================================
      // GET USER PROFILE
      // =====================================

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select(`
            total_orders,
            total_spent,
            reward_points
          `)
          .eq("id", order.user_id)
          .single();

      if (profileError) throw profileError;


      const currentOrders =
        Number(profile.total_orders || 0);

      const currentSpent =
        Number(profile.total_spent || 0);

      const currentRewardPoints =
        Number(profile.reward_points || 0);


// =====================================
// GET PRODUCT FROM CORRECT GAME TABLE
// =====================================

let productTable = "products";

if (
  order.category === "COD Mobile"
) {

  productTable =
    "cod_mobile_products";

}

else if (
  order.category === "Delta Force"
) {

  productTable =
    "delta_force_products";

}


const {
  data: product,
  error: productError
} = await supabase
  .from(productTable)
  .select(`
    reward_points,
    garena_shell_cost
  `)
  .eq(
    "product_name",
    order.product_name
  )
  .single();


if (productError)
  throw productError;


const baseRewardPoints =
  Number(
    product?.reward_points || 0
  );


// =====================================
// GARENA SHELL COST
// =====================================

const garenaShellCost =
  Number(
    product?.garena_shell_cost || 0
  );


const totalShellCost =
  garenaShellCost * quantity;


console.log(
  "Garena Shell deduction:",
  {
    game: order.category,
    table: productTable,
    product: order.product_name,
    garenaShellCost,
    quantity,
    totalShellCost
  }
);


// =====================================
// GET COMMON GARENA SHELL STOCK
// =====================================

const {
  data: shellStock,
  error: shellStockError
} = await supabase
  .from("garena_shell_stock")
  .select("shell_balance")
  .eq("id", 1)
  .single();


if (shellStockError)
  throw shellStockError;


const currentShellBalance =
  Number(
    shellStock?.shell_balance || 0
  );


// =====================================
// CHECK SHELL STOCK
// =====================================

if (
  currentShellBalance <
  totalShellCost
) {

  throw new Error(
    `Not enough Garena Shell stock. Available: ${currentShellBalance}, Required: ${totalShellCost}`
  );

}


// =====================================
// CALCULATE NEW BALANCE
// =====================================

const newShellBalance =
  currentShellBalance -
  totalShellCost;


console.log(
  "New Garena Shell Balance:",
  newShellBalance
);


// =====================================
// UPDATE COMMON SHELL STOCK
// =====================================

const {
  error: shellUpdateError
} = await supabase
  .from("garena_shell_stock")
  .update({
    shell_balance:
      newShellBalance
  })
  .eq("id", 1);


if (shellUpdateError)
  throw shellUpdateError;

      // =====================================
      // CHECK RESELLER REWARD %
      // =====================================

      const {
        data: resellerApplication,
        error: resellerError
      } = await supabase
        .from("reseller_applications")
        .select(`
          status,
          reseller_plans (
            reward_percentage
          )
        `)
        .eq("user_id", order.user_id)
        .eq("status", "approved")
        .order("submitted_at", {
          ascending: false
        })
        .limit(1)
        .maybeSingle();

      if (resellerError) throw resellerError;


      // =====================================
      // REWARD PERCENTAGE
      // =====================================

      let rewardPercentage = 100;

      // Normal user = 100%

      // Approved reseller:
      // Basic   = 0%
      // Pro     = 50%
      // Premium = 100%

      if (
        resellerApplication &&
        resellerApplication.reseller_plans
      ) {

        rewardPercentage =
          Number(
            resellerApplication
              .reseller_plans
              .reward_percentage || 0
          );

      }


      // =====================================
      // FINAL REWARD POINTS
      // =====================================

      const earnedRewardPoints =
        baseRewardPoints *
        quantity *
        (rewardPercentage / 100);


      console.log(
        "Reward calculation:",
        {
          baseRewardPoints,
          quantity,
          rewardPercentage,
          earnedRewardPoints
        }
      );


      // =====================================
      // UPDATE PROFILE
      // =====================================

      const { error: updateProfileError } =
        await supabase
          .from("profiles")
          .update({

            total_orders:
              currentOrders + quantity,

            total_spent:
              currentSpent + totalPrice,

            reward_points:
              currentRewardPoints +
              earnedRewardPoints

          })
          .eq("id", order.user_id);

      if (updateProfileError)
        throw updateProfileError;

    }


    // =====================================
    // UPDATE ORDER STATUS
    // =====================================

    const { error } =
      await supabase
        .from("orders")
        .update({
          status
        })
        .eq("id", id);

    if (error) throw error;


    // =====================================
    // SUCCESS MESSAGE
    // =====================================

showToast(
  "Status Updated ✅"
);

// Save current Orders scroll position
const ordersBox =
  document.querySelector(".ordersScrollBox");

const savedScrollTop =
  ordersBox ? ordersBox.scrollTop : 0;

await loadCounts();

await viewOrders();

// Restore Orders scroll position
requestAnimationFrame(() => {

  const newOrdersBox =
    document.querySelector(".ordersScrollBox");

  if (newOrdersBox) {
    newOrdersBox.scrollTop = savedScrollTop;
  }

});

  }

  catch (err) {

    console.error(
      "Status update error:",
      err
    );

    showToast(
      "Update Failed",
      "#dc2626"
    );

  }

};

/* ===========================================
   SUCCESS ORDERS
=========================================== */

window.viewTopups = async () => {

  closeSidebar();


  try {

    const { data = [] } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "success")
      .order("created_at", { ascending: false });

    renderStatusPage(
      "✅ Success Orders",
      data,
      "#22c55e"
    );

  } catch (err) {

    console.error(err);

    showToast("Load Failed", "#dc2626");

  }


};

/* ===========================================
   REJECTED ORDERS
=========================================== */

window.viewRejected = async () => {

  closeSidebar();


  try {

    const { data = [] } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "reject")
      .order("created_at", { ascending: false });

    renderStatusPage(
      "❌ Rejected Orders",
      data,
      "#ef4444"
    );

  } catch (err) {

    console.error(err);

    showToast("Load Failed", "#dc2626");

  }


};

/* ===========================================
   PENDING ORDERS
=========================================== */

window.viewPending = async () => {

  closeSidebar();


  try {

    const { data = [] } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    const pending = data.filter(x =>
      !x.status ||
      x.status === "pending" ||
      x.status === "Pending"
    );

    renderStatusPage(
      "⏳ Pending Orders",
      pending,
      "#f59e0b"
    );

  } catch (err) {

    console.error(err);

    showToast("Load Failed", "#dc2626");

  }


};

/* ===========================================
   COMMON RENDER FUNCTION
=========================================== */

function renderStatusPage(title, orders, color) {

  let html = `

<div class="panel">

<div class="panelHeader">

<h2>${title}</h2>

</div>

<div class="panelBody">

<div class="successScrollBox">

`;

  if (orders.length === 0) {

    html += `

<div class="statCard">

<div class="icon">📦</div>

<div class="info">

<h4>No Orders</h4>

<h2>0</h2>

</div>

</div>

</div>

`;

  }

  orders.forEach(order => {

    html += `

<div class="card">

<h3>${order.product_name}</h3>

<p><b>UID :</b> ${order.uid}</p>

<p>
<b>Price :</b>
Rs. ${Number(order.total_price || 0).toFixed(2)}
${
  (order.quantity || 1) > 1
  ? ` × ${order.quantity}`
  : ""
}
</p>

<p>

<b>Status :</b>

<span style="color:${color};font-weight:bold;">

${order.status || "pending"}

</span>

</p>

</div>

`;

  });

  html += `

</div>

</div>

`;

  contentBox.innerHTML = html;

}

/* ===========================================
   WALLET TOPUPS
=========================================== */

window.viewWalletTopups = async () => {

  closeSidebar();



  try {

    const { data, error } = await supabase
      .from("wallet_topups")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    let html = `

<div class="panel">

<div class="panelHeader">

<h2>💰 Wallet Topups</h2>

</div>

<div class="panelBody">

<div class="walletScrollBox">

`;

    if (!data || data.length === 0) {

      html += `

<div class="statCard">

<div class="icon">💰</div>

<div class="info">

<h4>No Wallet Requests</h4>

<h2>0</h2>

</div>

</div>

</div>

`;

    } else {

      data.forEach(item => {

        let color = "#f59e0b";

        if (item.status === "success") color = "#22c55e";
        if (item.status === "reject") color = "#ef4444";

        html += `

<div class="card">

<h3>${item.email}</h3>

<p><b>📱 WhatsApp :</b> ${item.whatsapp}</p>

<p><b>💰 Amount :</b> Rs. ${Number(item.amount).toFixed(2)}</p>

<p>

<b>Status :</b>

<span style="color:${color};font-weight:bold;">

${item.status}

</span>

</p>

${item.receipt_url ?

`<a href="${item.receipt_url}" target="_blank">

📷 View Receipt

</a>`

: ""}

<div>

<button onclick="walletSuccess('${item.id}','${item.user_id}')">

✅ Success

</button>

<button onclick="walletReject('${item.id}')">

❌ Reject

</button>

</div>

</div>

`;

      });

    }

    html += `

</div>

</div>

`;

    contentBox.innerHTML = html;

  }

  catch (err) {

    console.error(err);

    showToast("Wallet Load Failed", "#dc2626");

  }


};

/* ===========================================
   WALLET SUCCESS
=========================================== */

window.walletSuccess = async (id, userId) => {

  walletPopup.classList.add("active");

  walletAmount.value = "";

  walletCancel.onclick = () => {

    walletPopup.classList.remove("active");

  };

  walletOk.onclick = async () => {

    const amount = Number(walletAmount.value);

    if (!amount) {

      alert("Enter Wallet Amount");

      return;

    }

    walletPopup.classList.remove("active");

    const { data: profile } = await supabase

      .from("profiles")

      .select("wallet_balance")

      .eq("id", userId)

      .single();

    const current = Number(profile?.wallet_balance || 0);

    await supabase

      .from("profiles")

      .update({

        wallet_balance: current + amount

      })

      .eq("id", userId);

    await supabase

      .from("wallet_topups")

      .update({

        status: "success"

      })

      .eq("id", id);

    showToast("Wallet Updated ✅");

    loadCounts();

    viewWalletTopups();

  };

};

/* ===========================================
   WALLET REJECT
=========================================== */

window.walletReject = async (id) => {

  await supabase

    .from("wallet_topups")

    .update({

      status: "reject"

    })

    .eq("id", id);

  showToast("Wallet Rejected", "#dc2626");

  loadCounts();

  viewWalletTopups();

};

/* ===========================================
   SEARCH ORDERS
=========================================== */

window.searchOrder = async () => {

  const keyword = document
    .getElementById("searchUser")
    .value
    .trim()
    .toLowerCase();

  const { data } = await supabase
    .from("orders")
    .select("*");

const filtered = data.filter(item =>
  (item.order_number || "").toLowerCase().includes(keyword) ||
  (item.uid || "").toLowerCase().includes(keyword) ||
  (item.user_id || "").toLowerCase().includes(keyword) ||
  (item.product_name || "").toLowerCase().includes(keyword) ||
  (item.category || "").toLowerCase().includes(keyword)
);

  let html = `

<div class="panel">

<div class="panelHeader">

<h2>🔍 Search Results</h2>

</div>

<div class="panelBody">

`;

  if (filtered.length === 0) {

    html += `
<div class="statCard">
<div class="icon">❌</div>
<div class="info">
<h4>No Results Found</h4>
</div>
</div>
`;

  } else {

    filtered.forEach(item => {

      let color = "#f59e0b";

      if (item.status === "success") color = "#22c55e";
      if (item.status === "reject") color = "#ef4444";

      html += `

<div class="card">

<h3>${item.product_name}</h3>

<p><b>UID :</b> ${item.uid}</p>

<p><b>Order ID :</b> ${item.order_number || "N/A"}</p>


<p>
<b>Price :</b>
Rs. ${Number(item.total_price || item.price || 0).toFixed(2)}
${
  (item.quantity || 1) > 1
  ? ` × ${item.quantity}`
  : ""
}
</p>

<p>

<b>Status :</b>

<span style="color:${color};font-weight:bold;">

${item.status}

</span>

</p>

</div>

`;

    });

  }

  html += `
</div>
</div>
`;

  contentBox.innerHTML = html;

};

/* =========================================================
   PREMIUM RESELLER SYSTEM CONFIRM POPUP
========================================================= */

function showResellerConfirm({
    type = "disable",
    title,
    message
}) {

    return new Promise((resolve) => {

        const isDisable =
            type === "disable";

        const popup =
            document.createElement("div");

        popup.className =
            "premium-confirm-overlay";

        popup.innerHTML = `

            <div class="premium-confirm-box">

                <button
                    type="button"
                    class="premium-confirm-close"
                    id="premiumConfirmClose"
                >
                    &times;
                </button>


                <div class="premium-confirm-icon ${isDisable ? "danger" : "success"}">

                    <i class="fa-solid ${
                        isDisable
                        ? "fa-pause"
                        : "fa-play"
                    }"></i>

                </div>


                <div class="premium-confirm-content">

                    <span class="premium-confirm-label">

                        RESELLER SYSTEM

                    </span>


                    <h2>
                        ${title}
                    </h2>


                    <p>
                        ${message}
                    </p>

                </div>


                <div class="premium-confirm-status">

                    <div class="status-dot ${
                        isDisable
                        ? "red"
                        : "green"
                    }"></div>


                    <span>
                        ${
                            isDisable
                            ? "System will be temporarily paused"
                            : "System will resume normally"
                        }
                    </span>

                </div>


                <div class="premium-confirm-actions">

                    <button
                        type="button"
                        class="premium-confirm-cancel"
                        id="premiumConfirmCancel"
                    >
                        Cancel
                    </button>


                    <button
                        type="button"
                        class="premium-confirm-action ${
                            isDisable
                            ? "danger-btn"
                            : "success-btn"
                        }"
                        id="premiumConfirmAction"
                    >

                        <i class="fa-solid fa-check"></i>

                        ${
                            isDisable
                            ? "Disable Reseller"
                            : "Enable Reseller"
                        }

                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(
            popup
        );


        const closePopup = (
            result
        ) => {

            popup.classList.remove(
                "show"
            );


            setTimeout(() => {

                popup.remove();

                resolve(result);

            }, 250);

        };


        popup
            .querySelector(
                "#premiumConfirmClose"
            )
            ?.addEventListener(
                "click",
                () => closePopup(false)
            );


        popup
            .querySelector(
                "#premiumConfirmCancel"
            )
            ?.addEventListener(
                "click",
                () => closePopup(false)
            );


        popup
            .querySelector(
                ".premium-confirm-overlay"
            )
            ?.addEventListener(
                "click",
                (event) => {

                    if (
                        event.target === popup
                    ) {

                        closePopup(false);

                    }

                }
            );


        popup
            .querySelector(
                "#premiumConfirmAction"
            )
            ?.addEventListener(
                "click",
                () => closePopup(true)
            );


        requestAnimationFrame(() => {

            popup.classList.add(
                "show"
            );

        });

    });

}

/* ===========================================
   UPDATE RESELLER SYSTEM STATUS
   PAUSE / RESUME MEMBERSHIP TIME
=========================================== */

window.setResellerSystemStatus = async (status) => {

  try {

    /* =========================================
       GET CURRENT SYSTEM SETTINGS
    ========================================= */

    const {
      data: currentSettings,
      error: fetchError
    } = await supabase
      .from("reseller_system_settings")
      .select(`
        enabled,
        paused_at,
        total_paused_seconds
      `)
      .eq("id", 1)
      .single();

    if (fetchError) {
      throw fetchError;
    }


    /* =========================================
       DISABLE RESELLER SYSTEM
    ========================================= */

    if (!status) {

const confirmed =
    await showResellerConfirm({

        type: "disable",

        title:
            "Temporarily Disable Reseller?",

        message:
            "All active reseller membership timers will be paused until you enable the reseller system again."

    });


if (!confirmed) return;


      /* Already disabled */

      if (currentSettings?.enabled === false) {

        showToast(
          "Reseller System is already disabled 🔴",
          "#dc2626"
        );

        return;
      }


      /* =======================================
         SAVE EXACT PAUSE TIME
      ======================================= */

      const pauseTime =
        new Date();


      const { error } = await supabase
        .from("reseller_system_settings")
        .update({

          enabled: false,

          paused_at:
            pauseTime.toISOString(),

          updated_at:
            pauseTime.toISOString()

        })
        .eq("id", 1);


      if (error) {
        throw error;
      }


      console.log(
        "⏸️ Reseller system paused at:",
        pauseTime.toISOString()
      );


      showToast(
        "Reseller System Temporarily Disabled 🔴",
        "#dc2626"
      );

    }


    /* =========================================
       ENABLE RESELLER SYSTEM
    ========================================= */

    else {

const confirmed =
    await showResellerConfirm({

        type: "enable",

        title:
            "Enable Reseller System?",

        message:
            "All active reseller membership timers will continue from where they stopped."

    });


if (!confirmed) return;


      /* =======================================
         ALREADY ENABLED
      ======================================= */

      if (currentSettings?.enabled === true) {

        showToast(
          "Reseller System is already enabled 🟢",
          "#16a34a"
        );

        return;
      }


      /* =======================================
         CALCULATE PAUSED DURATION
      ======================================= */

      let pausedSeconds = 0;


      if (currentSettings?.paused_at) {

        const pausedAt =
          new Date(
            currentSettings.paused_at
          ).getTime();


        const now =
          Date.now();


        pausedSeconds =
          Math.max(
            0,
            Math.floor(
              (now - pausedAt) / 1000
            )
          );

      }


      console.log(
        "⏸️ Current pause duration:",
        pausedSeconds,
        "seconds"
      );


      /* =======================================
         GET ACTIVE RESELLERS
      ======================================= */

      const {
        data: activeResellers,
        error: resellerError
      } = await supabase
        .from("reseller_applications")
        .select(`
          id,
          user_id,
          expires_at,
          status
        `)
        .eq(
          "status",
          "approved"
        )
        .not(
          "expires_at",
          "is",
          null
        );


      if (resellerError) {
        throw resellerError;
      }


      /* =======================================
         EXTEND EACH ACTIVE MEMBERSHIP
      ======================================= */

      if (
        pausedSeconds > 0 &&
        activeResellers &&
        activeResellers.length > 0
      ) {

        for (
          const reseller
          of activeResellers
        ) {

          const oldExpiry =
            new Date(
              reseller.expires_at
            );


          /* ===================================
             ONLY EXTEND MEMBERSHIPS THAT
             WERE ACTIVE BEFORE PAUSE
          =================================== */

          if (
            oldExpiry.getTime() > Date.now()
          ) {

            const newExpiry =
              new Date(
                oldExpiry.getTime() +
                (
                  pausedSeconds * 1000
                )
              );


            const {
              error: updateError
            } = await supabase
              .from(
                "reseller_applications"
              )
              .update({

                expires_at:
                  newExpiry.toISOString()

              })
              .eq(
                "id",
                reseller.id
              )
              .eq(
                "status",
                "approved"
              );


            if (updateError) {

              console.error(
                "❌ Failed to extend reseller:",
                reseller.id,
                updateError
              );

              continue;
            }


            console.log(
              "✅ Reseller expiry extended:",
              reseller.id,
              oldExpiry.toISOString(),
              "→",
              newExpiry.toISOString()
            );

          }

        }

      }


      /* =======================================
         UPDATE TOTAL PAUSED TIME
      ======================================= */

      const oldTotalPaused =
        Number(
          currentSettings?.total_paused_seconds || 0
        );


      const newTotalPaused =
        oldTotalPaused +
        pausedSeconds;


      /* =======================================
         RESUME SYSTEM
      ======================================= */

      const resumeTime =
        new Date();


      const {
        error: resumeError
      } = await supabase
        .from(
          "reseller_system_settings"
        )
        .update({

          enabled: true,

          paused_at: null,

          total_paused_seconds:
            newTotalPaused,

          updated_at:
            resumeTime.toISOString()

        })
        .eq(
          "id",
          1
        );


      if (resumeError) {
        throw resumeError;
      }


      console.log(
        "▶️ Reseller system resumed"
      );


      console.log(
        "⏱️ Added paused time:",
        pausedSeconds,
        "seconds"
      );


      console.log(
        "⏱️ Total paused time:",
        newTotalPaused,
        "seconds"
      );


      showToast(
        "Reseller System Enabled 🟢",
        "#16a34a"
      );

    }


    /* =========================================
       REFRESH ADMIN PANEL
    ========================================= */

    await resellerSystemPage();


  } catch (error) {

    console.error(
      "❌ Update Reseller System Error:",
      error
    );


    showToast(
      "Failed To Update Reseller System ❌",
      "#dc2626"
    );

  }

};

/* ===========================================
   RESELLER SYSTEM PAGE
=========================================== */

window.resellerSystemPage = async () => {

    closeSidebar();

    try {

        const {
            data,
            error
        } = await supabase
            .from("reseller_system_settings")
            .select(`
                enabled,
                paused_at,
                total_paused_seconds,
                updated_at
            `)
            .eq("id", 1)
            .single();


        if (error) {
            throw error;
        }


        const isEnabled =
            data?.enabled === true;


        contentBox.innerHTML = `

            <div class="panel">

                <div class="panelHeader">

                    <h2>
                        🤝 Reseller System
                    </h2>

                </div>


                <div class="panelBody">


                    <div class="statCard">

                        <div class="icon">
                            ${isEnabled ? "🟢" : "🔴"}
                        </div>


                        <div class="info">

                            <h4>
                                Reseller Status
                            </h4>


                            <h2>
                                ${
                                    isEnabled
                                    ? "ACTIVE"
                                    : "TEMPORARILY DISABLED"
                                }
                            </h2>

                        </div>

                    </div>


                    <br>


                    ${
                        !isEnabled && data?.paused_at
                        ? `

                            <div class="statCard">

                                <div class="icon">
                                    ⏸️
                                </div>


                                <div class="info">

                                    <h4>
                                        Disabled Since
                                    </h4>


                                    <p>
                                        ${
                                            new Date(
                                                data.paused_at
                                            ).toLocaleString()
                                        }
                                    </p>

                                </div>

                            </div>

                            <br>

                        `
                        : ""
                    }


                    <button
                        onclick="setResellerSystemStatus(${!isEnabled})"
                    >

                        ${
                            isEnabled
                            ? "🔴 Temporarily Disable Reseller"
                            : "🟢 Enable Reseller"
                        }

                    </button>


                </div>

            </div>

        `;


    } catch (error) {

        console.error(
            "Reseller System Error:",
            error
        );


        showToast(
            "Failed To Load Reseller System ❌",
            "#dc2626"
        );

    }

};

/* ===========================================
   MAINTENANCE
=========================================== */

window.maintenancePage = async () => {

  closeSidebar();

  const { data } = await supabase
    .from("settings")
    .select("maintenance")
    .eq("id", 1)
    .single();

  contentBox.innerHTML = `

<div class="panel">

<div class="panelHeader">

<h2>🛠 Maintenance Mode</h2>

</div>

<div class="panelBody">

<div class="statCard">

<div class="icon">

${data.maintenance ? "🔴" : "🟢"}

</div>

<div class="info">

<h4>Status</h4>

<h2>

${data.maintenance ? "ON" : "OFF"}

</h2>

</div>

</div>

<br>

<button onclick="setMaintenance(true)">

🔴 Turn ON

</button>

<br><br>

<button onclick="setMaintenance(false)">

🟢 Turn OFF

</button>

</div>

</div>

`;

};

window.setMaintenance = async (status) => {

  await supabase
    .from("settings")
    .update({
      maintenance: status
    })
    .eq("id", 1);

  showToast("Maintenance Updated ✅");

  maintenancePage();

};


/* ===========================================
   UPDATE STOCK STATUS
=========================================== */

window.setStockStatus = async (status) => {

  try {

    const { error } = await supabase
      .from("settings")
      .update({
        stock_out: status
      })
      .eq("id", 1);

    if (error) throw error;

    showToast(
      status
        ? "Stock marked as OUT OF STOCK 🟤"
        : "Stock marked as IN STOCK 🟢"
    );

    await stockPage();

  }

  catch (error) {

    console.error(
      "Stock update error:",
      error
    );

    showToast(
      "Failed To Update Stock",
      "#dc2626"
    );

  }

};

/* ===========================================
   REFRESH DASHBOARD
=========================================== */

window.refreshDashboard = async () => {

  await loadCounts();

  await showDashboard();

};

/* ===========================================
   PRODUCTS MANAGEMENT
=========================================== */

window.viewProducts = async () => {

  closeSidebar();

  try {

    // Load products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: true });

    if (productsError) throw productsError;


    // Load Garena Shell Balance
    const { data: shellStock, error: shellError } = await supabase
      .from("garena_shell_stock")
      .select("shell_balance")
      .eq("id", 1)
      .single();

    if (shellError) throw shellError;


    const shellBalance = Number(shellStock?.shell_balance || 0);


    let html = `

<div class="panel">

<div class="panelHeader">

<h2>🛍️ Products Management</h2>

</div>

<div class="panelBody">

<div class="card" style="
margin-bottom:20px;
padding:20px;
">

<h3>🔥 Garena Shell Stock</h3>

<p style="font-size:20px;">
<b>Current Balance:</b>
${shellBalance} Shell
</p>

</div>

`;


    products.forEach(product => {

      const shellCost =
        Number(product.garena_shell_cost || 0);


      let availableStock = 0;
      let stockText = "";
      let stockColor = "";


      if (shellCost <= 0) {

        stockText = "⚠️ Shell Cost Not Set";
        stockColor = "#f59e0b";

      } else {

        availableStock =
          Math.floor(shellBalance / shellCost);


        if (availableStock > 0) {

          stockText =
            `🟢 ${availableStock} Available`;

          stockColor = "#22c55e";

        } else {

          stockText =
            "🔴 OUT OF STOCK";

          stockColor = "#ef4444";

        }

      }


      html += `

<div class="card" style="
margin-bottom:15px;
">

<h3>
${product.product_name}
</h3>

<p>
<b>Category:</b>
${product.category}
</p>

<p>
<b>Price:</b>

<input
type="number"
id="price-${product.id}"
value="${product.price}"
style="width:120px;">
</p>


<p>
<b>Reward Points:</b>

<input
type="number"
step="0.5"
id="points-${product.id}"
value="${product.reward_points || 0}"
style="width:120px;">
</p>


<p>
<b>Garena Shell Cost:</b>

<input
type="number"
min="0"
step="1"
id="shell-${product.id}"
value="${product.garena_shell_cost || 0}"
style="width:120px;">
</p>


<p>
<b>Available Stock:</b>

<span style="
font-weight:bold;
color:${stockColor};
">

${stockText}

</span>

</p>


<p>
<b>Status:</b>

${product.active
  ? "🟢 Active"
  : "🔴 Inactive"
}

</p>


<button
onclick="saveProduct(${product.id})">

💾 Save

</button>


</div>

`;

    });


    html += `

</div>

</div>

`;


    contentBox.innerHTML = html;

  }

  catch (err) {

    console.error(err);

    showToast(
      "Products Load Failed",
      "#dc2626"
    );

  }

};

/* =====================================================
   GARENA SHELL MANAGEMENT
===================================================== */

window.viewGarenaShells = async () => {

    closeSidebar();

    const contentBox =
        document.getElementById("contentBox");

    if (!contentBox) return;

    contentBox.innerHTML = `

        <div class="panel">

            <div class="panelHeader">

                <h2>🔥 Garena Shells</h2>

            </div>

            <div class="panelBody">

                <div
                    id="garenaShellProducts"
                    style="
                        display:grid;
                        grid-template-columns:
                        repeat(auto-fit,minmax(220px,1fr));
                        gap:18px;
                    "
                >

                    <p>Loading Garena Shells...</p>

                </div>

            </div>

        </div>

    `;

    await loadGarenaShellProducts();

};


// =====================================================
// LOAD GARENA SHELL PACKAGES
// =====================================================

async function loadGarenaShellProducts() {

    const container =
        document.getElementById(
            "garenaShellProducts"
        );

    if (!container) return;

    try {

        const {
            data,
            error
        } = await supabase
            .from("garena_shell_products")
            .select("*")
            .order("shell_amount", {
                ascending: true
            });


        if (error) {
            throw error;
        }


        if (!data || data.length === 0) {

            container.innerHTML = `

                <div class="panel">

                    <div class="panelBody">

                        <p>
                            No Garena Shell packages found.
                        </p>

                    </div>

                </div>

            `;

            return;

        }


        container.innerHTML = "";


        /*
         * Get REAL code count from
         * garena_shell_codes table.
         */

        for (const product of data) {

            const card =
                document.createElement("div");

            card.className =
                "panel";


            // =========================================
            // GET ACTUAL CODE COUNT
            // =========================================

            const {
                count: stock,
                error: countError
            } = await supabase
                .from("garena_shell_codes")
                .select("id", {
                    count: "exact",
                    head: true
                })
                .eq(
                    "product_id",
                    product.id
                );


            if (countError) {

                console.error(
                    "Code count error:",
                    countError
                );

            }


            const actualStock =
                Number(stock || 0);


            const price =
                Number(
                    product.price || 0
                );


            // =========================================
            // CARD
            // =========================================

            card.innerHTML = `

                <div class="panelHeader">

                    <h3>
                        🔥
                        ${Number(
                            product.shell_amount
                        ).toLocaleString()}
                        Shells
                    </h3>

                </div>


                <div
                    class="panelBody"
                    style="text-align:center;"
                >

                    <div
                        style="
                            font-size:28px;
                            font-weight:800;
                            margin-bottom:12px;
                        "
                    >

                        Rs.
                        ${price.toFixed(2)}

                    </div>


                    <div
                        style="
                            margin-bottom:15px;
                        "
                    >

                        ${
                            actualStock > 0

                            ? `
                                <span
                                    style="
                                        color:#22c55e;
                                        font-weight:700;
                                    "
                                >
                                    ● ${actualStock}
                                    Codes Available
                                </span>
                            `

                            : `
                                <span
                                    style="
                                        color:#ef4444;
                                        font-weight:700;
                                    "
                                >
                                    ● OUT OF STOCK
                                </span>
                            `
                        }

                    </div>


                    <button
                        class="admin-btn"
                        onclick="
                            editGarenaPrice(
                                '${product.id}',
                                ${price}
                            )
                        "
                    >

                        💰 Edit Price

                    </button>


                    <button
                        class="admin-btn"
                        onclick="
                            addGarenaCodes(
                                '${product.id}',
                                ${Number(
                                    product.shell_amount
                                )}
                            )
                        "
                    >

                        🎟️ Add Codes

                    </button>

                </div>

            `;


            container.appendChild(card);

        }

    }

    catch(error) {

        console.error(
            "Garena Shell Load Error:",
            error
        );


        container.innerHTML = `

            <div class="panel">

                <div class="panelBody">

                    <p style="color:#ef4444;">

                        Failed to load Garena Shells.

                    </p>

                </div>

            </div>

        `;

    }

}


/* =====================================================
   PREMIUM PRICE POPUP
===================================================== */

function showPremiumPricePopup(currentPrice) {

    return new Promise((resolve) => {

        const overlay =
            document.createElement("div");

        overlay.id = "premiumPricePopup";

        overlay.innerHTML = `

            <div class="premium-admin-overlay">

                <div class="premium-admin-modal">

                    <button
                        type="button"
                        class="premium-admin-close"
                        id="premiumPriceClose"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>


                    <div class="premium-admin-icon">

                        <i class="fa-solid fa-tags"></i>

                    </div>


                    <div class="premium-admin-brand">
                        🔥 PHOENIX STORE
                    </div>


                    <span class="premium-admin-badge">
                        PRODUCT PRICE
                    </span>


                    <h2>
                        Edit Shell Price
                    </h2>


                    <p class="premium-admin-description">
                        Set the selling price for this
                        Garena Shell package.
                    </p>


                    <div class="premium-price-input-box">

                        <span>Rs.</span>

                        <input
                            type="number"
                            id="premiumPriceInput"
                            value="${currentPrice}"
                            min="0"
                            step="0.01"
                            inputmode="decimal"
                        >

                    </div>


                    <p
                        id="premiumPriceError"
                        class="premium-admin-error"
                    ></p>


                    <div class="premium-admin-actions">

                        <button
                            type="button"
                            id="premiumPriceCancel"
                            class="premium-admin-cancel"
                        >
                            Cancel
                        </button>


                        <button
                            type="button"
                            id="premiumPriceConfirm"
                            class="premium-admin-confirm"
                        >

                            <i class="fa-solid fa-check"></i>

                            Update Price

                        </button>

                    </div>

                </div>

            </div>

        `;


        document.body.appendChild(
            overlay
        );


        const input =
            overlay.querySelector(
                "#premiumPriceInput"
            );

        const close =
            () => {

                overlay.remove();

                resolve(null);

            };


        const confirm =
            () => {

                const value =
                    input.value.trim();


                const price =
                    Number(value);


                if (
                    value === "" ||
                    !Number.isFinite(price) ||
                    price < 0
                ) {

                    overlay
                        .querySelector(
                            "#premiumPriceError"
                        )
                        .textContent =
                        "Please enter a valid price.";

                    input.focus();

                    return;

                }


                overlay.remove();

                resolve(price);

            };


        overlay
            .querySelector(
                "#premiumPriceClose"
            )
            .addEventListener(
                "click",
                close
            );


        overlay
            .querySelector(
                "#premiumPriceCancel"
            )
            .addEventListener(
                "click",
                close
            );


        overlay
            .querySelector(
                "#premiumPriceConfirm"
            )
            .addEventListener(
                "click",
                confirm
            );


        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target === overlay
                ) {

                    close();

                }

            }
        );


        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    confirm();

                }


                if (
                    event.key === "Escape"
                ) {

                    close();

                }

            }
        );


        requestAnimationFrame(() => {

            input.focus();

            input.select();

        });

    });

}


/* =====================================================
   EDIT GARENA PRICE
===================================================== */

window.editGarenaPrice = async (
    productId,
    currentPrice
) => {

    const price =
        await showPremiumPricePopup(
            currentPrice
        );


    if (price === null) {

        return;

    }


    try {

        const {
            error
        } = await supabase
            .from("garena_shell_products")
            .update({
                price: price
            })
            .eq(
                "id",
                productId
            );


        if (error) {

            throw error;

        }


        showToast(
            "Garena Shell price updated.",
            "#22c55e"
        );


        await loadGarenaShellProducts();

    }

    catch(error) {

        console.error(error);

        showToast(
            "Failed to update price.",
            "#ef4444"
        );

    }

};

/* =====================================================
   ADD GARENA REDEEM CODES
===================================================== */

window.addGarenaCodes = async (
    productId,
    shellAmount
) => {

    /* =========================================
       CREATE PREMIUM ADD-CODES POPUP
    ========================================= */

    const overlay =
        document.createElement("div");

    overlay.className =
        "premium-admin-overlay";


    overlay.innerHTML = `

        <div class="premium-admin-modal add-codes-modal">

            <button
                type="button"
                class="premium-admin-close"
                id="addCodesClose"
            >
                <i class="fa-solid fa-xmark"></i>
            </button>


            <div class="premium-admin-icon">

                <i class="fa-solid fa-ticket"></i>

            </div>


            <div class="premium-admin-brand">
                🔥 PHOENIX STORE
            </div>


            <span class="premium-admin-badge">
                ADD REDEEM CODES
            </span>


            <h2>
                Add Shell Codes
            </h2>


            <p class="premium-admin-description">

                Add redeem codes for
                <strong>
                    ${Number(shellAmount).toLocaleString()} Shells
                </strong>.

                Enter one code per line.

            </p>


            <div class="premium-code-input-box">

                <textarea
                    id="premiumRedeemCodes"
                    placeholder="Paste redeem codes here...

Example:
RGG-XXXX-XXXX-XXXX
RGG-YYYY-YYYY-YYYY
RGG-ZZZZ-ZZZZ-ZZZZ"
                    autocomplete="off"
                    spellcheck="false"
                ></textarea>

            </div>


            <div
                class="premium-code-count"
                id="premiumCodeCount"
            >
                0 codes
            </div>


            <div
                class="premium-admin-error"
                id="premiumCodesError"
            ></div>


            <div class="premium-admin-actions">

                <button
                    type="button"
                    class="premium-admin-cancel"
                    id="addCodesCancel"
                >

                    Cancel

                </button>


                <button
                    type="button"
                    class="premium-admin-confirm"
                    id="addCodesConfirm"
                >

                    <i class="fa-solid fa-plus"></i>

                    Add Codes

                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    document.body.classList.add(
        "popup-open"
    );


    const textarea =
        overlay.querySelector(
            "#premiumRedeemCodes"
        );


    const count =
        overlay.querySelector(
            "#premiumCodeCount"
        );


    const errorBox =
        overlay.querySelector(
            "#premiumCodesError"
        );


    const closeButton =
        overlay.querySelector(
            "#addCodesClose"
        );


    const cancelButton =
        overlay.querySelector(
            "#addCodesCancel"
        );


    const confirmButton =
        overlay.querySelector(
            "#addCodesConfirm"
        );


    /* =========================================
       CLEANUP
    ========================================= */

    const closeModal = () => {

        overlay.remove();

        if (
            !document.querySelector(
                ".premium-admin-overlay"
            )
        ) {

            document.body.classList.remove(
                "popup-open"
            );

        }

    };


    closeButton.addEventListener(
        "click",
        closeModal
    );


    cancelButton.addEventListener(
        "click",
        closeModal
    );


    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target === overlay
            ) {

                closeModal();

            }

        }
    );


    /* =========================================
       CODE COUNT
    ========================================= */

    textarea.addEventListener(
        "input",
        () => {

            const codes =
                textarea.value
                    .split(/\r?\n/)
                    .map(code => code.trim())
                    .filter(Boolean);


            const uniqueCodes =
                [
                    ...new Set(codes)
                ];


            count.textContent =
                `${uniqueCodes.length} ${
                    uniqueCodes.length === 1
                        ? "code"
                        : "codes"
                }`;

        }
    );


    /* =========================================
       ADD CODES
    ========================================= */

    confirmButton.addEventListener(
        "click",
        async () => {

            errorBox.textContent = "";


            const input =
                textarea.value;


            if (
                input === null ||
                input.trim() === ""
            ) {

                errorBox.textContent =
                    "Please enter at least one redeem code.";

                textarea.focus();

                return;

            }


            const codes =
                input
                    .split(/\r?\n/)
                    .map(code => code.trim())
                    .filter(Boolean);


            const uniqueCodes =
                [
                    ...new Set(codes)
                ];


            if (
                uniqueCodes.length === 0
            ) {

                errorBox.textContent =
                    "Please enter valid redeem codes.";

                textarea.focus();

                return;

            }


            /* Prevent double click */

            confirmButton.disabled =
                true;


            confirmButton.innerHTML = `

                <i class="fa-solid fa-spinner fa-spin"></i>

                Adding...

            `;


            try {

                const rows =
                    uniqueCodes.map(
                        code => ({

                            product_id:
                                productId,

                            redeem_code:
                                code

                        })
                    );


                const {
                    error
                } = await supabase
                    .from(
                        "garena_shell_codes"
                    )
                    .insert(rows);


                if (error) {

                    throw error;

                }


                closeModal();


                showToast(
                    `${uniqueCodes.length} redeem codes added.`,
                    "#22c55e"
                );


                await loadGarenaShellProducts();


            }
            catch (error) {

                console.error(
                    "Add Garena Codes Error:",
                    error
                );


                errorBox.textContent =
                    "Failed to add redeem codes.";


                confirmButton.disabled =
                    false;


                confirmButton.innerHTML = `

                    <i class="fa-solid fa-plus"></i>

                    Add Codes

                `;

            }

        }
    );


    /* Focus textarea */

    setTimeout(
        () => textarea.focus(),
        100
    );

};

/* ===========================================
   SAVE PRODUCT
=========================================== */

window.saveProduct = async (id) => {

  const price =
    Number(
      document.getElementById(`price-${id}`).value
    );

  const rewardPoints =
    Number(
      document.getElementById(`points-${id}`).value
    );

  const shellCost =
    Number(
      document.getElementById(`shell-${id}`).value
    );

  if (
    price < 0 ||
    rewardPoints < 0 ||
    shellCost < 0
  ) {

    showToast(
      "Invalid Value",
      "#dc2626"
    );

    return;

  }

  const { error } = await supabase
    .from("products")
    .update({
      price: price,
      reward_points: rewardPoints,
      garena_shell_cost: shellCost
    })
    .eq("id", id);

  if (error) {

    console.error(error);

    showToast(
      "Update Failed ❌",
      "#dc2626"
    );

    return;

  }

  showToast("Product Updated ✅");

  viewProducts();

};

/* ===========================================
   RESELLER APPLICATIONS
=========================================== */

window.viewResellerApplications = async () => {

  closeSidebar();

  showLoading();

  try {

    const { data: applications, error } = await supabase
      .from("reseller_applications")
      .select(`
        *,
        reseller_plans (
          plan_name,
          price,
          duration_months,
          discount_percentage,
          reward_percentage
        )
      `)
      .order("submitted_at", {
        ascending: false
      });

    if (error) throw error;


    let html = `

<div class="panel">

<div class="panelHeader">

<h2>🤝 Reseller Applications</h2>

</div>

<div class="panelBody">

<div class="resellerScrollBox">

`;


    if (!applications || applications.length === 0) {

      html += `

<div class="statCard">

<div class="icon">🤝</div>

<div class="info">

<h4>No Reseller Applications</h4>

<h2>0</h2>

</div>

</div>

`;

    } else {

      applications.forEach(application => {

        const plan =
          application.reseller_plans;

        const status =
          application.status || "pending";


        let statusColor =
          "#f59e0b";

        if (status === "approved") {

          statusColor =
            "#22c55e";

        }

        if (status === "rejected") {

          statusColor =
            "#ef4444";

        }


        html += `

<div class="card reseller-application-card">

<h3>
🤝 Reseller Application
</h3>


<hr>


<p>
<b>👤 Applicant</b>
</p>

<p>
<b>Username :</b>
${application.real_name || "N/A"}
</p>

<p>
<b>Email :</b>
${application.email || "N/A"}
</p>

<p>
<b>WhatsApp :</b>
${application.whatsapp || "N/A"}
</p>


<br>


<p>
<b>🏪 Business</b>
</p>

<p>
<b>Business Name :</b>
${application.branch_name || "N/A"}
</p>

<p>
<b>Address :</b>
${application.address || "N/A"}
</p>

<p>
<b>Country :</b>
${application.country || "N/A"}
</p>


<br>


<p>
<b>💼 Plan</b>
</p>

<p>
<b>Plan :</b>
${application.plan_name || plan?.plan_name || "N/A"}
</p>

<p>
<b>Plan Price :</b>
Rs.
${Number(
  application.plan_price ||
  plan?.price ||
  0
).toLocaleString()}
</p>

<p>
<b>Discount :</b>
${Number(
  plan?.discount_percentage || 0
)}%
</p>

<p>
<b>Duration :</b>
${Number(
  plan?.duration_months || 6
)}
 Months
</p>


<br>


<p>
<b>📊 Monthly Profit :</b>
Rs.
${Number(
  application.monthly_profit || 0
).toLocaleString()}
</p>


<p>
<b>📅 Submitted :</b>
${new Date(
  application.submitted_at
).toLocaleString()}
</p>


<p>

<b>Status :</b>

<span
style="
color:${statusColor};
font-weight:bold;
">

${status.toUpperCase()}

</span>

</p>


${
  status === "rejected" &&
  application.rejection_reason
    ? `
      <p>
        <b>❌ Rejection Reason :</b>
        ${application.rejection_reason}
      </p>
    `
    : ""
}


<div style="
margin-top:18px;
display:flex;
gap:10px;
flex-wrap:wrap;
">


${
  status === "pending"
    ? `

<button
onclick="approveReseller('${application.id}')"
>

✅ Approve

</button>


<button
onclick="rejectReseller('${application.id}')"
>

❌ Reject

</button>

`
    : ""
}


</div>


</div>

`;

      });

    }


    html += `

</div>

</div>

</div>

`;


    contentBox.innerHTML =
      html;


  }

  catch (error) {

    console.error(
      "Reseller applications error:",
      error
    );

    showToast(
      "Failed To Load Reseller Applications",
      "#dc2626"
    );

  }

  finally {

    hideLoading();

  }

};


window.viewGarenaShellStock = async () => {

    closeSidebar();

    const contentBox =
        document.getElementById("contentBox");

    if (!contentBox) return;

    contentBox.innerHTML = `
        <div class="panel">

            <div class="panelHeader">
                <h2>📦 Stocks Garena Shell</h2>
            </div>

            <div class="panelBody">

                <div class="stock-management-card">

                    <div class="stock-title">
                        🔥 Garena Shell Stock
                    </div>

                    <div
                        id="currentGarenaShellStock"
                        class="stock-balance"
                    >
                        Loading...
                    </div>

                    <input
                        id="garenaShellStockInput"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Enter stock"
                    >

                    <button
                        onclick="updateGarenaShellStock()"
                    >
                        💾 Update Stock
                    </button>

                </div>

            </div>

        </div>
    `;

    await loadGarenaShellStock();
};

async function loadGarenaShellStock() {

    const { data, error } =
        await supabase
        .from("garena_shell_stock")
        .select("shell_balance")
        .eq("id", 1)
        .single();

    if (error) {

        console.error(
            "Garena Shell Stock Error:",
            error
        );

        return;
    }

    const balance =
        Number(data.shell_balance || 0);

    document.getElementById(
        "currentGarenaShellStock"
    ).textContent =
        balance.toLocaleString() + " Shells";

    document.getElementById(
        "garenaShellStockInput"
    ).value =
        balance;
}


window.updateGarenaShellStock = async () => {

    const input =
        document.getElementById(
            "garenaShellStockInput"
        );

    const balance =
        Number(input.value);

    if (
        !Number.isInteger(balance) ||
        balance < 0
    ) {

        showToast(
            "Enter a valid stock amount",
            "#dc2626"
        );

        return;
    }

    const { error } =
        await supabase
        .from("garena_shell_stock")
        .update({
            shell_balance: balance,
            updated_at: new Date().toISOString()
        })
        .eq("id", 1);

    if (error) {

        console.error(
            "Stock Update Error:",
            error
        );

        showToast(
            "Stock Update Failed",
            "#dc2626"
        );

        return;
    }

    showToast(
        "Garena Shell Stock Updated ✅"
    );

    await loadGarenaShellStock();
};

/* ===========================================
   PREMIUM APPROVE CONFIRMATION
=========================================== */

function showApproveConfirm() {

  return new Promise((resolve) => {

    // Remove old popup if exists
    document.getElementById("phoenixApprovePopup")?.remove();

    const popup = document.createElement("div");

    popup.id = "phoenixApprovePopup";

    popup.innerHTML = `

      <div class="phoenix-approve-overlay">

        <div class="phoenix-approve-box">

          <button
            class="phoenix-approve-close"
            id="approvePopupClose">

            ✕

          </button>


          <div class="phoenix-approve-icon">

            <i class="fa-solid fa-circle-check"></i>

          </div>


          <div class="phoenix-approve-title">

            Approve Application

          </div>


          <div class="phoenix-approve-subtitle">

            Reseller Application

          </div>


          <div class="phoenix-approve-message">

            Are you sure you want to approve
            this reseller application?

          </div>


          <div class="phoenix-approve-warning">

            <i class="fa-solid fa-shield-halved"></i>

            <span>
              This will activate the reseller
              membership and its benefits.
            </span>

          </div>


          <div class="phoenix-approve-actions">

            <button
              id="approvePopupCancel"
              class="phoenix-cancel-btn">

              Cancel

            </button>


            <button
              id="approvePopupConfirm"
              class="phoenix-confirm-btn">

              <i class="fa-solid fa-check"></i>

              Approve

            </button>

          </div>

        </div>

      </div>

    `;


    document.body.appendChild(popup);


    // =====================================
    // ADD STYLE
    // =====================================

    if (!document.getElementById("phoenixApproveStyle")) {

      const style =
        document.createElement("style");

      style.id =
        "phoenixApproveStyle";

      style.textContent = `

        .phoenix-approve-overlay {

          position: fixed;

          inset: 0;

          background:
            rgba(0, 0, 0, 0.78);

          backdrop-filter:
            blur(10px);

          -webkit-backdrop-filter:
            blur(10px);

          display: flex;

          align-items: center;

          justify-content: center;

          z-index: 999999;

          padding: 20px;

          animation:
            phoenixFadeIn .2s ease;

        }


        .phoenix-approve-box {

          width: min(420px, 100%);

          background:
            linear-gradient(
              145deg,
              #101b2d,
              #07111f
            );

          border:
            1px solid rgba(
              0,
              255,
              140,
              .25
            );

          border-radius: 24px;

          padding: 30px 24px 24px;

          text-align: center;

          position: relative;

          box-shadow:
            0 25px 80px
            rgba(0,0,0,.65),

            0 0 35px
            rgba(0,255,120,.12);

          animation:
            phoenixPopupIn .25s ease;

        }


        .phoenix-approve-close {

          position: absolute;

          top: 14px;

          right: 14px;

          width: 36px;

          height: 36px;

          border: none;

          border-radius: 50%;

          background:
            rgba(255,255,255,.08);

          color: #fff;

          font-size: 18px;

          cursor: pointer;

        }


        .phoenix-approve-close:hover {

          background:
            rgba(255,255,255,.16);

        }


        .phoenix-approve-icon {

          width: 76px;

          height: 76px;

          margin: 5px auto 18px;

          border-radius: 50%;

          display: flex;

          align-items: center;

          justify-content: center;

          background:
            rgba(34,197,94,.12);

          border:
            1px solid
            rgba(34,197,94,.35);

          box-shadow:
            0 0 30px
            rgba(34,197,94,.18);

        }


        .phoenix-approve-icon i {

          font-size: 38px;

          color: #22c55e;

        }


        .phoenix-approve-title {

          color: #fff;

          font-size: 23px;

          font-weight: 800;

          margin-bottom: 5px;

        }


        .phoenix-approve-subtitle {

          color: #22c55e;

          font-size: 13px;

          font-weight: 700;

          text-transform: uppercase;

          letter-spacing: 1px;

          margin-bottom: 18px;

        }


        .phoenix-approve-message {

          color: #d7deea;

          font-size: 15px;

          line-height: 1.6;

          margin-bottom: 18px;

        }


        .phoenix-approve-warning {

          display: flex;

          align-items: center;

          gap: 10px;

          text-align: left;

          padding: 13px;

          border-radius: 13px;

          background:
            rgba(34,197,94,.07);

          border:
            1px solid
            rgba(34,197,94,.15);

          color: #aeb9c9;

          font-size: 12px;

          line-height: 1.45;

          margin-bottom: 22px;

        }


        .phoenix-approve-warning i {

          color: #22c55e;

          font-size: 18px;

          flex-shrink: 0;

        }


        .phoenix-approve-actions {

          display: flex;

          gap: 12px;

        }


        .phoenix-cancel-btn,
        .phoenix-confirm-btn {

          flex: 1;

          height: 48px;

          border: none;

          border-radius: 13px;

          font-size: 14px;

          font-weight: 700;

          cursor: pointer;

          transition:
            .2s ease;

        }


        .phoenix-cancel-btn {

          background:
            rgba(255,255,255,.08);

          color: #dbe4f0;

          border:
            1px solid
            rgba(255,255,255,.08);

        }


        .phoenix-cancel-btn:hover {

          background:
            rgba(255,255,255,.14);

        }


        .phoenix-confirm-btn {

          background:
            linear-gradient(
              135deg,
              #22c55e,
              #16a34a
            );

          color: #fff;

          box-shadow:
            0 8px 22px
            rgba(34,197,94,.25);

        }


        .phoenix-confirm-btn:hover {

          transform:
            translateY(-1px);

          box-shadow:
            0 10px 28px
            rgba(34,197,94,.35);

        }


        @keyframes phoenixFadeIn {

          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }

        }


        @keyframes phoenixPopupIn {

          from {

            opacity: 0;

            transform:
              translateY(15px)
              scale(.96);

          }

          to {

            opacity: 1;

            transform:
              translateY(0)
              scale(1);

          }

        }


        @media (max-width: 480px) {

          .phoenix-approve-box {

            padding:
              28px 18px 18px;

            border-radius:
              20px;

          }

          .phoenix-approve-title {

            font-size: 21px;

          }

          .phoenix-approve-actions {

            gap: 9px;

          }

        }

      `;

      document.head.appendChild(style);

    }


    // =====================================
    // BUTTONS
    // =====================================

    const closePopup = (result) => {

      popup.remove();

      resolve(result);

    };


    document
      .getElementById("approvePopupClose")
      .onclick = () => {

        closePopup(false);

      };


    document
      .getElementById("approvePopupCancel")
      .onclick = () => {

        closePopup(false);

      };


    document
      .getElementById("approvePopupConfirm")
      .onclick = () => {

        closePopup(true);

      };


    // Click outside popup
    popup
      .querySelector(".phoenix-approve-overlay")
      .addEventListener("click", (event) => {

        if (
          event.target.classList.contains(
            "phoenix-approve-overlay"
          )
        ) {

          closePopup(false);

        }

      });

  });

}

/* ===========================================
   APPROVE RESELLER APPLICATION
=========================================== */

window.approveReseller = async (applicationId) => {

  const confirmApprove =
    await showApproveConfirm();

  if (!confirmApprove) {
    return;
  }

  showLoading();


  try {

    /* =========================================
       GET CURRENT ADMIN
    ========================================= */

    if (!currentAdmin) {

      throw new Error(
        "Admin session not found."
      );

    }


    /* =========================================
       GET APPLICATION
    ========================================= */

    const {
      data: application,
      error: applicationError
    } = await supabase
      .from("reseller_applications")
      .select("id,status")
      .eq("id", applicationId)
      .single();


    if (applicationError) {

      throw applicationError;

    }


    if (application.status !== "pending") {

      showToast(
        "This application is no longer pending.",
        "#f59e0b"
      );

      await viewResellerApplications();

      return;

    }


    /* =========================================
       APPROVAL EXPIRY
       6 MONTHS FROM NOW
    ========================================= */

    const expiresAt =
      new Date();

    expiresAt.setMonth(
      expiresAt.getMonth() + 6
    );


    /* =========================================
       UPDATE APPLICATION
    ========================================= */

    const {
      error: updateError
    } = await supabase
      .from("reseller_applications")
      .update({

        status:
          "approved",

        reviewed_at:
          new Date().toISOString(),

        reviewed_by:
          currentAdmin.id,

        rejection_reason:
          null,

        expires_at:
          expiresAt.toISOString()

      })
      .eq(
        "id",
        applicationId
      )
      .eq(
        "status",
        "pending"
      );


    if (updateError) {

      throw updateError;

    }


    /* =========================================
       SUCCESS
    ========================================= */

    showToast(
      "Reseller Application Approved ✅"
    );


    await viewResellerApplications();

  }

  catch (error) {

    console.error(
      "Approve reseller error:",
      error
    );

    showToast(
      "Approval Failed ❌",
      "#dc2626"
    );

  }

  finally {

    hideLoading();

  }

};

/* ===========================================
   OPEN REJECT RESELLER POPUP
=========================================== */

window.rejectReseller = (applicationId) => {

    const popup =
        document.getElementById("rejectResellerPopup");

    const input =
        document.getElementById("rejectReasonInput");

    if (!popup || !input) {

        console.error(
            "Reject popup not found."
        );

        return;
    }


    /* Save application ID */

    window.currentRejectApplicationId =
        applicationId;


    /* Clear old reason */

    input.value = "";


    /* Reset character count */

    const counter =
        document.getElementById("rejectCharCount");

    if (counter) {

        counter.textContent = "0";

    }


    /* Open popup */

    popup.classList.add("active");


    /* Focus input */

    setTimeout(() => {

        input.focus();

    }, 100);

};

/* ===========================================
   RESELLER REJECT POPUP
=========================================== */

window.closeRejectPopup = () => {

  const popup =
    document.getElementById(
      "rejectResellerPopup"
    );

  if (popup) {

    popup.classList.remove("active");

  }

  window.currentRejectApplicationId =
    null;

};


/* ===========================================
   CONFIRM REJECT
=========================================== */

window.confirmRejectReseller = async () => {

  const applicationId =
    window.currentRejectApplicationId;

  const input =
    document.getElementById(
      "rejectReasonInput"
    );

  const rejectionReason =
    input?.value.trim() || "";


  /* =========================================
     CHECK REASON
  ========================================= */

  if (!rejectionReason) {

    showToast(
      "Please enter a rejection reason.",
      "#dc2626"
    );

    input?.focus();

    return;

  }


  /* =========================================
     CLOSE POPUP
  ========================================= */

  closeRejectPopup();


  /* =========================================
     LOADING
  ========================================= */

  showLoading();


  try {

    /* =======================================
       CHECK ADMIN
    ======================================= */

    if (!currentAdmin) {

      throw new Error(
        "Admin session not found."
      );

    }


    /* =======================================
       GET APPLICATION
    ======================================= */

    const {
      data: application,
      error: applicationError
    } = await supabase

      .from("reseller_applications")

      .select("id,status")

      .eq("id", applicationId)

      .single();


    if (applicationError) {

      throw applicationError;

    }


    /* =======================================
       CHECK STATUS
    ======================================= */

    if (
      application.status !== "pending"
    ) {

      showToast(
        "This application is no longer pending.",
        "#f59e0b"
      );

      await viewResellerApplications();

      return;

    }


    /* =======================================
       REJECT APPLICATION
    ======================================= */

    const {
      error: updateError
    } = await supabase

      .from("reseller_applications")

      .update({

        status:
          "rejected",

        rejection_reason:
          rejectionReason,

        reviewed_at:
          new Date().toISOString(),

        reviewed_by:
          currentAdmin.id,

        expires_at:
          null

      })

      .eq(
        "id",
        applicationId
      )

      .eq(
        "status",
        "pending"
      );


    if (updateError) {

      throw updateError;

    }


    /* =======================================
       SUCCESS
    ======================================= */

    showToast(
      "Reseller Application Rejected ❌",
      "#dc2626"
    );


    await viewResellerApplications();

  }

  catch (error) {

    console.error(
      "Reject reseller error:",
      error
    );

    showToast(
      "Rejection Failed ❌",
      "#dc2626"
    );

  }

  finally {

    hideLoading();

  }

};


/* ===========================================
   REASON CHARACTER COUNT
=========================================== */

document.addEventListener(
  "input",
  (event) => {

    if (
      event.target.id !==
      "rejectReasonInput"
    ) {

      return;

    }


    const counter =
      document.getElementById(
        "rejectCharCount"
      );


    if (counter) {

      counter.textContent =
        event.target.value.length;

    }

  }
);

/* ===========================================
   PREMIUM REDEEM CODE GENERATOR
=========================================== */

window.viewRedeemCodes = async () => {

  closeSidebar();


  /* =========================================
     PREMIUM STYLE
  ========================================= */

  if (!document.getElementById("phoenixRedeemStyle")) {

    const style =
      document.createElement("style");

    style.id =
      "phoenixRedeemStyle";

    style.textContent = `

      .phoenix-redeem-wrapper {

        max-width: 720px;

        margin: 0 auto;

      }


      .phoenix-redeem-card {

        position: relative;

        overflow: hidden;

        padding: 30px;

        border-radius: 24px;

        background:
          linear-gradient(
            145deg,
            #101b2d,
            #07111f
          );

        border:
          1px solid
          rgba(255,255,255,.08);

        box-shadow:
          0 25px 70px
          rgba(0,0,0,.45);

      }


      .phoenix-redeem-card::before {

        content: "";

        position: absolute;

        width: 220px;

        height: 220px;

        top: -120px;

        right: -80px;

        background:
          rgba(99,102,241,.18);

        filter:
          blur(50px);

        border-radius: 50%;

      }


      .phoenix-redeem-header {

        position: relative;

        display: flex;

        align-items: center;

        gap: 16px;

        margin-bottom: 28px;

      }


      .phoenix-redeem-icon {

        width: 58px;

        height: 58px;

        border-radius: 17px;

        display: flex;

        align-items: center;

        justify-content: center;

        background:
          linear-gradient(
            135deg,
            #6366f1,
            #8b5cf6
          );

        box-shadow:
          0 10px 30px
          rgba(99,102,241,.3);

        font-size: 27px;

      }


      .phoenix-redeem-header h2 {

        margin: 0;

        color: #fff;

        font-size: 23px;

        font-weight: 800;

      }


      .phoenix-redeem-header p {

        margin: 5px 0 0;

        color: #94a3b8;

        font-size: 13px;

      }


      .phoenix-redeem-label {

        display: block;

        margin-bottom: 9px;

        color: #cbd5e1;

        font-size: 13px;

        font-weight: 700;

      }


      .phoenix-redeem-input {

        width: 100%;

        box-sizing: border-box;

        height: 54px;

        padding: 0 17px;

        border-radius: 14px;

        border:
          1px solid
          rgba(255,255,255,.1);

        background:
          rgba(255,255,255,.05);

        color: #fff;

        font-size: 16px;

        outline: none;

        transition: .2s ease;

      }


      .phoenix-redeem-input::placeholder {

        color: #64748b;

      }


      .phoenix-redeem-input:focus {

        border-color:
          rgba(99,102,241,.8);

        box-shadow:
          0 0 0 4px
          rgba(99,102,241,.12);

      }


      .phoenix-redeem-generate {

        width: 100%;

        height: 54px;

        margin-top: 18px;

        border: none;

        border-radius: 14px;

        background:
          linear-gradient(
            135deg,
            #6366f1,
            #8b5cf6
          );

        color: #fff;

        font-size: 15px;

        font-weight: 800;

        cursor: pointer;

        transition: .2s ease;

        box-shadow:
          0 10px 28px
          rgba(99,102,241,.25);

      }


      .phoenix-redeem-generate:hover {

        transform:
          translateY(-2px);

        box-shadow:
          0 14px 35px
          rgba(99,102,241,.35);

      }


      .phoenix-redeem-result {

        margin-top: 24px;

      }


      .phoenix-generated-code {

        position: relative;

        padding: 22px;

        border-radius: 18px;

        background:
          linear-gradient(
            145deg,
            rgba(34,197,94,.08),
            rgba(15,23,42,.8)
          );

        border:
          1px solid
          rgba(34,197,94,.2);

      }


      .phoenix-generated-label {

        color: #94a3b8;

        font-size: 12px;

        font-weight: 700;

        text-transform: uppercase;

        letter-spacing: 1px;

      }


      .phoenix-generated-amount {

        margin-top: 5px;

        color: #22c55e;

        font-size: 24px;

        font-weight: 900;

      }


      .phoenix-code-row {

        display: flex;

        align-items: center;

        gap: 10px;

        margin-top: 18px;

      }


      .phoenix-code {

        flex: 1;

        min-width: 0;

        padding: 14px;

        border-radius: 12px;

        background:
          rgba(0,0,0,.3);

        color: #fff;

        font-size: 16px;

        font-weight: 800;

        letter-spacing: 1.5px;

        text-align: center;

        word-break: break-all;

      }


      .phoenix-copy-btn {

        height: 48px;

        padding: 0 16px;

        border: none;

        border-radius: 12px;

        background:
          rgba(255,255,255,.08);

        border:
          1px solid
          rgba(255,255,255,.08);

        color: #fff;

        font-weight: 700;

        cursor: pointer;

        white-space: nowrap;

        transition: .2s ease;

      }


      .phoenix-copy-btn:hover {

        background:
          rgba(255,255,255,.15);

      }


      .phoenix-redeem-info {

        display: flex;

        align-items: center;

        gap: 10px;

        margin-top: 20px;

        padding: 13px;

        border-radius: 12px;

        background:
          rgba(99,102,241,.07);

        border:
          1px solid
          rgba(99,102,241,.12);

        color: #94a3b8;

        font-size: 12px;

        line-height: 1.5;

      }


      .phoenix-redeem-info span {

        font-size: 18px;

      }


      @media (max-width: 600px) {

        .phoenix-redeem-card {

          padding: 22px 16px;

          border-radius: 20px;

        }


        .phoenix-redeem-header h2 {

          font-size: 20px;

        }


        .phoenix-code-row {

          flex-direction: column;

          align-items: stretch;

        }


        .phoenix-copy-btn {

          width: 100%;

        }

      }

    `;

    document.head.appendChild(style);

  }


  /* =========================================
     PREMIUM UI
  ========================================= */

  contentBox.innerHTML = `

    <div class="panel">

      <div class="panelHeader">

        <h2>
          🎟️ Redeem Codes
        </h2>

      </div>


      <div class="panelBody">

        <div class="phoenix-redeem-wrapper">

          <div class="phoenix-redeem-card">


            <div class="phoenix-redeem-header">

              <div class="phoenix-redeem-icon">

                🎟️

              </div>


              <div>

                <h2>
                  Generate Redeem Code
                </h2>

                <p>
                  Create a wallet credit code for your users.
                </p>

              </div>

            </div>


            <label
              class="phoenix-redeem-label"
              for="redeemAmount"
            >

              💰 Redeem Amount

            </label>


            <input
              type="number"
              id="redeemAmount"
              class="phoenix-redeem-input"
              placeholder="Enter amount (Rs.)"
              min="1"
              step="1"
            >


            <button
              class="phoenix-redeem-generate"
              onclick="generateRedeemCode()"
            >

              <i class="fa-solid fa-ticket"></i>

              &nbsp;

              Generate Redeem Code

            </button>


            <div
              id="generatedRedeemCode"
              class="phoenix-redeem-result"
            ></div>


            <div class="phoenix-redeem-info">

              <span>🛡️</span>

              <div>

                Each generated code can be redeemed
                according to its available balance.

              </div>

            </div>


          </div>

        </div>

      </div>

    </div>

  `;

};

/* ===========================================
   GENERATE REDEEM CODE
=========================================== */

window.generateRedeemCode = async () => {

  const amountInput =
    document.getElementById("redeemAmount");

  const resultBox =
    document.getElementById("generatedRedeemCode");

  const amount =
    Number(amountInput?.value || 0);


  /* =========================================
     VALIDATE
  ========================================= */

  if (!amount || amount <= 0) {

    showToast(
      "Please enter a valid amount.",
      "#dc2626"
    );

    amountInput?.focus();

    return;
  }


  if (!currentAdmin) {

    showToast(
      "Admin session not found.",
      "#dc2626"
    );

    return;
  }


  /* =========================================
     GENERATE UNIQUE CODE
  ========================================= */

  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "PNX-";

  for (let i = 0; i < 12; i++) {

    code += characters.charAt(
      Math.floor(
        Math.random() * characters.length
      )
    );

  }


  /* =========================================
     SAVE TO SUPABASE
  ========================================= */

  const {
    data,
    error
  } = await supabase
    .from("redeem_codes")
    .insert({

      code: code,

      amount: amount,

      status: "unused",

      created_by: currentAdmin.id

    })
    .select()
    .single();


  if (error) {

    console.error(
      "Redeem code generation error:",
      error
    );

    showToast(
      "Failed to generate redeem code ❌",
      "#dc2626"
    );

    return;
  }


  /* =========================================
     SHOW GENERATED CODE
  ========================================= */

  resultBox.innerHTML = `

    <div class="phoenix-generated-code">

      <div class="phoenix-generated-label">
        Redeem Amount
      </div>

      <div class="phoenix-generated-amount">
        Rs. ${Number(data.amount).toFixed(2)}
      </div>


      <div class="phoenix-code-row">

        <div class="phoenix-code">
          ${data.code}
        </div>

        <button
          class="phoenix-copy-btn"
          onclick="copyRedeemCode('${data.code}')"
        >

          📋 Copy

        </button>

      </div>

    </div>

  `;


  amountInput.value = "";


  showToast(
    "Redeem Code Generated ✅"
  );

};


/* ===========================================
   COPY REDEEM CODE
=========================================== */

window.copyRedeemCode = async (code) => {

  try {

    await navigator.clipboard.writeText(code);

    showToast(
      "Redeem Code Copied ✅"
    );

  }

  catch (error) {

    console.error(
      "Copy failed:",
      error
    );

    showToast(
      "Copy Failed ❌",
      "#dc2626"
    );

  }

};

/* ===========================================
   RESELLER PLANS MANAGEMENT
=========================================== */

window.viewResellerPlans = async () => {

  closeSidebar();

  showLoading();

  try {

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
        reward_percentage
      `)
      .order("id", {
        ascending: true
      });

    if (error) throw error;


    let html = `

<div class="panel">

  <div class="panelHeader">

    <h2>
      ⚙️ Reseller Plans
    </h2>

  </div>


  <div class="panelBody">

    <div class="reseller-plans-grid">

`;


    if (!plans || plans.length === 0) {

      html += `

<div class="statCard">

  <div class="icon">
    ❌
  </div>

  <div class="info">

    <h4>
      No Reseller Plans Found
    </h4>

    <h2>
      0
    </h2>

  </div>

</div>

`;

    } else {

      plans.forEach(plan => {

        html += `

<div class="card reseller-plan-admin-card">

  <div class="reseller-plan-title">

    <h3>
      🤝 ${plan.plan_name}
    </h3>

  </div>


  <p>

    <b>💰 Price :</b>

    Rs.
    ${Number(
      plan.price || 0
    ).toLocaleString()}

  </p>


  <p>

    <b>📅 Duration :</b>

    ${Number(
      plan.duration_months || 0
    )}

    Months

  </p>


  <p>

    <b>🎁 Reward :</b>

    ${Number(
      plan.reward_percentage || 0
    )}%

  </p>


  <div class="discount-editor">

    <label>
      🏷️ Discount Percentage
    </label>


    <div class="discount-input-row">

      <input
        type="number"
        id="discount-${plan.id}"
        value="${Number(
          plan.discount_percentage || 0
        )}"
        min="0"
        max="100"
        step="0.01"
      >

      <span>
        %
      </span>

    </div>


    <button
      onclick="saveResellerDiscount('${plan.id}')"
    >

      💾 Save Discount

    </button>

  </div>

</div>

`;

      });

    }


    html += `

    </div>

  </div>

</div>

`;

    contentBox.innerHTML = html;


    /* =========================================
       PREMIUM DESIGN
    ========================================= */

    if (
      !document.getElementById(
        "phoenixResellerPlansStyle"
      )
    ) {

      const style =
        document.createElement("style");

      style.id =
        "phoenixResellerPlansStyle";

      style.textContent = `

        .reseller-plans-grid {

          display: grid;

          grid-template-columns:
            repeat(
              auto-fit,
              minmax(260px, 1fr)
            );

          gap: 18px;

        }


        .reseller-plan-admin-card {

          position: relative;

          overflow: hidden;

          padding: 22px;

          border-radius: 20px;

          background:
            linear-gradient(
              145deg,
              #101b2d,
              #07111f
            );

          border:
            1px solid
            rgba(99,102,241,.18);

          box-shadow:
            0 15px 40px
            rgba(0,0,0,.35);

          transition:
            .25s ease;

        }


        .reseller-plan-admin-card:hover {

          transform:
            translateY(-4px);

          border-color:
            rgba(99,102,241,.45);

          box-shadow:
            0 18px 45px
            rgba(99,102,241,.12);

        }


        .reseller-plan-title {

          margin-bottom: 18px;

        }


        .reseller-plan-title h3 {

          margin: 0;

          color: #fff;

          font-size: 20px;

          font-weight: 800;

        }


        .reseller-plan-admin-card p {

          color: #cbd5e1;

          font-size: 14px;

          margin:
            10px 0;

        }


        .discount-editor {

          margin-top: 20px;

          padding-top: 18px;

          border-top:
            1px solid
            rgba(255,255,255,.08);

        }


        .discount-editor label {

          display: block;

          color: #94a3b8;

          font-size: 13px;

          font-weight: 700;

          margin-bottom: 9px;

        }


        .discount-input-row {

          display: flex;

          align-items: center;

          gap: 8px;

        }


        .discount-input-row input {

          flex: 1;

          min-width: 0;

          height: 48px;

          padding:
            0 14px;

          border-radius: 12px;

          border:
            1px solid
            rgba(255,255,255,.1);

          background:
            rgba(255,255,255,.05);

          color: #fff;

          font-size: 16px;

          font-weight: 700;

          outline: none;

        }


        .discount-input-row input:focus {

          border-color:
            #6366f1;

          box-shadow:
            0 0 0 3px
            rgba(99,102,241,.12);

        }


        .discount-input-row span {

          color: #8b5cf6;

          font-size: 20px;

          font-weight: 800;

        }


        .discount-editor button {

          width: 100%;

          height: 46px;

          margin-top: 12px;

          border: none;

          border-radius: 12px;

          background:
            linear-gradient(
              135deg,
              #6366f1,
              #8b5cf6
            );

          color: #fff;

          font-size: 14px;

          font-weight: 800;

          cursor: pointer;

          transition: .2s ease;

        }


        .discount-editor button:hover {

          transform:
            translateY(-1px);

          box-shadow:
            0 8px 20px
            rgba(99,102,241,.25);

        }


        @media(max-width:600px) {

          .reseller-plans-grid {

            grid-template-columns:
              1fr;

          }

        }

      `;

      document.head.appendChild(style);

    }

  }

  catch (error) {

    console.error(
      "Reseller plans error:",
      error
    );

    showToast(
      "Failed To Load Reseller Plans ❌",
      "#dc2626"
    );

  }

  finally {

    hideLoading();

  }

};


/* ===========================================
   SAVE RESELLER DISCOUNT
=========================================== */

window.saveResellerDiscount = async (planId) => {

  const input =
    document.getElementById(
      `discount-${planId}`
    );


  if (!input) {

    showToast(
      "Discount input not found ❌",
      "#dc2626"
    );

    return;

  }


  const discount =
    Number(input.value);


  /* =========================================
     VALIDATION
  ========================================= */

  if (
    Number.isNaN(discount) ||
    discount < 0 ||
    discount > 100
  ) {

    showToast(
      "Discount must be between 0% and 100%.",
      "#dc2626"
    );

    input.focus();

    return;

  }


  if (!currentAdmin) {

    showToast(
      "Admin session not found.",
      "#dc2626"
    );

    return;

  }


  showLoading();


  try {

    /* =======================================
       UPDATE SUPABASE
    ======================================= */

    const {
      error
    } = await supabase
      .from("reseller_plans")
      .update({

        discount_percentage:
          discount

      })
      .eq(
        "id",
        planId
      );


    if (error) {

      throw error;

    }


    /* =======================================
       SUCCESS
    ======================================= */

    showToast(
      "Discount Updated Successfully ✅"
    );


    await viewResellerPlans();

  }

  catch (error) {

    console.error(
      "Discount update error:",
      error
    );

    showToast(
      "Discount Update Failed ❌",
      "#dc2626"
    );

  }

  finally {

    hideLoading();

  }

};

window.viewCodMobileProducts = async () => {

    closeSidebar();

    const contentBox =
        document.getElementById("contentBox");

    if (!contentBox) return;

    contentBox.innerHTML = `
        <div class="panel">

            <div class="panelHeader">
                <h2>🎯 Call of Duty: Mobile</h2>
            </div>

            <div class="panelBody">

                <div id="codMobileAdminProducts">
                    Loading...
                </div>

            </div>

        </div>
    `;

    await loadCodMobileAdminProducts();
};

window.viewDeltaForceProducts = async () => {

    closeSidebar();

    const contentBox =
        document.getElementById("contentBox");

    if (!contentBox) return;

    contentBox.innerHTML = `
        <div class="panel">

            <div class="panelHeader">
                <h2>🎯 Delta Force</h2>
            </div>

            <div class="panelBody">

                <div id="deltaForceAdminProducts">
                    Loading...
                </div>

            </div>

        </div>
    `;

    await loadDeltaForceAdminProducts();
};

async function loadCodMobileAdminProducts() {

    const container =
        document.getElementById(
            "codMobileAdminProducts"
        );

    if (!container) return;

    const {
        data,
        error
    } = await supabase
        .from("cod_mobile_products")
        .select("*")
        .order("sort_order", {
            ascending: true
        });

    if (error) {

        console.error(error);

        container.innerHTML = `
            <p style="color:#ef4444;">
                Failed to load COD Mobile products.
            </p>
        `;

        return;
    }

    if (!data || data.length === 0) {

        container.innerHTML = `
            <p>No COD Mobile products found.</p>
        `;

        return;
    }


    /* =========================================
       GET CURRENT GARENA SHELL STOCK
    ========================================= */

    const {
        data: stockData,
        error: stockError
    } = await supabase
        .from("garena_shell_stock")
        .select("shell_balance")
        .eq("id", 1)
        .single();

    if (stockError) {

        console.error(
            "Garena Shell Stock Error:",
            stockError
        );

    }


    const shellBalance =
        Number(
            stockData?.shell_balance || 0
        );


    /* =========================================
       RENDER PRODUCTS
    ========================================= */

    container.innerHTML = "";

    data.forEach(product => {


        const shellCost =
            Number(
                product.garena_shell_cost || 0
            );


        /*
         * How many units can be sold
         * with current Garena Shell stock
         */

        const available =
            shellCost > 0
                ? Math.floor(
                    shellBalance / shellCost
                )
                : 0;


        /* =====================================
           AUTOMATIC STOCK STATUS
        ===================================== */

        let stockHTML = "";


        if (shellCost <= 0) {

            stockHTML = `
                <div class="cod-stock-status stock-warning">
                    ⚠️ Shell Cost Not Set
                </div>
            `;

        } else if (
            shellBalance >= shellCost
        ) {

            stockHTML = `
                <div class="cod-stock-status stock-in">
                    🟢 In Stock
                    <span>
                        ${available.toLocaleString()}
                        Available
                    </span>
                </div>
            `;

        } else {

            stockHTML = `
                <div class="cod-stock-status stock-out">
                    🔴 Out of Stock
                </div>
            `;

        }


        /* =====================================
           CREATE CARD
        ===================================== */

        const card =
            document.createElement("div");

        card.className =
            "cod-admin-card";


        card.innerHTML = `

            <div class="cod-admin-info">

                <h3>
                    🎯 ${Number(
                        product.cp_amount || 0
                    ).toLocaleString()} CP
                </h3>

                <span>
                    Product ID: ${product.id}
                </span>

            </div>


            <!-- PRICE -->

            <div class="cod-admin-control">

                <label>
                    Price
                </label>

                <input
                    type="number"
                    min="0"
                    step="0.01"
                    id="cod-price-${product.id}"
                    value="${Number(
                        product.price || 0
                    )}"
                >

            </div>


            <!-- GARENA SHELL COST -->

            <div class="cod-admin-control">

                <label>
                    🔥 Garena Shell Cost
                </label>

                <input
                    type="number"
                    min="0"
                    step="1"
                    id="cod-shell-${product.id}"
                    value="${shellCost}"
                >

            </div>


            <!-- AUTOMATIC STOCK -->

            <div class="cod-admin-control">

                <label>
                    Stock Status
                </label>

                ${stockHTML}

            </div>


            <!-- PRODUCT STATUS -->

            <div class="cod-admin-control">

                <label>
                    Product Status
                </label>

                <select
                    id="cod-active-${product.id}"
                >

                    <option
                        value="true"
                        ${
                            product.active === true
                                ? "selected"
                                : ""
                        }
                    >
                        🟢 Active
                    </option>

                    <option
                        value="false"
                        ${
                            product.active !== true
                                ? "selected"
                                : ""
                        }
                    >
                        🔴 Inactive
                    </option>

                </select>

            </div>


            <!-- SAVE -->

            <button
                class="admin-btn"
                onclick="
                    saveCodMobileProduct(
                        '${product.id}'
                    )
                "
            >

                💾 Save Changes

            </button>

        `;


        container.appendChild(card);

    });

}


async function loadDeltaForceAdminProducts() {

    const container =
        document.getElementById(
            "deltaForceAdminProducts"
        );

    if (!container) return;


    // =========================================
    // LOAD DELTA FORCE PRODUCTS
    // =========================================

    const {
        data,
        error
    } = await supabase
        .from("delta_force_products")
        .select("*")
        .order("sort_order", {
            ascending: true
        });


    if (error) {

        console.error(
            "Delta Force products error:",
            error
        );

        container.innerHTML = `
            <p style="color:#ef4444;">
                Failed to load Delta Force products.
            </p>
        `;

        return;
    }


    if (!data || data.length === 0) {

        container.innerHTML = `
            <p>
                No Delta Force products found.
            </p>
        `;

        return;
    }


    // =========================================
    // GET GARENA SHELL STOCK
    // =========================================

    const {
        data: stockData,
        error: stockError
    } = await supabase
        .from("garena_shell_stock")
        .select("shell_balance")
        .eq("id", 1)
        .single();


    if (stockError) {

        console.error(
            "Garena Shell Stock Error:",
            stockError
        );

    }


    const shellBalance =
        Number(
            stockData?.shell_balance || 0
        );


    // =========================================
    // RENDER
    // =========================================

    container.innerHTML = "";


    data.forEach(product => {

        const shellCost =
            Number(
                product.garena_shell_cost || 0
            );


        // How many can be sold
        const available =
            shellCost > 0
                ? Math.floor(
                    shellBalance / shellCost
                )
                : 0;


        // =====================================
        // AUTOMATIC STOCK STATUS
        // =====================================

        let stockHTML = "";


        if (shellCost <= 0) {

            stockHTML = `
                <div class="cod-stock-status stock-warning">
                    ⚠️ Shell Cost Not Set
                </div>
            `;

        }

        else if (shellBalance >= shellCost) {

            stockHTML = `
                <div class="cod-stock-status stock-in">
                    🟢 In Stock
                    <span>
                        ${available.toLocaleString()}
                        Available
                    </span>
                </div>
            `;

        }

        else {

            stockHTML = `
                <div class="cod-stock-status stock-out">
                    🔴 Out of Stock
                </div>
            `;

        }


        // =====================================
        // CARD
        // =====================================

        const card =
            document.createElement("div");

        card.className =
            "cod-admin-card";


        card.innerHTML = `

            <div class="cod-admin-info">

                <h3>
                    🎯 ${Number(
                        product.point_amount || 0
                    ).toLocaleString()} Points
                </h3>

                <span>
                    Product ID: ${product.id}
                </span>

            </div>


            <!-- PRICE -->

            <div class="cod-admin-control">

                <label>
                    Price
                </label>

                <input
                    type="number"
                    min="0"
                    step="0.01"
                    id="delta-price-${product.id}"
                    value="${Number(
                        product.price || 0
                    )}"
                >

            </div>


            <!-- GARENA SHELL COST -->

            <div class="cod-admin-control">

                <label>
                    🔥 Garena Shell Cost
                </label>

                <input
                    type="number"
                    min="0"
                    step="1"
                    id="delta-shell-${product.id}"
                    value="${shellCost}"
                >

            </div>


            <!-- AUTOMATIC STOCK -->

            <div class="cod-admin-control">

                <label>
                    Stock Status
                </label>

                ${stockHTML}

            </div>


            <!-- PRODUCT STATUS -->

            <div class="cod-admin-control">

                <label>
                    Product Status
                </label>

                <select
                    id="delta-active-${product.id}"
                >

                    <option
                        value="true"
                        ${
                            product.active === true
                                ? "selected"
                                : ""
                        }
                    >
                        🟢 Active
                    </option>

                    <option
                        value="false"
                        ${
                            product.active !== true
                                ? "selected"
                                : ""
                        }
                    >
                        🔴 Inactive
                    </option>

                </select>

            </div>


            <!-- SAVE -->

            <button
                class="admin-btn"
                onclick="
                    saveDeltaForceProduct(
                        '${product.id}'
                    )
                "
            >

                💾 Save Changes

            </button>

        `;


        container.appendChild(card);

    });

}

window.saveCodMobileProduct = async (
    productId
) => {

    const priceInput =
        document.getElementById(
            `cod-price-${productId}`
        );

    const shellInput =
        document.getElementById(
            `cod-shell-${productId}`
        );

    const activeInput =
        document.getElementById(
            `cod-active-${productId}`
        );


    // =====================================
    // GET VALUES
    // =====================================

    const price =
        Number(
            priceInput?.value
        );

    const shellCost =
        Number(
            shellInput?.value
        );

    const active =
        activeInput?.value === "true";


    // =====================================
    // VALIDATE PRICE
    // =====================================

    if (
        !Number.isFinite(price) ||
        price < 0
    ) {

        showToast(
            "Please enter a valid price.",
            "#ef4444"
        );

        return;

    }


    // =====================================
    // VALIDATE GARENA SHELL COST
    // =====================================

    if (
        !Number.isInteger(shellCost) ||
        shellCost < 0
    ) {

        showToast(
            "Please enter a valid Garena Shell Cost.",
            "#ef4444"
        );

        return;

    }


    try {

        // =================================
        // UPDATE DATABASE
        // =================================

        const {
            error
        } = await supabase
            .from("cod_mobile_products")
            .update({

                price:
                    price,

                garena_shell_cost:
                    shellCost,

                active:
                    active

            })
            .eq(
                "id",
                productId
            );


        if (error) {

            throw error;

        }


        // =================================
        // SUCCESS
        // =================================

        showToast(
            "COD Mobile product updated successfully. ✅",
            "#22c55e"
        );


        // Reload products
        await loadCodMobileAdminProducts();


    }
    catch (error) {

        console.error(
            "COD Mobile update error:",
            error
        );


        showToast(
            "Failed to update product.",
            "#ef4444"
        );

    }

};

window.saveDeltaForceProduct = async (productId) => {

    const priceInput =
        document.getElementById(
            `delta-price-${productId}`
        );

    const shellInput =
        document.getElementById(
            `delta-shell-${productId}`
        );

    const activeInput =
        document.getElementById(
            `delta-active-${productId}`
        );


    // =====================================
    // GET VALUES
    // =====================================

    const price =
        Number(
            priceInput?.value
        );

    const shellCost =
        Number(
            shellInput?.value
        );

    const active =
        activeInput?.value === "true";


    // =====================================
    // VALIDATE PRICE
    // =====================================

    if (
        !Number.isFinite(price) ||
        price < 0
    ) {

        showToast(
            "Please enter a valid price.",
            "#ef4444"
        );

        return;
    }


    // =====================================
    // VALIDATE SHELL COST
    // =====================================

    if (
        !Number.isInteger(shellCost) ||
        shellCost < 0
    ) {

        showToast(
            "Please enter a valid Garena Shell Cost.",
            "#ef4444"
        );

        return;
    }


    try {

        // =================================
        // UPDATE THROUGH RPC
        // =================================

        const {
            data,
            error
        } = await supabase.rpc(
            "admin_update_delta_force_product",
            {
                p_product_id: Number(productId),
                p_price: price,
                p_shell_cost: shellCost,
                p_active: active
            }
        );


        if (error) {
            throw error;
        }


        if (!data?.success) {

            throw new Error(
                data?.message ||
                "Unable to update Delta Force product."
            );
        }


        // =================================
        // SUCCESS
        // =================================

        showToast(
            "Delta Force product updated successfully. ✅",
            "#22c55e"
        );


        // Reload
        await loadDeltaForceAdminProducts();


    } catch (error) {

        console.error(
            "Delta Force update error:",
            error
        );


        showToast(
            error.message ||
            "Failed to update Delta Force product.",
            "#ef4444"
        );
    }

};

/* ===========================================
   PHOENIX STORE - REVIEWS MANAGEMENT
=========================================== */

function escapeReviewHTML(value = "") {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* ===========================================
   REVIEW STARS
=========================================== */

function reviewStars(rating) {

  const value = Math.max(
    0,
    Math.min(5, Number(rating) || 0)
  );

  return "★".repeat(value) +
         "☆".repeat(5 - value);

}


/* ===========================================
   VIEW REVIEWS
=========================================== */

window.viewReviews = async function () {

  console.log("⭐ REVIEWS BUTTON CLICKED");

  try {

    if (typeof closeSidebar === "function") {
      closeSidebar();
    }


    const box =
      document.getElementById("contentBox");


    if (!box) {

      console.error(
        "❌ contentBox not found"
      );

      return;
    }


    /* ---------------------------------------
       SHOW LOADING
    --------------------------------------- */

    box.innerHTML = `

      <div class="panel">

        <div class="panelHeader">

          <h2>
            ⭐ Customer Reviews
          </h2>

        </div>

        <div class="panelBody">

          <div style="
            padding:40px;
            text-align:center;
          ">

            <div style="
              font-size:35px;
              margin-bottom:10px;
            ">
              ⭐
            </div>

            <p>
              Loading reviews...
            </p>

          </div>

        </div>

      </div>

    `;


    /* ---------------------------------------
       CHECK SESSION
    --------------------------------------- */

    const {
      data: {
        session
      },
      error: sessionError
    } =
      await supabase.auth.getSession();


    if (
      sessionError ||
      !session
    ) {

      box.innerHTML = `

        <div class="panel">

          <div class="panelBody">

            <div class="review-admin-empty error">

              <div class="review-admin-empty-icon">
                🔐
              </div>

              <h3>
                Admin Session Expired
              </h3>

              <p>
                Please login again.
              </p>

            </div>

          </div>

        </div>

      `;

      return;
    }


    console.log(
      "ADMIN USER:",
      session.user.id
    );


    /* ---------------------------------------
       VERIFY ADMIN
    --------------------------------------- */

    const {
      data: admin,
      error: adminError
    } =
      await supabase
        .from("admin_users")
        .select("id")
        .eq(
          "id",
          session.user.id
        )
        .maybeSingle();


    if (
      adminError ||
      !admin
    ) {

      console.error(
        "Admin verification failed:",
        adminError
      );

      box.innerHTML = `

        <div class="panel">

          <div class="panelBody">

            <div class="review-admin-empty error">

              <div class="review-admin-empty-icon">
                🔐
              </div>

              <h3>
                Admin Access Required
              </h3>

              <p>
                Your account is not registered
                as an administrator.
              </p>

            </div>

          </div>

        </div>

      `;

      return;
    }


    /* ---------------------------------------
       LOAD REVIEWS
    --------------------------------------- */

    const {
      data: reviews,
      error
    } =
      await supabase
        .from("reviews")
        .select(`
          id,
          user_id,
          customer_name,
          customer_avatar,
          rating,
          review_text,
          status,
          created_at,
          updated_at
        `)
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {

      console.error(
        "❌ Reviews loading error:",
        error
      );

      box.innerHTML = `

        <div class="panel">

          <div class="panelHeader">

            <h2>
              ⭐ Customer Reviews
            </h2>

          </div>

          <div class="panelBody">

            <div class="review-admin-empty error">

              <div class="review-admin-empty-icon">
                ⚠️
              </div>

              <h3>
                Unable to Load Reviews
              </h3>

              <p>
                ${escapeReviewHTML(
                  error.message
                )}
              </p>

            </div>

          </div>

        </div>

      `;

      return;
    }


    console.log(
      "✅ REVIEWS LOADED:",
      reviews
    );


    /* ---------------------------------------
       COUNTS
    --------------------------------------- */

    const pending =
      reviews.filter(
        r =>
          String(r.status)
            .toLowerCase() === "pending"
      ).length;


    const approved =
      reviews.filter(
        r =>
          String(r.status)
            .toLowerCase() === "approved"
      ).length;


    const rejected =
      reviews.filter(
        r =>
          String(r.status)
            .toLowerCase() === "rejected"
      ).length;


    /* ---------------------------------------
       HEADER
    --------------------------------------- */

    let html = `

      <div class="panel reviews-admin-panel">

        <div class="panelHeader reviews-admin-header">

          <div>

            <h2>
              ⭐ Customer Reviews
            </h2>

            <p>
              Manage customer feedback
            </p>

          </div>

          <div class="reviews-admin-count">

            ${reviews.length} Reviews

          </div>

        </div>


        <div class="panelBody">


          <div style="
            display:flex;
            gap:10px;
            flex-wrap:wrap;
            margin-bottom:20px;
          ">

            <span class="review-status pending">
              ⏳ Pending: ${pending}
            </span>

            <span class="review-status approved">
              ✅ Approved: ${approved}
            </span>

            <span class="review-status rejected">
              ❌ Rejected: ${rejected}
            </span>

          </div>


          <div class="reviews-admin-list">

    `;


    /* ---------------------------------------
       NO REVIEWS
    --------------------------------------- */

    if (!reviews.length) {

      html += `

        <div class="review-admin-empty">

          <div class="review-admin-empty-icon">
            ⭐
          </div>

          <h3>
            No Reviews Yet
          </h3>

          <p>
            Customer reviews will appear here
            after submission.
          </p>

        </div>

      `;

    }


    /* ---------------------------------------
       REVIEW CARDS
    --------------------------------------- */

    reviews.forEach(
      review => {

        const status =
          String(
            review.status ||
            "pending"
          ).toLowerCase();


        const name =
          escapeReviewHTML(
            review.customer_name ||
            "Customer"
          );


        const text =
          escapeReviewHTML(
            review.review_text ||
            ""
          );


        const avatar =
          escapeReviewHTML(
            review.customer_avatar ||
            ""
          );


        const date =
          review.created_at
            ? new Date(
                review.created_at
              ).toLocaleString()
            : "Unknown date";


        const stars =
          reviewStars(
            review.rating
          );


        html += `

          <div class="review-admin-card">


            <div class="review-admin-top">


              <div class="review-admin-customer">


                <div class="review-admin-avatar">

                </div>


                <div>

                  <h3>
                    ${name}
                  </h3>

                  <p>
                    ${date}
                  </p>

                </div>


              </div>


              <span class="
                review-status-badge
                ${status}
              ">

                ${status.toUpperCase()}

              </span>


            </div>


            <div class="review-admin-rating">

              <span>
                ${stars}
              </span>

              <span>
                ${Number(
                  review.rating || 0
                )}/5
              </span>

            </div>


            <div class="review-admin-text">

              <span class="review-quote">
                “
              </span>

              <p>
                ${text}
              </p>

            </div>


            <div class="review-admin-actions">


              ${
                status === "pending"

                ? `

                  <button
                    class="review-approve-btn"
                    onclick="
                      updateReviewStatus(
                        '${review.id}',
                        'approved'
                      )
                    "
                  >

                    ✓ Approve

                  </button>


                  <button
                    class="review-reject-btn"
                    onclick="
                      updateReviewStatus(
                        '${review.id}',
                        'rejected'
                      )
                    "
                  >

                    ✕ Reject

                  </button>

                `

                : status === "approved"

                  ? `

                    <span class="review-admin-note">

                      ✓ Review approved

                    </span>

                  `

                  : `

                    <span class="review-admin-note">

                      ✕ Review rejected

                    </span>

                  `
              }


            </div>


          </div>

        `;

      }
    );


    html += `

          </div>

        </div>

      </div>

    `;


    box.innerHTML = html;


  } catch (error) {

    console.error(
      "❌ VIEW REVIEWS ERROR:",
      error
    );


    const box =
      document.getElementById(
        "contentBox"
      );


    if (box) {

      box.innerHTML = `

        <div class="panel">

          <div class="panelBody">

            <div class="review-admin-empty error">

              <div class="review-admin-empty-icon">
                ⚠️
              </div>

              <h3>
                Something Went Wrong
              </h3>

              <p>
                ${escapeReviewHTML(
                  error.message ||
                  "Unknown error"
                )}
              </p>

            </div>

          </div>

        </div>

      `;

    }

  }

};


function showReviewConfirm(action) {

    return new Promise((resolve) => {

        const overlay = document.createElement("div");

        overlay.className = "review-confirm-overlay";

        overlay.innerHTML = `

            <div class="review-confirm-box">

                <div class="review-confirm-icon">
                    ${action === "approve" ? "✓" : "✕"}
                </div>

                <h3>
                    ${
                        action === "approve"
                            ? "Approve Review?"
                            : "Reject Review?"
                    }
                </h3>

                <p>
                    Are you sure you want to
                    ${action} this customer review?
                </p>

                <div class="review-confirm-actions">

                    <button
                        class="review-cancel-btn"
                        id="reviewConfirmCancel"
                    >
                        Cancel
                    </button>

                    <button
                        class="review-confirm-btn"
                        id="reviewConfirmOk"
                    >
                        ${
                            action === "approve"
                                ? "✓ Approve"
                                : "✕ Reject"
                        }
                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(overlay);


        document
            .getElementById("reviewConfirmCancel")
            .onclick = () => {

                overlay.remove();
                resolve(false);

            };


        document
            .getElementById("reviewConfirmOk")
            .onclick = () => {

                overlay.remove();
                resolve(true);

            };


        overlay.onclick = (e) => {

            if (e.target === overlay) {

                overlay.remove();
                resolve(false);

            }

        };

    });

}

/* ===========================================
   APPROVE / REJECT REVIEW
=========================================== */

window.updateReviewStatus =
async function (
  id,
  status
) {

  if (
    status !== "approved" &&
    status !== "rejected"
  ) {
    return;
  }


const action =
    status === "approved"
        ? "approve"
        : "reject";

const confirmed = await showReviewConfirm(action);

if (!confirmed) {
    return;
}

try {

    const {
      data: {
        session
      }
    } =
      await supabase.auth.getSession();


    if (!session) {

      location.replace(
        "adminlogin.html"
      );

      return;
    }


    const {
      data: admin,
      error: adminError
    } =
      await supabase
        .from("admin_users")
        .select("id")
        .eq(
          "id",
          session.user.id
        )
        .maybeSingle();


    if (
      adminError ||
      !admin
    ) {

      alert(
        "Admin access required."
      );

      return;
    }


    const {
      error
    } =
      await supabase
        .from("reviews")
        .update({
          status: status,
          updated_at:
            new Date().toISOString()
        })
        .eq(
          "id",
          id
        );


    if (error) {

      console.error(
        "Review update error:",
        error
      );

      alert(
        "Unable to update review.\n\n" +
        error.message
      );

      return;
    }


    if (typeof showToast === "function") {

      showToast(
        status === "approved"
          ? "Review approved successfully"
          : "Review rejected successfully",
        status === "approved"
          ? "#16a34a"
          : "#dc2626"
      );

    } else {

      alert(
        status === "approved"
          ? "Review approved successfully."
          : "Review rejected successfully."
      );

    }


    await window.viewReviews();


  } catch (error) {

    console.error(
      "Review status error:",
      error
    );


    alert(
      error.message ||
      "Something went wrong."
    );

  }

};

