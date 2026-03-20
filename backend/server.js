require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const OpenAI = require("openai");
const path = require("path");
const db = require("./database");

const app = express();

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔗 Google Drive Links
const CV_LINK = "https://drive.google.com/file/d/1xBpKZDKyTvcuQF7HgUoU6wox5i9CJFPK/preview";
const RS_LINK = "https://drive.google.com/file/d/1zvi-BNUmgRU-iqxbwx3qC_qpKj7yLcVf/preview";

// Root
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// 🔐 Login
app.post("/login", (req, res) => {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      return res.status(400).json({ success: false });
    }

    if (
      id === process.env.ADMIN_ID &&
      password === process.env.ADMIN_PASSWORD
    ) {
      return res.json({ success: true });
    }

    return res.status(401).json({ success: false });

  } catch (error) {
    res.status(500).json({ success: false });
  }
});


// 🤖 EMAIL GENERATION (FIXED + CHEAP MODEL)
app.post("/generate-email", async (req, res) => {
  try {
    const { name, university } = req.body;
    const lastName = name.split(" ").slice(-1);

    const prompt = `
search for prof ${name} from ${university}, summarize his/her research, keep in mind. note his/her research summary and notable works.   

now generate highly personalized, professional, and persuasive emails to professors for PhD applications.   

You MUST strictly follow the structure, tone, and style of the template provided below.  

--------------------------------------------------  
TEMPLATE STYLE (MANDATORY)  
--------------------------------------------------  

Dear Prof. ${lastName},

I hope you are doing well.  

My name is Santanu Saha, and I am an international graduate in biotechnology from the Indian Institute of Technology Mandi (IIT Mandi). I recently came across your group’s research at ${university}, particularly your work on [research area]. I found the work deeply inspiring.  

I was especially fascinated by [recent work]. These efforts to [describe impact or approach] align very closely with my research interests.  

During my Master's, I worked on COF nanoparticles for drug delivery. I gained hands-on experience in nanoparticle synthesis, spectroscopic characterization, and in vitro assays. I am passionate about applying nanomaterials to solve challenges in drug delivery, biomaterials, and tissue engineering. I am also proficient in Python for automating data analysis and visualization workflows. Here is a visual abstract of my master's project: [image.png]  

I am currently seeking a PhD opportunity, and I would be very grateful for the chance to learn more about your ongoing projects and to discuss how my background could contribute to your lab. I am attaching my CV and a summary of my research experience to this email.  

Thank you for your time and consideration. I look forward to hearing from you.  

--------------------------------------------------  
STRICT RULES  
--------------------------------------------------  

1. PERSONALIZATION IS CRITICAL  
2. USE REAL RESEARCH FROM WEB  
3. DO NOT HALLUCINATE  
4. KEEP STRUCTURE EXACT  
5. 180–250 WORDS  
6. OUTPUT ONLY EMAIL. NO NEED OF ANY SOURCE LINKS  
7. DO NOT USE LONG HYPHEN (—)
--------------------------------------------------
SUBJECT LINE INSTRUCTION
--------------------------------------------------

Also generate a subject line.

Rules:
- Format: "Prospective PhD Student Interested in [topic]"
- Topic must be 3–4 words ONLY
- Clean and concise

--------------------------------------------------
OUTPUT FORMAT (STRICT)
--------------------------------------------------

SUBJECT:
<subject line>

EMAIL:
<full email>
`;

const response = await client.responses.create({
  model: "gpt-5.2",
  tools: [{ type: "web_search" }],
  input: prompt,
  temperature: 0.7,
  top_p: 1,
  presence_penalty: 0.2,
  frequency_penalty: 0.2,
});

// ✅ Robust extraction
const output =
  response.output_text ||
  response.output?.map(o =>
    o.content?.map(c => c.text).join("")
  ).join("") ||
  "";

console.log("AI OUTPUT:", output);

if (!output) {
  return res.status(500).json({
    success: false,
    error: "Empty AI response",
  });
}

// SUBJECT
const subjectMatch = output.match(/SUBJECT:\s*(.*)/i);
const subject = subjectMatch
  ? subjectMatch[1].trim()
  : "Prospective PhD Student Interested in Nanomaterials";

// EMAIL
const emailMatch = output.match(/EMAIL:\s*([\s\S]*)/i);
const email = emailMatch ? emailMatch[1].trim() : output;


// const response = await client.responses.create({
    //   model: "gpt-5.2",
    //   tools: [{ type: "web_search" }],
    //   input: prompt,
    //   temperature: 0.7,
    //   top_p: 1,
    //   presence_penalty: 0.2,
    //   frequency_penalty: 0.2,
    // });

    // // ✅ SAFE extraction
    // const output =
    //   response.output?.[0]?.content?.[0]?.text || "";

    // if (!output) {
    //   return res.status(500).json({
    //     success: false,
    //     error: "AI returned empty response",
    //   });
    // }

    // // SUBJECT
    // const subjectMatch = output.match(/SUBJECT:\s*(.*)/i);
    // const subject = subjectMatch
    //   ? subjectMatch[1].trim()
    //   : "Prospective PhD Student Interested in Nanomaterials";

    // // EMAIL
    // const emailMatch = output.match(/EMAIL:\s*([\s\S]*)/i);
    // const email = emailMatch ? emailMatch[1].trim() : output;

    res.json({
      success: true,
      subject,
      body: email,
    });

  } catch (err) {
    console.error("Generate error:", err);
    res.status(500).json({ success: false });
  }
});


// 📧 SEND EMAIL (STABLE VERSION)
app.post("/send-email", async (req, res) => {
  try {
    const { to, subject, body, name, university } = req.body;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // IMPORTANT: false for 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      family: 4, // 🔥 FORCE IPv4 (CRITICAL FIX)
    });    
    // const transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASS,
    //   },
    // });

    // 🔁 Replace placeholders safely
    let htmlBody = body
      .replace(/\n/g, "<br>")
      .replace(
        "[image.png]",
        `<br><img src="cid:visualabstract" style="max-width:500px;" /><br>`
      );

    // ✅ Robust CV replacement (regex)
    htmlBody = htmlBody.replace(
      /I am attaching my CV.*?email\./i,
      `You can find my <a href="${CV_LINK}" target="_blank"><strong>CV</strong></a> and <a href="${RS_LINK}" target="_blank"><strong>research summary</strong></a> here.`
    );

    // ✅ Signature block
    const SIGNATURE = `
      <br><br>
      <strong>Santanu Saha</strong><br>
      email: <a href="mailto:santanu.bt15@gmail.com">santanu.bt15@gmail.com</a><br>
      <a href="mailto:santanu.biomat@gmail.com">santanu.biomat@gmail.com</a><br>
      <a href="https://linkedin.com/in/sahanion" target="_blank">LinkedIn</a> • 
      <a href="https://x.com/sprtl_crocodile" target="_blank">X</a>
      <br><br>
      <img src="cid:signature" style="max-width:500px;" />
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: `
        ${htmlBody}
        ${SIGNATURE}
      `,
      
      attachments: [
        {
          filename: "visual.png",
          path: path.join(__dirname, "files", "visual.png"),
          cid: "visualabstract",
        },
        {
          filename: "signature.jpg",
          path: path.join(__dirname, "files", "signature.jpg"),
          cid: "signature",
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    // 📊 Log

    const ip = req.ip;

      db.prepare(`
        INSERT INTO mail_logs 
        (professor_name, university, email, attempts, ip, location) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(name, university, to, 1, ip, "Unknown");

    res.json({ success: true });

  } catch (err) {
    console.error("Send error:", err);
    res.status(500).json({ success: false });
  }
});


// 📊 LOGS
// app.get("/logs", (req, res) => {
//   db.all("SELECT * FROM mail_logs ORDER BY timestamp DESC", [], (err, rows) => {
//     if (err) return res.status(500).json({ success: false });

//     res.json({
//       success: true,
//       logs: rows,
//     });
//   });
// });
// const rows = db.prepare(
//   "SELECT * FROM mail_logs ORDER BY timestamp DESC"
// ).all();

// res.json({
//   success: true,
//   logs: rows,
// });


// 📊 LOGS
app.get("/logs", (req, res) => {
  try {
    const rows = db.prepare(
      "SELECT * FROM mail_logs ORDER BY timestamp DESC"
    ).all();

    res.json({
      success: true,
      logs: rows,
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// 🚀 START
// const PORT = 5000;
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});







// require("dotenv").config();

// const express = require("express");
// const cors = require("cors");
// const nodemailer = require("nodemailer");
// const OpenAI = require("openai");
// const path = require("path");
// const db = require("./database");

// const app = express();

// app.use(cors());
// app.use(express.json());

// const client = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // 🔗 Google Drive Links
// const CV_LINK = "https://drive.google.com/file/d/1xBpKZDKyTvcuQF7HgUoU6wox5i9CJFPK/preview";
// const RS_LINK = "https://drive.google.com/file/d/1zvi-BNUmgRU-iqxbwx3qC_qpKj7yLcVf/preview";

// // Root
// app.get("/", (req, res) => {
//   res.send("Backend is running");
// });

// // 🔐 Login
// app.post("/login", (req, res) => {
//   try {
//     const { id, password } = req.body;

//     if (!id || !password) {
//       return res.status(400).json({ success: false });
//     }

//     if (
//       id === process.env.ADMIN_ID &&
//       password === process.env.ADMIN_PASSWORD
//     ) {
//       return res.json({ success: true });
//     }

//     return res.status(401).json({ success: false });

//   } catch (error) {
//     res.status(500).json({ success: false });
//   }
// });


// // 🤖 EMAIL GENERATION
// app.post("/generate-email", async (req, res) => {
//   try {
//     const { name, university } = req.body;
//     const lastName = name.split(" ").slice(-1);

//     const prompt = `
// search for prof ${name} from ${university}, summarize his/her research.

// Generate a highly personalized PhD email using this structure:

// Dear Prof. ${lastName},

// I hope you are doing well.  

// My name is Santanu Saha, and I am an international graduate in biotechnology from IIT Mandi. I recently came across your research at ${university}, particularly your work on [research area].

// I was especially fascinated by [recent work]. These efforts align closely with my research interests.

// During my Master's, I worked on COF nanoparticles for drug delivery. I have experience in nanoparticle synthesis, spectroscopic characterization, and in vitro assays. I also use Python for data analysis.

// Here is a visual abstract: [image.png]

// I am currently seeking a PhD opportunity and would love to discuss how I can contribute to your lab.

// Thank you for your time.

// --------------------------------------------------

// Rules:
// - 140–180 words
// - No hallucination
// - Strict structure
// - No links
// - No long hyphen

// --------------------------------------------------

// Output format:

// SUBJECT:
// ...

// EMAIL:
// ...
// `;

//     const response = await client.responses.create({
//       model: "gpt-5.2",
//       tools: [{ type: "web_search" }],
//       input: prompt,
//       temperature: 0.7,
//     });

//     const output = response.output_text || "";

//     const subjectMatch = output.match(/SUBJECT:\s*(.*)/i);
//     const subject = subjectMatch
//       ? subjectMatch[1].trim()
//       : "Prospective PhD Student";

//     const emailMatch = output.match(/EMAIL:\s*([\s\S]*)/i);
//     const email = emailMatch ? emailMatch[1].trim() : output;

//     res.json({
//       success: true,
//       subject,
//       body: email,
//     });

//   } catch (err) {
//     console.error("Generate error:", err);
//     res.status(500).json({ success: false });
//   }
// });


// // 📧 SEND EMAIL
// app.post("/send-email", async (req, res) => {
//   try {
//     const { to, subject, body, name, university } = req.body;

//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     // Replace placeholders
//     let htmlBody = body
//       .replace(/\n/g, "<br>")
//       .replace(
//         "[image.png]",
//         `<br><img src="cid:visualabstract" style="max-width:500px;" /><br>`
//       );

//     // Replace CV line
//     htmlBody = htmlBody.replace(
//       /I am attaching my CV.*?email\./i,
//       `You can find my <a href="${CV_LINK}" target="_blank"><strong>CV</strong></a> and <a href="${RS_LINK}" target="_blank"><strong>research summary</strong></a> here.`
//     );

//     // Signature
//     const SIGNATURE = `
//       <br><br>
//       <strong>Santanu Saha</strong><br>
//       santanu.bt15@gmail.com<br>
//       santanu.biomat@gmail.com<br>
//       <a href="https://linkedin.com/in/sahanion">LinkedIn</a>
//       <br><br>
//       <img src="cid:signature" style="max-width:500px;" />
//     `;

//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to,
//       subject,
//       html: htmlBody + SIGNATURE,
//       attachments: [
//         {
//           filename: "visual.png",
//           path: path.join(__dirname, "files", "visual.png"),
//           cid: "visualabstract",
//         },
//         {
//           filename: "signature.jpg",
//           path: path.join(__dirname, "files", "signature.jpg"),
//           cid: "signature",
//         },
//       ],
//     };

//     await transporter.sendMail(mailOptions);

//     // 🌐 IP fix for Render
//     const ip =
//       req.headers["x-forwarded-for"] || req.socket.remoteAddress;

//     // Log
//     db.prepare(`
//       INSERT INTO mail_logs 
//       (professor_name, university, email, attempts, ip, location) 
//       VALUES (?, ?, ?, ?, ?, ?)
//     `).run(name, university, to, 1, ip, "Unknown");

//     res.json({ success: true });

//   } catch (err) {
//     console.error("Send error:", err);
//     res.status(500).json({ success: false });
//   }
// });


// // 📊 LOGS (FIXED)
// app.get("/logs", (req, res) => {
//   try {
//     const rows = db.prepare(
//       "SELECT * FROM mail_logs ORDER BY timestamp DESC"
//     ).all();

//     res.json({
//       success: true,
//       logs: rows,
//     });

//   } catch (err) {
//     res.status(500).json({ success: false });
//   }
// });


// // 🚀 START
// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });








// require("dotenv").config();

// const express = require("express");
// const cors = require("cors");
// const nodemailer = require("nodemailer");
// const OpenAI = require("openai");
// const path = require("path");
// const fs = require("fs");
// const db = require("./database"); // now better-sqlite3 instance

// const app = express();

// app.use(cors());
// app.use(express.json());

// const client = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // Root
// app.get("/", (req, res) => {
//   res.send("Backend is running");
// });

// // 🔐 Login
// app.post("/login", (req, res) => {
//   try {
//     const { id, password } = req.body;

//     if (!id || !password) {
//       return res.status(400).json({ success: false });
//     }

//     if (
//       id === process.env.ADMIN_ID &&
//       password === process.env.ADMIN_PASSWORD
//     ) {
//       return res.json({ success: true });
//     }

//     return res.status(401).json({ success: false });

//   } catch (error) {
//     res.status(500).json({ success: false });
//   }
// });


// // 🤖 EMAIL GENERATION (UNCHANGED)
// app.post("/generate-email", async (req, res) => {
//   try {
//     const { name, university } = req.body;

//     const lastName = name.split(" ").slice(-1);

//     const prompt = `
// search for prof ${name} from ${university}, summarize his/her research, keep in mind. note his/her research summary and notable works.   

// now generate highly personalized, professional, and persuasive emails to professors for PhD applications.   

// You MUST strictly follow the structure, tone, and style of the template provided below.  

// --------------------------------------------------  
// TEMPLATE STYLE (MANDATORY)  
// --------------------------------------------------  

// Dear Prof. ${lastName},

// I hope you are doing well.  

// My name is Santanu Saha, and I am an international graduate in biotechnology from the Indian Institute of Technology Mandi (IIT Mandi). I recently came across your group’s research at ${university}, particularly your work on [research area]. I found the work deeply inspiring.  

// I was especially fascinated by [recent work]. These efforts to [describe impact or approach] align very closely with my research interests.  

// During my Master's, I worked on COF nanoparticles for drug delivery. I gained hands-on experience in nanoparticle synthesis, spectroscopic characterization, and in vitro assays. I am passionate about applying nanomaterials to solve challenges in drug delivery, biomaterials, and tissue engineering. I am also proficient in Python for automating data analysis and visualization workflows. Here is a visual abstract of my master's project: [image.png]  

// I am currently seeking a PhD opportunity, and I would be very grateful for the chance to learn more about your ongoing projects and to discuss how my background could contribute to your lab. I am attaching my CV and a summary of my research experience to this email.  

// Thank you for your time and consideration. I look forward to hearing from you.  

// Kind regards,  

// --------------------------------------------------  
// STRICT RULES  
// --------------------------------------------------  

// 1. PERSONALIZATION IS CRITICAL  
// 2. USE REAL RESEARCH FROM WEB  
// 3. DO NOT HALLUCINATE  
// 4. KEEP STRUCTURE EXACT  
// 5. 180–250 WORDS  
// 6. OUTPUT ONLY EMAIL  
// 7. EMAIL IN PLAIN TEXT  

// --------------------------------------------------
// SUBJECT LINE INSTRUCTION
// --------------------------------------------------

// Also generate a subject line.

// Rules:
// - Format: "Prospective PhD Student Interested in [topic]"
// - Topic must be 3–4 words ONLY
// - Clean and concise

// --------------------------------------------------
// OUTPUT FORMAT (STRICT)
// --------------------------------------------------

// SUBJECT:
// <subject line>

// EMAIL:
// <full email>
// `;

//     const response = await client.responses.create({
//       model: "gpt-5.2",
//       tools: [{ type: "web_search" }],
//       input: prompt,
//       temperature: 0.7,
//       top_p: 1,
//       presence_penalty: 0.2,
//       frequency_penalty: 0.2,
//     });

//     const output = response.output_text || "";

//     const subjectMatch = output.match(/SUBJECT:\s*(.*)/i);
//     const subject = subjectMatch
//       ? subjectMatch[1].trim()
//       : "Prospective PhD Student Interested in Nanomaterials";

//     const emailMatch = output.match(/EMAIL:\s*([\s\S]*)/i);
//     const email = emailMatch ? emailMatch[1].trim() : output;

//     res.json({
//       success: true,
//       subject,
//       body: email,
//     });

//   } catch (err) {
//     console.error("Generate error:", err);
//     res.status(500).json({ success: false });
//   }
// });


// // 📧 SEND EMAIL (UPDATED DB PART ONLY)
// app.post("/send-email", async (req, res) => {
//   try {
//     const { to, subject, body, name, university } = req.body;

//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     const basePath = path.resolve(__dirname, "files");

//     const visualPath = path.join(basePath, "visual.png");
//     const cvPath = path.join(basePath, "CV.pdf");
//     const rsPath = path.join(basePath, "research_summary.pdf");

//     if (!fs.existsSync(cvPath) || !fs.existsSync(rsPath)) {
//       return res.status(500).json({
//         success: false,
//         error: "Attachment files missing",
//       });
//     }

//     const htmlBody = body
//       .replace(/\n/g, "<br>")
//       .replace(
//         "[image.png]",
//         `<br><img src="cid:visualabstract" style="max-width:500px;" /><br>`
//       );

//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to,
//       subject,
//       html: `
//         <p>${htmlBody}</p>
//         <br><br>
//         <p>Kind regards,<br>Santanu Saha</p>
//       `,
//       attachments: [
//         { filename: "visual.png", path: visualPath, cid: "visualabstract" },
//         { filename: "CV.pdf", path: cvPath },
//         { filename: "research_summary.pdf", path: rsPath },
//       ],
//     };

//     await transporter.sendMail(mailOptions);

//     // ✅ FIXED FOR better-sqlite3
//     const ip = req.ip;

//     db.prepare(`
//       INSERT INTO mail_logs 
//       (professor_name, university, email, attempts, ip, location) 
//       VALUES (?, ?, ?, ?, ?, ?)
//     `).run(name, university, to, 1, ip, "Unknown");

//     res.json({ success: true });

//   } catch (err) {
//     console.error("Send error:", err);
//     res.status(500).json({ success: false });
//   }
// });


// 📊 LOGS (FIXED)
// app.get("/logs", (req, res) => {
//   try {
//     const rows = db.prepare(
//       "SELECT * FROM mail_logs ORDER BY timestamp DESC"
//     ).all();

//     res.json({
//       success: true,
//       logs: rows,
//     });
//   } catch (err) {
//     res.status(500).json({ success: false });
//   }
// });


// // 🚀 START
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });