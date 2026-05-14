import svgCaptcha from 'svg-captcha';
import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("Enter CAPTCHA text: ", (userText) => {

    const captcha = svgCaptcha.create({
        size: userText.length,
        noise: 3,
        color: true,
        text: userText
    });

    fs.writeFileSync("captcha.svg", captcha.data);

    console.log("CAPTCHA generated successfully!");
    console.log("Saved as captcha.svg");

    rl.close();
});