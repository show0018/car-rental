document.addEventListener("DOMContentLoaded", () => {
  const vin = localStorage.getItem("lastVin");
  if (!vin) return showReminder("You have not selected any car yet. Please choose one from the homepage.");

  const baseURL = window.location.origin.includes("localhost")
    ? "http://localhost:3001"
    : "";

  fetch(`${baseURL}/api/cars/${vin}`)
    .then(res => {
      if (!res.ok) throw new Error("Car not found");
      return res.json();
    })
    .then(car => {
      if (car.available === 0) return showReminder(`${car.brand} ${car.carModel} is no longer available.`);
      showCarAndForm(car); 
    })
    .catch(err => {
      console.error("Fetch error:", err);
      showReminder("Error fetching car information.");
    });
});

function showReminder(msg) {
  document.getElementById("main-content").innerHTML = `
    <p>${msg}</p>
    <a href="index.html">Return to homepage</a>
  `;
}

function showCarAndForm(car) {
  const saved = JSON.parse(localStorage.getItem("reservationForm")) || {};

  document.getElementById("main-content").innerHTML = `
    <div class="car-info">
      <img src="./${car.image}" alt="${car.carModel}" width="300" height="180" style="display:block; margin: 0 auto 20px;" />
      <h2>${car.brand} ${car.carModel}</h2>
      <p>Year: ${car.yearOfManufacture} | Type: ${car.carType}</p>
      <p>Fuel: ${car.fuelType} | Mileage: ${car.mileage}</p>
      <p><strong>$${car.pricePerDay}/day</strong></p>
    </div>

    <form id="reservation-form">
      <input type="hidden" id="vin" value="${car.vin}" />
      <label>Name: <input type="text" id="customerName" value="${saved.customerName || ''}" required></label>
      <label>Phone: <input type="text" id="phoneNumber" value="${saved.phoneNumber || ''}" required></label>
      <label>Email: <input type="email" id="email" value="${saved.email || ''}" required></label>
      <label>License No.: <input type="text" id="driversLicenseNumber" value="${saved.driversLicenseNumber || ''}" required></label>
      <label>Start Date: <input type="date" id="start-date" value="${saved.startDate || ''}" required></label>
      <label>Rental Days: <input type="number" id="rentalDays" min="1" value="${saved.rentalDays || 1}" required></label>
      <p>Total: $<span id="total-price">0.00</span></p>
      <button type="submit" id="submit-btn" disabled>Confirm Reservation</button>
      <button type="button" id="cancel-btn">Cancel</button>
    </form>
  `;

  setupForm(car);
}

function setupForm(car) {
  const form = document.getElementById("reservation-form");
  const submitBtn = document.getElementById("submit-btn");

  function updateTotal() {
    const days = parseInt(document.getElementById("rentalDays").value);
    if (!isNaN(days) && days > 0) {
      const total = days * car.pricePerDay;
      document.getElementById("total-price").textContent = total.toFixed(2);
    }
  }

  function validate() {
    const isValid = [...form.elements].every(el =>
      el.type === "submit" || el.type === "button" || (el.required ? el.value.trim() !== "" : true)
    );
    submitBtn.disabled = !isValid;
    updateTotal();
    saveForm();
  }

  function saveForm() {
    const formData = {
      customerName: document.getElementById("customerName").value,
      phoneNumber: document.getElementById("phoneNumber").value,
      email: document.getElementById("email").value,
      driversLicenseNumber: document.getElementById("driversLicenseNumber").value,
      startDate: document.getElementById("start-date").value,
      rentalDays: document.getElementById("rentalDays").value
    };
    localStorage.setItem("reservationForm", JSON.stringify(formData));
  }

  form.addEventListener("input", validate);
  form.addEventListener("change", validate);
  document.getElementById("cancel-btn").addEventListener("click", () => {
    localStorage.removeItem("reservationForm");
    window.location.href = "index.html";
  });

  form.addEventListener("submit", e => {
    e.preventDefault();

    const rentalDays = parseInt(document.getElementById("rentalDays").value);
    const totalPrice = rentalDays * car.pricePerDay;
    const orderDate = new Date().toISOString().split("T")[0];

    const data = {
      vin: car.vin,
      customerName: form.customerName.value,
      phoneNumber: form.phoneNumber.value,
      email: form.email.value,
      driversLicenseNumber: form.driversLicenseNumber.value,
      startDate: form["start-date"].value,
      rentalPeriod: rentalDays,
      totalPrice,
      orderDate
    };

    const baseURL = window.location.origin.includes("localhost")
      ? "http://localhost:3001"
      : "";

    fetch(`${baseURL}/api/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(resp => {
        alert(resp.message || "Reservation successful!");
        form.reset();
        localStorage.removeItem("reservationForm");
      })
      .catch(err => {
        console.error("Reservation error:", err);
        alert("Failed to place reservation.");
      });
  });

  validate();
}

// 🔍 サーチバー（残す場合）
const searchInput = document.getElementById("search");
if (searchInput) {
  const suggestionBox = document.createElement("div");
  suggestionBox.classList.add("suggestions");
  searchInput.parentNode.appendChild(suggestionBox);

  searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.toLowerCase().trim();
    if (!keyword) {
      suggestionBox.innerHTML = "";
      return;
    }

    const keywords = [ "suv", "sedan", "coupe", "hatchback", "toyota", "mazda", "nissan", "ford", "comfortable", "spacious", "sporty", "fuel", "daily" ];

    const suggestions = keywords.filter(k => k.includes(keyword)).slice(0, 5);
    suggestionBox.innerHTML = suggestions.map(s => `<div class="suggestion-item">${s}</div>`).join("");

    document.querySelectorAll(".suggestion-item").forEach(item => {
      item.addEventListener("click", () => {
        searchInput.value = item.textContent;
        suggestionBox.innerHTML = "";
        window.location.href = `index.html?search=${encodeURIComponent(item.textContent)}`;
      });
    });
  });
}
