import svgCaptcha from "svg-captcha";
import fs from "fs";
import readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Take input from user
rl.question("Enter text to generate CAPTCHA: ", (originalText) => {

    const captcha = svgCaptcha.create({
        size: originalText.length,
        noise: 3,
        color: true,
        background: "#ffffff",
    });

    fs.writeFileSync("captcha.svg", captcha.data);

    console.log("\nCAPTCHA generated successfully!");
    console.log("Open captcha.svg to view it.\n");

    rl.question("Enter CAPTCHA text: ", (userInput) => {

        if (userInput.trim() === captcha.text.trim()) {

            console.log("\n✅ CAPTCHA Verified Successfully!");
            console.log(`CAPTCHA Text: ${captcha.text}`);
            console.log(`Original Text: ${originalText}`);

        } else {

            console.log("\n❌ Incorrect CAPTCHA!");
            console.log(`Correct CAPTCHA was: ${captcha.text}`);
            console.log(`Original Text: ${originalText}`);
        }

        rl.close();
    });
});