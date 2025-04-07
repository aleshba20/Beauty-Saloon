// const apiBaseUrl = "http://localhost:3000"; // Change this if deployed
const apiBaseUrl = "https://beauty-saloon-2.onrender.com";

/** 📌 Load available slots when a user selects a service */
async function loadService(service) {
  console.log(`📡 Requesting slots for: ${service}`);

  try {
    const response = await fetch(`${apiBaseUrl}/slots/${service}`);
    if (!response.ok) {
      throw new Error("Failed to fetch slots");
    }

    const slots = await response.json();
    console.log(`✅ Slots received for ${service}:`, slots);

    const slotsList = document.getElementById("slots");
    const bookingForm = document.getElementById("booking-form");

    slotsList.innerHTML = "";
    bookingForm.style.display = "none";

    if (slots.length === 0) {
      slotsList.innerHTML = "<li>No available slots</li>";
    } else {
      slots.forEach((slot) => {
        const listItem = document.createElement("li");
        listItem.classList.add("slot-item");

        // Extract slot time if it's an object
        const slotTime = typeof slot === "object" ? slot.time : slot;
        listItem.textContent = slotTime;

        // Create "Book Now" button
        const bookButton = document.createElement("button");
        bookButton.textContent = "Book Now";
        bookButton.classList.add("book-button");

        // 👇 Add openBookingModal inside the click handler
        bookButton.onclick = () => {
          selectSlot(service, slotTime); // populate the form
          openBookingModal(); // show the popup modal
        };

        listItem.appendChild(bookButton);
        slotsList.appendChild(listItem);
      });
    }
  } catch (error) {
    console.error("❌ Error fetching slots:", error);
    alert("Failed to load slots. Please try again.");
  }
}

/** 📌 Handle slot selection & show booking form */
function selectSlot(service, slot) {
  const bookingForm = document.getElementById("booking-form");
  bookingForm.style.display = "block";

  // Set min/max for the date input
  const dateInput = document.getElementById("date");
  const today = new Date();
  const maxDate = new Date();
  maxDate.setMonth(today.getMonth() + 1); // 1 month from today

  const formatDate = (d) => d.toISOString().split("T")[0];
  dateInput.min = formatDate(today);
  dateInput.max = formatDate(maxDate);

  // Add event listener for form submission
  bookingForm.onsubmit = async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const artist = document.getElementById("artist").value.trim();
    const dateValue = document.getElementById("date").value;

    const selectedDate = new Date(dateValue);
    selectedDate.setHours(0, 0, 0, 0); // normalize
    today.setHours(0, 0, 0, 0);
    maxDate.setHours(0, 0, 0, 0);

    // 💥 Frontend date validation
    if (selectedDate < today || selectedDate > maxDate) {
      alert(
        "❌ Booking failed. Please select a date within 1 month from today."
      );
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service,
          slot,
          name,
          email,
          phone,
          artist,
          date: dateValue,
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonErr) {
        result = await response.text();
      }

      if (response.ok) {
        console.log("✅ Booking confirmed:", result);
        alert("🎉 Booking confirmed! Check your email for details.");
      } else {
        console.error("❌ Booking error:", result);
        if (
          typeof result === "string" &&
          result.includes("Slot not available")
        ) {
          console.warn("⏳ Slot already booked, but no alert will be shown.");
        } else {
          alert("❌ Error: " + (result.message || result));
        }
      }
    } catch (error) {
      console.error("❌ Booking failed:", error);
      alert("❌ Booking failed. Please try again.");
    }
  };
}

/** 📌 Search & Filter Slots */

function searchSlots() {
  const searchInput = document
    .getElementById("search")
    .value.trim()
    .toLowerCase();
  const slotsList = document.getElementById("slots");
  const slotItems = slotsList.getElementsByClassName("slot-item");

  let found = false;

  if (searchInput === "") {
    // If search is cleared, restore original slots without reloading service
    Array.from(slotItems).forEach((item) => (item.style.display = "flex"));
    return;
  }

  Array.from(slotItems).forEach((item) => {
    const slotText = item.textContent.toLowerCase();
    if (slotText.includes(searchInput)) {
      item.style.display = "flex"; // Show matching slots
      found = true;
    } else {
      item.style.display = "none"; // Hide non-matching slots
    }
  });

  // Remove the "No Results Found" message if a valid slot is typed
  const noResultsMessage = document.querySelector(".no-results");
  if (noResultsMessage) {
    noResultsMessage.remove();
  }

  // If no matches are found, display "No available slots found."
  if (!found) {
    if (!document.querySelector(".no-results")) {
      const noResultsItem = document.createElement("li");
      noResultsItem.classList.add("no-results");
      noResultsItem.textContent = "No available slots found.";
      slotsList.appendChild(noResultsItem);
    }
  }
}

// Attach search function to input field
document.getElementById("search").addEventListener("input", searchSlots);

/** 📌 Chatbox Toggle */
function toggleChatbox() {
  const chatbox = document.querySelector(".chatbox");
  chatbox.style.display = chatbox.style.display === "block" ? "none" : "block";
}

/** 📌 Send message in Chatbox */
function sendMessage(event) {
  if (event && event.key !== "Enter") return;

  const inputField = document.getElementById("chat-input");
  const message = inputField.value.trim();

  if (message === "") return;

  const messagesContainer = document.getElementById("chatbox-messages");
  const userMessage = document.createElement("p");
  userMessage.classList.add("user-message");
  userMessage.textContent = message;
  messagesContainer.appendChild(userMessage);

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  inputField.value = "";

  setTimeout(() => {
    const botResponse = document.createElement("p");
    botResponse.classList.add("bot-message");
    botResponse.textContent = getBotReply(message);
    messagesContainer.appendChild(botResponse);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 1000);
}

function openBookingModal() {
  document.getElementById("booking-modal").style.display = "block";
}

function closeBookingModal() {
  document.getElementById("booking-modal").style.display = "none";
}

// Optional: close when clicking outside
window.addEventListener("click", function (event) {
  const modal = document.getElementById("booking-modal");
  if (event.target === modal) {
    closeBookingModal();
  }
});

//** 📌 Auto-responses for Chatbox */
function getBotReply(userMessage) {
  const msg = userMessage.toLowerCase();

  const responses = {
    hello: "Hi there! How can I assist you today? 😊",
    services:
      "We offer Makeup, Hair Styling, Henna, and Beauty Consultations! 💄💇‍♀️✨",
    appointment:
      "You can book an appointment by clicking on 'Book Appointment' at the top of the page! 📅",
    price:
      "Our prices vary depending on the service. You can check the full price list on our 'Services' page! 💰💅",
    location:
      "We are located in Doha, Qatar. You can find us on Google Maps for exact directions! 📍",
    hours:
      "Our working hours are from 10 AM to 8 PM, Monday to Saturday. We are closed on Sundays! ⏰",
    makeup:
      "We offer bridal, party, and casual makeup services! Would you like to book a session? 💄💖",
    hair: "We offer hair styling, cutting, coloring, and keratin treatments. Let us know how we can help! 💇‍♀️✨",
    henna:
      "Yes! We specialize in bridal and party henna designs. You can book a henna session through our website! 🌿✋",
    member:
      "Our members get exclusive discounts on beauty services! Subscribe to our newsletter to become a member! 🎉💖",
    offers:
      "We have amazing deals running every month! Follow our Instagram @llishamua for the latest updates! 📢💖",
    thanks:
      "You're most welcome! Let me know if you need anything else. Have a beautiful day! 💕😊",
    book: "To book an appointment, click on any service and choose your slot! 📅",
  };

  for (const keyword in responses) {
    if (msg.includes(keyword)) {
      return responses[keyword];
    }
  }

  return "I'm sorry, I didn't understand that. Can you please rephrase? 🤔";
}

/** 📌 Smooth Page Transitions */
document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll("nav a, .footer-links a");

  links.forEach((link) => {
    link.addEventListener("click", function (event) {
      const href = this.getAttribute("href");

      if (href.startsWith("#") || href.endsWith(".html")) {
        event.preventDefault();
        document.body.classList.add("fade-out");

        setTimeout(() => {
          if (href.startsWith("#")) {
            document.querySelector(href).scrollIntoView({ behavior: "smooth" });
            document.body.classList.remove("fade-out");
          } else {
            window.location.href = href;
          }
        }, 500);
      }
    });
  });

  document.body.classList.add("page-transition");
});

// /** 📌 Popups for Makeup services
function openPopup(service) {
  const popup = document.getElementById("popup-modal");
  const title = document.getElementById("popup-title");
  const description = document.getElementById("popup-description");
  const discount = document.getElementById("popup-discount");
  const image = document.getElementById("popup-image");

  const services = {
    bridal: {
      title: "Bridal Makeup",
      desc: "Luxury bridal glam with full-face makeup, lashes, and setting spray. 💄✨",
      discount: "20%",
      image: "images/photo-1588842867976-fd084ca2c87b.png",
    },
    party: {
      title: "Party Makeup",
      desc: "Soft glam or bold, tailored to your preference. Long-lasting and lightweight. 🎉",
      discount: "10%",
      image: "images/WhatsApp Image 2025-01-25 at 16.15.49_e3ec1f6d.jpg",
    },
    engagement: {
      title: "Engagement Makeup",
      desc: "Custom engagement makeup with soft or bold finish, perfect for your special occasion. 💍",
      discount: "15%",
      image: "images/WhatsApp Image 2025-03-29 at 22.31.37_c142f702.jpg",
    },
    photoshoot: {
      title: "Photoshoot Makeup",
      image: "images/something.png",
      desc: "Flawless HD makeup designed for professional photography. 📸",
      discount: "10%",
      image: "images/WhatsApp Image 2025-03-29 at 21.51.53_538d3e2a.jpg",
    },
    casual: {
      title: "Casual Makeup",
      desc: "Soft and natural everyday makeup look for any occasion. ☕",
      discount: "5%",
      image: "images/istockphoto-1265032285-612x612.png",
    },
    eye: {
      title: "Eye Makeup Only",
      desc: "Detailed eye glam with liner, lashes, and brow sculpting to enhance your beauty. 👁",
      discount: "10%",
      image: "images/WhatsApp Image 2025-03-29 at 21.50.52_bab55a58.jpg",
    },
  };

  const selected = services[service];

  title.innerText = selected.title;
  description.innerText = selected.desc;
  discount.innerText = selected.discount;

  // Set the image dynamically
  if (selected.image) {
    image.src = selected.image;
    image.alt = selected.title;
    image.style.display = "block";
  } else {
    image.style.display = "none";
  }

  popup.style.display = "flex";
}

function closePopup() {
  document.getElementById("popup-modal").style.display = "none";
}

// Optional: close when clicking outside the popup
window.onclick = function (event) {
  const popup = document.getElementById("popup-modal");
  if (event.target === popup) {
    closePopup();
  }
};
/** 📌 Open Henna Popup Function */
function openHennaPopup(service) {
  const popup = document.getElementById("henna-popup-modal");
  const title = document.getElementById("henna-popup-title");
  const description = document.getElementById("henna-popup-description");
  const discount = document.getElementById("henna-popup-discount");
  const image = document.getElementById("henna-popup-image");

  // Henna service details
  const hennaServices = {
    bridal: {
      title: "Bridal Henna",
      desc: "Luxury bridal henna with intricate patterns covering full hands and feet. Lasts up to 2 weeks. 🌿✨",
      discount: "20%",
      image: "images/WhatsApp Image 2025-03-29 at 22.29.13_fb9b0cd3.jpg",
    },
    party: {
      title: "Party Henna",
      desc: "Beautiful floral & intricate patterns for any event. 🌸",
      discount: "10%",
      image: "images/WhatsApp Image 2025-03-29 at 22.18.39_d829a820.jpg",
    },
    engagement: {
      title: "Engagement Henna",
      desc: "Elegant henna designs for your special occasion. 💍",
      discount: "15%",
      image: "images/WhatsApp Image 2025-03-29 at 22.18.39_e142408d.jpg",
    },
    simple: {
      title: "Simple Henna",
      desc: "Minimalistic designs for casual or festive looks. ✨",
      discount: "5%",
      image: "images/WhatsApp Image 2025-03-29 at 22.18.38_a16bdaf4.jpg",
    },
    arabic: {
      title: "Arabic Henna",
      desc: "Bold and stylish Arabic-style henna patterns. 🌙",
      discount: "10%",
      image: "images/WhatsApp Image 2025-03-29 at 22.18.40_d03a7de4.jpg",
    },
    kids: {
      title: "Henna for Kids",
      desc: "Fun, small & cute henna designs for children. 🧒",
      discount: "10%",
      image: "images/WhatsApp Image 2025-03-29 at 22.18.40_4f47c131.jpg",
    },
  };

  const selected = hennaServices[service];

  if (selected) {
    title.innerText = selected.title;
    description.innerText = selected.desc;
    discount.innerText = selected.discount;

    // Set image
    if (selected.image) {
      image.src = selected.image;
      image.alt = selected.title;
      image.style.display = "block";
    } else {
      image.style.display = "none";
    }

    // Show popup
    popup.style.display = "flex";
  } else {
    console.error("❌ Error: Henna service not found!");
  }
}

/** 📌 Close Henna Popup Function */
function closeHennaPopup() {
  document.getElementById("henna-popup-modal").style.display = "none";
}

/** 📌 Close Popup if Clicking Outside */
window.onclick = function (event) {
  const popup = document.getElementById("henna-popup-modal");
  if (event.target === popup) {
    closeHennaPopup();
  }
};

/** 📌 Page Animations */
document.addEventListener("DOMContentLoaded", function () {
  gsap.from(".hero h1", {
    duration: 1,
    y: 50,
    opacity: 0,
    ease: "power3.out",
  });
  gsap.from(".hero p", {
    duration: 1,
    y: 50,
    opacity: 0,
    delay: 0.3,
    ease: "power3.out",
  });
  gsap.from(".learn-more", {
    duration: 1,
    y: 50,
    opacity: 0,
    delay: 0.6,
    ease: "power3.out",
  });

  gsap.utils.toArray(".animate").forEach((section) => {
    gsap.from(section, {
      scrollTrigger: { trigger: section, start: "top 80%" },
      opacity: 0,
      y: 50,
      duration: 1,
      ease: "power3.out",
    });
  });

  gsap.from("nav ul li", {
    duration: 1,
    y: -20,
    opacity: 0,
    stagger: 0.2,
    ease: "power3.out",
  });
  document.body.classList.add("page-transition");

  window.addEventListener("beforeunload", function () {
    document.body.classList.add("fade-out");
  });
});

// ----------------------
document.addEventListener("DOMContentLoaded", function () {
  const elementsToAnimate = document.querySelectorAll("[data-animate]");

  function animateOnScroll() {
    elementsToAnimate.forEach((element) => {
      const position = element.getBoundingClientRect().top;
      const screenHeight = window.innerHeight;

      if (position < screenHeight - 100) {
        element.classList.add("active");
      }
    });
  }

  window.addEventListener("scroll", animateOnScroll);
  animateOnScroll(); // Run once on page load in case elements are already in view
});
