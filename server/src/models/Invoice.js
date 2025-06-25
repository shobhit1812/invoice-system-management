import mongoose from "mongoose";

const lineItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
});

const invoiceSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    vendor: { type: String, required: true },
    date: { type: Date, required: true },
    lineItems: [lineItemSchema],
    category: {
      code: { type: Number, required: true },
      name: { type: String, required: true },
    },
    total: { type: Number, required: true },
    confidenceScore: { type: Number, default: 1.0 },
    corrections: [
      { field: String, oldValue: String, newValue: String, date: Date },
    ],
    missingFields: [{ type: String }],
  },
  { timestamps: true }
);

export const Invoice = mongoose.model("Invoice", invoiceSchema);
