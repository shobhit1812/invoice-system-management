import axios from "axios";
import * as XLSX from "xlsx";

import { saveAs } from "file-saver";
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { TailSpin } from "react-loader-spinner";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Upload,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const Home = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const [totalPages, setTotalPages] = useState(1);
  const [expandedRows, setExpandedRows] = useState({});
  const navigate = useNavigate();

  const handleDownloadExcel = () => {
    if (!invoices.length) return alert("No invoices to download");

    const data = invoices.map((invoice) => ({
      Vendor: invoice.vendor,
      Date: new Date(invoice.date).toLocaleDateString(),
      Total: invoice.total,
      Category: invoice.category?.name || "",
      "Line Items": invoice.lineItems
        .map((item) => `${item.name}: $${item.price}`)
        .join(", "),
      "Confidence Score": invoice.confidenceScore,
      "Missing Fields": invoice.missingFields.join(", "),
      "Created At": new Date(invoice.createdAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `invoices_page_${page}.xlsx`);
  };

  const fetchInvoices = async (pageNum) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/invoices?page=${pageNum}`
      );
      setInvoices(response.data.invoices || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error(error);
      alert("Error fetching invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/api/invoice/${id}`
      );
      fetchInvoices();
    } catch (error) {
      console.error(error);
      alert("Error deleting the invoice");
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit/${id}`);
  };

  const onDrop = async (acceptedFiles) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  };

  const removeFile = (name) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const handleUpload = async () => {
    if (!files.length) return;

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/process-invoices`,
        formData
      );
      await fetchInvoices(page);
      setFiles([]);
    } catch {
      alert("Error uploading files");
      alert("Try Again... May be server slow");
      await fetchInvoices(page);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getBackgroundColor = (score, missingFields) => {
    if (missingFields?.includes("UNKNOWN")) return "bg-red-100";
    if (score >= 0.75) return "bg-green-50";
    if (score >= 0.5) return "bg-yellow-50";
    return "bg-red-50";
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  useEffect(() => {
    fetchInvoices(page);
  }, [page]);

  return (
    <div className="min-h-screen px-4 py-6 bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-blue-800 mb-10">
          Invoice Management System
        </h1>

        {/* Upload Box */}
        <div className="flex justify-center mb-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 w-full sm:w-1/2 text-center transition-all duration-200 shadow-lg
              ${
                isDragActive
                  ? "border-blue-500 bg-blue-100"
                  : "border-blue-300 bg-white"
              }
              hover:border-blue-400 hover:bg-blue-50 cursor-pointer`}
          >
            <input {...getInputProps()} />
            <Upload className="w-10 h-10 mx-auto text-blue-500 mb-2" />
            <p className="text-blue-600 font-semibold">
              {isDragActive
                ? "Drop files here"
                : "Drag & drop invoices or click to upload"}
            </p>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mb-6 bg-white p-4 rounded-lg shadow space-y-2">
            {files.map((file) => (
              <div
                key={file.name}
                className="flex justify-between items-center text-gray-700 bg-gray-100 px-4 py-2 rounded-lg"
              >
                <span className="truncate w-5/6">{file.name}</span>
                <button
                  onClick={() => removeFile(file.name)}
                  className="text-red-500 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium mt-2 cursor-pointer"
              onClick={handleUpload}
            >
              Upload Files
            </button>
          </div>
        )}

        {/* Invoice Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <TailSpin height="60" width="60" color="#3b82f6" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center text-gray-600 py-12 bg-white rounded-xl shadow">
            No invoices available
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl shadow-lg bg-white">
            <table className="w-full table-auto text-sm">
              <thead className="bg-blue-100">
                <tr>
                  <th className="p-4 text-left font-semibold text-blue-700">
                    Vendor
                  </th>
                  <th className="p-4 text-left font-semibold text-blue-700">
                    Date
                  </th>
                  <th className="p-4 text-left font-semibold text-blue-700">
                    Total
                  </th>
                  <th className="p-4 text-left font-semibold text-blue-700">
                    Category
                  </th>
                  <th className="p-4 text-left font-semibold text-blue-700">
                    Line Items
                  </th>
                  <th className="p-4 text-left font-semibold text-blue-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice._id}
                    className={`border-t transition-all duration-200 ${getBackgroundColor(
                      invoice.confidenceScore,
                      invoice.missingFields
                    )}`}
                  >
                    <td className="p-4 text-gray-800 font-medium">
                      {invoice.vendor}
                      {invoice.missingFields?.includes("vendor") && (
                        <span className="ml-2 text-xs text-red-500">
                          Missing
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-600">
                      {new Date(invoice.date).toLocaleDateString()}
                      {invoice.missingFields?.includes("date") && (
                        <span className="ml-2 text-xs text-red-500">
                          Missing
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-800">
                      ${invoice.total}
                      {invoice.missingFields?.includes("total") && (
                        <span className="ml-2 text-xs text-red-500">
                          Missing
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-600">
                      {invoice.category?.name || "—"}
                      {invoice.missingFields?.includes("category") && (
                        <span className="ml-2 text-xs text-red-500">
                          Missing
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-blue-600">
                      <button
                        onClick={() => toggleRow(invoice._id)}
                        className="flex items-center hover:underline"
                      >
                        {expandedRows[invoice._id] ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                        <span className="ml-1">Details</span>
                      </button>
                      {expandedRows[invoice._id] && (
                        <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
                          {invoice.lineItems?.length ? (
                            invoice.lineItems.map((item) => (
                              <li key={item._id}>
                                {item.name}: ${item.price}
                              </li>
                            ))
                          ) : (
                            <li className="text-red-500">No line items</li>
                          )}
                        </ul>
                      )}
                    </td>
                    <td className="p-4 flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleEdit(invoice._id)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(invoice._id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-center items-center gap-2 p-4 bg-blue-50 border-t">
              <button
                onClick={() => setSearchParams({ page: Math.max(page - 1, 1) })}
                disabled={page === 1}
                className="p-2 rounded bg-blue-600 text-white disabled:bg-gray-400 hover:bg-blue-700 cursor-pointer"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-blue-700 font-medium">
                {page} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setSearchParams({ page: Math.min(page + 1, totalPages) })
                }
                disabled={page === totalPages}
                className="p-2 rounded bg-blue-600 text-white disabled:bg-gray-400 hover:bg-blue-700 cursor-pointer"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
        <div className="flex justify-end mt-5 p-2">
          <div className="space-x-2">
            {invoices.length ? (
              <>
                <button
                  onClick={() => navigate("/summary")}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-400 cursor-pointer"
                >
                  Get Summary
                </button>
                <button
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-400 cursor-pointer"
                  onClick={handleDownloadExcel}
                >
                  Download Excel
                </button>
              </>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
