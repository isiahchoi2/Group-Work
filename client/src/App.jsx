import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminError, setAdminError] = useState("");
  const [page, setPage] = useState("dashboard");
  const [ordersList, setOrdersList] = useState([]);
  const [copies, setCopies] = useState(1);
  const [paperSize, setPaperSize] = useState("A4");
  const [printType, setPrintType] = useState("Black and White");
  const [sides, setSides] = useState("Single-sided");
  const [instructions, setInstructions] = useState("");
  const [file, setFile] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("GCash");
  const [orderNumber, setOrderNumber] = useState("");

  const pricePerPage = printType === "Colored" ? 5 : 2;
  const estimatedCost = copies * pricePerPage;

  // Persist status directly to MongoDB database
  async function updateOrderStatusInDB(id, newStatus) {
    try {
      await fetch(`http://localhost:5000/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) {
      console.error("Error saving persistent status:", error);
    }
  }

  // Real Sequential Queue System with Permanent Database Locking
  useEffect(() => {
    if (page !== "my-orders" || ordersList.length === 0) return;

    const timer = setInterval(() => {
      setOrdersList((prevOrders) => {
        const activeOrderIndex = prevOrders.findIndex(
          (o) => o.status !== "Ready for Pickup"
        );

        if (activeOrderIndex === -1) return prevOrders;

        return prevOrders.map((order, index) => {
          if (order.status === "Ready for Pickup") return order;

          if (index === activeOrderIndex) {
            const currentProgress = order.simulatedProgress || 0;
            const requiredTimeUnits = Math.max(3, (order.copies || 1) * 3);

            if (currentProgress + 1 >= requiredTimeUnits) {
              updateOrderStatusInDB(order._id, "Ready for Pickup");
              return {
                ...order,
                status: "Ready for Pickup",
                simulatedProgress: currentProgress + 1
              };
            } else {
              if (order.status !== "In Process") {
                updateOrderStatusInDB(order._id, "In Process");
              }
              return {
                ...order,
                status: "In Process",
                simulatedProgress: currentProgress + 1
              };
            }
          }

          return { ...order, status: order.status || "Pending" };
        });
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [page, ordersList.length]);

  function handleRequest(event) {
    event.preventDefault();
    setPage("payment");
    window.scrollTo(0, 0);
  }

  function handleCheckout() {
    setPage("checkout");
    window.scrollTo(0, 0);
  }

  async function handleUpdateStatus(id, currentStatus) {
    const newStatus = currentStatus === "Pending" ? "Ready for Pickup" : "Pending";
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`http://localhost:5000/api/orders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchAdminOrders();
      }
    } catch (error) {
      console.error("Error updating order:", error);
    }
  }

  async function handleDeleteOrder(id) {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`http://localhost:5000/api/orders/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchAdminOrders();
      }
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  }

  async function fetchAdminOrders() {
    try {
      const response = await fetch("http://localhost:5000/api/orders");
      const data = await response.json();
      setOrdersList(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  }

  function handleStartEdit(order) {
    if (order.status !== "Pending" && order.status) {
      alert("You can only edit orders that are still Pending!");
      return;
    }
    setEditingOrderId(order._id);
    setCopies(order.copies);
    setPaperSize(order.paperSize);
    setPrintType(order.printType);
    setSides(order.sides);
    setInstructions(order.instructions || "");
    setPaymentMethod(order.paymentMethod || "GCash");
    setPage("request");
  }

  async function handleSaveOrder() {
    try {
      if (editingOrderId) {
        const orderData = { copies, paperSize, printType, sides, instructions, paymentMethod, estimatedCost };
        const response = await fetch(`http://localhost:5000/api/orders/${editingOrderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData)
        });
        if (response.ok) {
          setEditingOrderId(null);
          setPage("my-orders");
          fetchAdminOrders();
        }
      } else {
        const reference = "EP-" + Date.now().toString().slice(-8);
        setOrderNumber(reference);

        // Using FormData for real file uploads
        const formData = new FormData();
        formData.append("orderNumber", reference);
        formData.append("copies", copies);
        formData.append("paperSize", paperSize);
        formData.append("printType", printType);
        formData.append("sides", sides);
        formData.append("instructions", instructions || "");
        formData.append("paymentMethod", paymentMethod);
        formData.append("estimatedCost", estimatedCost);
        if (file) {
          formData.append("document", file);
        }

        const response = await fetch("http://localhost:5000/api/orders", {
          method: "POST",
          body: formData
        });

        if (response.ok) {
          setPage("confirmation");
        }
      }
    } catch (error) {
      console.error("Error saving order:", error);
    }
    window.scrollTo(0, 0);
  }

  function goBack(previousPage) {
    setPage(previousPage);
    window.scrollTo(0, 0);
  }

  const pendingCount = ordersList.filter(o => (o.status || "Pending") === "Pending").length;
  const readyCount = ordersList.filter(o => o.status === "Ready for Pickup").length;

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>E-Print</h2>
        <p className="sidebar-subtitle">Print Shop System</p>
        <nav>
          <a
            href="#dashboard"
            className={page === "dashboard" ? "active" : ""}
            onClick={(event) => {
              event.preventDefault();
              setPage("dashboard");
              fetchAdminOrders();
            }}
          >
            Dashboard
          </a>
          <a
            href="#request"
            className={page === "request" ? "active" : ""}
            onClick={(event) => {
              event.preventDefault();
              setEditingOrderId(null);
              setPage("request");
            }}
          >
            New Print Request
          </a>
          <a
            href="#orders"
            className={page === "my-orders" ? "active" : ""}
            onClick={(event) => {
              event.preventDefault();
              setPage("my-orders");
              fetchAdminOrders();
            }}
          >
            My Orders
          </a>
          <a
            href="#admin"
            className={page === "admin" ? "active" : ""}
            onClick={(event) => {
              event.preventDefault();
              setPage("admin");
              fetchAdminOrders();
            }}
          >
            Admin Dashboard
          </a>
        </nav>
        <p className="sidebar-footer">Online Printing Service</p>
      </aside>

      <main className="main-content">
        {page === "dashboard" && (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">STUDENT PORTAL</p>
                <h1>Welcome Back! 👋</h1>
                <p>Everything looks good. Here is your quick printing summary.</p>
              </div>
              <div className="user-avatar">S</div>
            </header>

            <section className="welcome-card">
              <div>
                <p className="eyebrow">CHILL & FAST</p>
                <h2>Skip the long queue today.</h2>
                <p>Upload your files, pay securely via GCash or Maya, and drop by only when it is ready for pickup.</p>
              </div>
            </section>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "25px" }}>
              <div className="request-card" style={{ marginBottom: 0, textAlign: "center", padding: "25px" }}>
                <p className="eyebrow">Ready for Pickup</p>
                <h3 style={{ fontSize: "36px", color: "#16a34a", marginTop: "8px" }}>{readyCount}</h3>
                <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>Completed print jobs</p>
              </div>
              <div className="request-card" style={{ marginBottom: 0, textAlign: "center", padding: "25px" }}>
                <p className="eyebrow">In Queue / Pending</p>
                <h3 style={{ fontSize: "36px", color: "#d97706", marginTop: "8px" }}>{pendingCount}</h3>
                <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>Processing or waiting</p>
              </div>
            </div>

            <section className="request-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">QUICK ACTIONS</p>
                  <h2>Get Started</h2>
                </div>
              </div>
              <p style={{ color: "#475569", marginBottom: "20px", fontSize: "14px", lineHeight: "1.6" }}>
                Need to pass an assignment or print out reviewer notes? Start a new print request now or inspect your live queue status.
              </p>
              <div style={{ display: "flex", gap: "15px" }}>
                <button
                  className="submit-button"
                  onClick={() => { setEditingOrderId(null); setPage("request"); }}
                >
                  Create New Print Request →
                </button>
                <button
                  className="submit-button"
                  style={{ background: "#334155" }}
                  onClick={() => { setPage("my-orders"); fetchAdminOrders(); }}
                >
                  View Live Queue →
                </button>
              </div>
            </section>
          </>
        )}

        {page === "request" && (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">STUDENT PORTAL</p>
                <h1>Print Shop Dashboard</h1>
                <p>Submit your documents and prepare your printing</p>
              </div>
              <div className="user-avatar">S</div>
            </header>

            <section className="request-card" id="request">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">PRINTING SERVICE</p>
                  <h2>{editingOrderId ? "Edit Print Request" : "New Print Request"}</h2>
                </div>
                <span className="step-label">STEP 1 OF 3</span>
              </div>
              <form onSubmit={handleRequest}>
                <label>
                  Document
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(event) => setFile(event.target.files[0] || null)}
                  />
                  <small>Accepted formats: PDF, DOC, DOCX, JPG, PNG</small>
                </label>
                <div className="form-grid">
                  <label>
                    Number of Copies
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={copies}
                      onChange={(event) => setCopies(Math.max(1, Number(event.target.value) || 1))}
                      required
                    />
                  </label>
                  <label>
                    Paper Size
                    <select value={paperSize} onChange={(event) => setPaperSize(event.target.value)}>
                      <option>A4</option>
                      <option>Letter</option>
                      <option>Legal</option>
                    </select>
                  </label>
                  <label>
                    Print Type
                    <select value={printType} onChange={(event) => setPrintType(event.target.value)}>
                      <option>Black and White</option>
                      <option>Colored</option>
                    </select>
                  </label>
                  <label>
                    Print Sides
                    <select value={sides} onChange={(event) => setSides(event.target.value)}>
                      <option>Single-sided</option>
                      <option>Double-sided</option>
                    </select>
                  </label>
                </div>
                <label>
                  Special Instructions
                  <textarea
                    rows="3"
                    value={instructions}
                    onChange={(event) => setInstructions(event.target.value)}
                    placeholder="Add instructions for the printing staff..."
                  />
                </label>
                <div className="cost-summary">
                  <div>
                    <span>Estimated Cost</span>
                    <small>Sample pricing subject to shop rates</small>
                  </div>
                  <strong>₱{estimatedCost.toFixed(2)}</strong>
                </div>
                <button className="submit-button" type="submit">
                  {editingOrderId ? "Update Request Details →" : "Prepare Print Request →"}
                </button>
              </form>
            </section>
          </>
        )}

        {page === "payment" && (
          <>
            <button className="back-button" onClick={() => goBack("request")}>
              ← Back to Print Request
            </button>
            <header className="page-header">
              <p className="eyebrow">STEP 2 OF 3</p>
              <h1>Select Payment Method</h1>
              <p>Choose how you would like to pay for your printing order.</p>
            </header>
            <section className="request-card">
              <h2 className="payment-heading">Available Payment Methods</h2>
              <p className="muted-text">Select one payment method to continue.</p>
              <div className="payment-options">
                {[
                  { name: "GCash", icon: "G", description: "Pay using your GCash wallet", className: "gcash" },
                  { name: "Maya", icon: "M", description: "Pay using your Maya wallet", className: "maya" },
                  { name: "QR Ph", icon: "", description: "Scan using a supported bank or e-wallet app", className: "qrph" }
                ].map((method) => (
                  <button
                    type="button"
                    key={method.name}
                    className={`payment-option ${paymentMethod === method.name ? "selected" : ""} ${method.className}`}
                    onClick={() => setPaymentMethod(method.name)}
                  >
                    <span className="payment-logo">{method.icon}</span>
                    <span className="payment-description">
                      <strong>{method.name}</strong>
                      <small>{method.description}</small>
                    </span>
                    <span className="payment-radio">{paymentMethod === method.name ? "●" : "○"}</span>
                  </button>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: "20px", background: "#f0f8ff", padding: "20px", borderRadius: "8px", border: "1px solid #d0e8ff" }}>
                <h3>Scan to Pay via {paymentMethod}</h3>
                <p>Please scan the QR code below using your mobile wallet app:</p>
                <img
                  src={paymentMethod === "GCash" ? "/Gcash.png.png" : "/Maya.png.png"}
                  alt="Payment QR Code"
                  style={{ width: "200px", height: "200px", border: "2px solid #ccc", borderRadius: "10px", marginTop: "10px", marginBottom: "10px", objectFit: "contain", background: "white" }}
                />
                <p style={{ fontSize: "14px", color: "gray" }}>
                  After paying via {paymentMethod}, show your reference or screenshot to the shop staff!
                </p>
              </div>
              <div className="cost-summary payment-total">
                <div>
                  <span>Estimated Total</span>
                  <small>Final price must be confirmed by the shop.</small>
                </div>
                <strong>₱{estimatedCost.toFixed(2)}</strong>
              </div>
              <button className="submit-button" onClick={handleCheckout}>
                Continue to Checkout
              </button>
            </section>
          </>
        )}

        {page === "checkout" && (
          <>
            <button className="back-button" onClick={() => goBack("payment")}>
              ← Back to Payment Methods
            </button>
            <header className="page-header">
              <p className="eyebrow">STEP 3 OF 3</p>
              <h1>Review Your Order</h1>
              <p>Check your printing details before placing the order.</p>
            </header>
            <section className="request-card">
              <h2>Order Summary</h2>
              <div className="checkout-document">
                <span className="document-icon">📄</span>
                <div>
                  <strong>{file ? file.name : "No document selected"}</strong>
                  <small>Printing document</small>
                </div>
              </div>
              <div className="checkout-details">
                <div><span>Number of copies</span><strong>{copies}</strong></div>
                <div><span>Paper size</span><strong>{paperSize}</strong></div>
                <div><span>Print type</span><strong>{printType}</strong></div>
                <div><span>Print sides</span><strong>{sides}</strong></div>
                <div><span>Payment method</span><strong>{paymentMethod}</strong></div>
                <div><span>Special instructions</span><strong>{instructions.trim() || "None"}</strong></div>
              </div>
              <div className="cost-summary checkout-total">
                <div>
                  <span>Estimated Total</span>
                  <small>Sample pricing, not a confirmed shop quote</small>
                </div>
                <strong>₱{estimatedCost.toFixed(2)}</strong>
              </div>
              <div className="notice">
                <strong>Payment is shown via QR code.</strong>
                <p>Please make sure you have scanned the QR code and completed your payment transfer before proceeding.</p>
              </div>
              <button className="submit-button" onClick={handleSaveOrder}>
                {editingOrderId ? "Save Changes to Order" : "Place Demo Order"}
              </button>
            </section>
          </>
        )}

        {page === "my-orders" && (
          <section className="request-card" style={{ padding: "20px" }}>
            <h2>Live Sequential Printing Queue</h2>
            <p className="muted-text" style={{ marginBottom: "15px" }}>
              Orders process one by one at standard print speeds (~3 seconds per page).
            </p>
            <button onClick={() => { setEditingOrderId(null); setPage("dashboard"); }} style={{ marginBottom: "15px", padding: "8px 15px", cursor: "pointer" }}>
              ← Back to Dashboard
            </button>
            <div className="orders-list">
              {ordersList.length === 0 ? (
                <p>No orders found yet.</p>
              ) : (
                ordersList.map((order) => {
                  const currentStatus = order.status || "Pending";
                  const statusColor =
                    currentStatus === "Ready for Pickup"
                      ? "green"
                      : currentStatus === "In Process"
                      ? "#007bff"
                      : "orange";

                  return (
                    <div key={order._id} style={{ border: "1px solid #ccc", padding: "15px", marginBottom: "15px", borderRadius: "8px", background: "#fff" }}>
                      <strong>Reference: {order.orderNumber}</strong>
                      <p>Paper Size: {order.paperSize} | Copies: {order.copies}</p>
                      <p>Type: {order.printType} ({order.sides})</p>
                      <p>
                        Live Status:{" "}
                        <span style={{ fontWeight: "bold", color: statusColor }}>
                          {currentStatus}
                        </span>
                      </p>
                      <p style={{ fontSize: "12px", color: "gray" }}>Ordered on: {new Date(order.createdAt).toLocaleString()}</p>
                      
                      {currentStatus === "Pending" && (
                        <button
                          onClick={() => handleStartEdit(order)}
                          style={{ marginTop: "10px", padding: "6px 12px", background: "#ffc107", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                        >
                          Edit Order Details
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {page === "confirmation" && (
          <section className="request-card confirmation-card">
            <div className="success-icon">✅</div>
            <p className="eyebrow">ORDER CREATED</p>
            <h1>Your order has been prepared!</h1>
            <p className="muted-text">Your demo order reference is shown below.</p>
            <div className="reference-box">
              <span>Order Reference</span>
              <strong>{orderNumber}</strong>
            </div>
            <div className="checkout-details">
              <div><span>Estimated total</span><strong>₱{estimatedCost.toFixed(2)}</strong></div>
              <div><span>Payment method</span><strong>{paymentMethod}</strong></div>
              <div><span>Payment status</span><strong className="pending-status">Ready for verification</strong></div>
              <div><span>Order status</span><strong>Demo order created</strong></div>
            </div>
            <div className="notice">
              This order is successfully prepared. Show your order reference and payment confirmation screenshot to the E-Print shop staff!
            </div>
            <button className="submit-button" onClick={() => { setEditingOrderId(null); setPage("dashboard"); }}>
              Back to Dashboard
            </button>
          </section>
        )}

        {page === "admin" && (
          <section className="admin-dashboard" style={{ padding: "20px" }}>
            <h2>Admin Dashboard</h2>
            <button onClick={() => { setPage("dashboard"); setIsAdminAuthenticated(false); setAdminPasswordInput(""); }}>
              Back to Dashboard
            </button>
            {!isAdminAuthenticated ? (
              <div style={{ maxWidth: "400px", margin: "40px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px", background: "#f9f9f9" }}>
                <h3>Admin Login Required</h3>
                <p style={{ fontSize: "14px", color: "#666" }}>Please enter the admin password to manage orders.</p>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await fetch("http://localhost:5000/api/admin/login", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ password: adminPasswordInput })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      localStorage.setItem("adminToken", data.token);
                      setIsAdminAuthenticated(true);
                      setAdminError("");
                      fetchAdminOrders();
                    } else {
                      setAdminError(data.error || "Incorrect password.");
                    }
                  } catch (err) {
                    setAdminError("Server connection failed.");
                  }
                }}>
                  <input
                    type="password"
                    placeholder="Enter password..."
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    style={{ width: "100%", padding: "10px", marginTop: "10px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
                    required
                  />
                  {adminError && <p style={{ color: "red", fontSize: "13px", marginBottom: "10px" }}>{adminError}</p>}
                  <button type="submit" style={{ width: "100%", padding: "10px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                    Login
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ marginTop: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <p>Welcome, Admin! You can now update or delete orders.</p>
                  <button
                    onClick={() => { setIsAdminAuthenticated(false); setAdminPasswordInput(""); localStorage.removeItem("adminToken"); }}
                    style={{ padding: "5px 10px", background: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                  >
                    Lock / Logout
                  </button>
                </div>
                <div className="orders-list">
                  {ordersList.length === 0 ? (
                    <p>No orders found in the database yet.</p>
                  ) : (
                    ordersList.map((order) => (
                      <div key={order._id} style={{ border: "1px solid #ccc", padding: "15px", marginBottom: "15px", borderRadius: "8px", background: "#fff" }}>
                        <strong>Reference: {order.orderNumber}</strong>
                        <p>Paper Size: {order.paperSize} | Copies: {order.copies}</p>
                        <p>Type: {order.printType} ({order.sides})</p>
                        <p>Payment: {order.paymentMethod} Total: ₱{order.estimatedCost}</p>
                        <p>Status: <span style={{ fontWeight: "bold", color: (order.status || "Pending") === "Ready for Pickup" ? "green" : "orange" }}>{order.status || "Pending"}</span></p>
                        <p style={{ fontSize: "12px", color: "gray" }}>Ordered on: {new Date(order.createdAt).toLocaleString()}</p>
                        <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                          <button
                            onClick={() => handleUpdateStatus(order._id, order.status || "Pending")}
                            style={{ padding: "5px 10px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                          >
                            Toggle Status
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order._id)}
                            style={{ padding: "5px 10px", background: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                          >
                            Delete Order
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;