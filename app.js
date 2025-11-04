require("dotenv").config();
const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static("public"));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"), false);
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

sequelize
  .sync()
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.log(err);
  });

//   model schema
const post = sequelize.define("post", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// CSV Upload model
const csvUpload = sequelize.define("csvUpload", {
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  filepath: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  filesize: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  uploadType: {
    type: DataTypes.ENUM("file", "url"),
    allowNull: false,
  },
  sourceUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rowCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/create-post", async (req, res) => {
  const { title, content } = req.body;
  try {
    const newPost = await post.create({ title, content });
    res.json(newPost);
  } catch (err) {
    console.log(err);
  }
});

app.get("/get-posts", async (req, res) => {
  try {
    const allPosts = await post.findAll();
    res.json(allPosts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// CSV Upload endpoint - File upload
app.post("/api/upload-csv", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Parse CSV and count rows
    const results = [];
    let rowCount = 0;

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (data) => {
        results.push(data);
        rowCount++;
      })
      .on("end", async () => {
        try {
          // Save upload record to database
          const uploadRecord = await csvUpload.create({
            filename: req.file.originalname,
            filepath: req.file.path,
            filesize: req.file.size,
            uploadType: "file",
            rowCount: rowCount,
          });

          res.json({
            message: "File uploaded successfully",
            uploadId: uploadRecord.id,
            filename: req.file.originalname,
            rowCount: rowCount,
          });
        } catch (dbError) {
          console.error("Database error:", dbError);
          res.status(500).json({ error: "Failed to save upload record" });
        }
      })
      .on("error", (error) => {
        console.error("CSV parsing error:", error);
        fs.unlinkSync(req.file.path); // Delete file on error
        res.status(400).json({ error: "Invalid CSV file" });
      });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// CSV Upload endpoint - URL upload
app.post("/api/upload-csv-url", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Download file from URL
    const response = await axios({
      url: url,
      method: "GET",
      responseType: "stream",
      timeout: 30000, // 30 second timeout
    });

    // Generate filename
    const filename = path.basename(new URL(url).pathname) || `upload-${Date.now()}.csv`;
    const filepath = path.join(__dirname, "public", "uploads", filename);

    // Save file
    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);

    writer.on("finish", async () => {
      try {
        const stats = fs.statSync(filepath);
        const filesize = stats.size;

        // Parse CSV and count rows
        const results = [];
        let rowCount = 0;

        fs.createReadStream(filepath)
          .pipe(csv())
          .on("data", (data) => {
            results.push(data);
            rowCount++;
          })
          .on("end", async () => {
            try {
              // Save upload record to database
              const uploadRecord = await csvUpload.create({
                filename: filename,
                filepath: filepath,
                filesize: filesize,
                uploadType: "url",
                sourceUrl: url,
                rowCount: rowCount,
              });

              res.json({
                message: "File uploaded successfully from URL",
                uploadId: uploadRecord.id,
                filename: filename,
                rowCount: rowCount,
              });
            } catch (dbError) {
              console.error("Database error:", dbError);
              fs.unlinkSync(filepath); // Delete file on error
              res.status(500).json({ error: "Failed to save upload record" });
            }
          })
          .on("error", (error) => {
            console.error("CSV parsing error:", error);
            fs.unlinkSync(filepath); // Delete file on error
            res.status(400).json({ error: "Invalid CSV file" });
          });
      } catch (error) {
        console.error("File processing error:", error);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
        res.status(500).json({ error: "Failed to process file" });
      }
    });

    writer.on("error", (error) => {
      console.error("File save error:", error);
      res.status(500).json({ error: "Failed to save file" });
    });
  } catch (err) {
    console.error("URL upload error:", err);
    if (err.response) {
      res.status(err.response.status || 500).json({ error: "Failed to download file from URL" });
    } else {
      res.status(500).json({ error: "Upload failed" });
    }
  }
});

// Get all CSV uploads
app.get("/api/csv-uploads", async (req, res) => {
  try {
    const uploads = await csvUpload.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(uploads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch uploads" });
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
