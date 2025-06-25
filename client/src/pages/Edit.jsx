import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { TailSpin } from "react-loader-spinner";

const Edit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await axios.get(
          `http://localhost:4001/api/invoice/${id}`
        );
        setInvoice(response.data.invoice);
      } catch (error) {
        console.error(error);
        alert("Error fetching invoice");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInvoice((prev) => ({ ...prev, [name]: value }));
  };

  const handleLineItemChange = (index, field, value) => {
    const updatedItems = [...invoice.lineItems];
    updatedItems[index][field] = value;
    setInvoice({ ...invoice, lineItems: updatedItems });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.put(`http://localhost:4001/api/invoice/${id}`, invoice);
      alert("Invoice updated successfully");
      navigate("/");
    } catch (error) {
      alert(error?.response?.data?.error || "Error updating invoice");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <TailSpin
          height="80"
          width="80"
          color="#3b82f6"
          ariaLabel="tail-spin-loading"
        />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-lg bg-white p-6 rounded-lg shadow">
          No data found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-100 p-4 sm:p-6">
      <div className="w-full sm:max-w-2xl bg-white rounded-xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Edit Invoice
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Vendor
            </label>
            <input
              name="vendor"
              value={invoice.vendor || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={
                invoice.date
                  ? new Date(invoice.date).toISOString().split("T")[0]
                  : ""
              }
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Total
            </label>
            <input
              type="number"
              step="0.01"
              name="total"
              value={invoice.total || 0}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Line Items
            </label>
            <div className="space-y-2">
              {invoice.lineItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Name"
                    value={item.name}
                    onChange={(e) =>
                      handleLineItemChange(index, "name", e.target.value)
                    }
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={item.price}
                    onChange={(e) =>
                      handleLineItemChange(
                        index,
                        "price",
                        Number(e.target.value)
                      )
                    }
                    className="w-24 px-3 py-2 border rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Category
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="category.code"
                value={invoice.category.code || 0}
                onChange={(e) =>
                  setInvoice({
                    ...invoice,
                    category: {
                      ...invoice.category,
                      code: Number(e.target.value),
                    },
                  })
                }
                className="w-24 px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                name="category.name"
                value={invoice.category.name || ""}
                onChange={(e) =>
                  setInvoice({
                    ...invoice,
                    category: {
                      ...invoice.category,
                      name: e.target.value,
                    },
                  })
                }
                className="flex-1 px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-8">
          <button
            onClick={() => navigate("/")}
            className="bg-gray-300 text-gray-800 rounded-lg px-5 py-2 hover:bg-gray-400 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white rounded-lg px-5 py-2 hover:bg-blue-700 disabled:bg-blue-400 transition cursor-pointer"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Edit;
