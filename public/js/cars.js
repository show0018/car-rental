let cars = [];
let currentCategory = null;
let currentBrand = null;

const baseURL = window.location.origin.includes("localhost")
  ? "http://localhost:3001"
  : ""; // AWSでは同一オリジン

fetch(`${baseURL}/api/cars`)
  .then(response => response.json())
  .then(data => {
    cars = data;

    const urlParams = new URLSearchParams(window.location.search);
    const initialKeyword = urlParams.get("search");

    if (initialKeyword) {
      searchInput.value = initialKeyword;
      triggerSearch(initialKeyword);
    } else {
      displayCars();
    }
  })
  .catch(error => {
    console.error("Error fetching cars:", error);
  });



function filterCategory(category) {
  currentCategory = category;
  displayCars();
}

function filterBrand(brand) {
  currentBrand = brand;
  displayCars();
}

function displayCars(carList = null) {
  const list = document.getElementById("product-list");
  list.innerHTML = "";

  const filtered = (carList || cars).filter(car => {
    const matchCategory = !currentCategory || car.carType === currentCategory;
    const matchBrand = !currentBrand || car.brand === currentBrand;
    return matchCategory && matchBrand;
  });

  if (filtered.length === 0) {
    list.innerHTML = "<p>No cars match your selection.</p>";
    return;
  }

  filtered.forEach(car => {
    const card = document.createElement("div");
    card.className = "product";
    console.log(car)

   card.innerHTML = `
  <img src="./${car.image}" alt="${car.carModel}" width="160" height="100" />
  <h3>${car.brand} ${car.carModel}</h3>
  <p>Type: ${car.carType} | Year: ${car.yearOfManufacture}</p>
  <p>Fuel: ${car.fuelType} | Mileage: ${car.mileage}</p>
  <p>Availability: ${car.available > 0 ? car.available : "Out of stock"}</p>
  <p><strong>Price:</strong> $${car.pricePerDay}/day</p>
  <p>${car.description}</p>
`;


    const reserveBtn = document.createElement("button");
    reserveBtn.textContent = "Reserve";
    if (car.available === 0) reserveBtn.disabled = true;

    reserveBtn.addEventListener("click", () => {
      localStorage.setItem("lastVin", car.vin); 
      window.location.href = "reservation.html";
    });

    card.appendChild(reserveBtn);
    list.appendChild(card);
  });
}


const searchInput = document.getElementById("search");
const suggestionBox = document.createElement("div");
suggestionBox.classList.add("suggestions");
searchInput.parentNode.appendChild(suggestionBox);

searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.toLowerCase().trim();
  if (!keyword) {
    suggestionBox.innerHTML = "";
    displayCars(); 
    return;
  }

  const matches = cars.filter(car =>
    car.carType.toLowerCase().includes(keyword) ||
    car.brand.toLowerCase().includes(keyword) ||
    car.carModel.toLowerCase().includes(keyword) ||
    car.description.toLowerCase().includes(keyword)
  );


  suggestionBox.innerHTML = [...new Set(matches.flatMap(car => [
    car.carType,
    car.brand,
    car.carModel,
    ...car.description.split(" ")
  ]))]
    .filter(word => word.toLowerCase().includes(keyword))
    .slice(0, 5)
    .map(s => `<div class="suggestion-item">${s}</div>`)
    .join("");

 
  document.querySelectorAll(".suggestion-item").forEach(item => {
    item.addEventListener("click", () => {
      searchInput.value = item.textContent;
      suggestionBox.innerHTML = "";
      triggerSearch(item.textContent);
    });
  });
});

function triggerSearch(keyword) {
  const result = cars.filter(car =>
    car.carType.toLowerCase().includes(keyword.toLowerCase()) ||
    car.brand.toLowerCase().includes(keyword.toLowerCase()) ||
    car.carModel.toLowerCase().includes(keyword.toLowerCase()) ||
    car.description.toLowerCase().includes(keyword.toLowerCase())
  );
  displayCars(result); 
}

