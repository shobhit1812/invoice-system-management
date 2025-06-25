# 🧾 Invoice Management System

An end-to-end application that extracts data from invoices (PDFs/images), parses them into structured formats, stores them in MongoDB, categorizes them, and allows manual edits and summary generation.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB (local or Atlas)
- `pnpm` or `npm`
- Google Gemini API Key (for extraction)

### Installation

```bash
git clone https://github.com/shobhit1812/invoice-system-mgmt.git
cd invoice-system-mgmt-backend
Create a .env file inside invoice-system-mgmt-backend/ and add the following:
    - PORT=4001
    - CORS_ORIGIN=*
    - GEMINI_API_KEY=api_key
    - MONGODB_URL=mongo_uri
pnpm install # or npm install

# Start backend
pnpm start
```

## Technical Approach And Key Decisions

1. Used React.js + Tailwind CSS for a clean, responsive frontend experience.

2. Built the backend using Express.js and MongoDB for fast development and flexible data storage.

3. Integrated Google Gemini API to extract and structure invoice data from PDFs and images.

4. Calculated a confidence score based on how complete the extracted data is (vendor, date, line items, category).

5. Built a summary endpoint to group total spend by category for quick insights.

6. Added drag-and-drop invoice uploading with duplicate detection to avoid saving the same invoice twice.

7. Designed with modularity in mind: easy to scale or plug in different AI models later.

## Trade-offs

1. Used Google Gemini instead of Tesseract OCR: Gemini gives more structured output but comes with API limits and requires internet. Local OCR would be free but messier.

2. Didn’t implement full user auth system: Kept the focus on invoice processing; adding login/signup would’ve taken time away from the core functionality.

3. Data stored directly from AI response: We rely on Gemini’s format — safer with a schema validation layer, but we trusted the structure to save dev time.

4. Excel export is frontend-only: Chose to build it client-side for speed; server-side Excel generation is heavier and needs more setup.
