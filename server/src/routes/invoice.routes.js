import { Router } from "express";
import {
  upload,
  processInvoicesWithGemini,
  getAllInvoices,
  getInvoiceById,
  getBulkSummary,
  editInvoice,
  deleteInvoiceById,
} from "../controllers/invoice.controller.js";

const router = Router();

router.post(
  "/process-invoices",
  upload.array("files"),
  processInvoicesWithGemini
);
router.get("/invoice/summaries", getBulkSummary);
router.get("/invoice/:id", getInvoiceById);
router.put("/invoice/:id", editInvoice);
router.delete("/invoice/:id", deleteInvoiceById);
router.get("/invoices", getAllInvoices);

export default router;
