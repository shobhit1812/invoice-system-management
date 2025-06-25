export const estimateConfidence = (parsedData) => {
  let score = 1.0;

  if (!parsedData.vendor) score -= 0.25;
  if (!parsedData.date) score -= 0.25;
  if (!parsedData.lineItems || parsedData.lineItems.length === 0) score -= 0.25;
  if (!parsedData.category) score -= 0.25;

  return Math.max(score, 0.1);
};

export const isValidInvoice = (data) => {
  if (!data.vendor || !data.date || !data.lineItems?.length || !data.category) {
    return false;
  }
  if (isNaN(new Date(data.date).getTime())) {
    return false;
  }
  if (!data.lineItems.every((item) => typeof item.price === "number")) {
    return false;
  }
  return true;
};
