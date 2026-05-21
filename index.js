import svgCaptcha from "svg-captcha";
import fs from "fs";
import readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Take input from user
rl.question("Enter text to generate CAPTCHA: ", (originalText) => {

    // Generate CAPTCHA
    const captcha = svgCaptcha.create({
        size: originalText.length,
        noise: 3,
        color: true,
        background: "#000",
        charPreset: originalText
    });

    // Save CAPTCHA image
    fs.writeFileSync("captcha.svg", captcha.data);

    console.log("\nCAPTCHA generated successfully!");
    console.log("Open captcha.svg to view it.\n");

    // Ask user to enter CAPTCHA
    rl.question("Enter CAPTCHA text: ", (userInput) => {

        if (userInput.trim() === captcha.text.trim()) {

            console.log("\n✅ CAPTCHA Verified Successfully!");
            console.log(`CAPTCHA Text: ${captcha.text}`);

        } else {

            console.log("\n❌ Incorrect CAPTCHA!");
            console.log(`Correct CAPTCHA was: ${captcha.text}`);
        }

        rl.close();
    });
});