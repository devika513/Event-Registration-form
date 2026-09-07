const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;
/* Security Headers */
app.use(helmet());
/* Request Body Size Limit */
app.use(express.json({
    limit: "10kb"
}));
/* Rate Limiting */
const registrationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message:
            "Too many registration attempts. Please try again later."
    }
});
/* Serve Frontend Files */
app.use(express.static(
    path.join(__dirname, "public")
));
/* Allowed Values */
const allowedEvents = [
    "DevOps Workshop",
    "AI Seminar",
    "Hackathon",
    "Technical Symposium"
];
const allowedGenders = [
    "Male",
    "Female",
    "Other"
];
/* Input Validation Function */
function validateRegistration(data) {
    if (
        !data ||
        typeof data.name !== "string" ||
        typeof data.email !== "string" ||
        typeof data.phone !== "string" ||
        typeof data.event !== "string" ||
        typeof data.gender !== "string"
    ) {
        return "Invalid registration data.";
    }
    const name = data.name.trim();
    const email = data.email.trim();
    const phone = data.phone.trim();
    /* Name Validation */
    if (name.length < 2 || name.length > 50) {
        return "Name must contain 2 to 50 characters.";
    }
    const namePattern =
        /^[a-zA-Z\s.'-]+$/;
    if (!namePattern.test(name)) {
        return "Name contains invalid characters.";
    }
    /* Email Validation */
    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
        !emailPattern.test(email) ||
        email.length > 100
    ) {
        return "Enter a valid email address.";
    }
    /* Phone Number Validation */
    if (!/^\d{10}$/.test(phone)) {
        return "Phone number must contain exactly 10 digits.";
    }
    /* Event Validation */
    if (!allowedEvents.includes(data.event)) {
        return "Invalid event selected.";
    }
    /* Gender Validation */
    if (!allowedGenders.includes(data.gender)) {
        return "Invalid gender selected.";
    }
    return null;
}
/* Registration API */
app.post(
    "/register",
    registrationLimiter,
    function (req, res) {
        const validationError =
            validateRegistration(req.body);
        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }
        const registration = {
            name: req.body.name.trim(),
            email:
                req.body.email
                    .trim()
                    .toLowerCase(),
            phone: req.body.phone.trim(),
            event: req.body.event,
            gender: req.body.gender,
            registeredAt:
                new Date().toISOString()
        };
        const databasePath = path.join(
            __dirname,
            "data",
            "registrations.txt"
        );
        const record =
            JSON.stringify(registration) + "\n";
        fs.appendFile(
            databasePath,
            record,
            {
                encoding: "utf8",
                flag: "a"
            },
            function (error) {
                if (error) {
                    console.error(
                        "Database write error:",
                        error
                    );
                    return res.status(500).json({
                        message:
                            "Registration could not be completed."
                    });
                }
                return res.status(201).json({
                    message:
                        "Registration completed successfully."
                });
            }
        );
    }
);
/* Handle Invalid URLs */
app.use(function (req, res) {
    res.status(404).json({
        message: "Resource not found."
    });
});
/* Start Server */
app.listen(PORT, function () {
    console.log(
        `Server running at http://localhost:${PORT}`
    );
});

