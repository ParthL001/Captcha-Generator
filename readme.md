# CAPTCHA Verification System

A Node.js based CAPTCHA Verification System built using the `svg-captcha` npm package.  
This project generates CAPTCHA SVG images dynamically and verifies user-entered CAPTCHA text through the command line interface.

---

## 📌 Features

- Generate CAPTCHA dynamically
- SVG-based CAPTCHA generation
- CAPTCHA verification system
- CLI-based interaction
- Random CAPTCHA generation using `svg-captcha`
- User input handling using `readline`
- Lightweight and beginner-friendly

---

## 🚀 Tech Stack

- JavaScript
- Node.js
- svg-captcha
- fs module
- readline module

---

## 📂 Project Structure

```txt
Captcha-generator/
│
├── index.js
├── captcha.svg
├── package.json
├── package-lock.json
└── README.md
```

---

## ⚙️ Installation

Clone the repository:

```bash
git clone https://github.com/ParthL001/Captcha-Generator.git
```

Move into the project directory:

```bash
cd Captcha-generator
```

Install dependencies:

```bash
npm install
```

---

## 📦 Dependencies

Install `svg-captcha` using:

```bash
npm install svg-captcha
```

---

## ▶️ Run the Project

Run the program using:

```bash
node index.js
```

---

## 🖥️ How It Works

1. User enters text
2. CAPTCHA SVG image is generated
3. CAPTCHA image is saved as `captcha.svg`
4. User opens the CAPTCHA image
5. User enters CAPTCHA text in terminal
6. Program verifies the CAPTCHA
7. Displays success or failure message

---

## 🧪 Example

```txt
Enter text to generate CAPTCHA: HELLO

CAPTCHA generated successfully!
Open captcha.svg to view it.

Enter CAPTCHA text: HELLO

✅ CAPTCHA Verified Successfully!
```

---

## 📸 Output

Generated Files:

- `captcha.svg` → Generated CAPTCHA image

---

## 📚 Learning Outcomes

This project helped in understanding:

- Node.js fundamentals
- ES Modules (`import/export`)
- Working with npm packages
- File handling using `fs`
- User input using `readline`
- CAPTCHA generation and verification
- SVG image creation

---

## ✨ Future Improvements

- Add random distortion effects
- Add noise lines and dots
- Create web-based version
- Add CAPTCHA expiration timer
- Add multiple verification attempts
- Convert SVG to PNG

---

## 👨‍💻 Author

PARTH LOKHANDE

---

## 📄 License

This project is open source and available under the MIT License.
