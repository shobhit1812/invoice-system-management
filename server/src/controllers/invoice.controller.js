import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";

import { Invoice } from "../models/Invoice.js";
import { chartOfAccounts } from "../constants/index.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { estimateConfidence, isValidInvoice } from "../utils/invoice.js";

dotenv.config();

const uploadsDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, "uploads");
  },
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

export const upload = multer({ storage });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Build Prompt
const buildPrompt = (extractedText) => {
  return `
You are an intelligent Invoice Parser.

Here is the raw extracted text:
"""
${extractedText}
"""

Here is the available chart of accounts (JSON array), with code and name:
${JSON.stringify(chartOfAccounts, null, 2)}

Assign the best category from the chart of accounts for this transaction.
Respond EXACTLY in this JSON format:
{
  "vendor": "string",
  "date": "YYYY-MM-DD",
  "lineItems": [{"name":"string","price":number}],
  "category": {"code": number, "name": "string"},
  "total": number
}
`;
};

export const processInvoicesWithGemini = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send({ error: "No files uploaded" });
    }

    const results = [];
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    for (const file of req.files) {
      const absoluteFilePath = path.join(process.cwd(), file.path);
      const base64File = fs.readFileSync(absoluteFilePath).toString("base64");

      const prompt = buildPrompt("Extract text and structure this invoice.");
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: file.mimetype,
            data: base64File,
          },
        },
      ]);

      const textResult = result?.response?.text();
      let parsedData;

      try {
        parsedData = JSON.parse(textResult.trim());
      } catch {
        const match = textResult.match(/\{[\s\S]*\}/);
        parsedData = match ? JSON.parse(match[0]) : textResult;
      }

      if (
        typeof parsedData.confidenceScore !== "number" ||
        parsedData.confidenceScore > 1 ||
        parsedData.confidenceScore < 0
      ) {
        parsedData.confidenceScore = estimateConfidence(parsedData);
      }

      const missingFields = [];
      if (!parsedData.vendor) missingFields.push("vendor");
      if (!parsedData.date) missingFields.push("date");
      if (!parsedData.lineItems || parsedData.lineItems.length === 0) {
        missingFields.push("lineItems");
      }
      if (!parsedData.category) missingFields.push("category");

      if (!isValidInvoice(parsedData)) {
        console.warn(
          `Invalid invoice data for ${parsedData.vendor || "UNKNOWN"}`
        );
      }

      // Check for Duplicates
      const existingInvoice = await Invoice.findOne({
        vendor: parsedData.vendor || "UNKNOWN",
        date: parsedData.date || new Date(),
        total: parsedData.total || 0,
        "lineItems.name": {
          $all: parsedData.lineItems?.map((item) => item.name) || [],
        },
      });

      if (existingInvoice) {
        results.push({
          filename: file.originalname,
          parsedData: {
            ...parsedData,
            isDuplicate: true,
            existingInvoiceId: existingInvoice._id,
          },
        });
        fs.unlinkSync(absoluteFilePath);
        continue;
      }

      // Save New Invoice
      const savedInvoice = await Invoice.create({
        filename: file.originalname,
        vendor: parsedData.vendor || "UNKNOWN",
        date: parsedData.date || new Date(),
        lineItems: parsedData.lineItems || [],
        category: parsedData.category || {
          code: 0,
          name: "UNKNOWN",
        },
        total: parsedData.total || 0,
        confidenceScore: parsedData.confidenceScore,
        missingFields,
      });

      results.push({ filename: file.originalname, parsedData: savedInvoice });
      fs.unlinkSync(absoluteFilePath);
    }

    res.json({ results });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error: "Error extracting data with Gemini",
      details: error.message,
    });
  }
};

export const getAllInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const invoices = await Invoice.find().skip(skip).limit(limit);
    const total = await Invoice.countDocuments();

    res.json({
      invoices,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalInvoices: total,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ error: "Error fetching invoices", details: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).send({ error: "Invoice not found" });
    }

    res.json({ status: "ok", invoice });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

export const getBulkSummary = async (req, res) => {
  try {
    const totalsByCategory = await Invoice.aggregate([
      {
        $group: {
          _id: "$category.name",
          totalAmount: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ totalsByCategory });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

export const editInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).send({ error: "Invoice not found" });
    }

    // Push corrections if needed
    Object.keys(updates).forEach((field) => {
      if (invoice[field] && invoice[field] !== updates[field]) {
        invoice.corrections.push({
          field,
          oldValue: String(invoice[field]),
          newValue: String(updates[field]),
          date: new Date(),
        });
      }
    });

    // Apply direct edits
    for (const [key, value] of Object.entries(updates)) {
      if (key in invoice) {
        invoice[key] = value;
      }
    }

    await invoice.save();

    res.json({ status: "ok", invoice });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

export const deleteInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedInvoice = await Invoice.findByIdAndDelete(id);
    if (!deletedInvoice) {
      return res.status(404).send({ error: "Invoice not found" });
    }

    res.json({ status: "ok", deletedInvoice });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ error: "Error deleting invoice", details: error.message });
  }
};
