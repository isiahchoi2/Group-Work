import { useState } from "react";
import "./App.css";

function App() {
  const [page, setPage] = useState("request");
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

  function handleRequest(event) {
    event.preventDefault();
    setPage("payment");
    window.scrollTo(0, 0);
  }

  function handleCheckout() {
    setPage("checkout");
    window.scrollTo(0, 0);
  }

  function handlePlaceOrder() {
    const reference = "EP-" + Date.now().toString().slice(-8);
    setOrderNumber(reference);
    setPage("confirmation");
    window.scrollTo(0, 0);
  }

  function goBack(previousPage) {
    setPage(previousPage);
    window.scrollTo(0, 0);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>E-Print</h2>
        <p className="sidebar-subtitle">Print Shop System</p>

        <nav>
          <a
            href="#dashboard"
            className={page === "request" ? "active" : ""}
            onClick={(event) => {
              event.preventDefault();
              setPage("request");
            }}
          >
            Dashboard
          </a>

          <a
            href="#request"
            className={page === "request" ? "active" : ""}
            onClick={(event) => {
              event.preventDefault();
              setPage("request");
            }}
          >
            New Print Request
          </a>

          <a
            href="#orders"
            onClick={(event) => event.preventDefault()}
          >
            My Orders
          </a>
        </nav>

        <p className="sidebar-footer">Online Printing Service</p>
      </aside>

      <main className="main-content">
        {page === "request" && (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">STUDENT PORTAL</p>
                <h1>Print Shop Dashboard</h1>
                <p>Submit your documents and prepare your printing request.</p>
              </div>
              <div className="user-avatar">S</div>
            </header>

            <section className="welcome-card">
              <div>
                <p className="eyebrow">WELCOME TO E-PRINT</p>
                <h2>Skip the long queue.</h2>
                <p>Prepare your printing request online before visiting the shop.</p>
              </div>
              <span className="printer-icon">🖨️</span>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <span>My Requests</span>
                <strong>0</strong>
                <small>Total submitted requests</small>
              </div>
              <div className="stat-card">
                <span>Pending</span>
                <strong>0</strong>
                <small>Waiting for staff review</small>
              </div>
              <div className="stat-card">
                <span>Completed</span>
                <strong>0</strong>
                <small>Ready or finished orders</small>
              </div>
            </section>

            <section className="request-card" id="request">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">PRINTING SERVICE</p>
                  <h2>New Print Request</h2>
                </div>
                <span className="step-label">STEP 1 OF 3</span>
              </div>

              <form onSubmit={handleRequest}>
                <label>
                  Document
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(event) =>
                      setFile(event.target.files[0] || null)
                    }
                    required
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
                      onChange={(event) =>
                        setCopies(
                          Math.max(1, Number(event.target.value) || 1)
                        )
                      }
                      required
                    />
                  </label>

                  <label>
                    Paper Size
                    <select
                      value={paperSize}
                      onChange={(event) => setPaperSize(event.target.value)}
                    >
                      <option>A4</option>
                      <option>Letter</option>
                      <option>Legal</option>
                    </select>
                  </label>

                  <label>
                    Print Type
                    <select
                      value={printType}
                      onChange={(event) => setPrintType(event.target.value)}
                    >
                      <option>Black and White</option>
                      <option>Colored</option>
                    </select>
                  </label>

                  <label>
                    Print Sides
                    <select
                      value={sides}
                      onChange={(event) => setSides(event.target.value)}
                    >
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
                    <small>Sample pricing — subject to shop rates</small>
                  </div>
                  <strong>₱{estimatedCost.toFixed(2)}</strong>
                </div>

                <button className="submit-button" type="submit">
                  Prepare Print Request →
                </button>
              </form>
            </section>
          </>
        )}

        {page === "payment" && (
          <>
            <button
              className="back-button"
              onClick={() => goBack("request")}
            >
              ← Back to Print Request
            </button>

            <header className="page-header">
              <p className="eyebrow">STEP 2 OF 3</p>
              <h1>Select Payment Method</h1>
              <p>Choose how you would like to pay for your printing order.</p>
            </header>

            <section className="request-card">
              <h2 className="payment-heading">Available Payment Methods</h2>
              <p className="muted-text">
                Select one payment method to continue.
              </p>

              <div className="payment-options">
                {[
                  {
                    name: "GCash",
                    icon: "G",
                    description: "Pay using your GCash wallet",
                    className: "gcash",
                  },
                  {
                    name: "Maya",
                    icon: "M",
                    description: "Pay using your Maya wallet",
                    className: "maya",
                  },
                  {
                    name: "QR Ph",
                    icon: "▦",
                    description: "Scan using a supported bank or e-wallet app",
                    className: "qrph",
                  },
                ].map((method) => (
                  <button
                    type="button"
                    key={method.name}
                    className={`payment-option ${
                      paymentMethod === method.name ? "selected" : ""
                    }`}
                    onClick={() => setPaymentMethod(method.name)}
                  >
                    <span className={`payment-logo ${method.className}`}>
                      {method.icon}
                    </span>
                    <span className="payment-description">
                      <strong>{method.name}</strong>
                      <small>{method.description}</small>
                    </span>
                    <span className="payment-radio">
                      {paymentMethod === method.name ? "●" : "○"}
                    </span>
                  </button>
                ))}
              </div>

              {/* QR CODE PAYMENT DISPLAY BOX */}
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

              <button
                className="submit-button"
                onClick={handleCheckout}
              >
                Continue to Checkout →
              </button>
            </section>
          </>
        )}

        {page === "checkout" && (
          <>
            <button
              className="back-button"
              onClick={() => goBack("payment")}
            >
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
                <div>
                  <span>Special instructions</span>
                  <strong>{instructions.trim() || "None"}</strong>
                </div>
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
                <p>
                  Please make sure you have scanned the QR code and completed your payment transfer before proceeding.
                </p>
              </div>

              <button
                className="submit-button"
                onClick={handlePlaceOrder}
              >
                Place Demo Order →
              </button>
            </section>
          </>
        )}

        {page === "confirmation" && (
          <section className="request-card confirmation-card">
            <div className="success-icon">✓</div>
            <p className="eyebrow">ORDER CREATED</p>
            <h1>Your order has been prepared!</h1>
            <p className="muted-text">
              Your demo order reference is shown below.
            </p>

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

            <button
              className="submit-button"
              onClick={() => goBack("request")}
            >
              Create Another Request
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;