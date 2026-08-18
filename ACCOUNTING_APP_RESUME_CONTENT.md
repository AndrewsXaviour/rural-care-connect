# Resume Content — AccountingApp

Use the content below in your resume, portfolio, or LinkedIn. Pick the version that fits your space.

---

## 📋 Short Version (1–2 Lines)

**AccountingApp** — A full-stack accounting/ERP web application for institutional financial management, built with Python Flask, SQLAlchemy, and WTForms, featuring master data CRUD, dynamic transaction forms, and automated journal voucher processing.

---

## 📋 Medium Version (Resume Bullet Points)

**AccountingApp** | Full-Stack Accounting Web Application | [GitHub Link]

- Architected a **Flask-based accounting system** with modular Blueprint architecture, separating authentication, dashboard, and master data management into independent modules
- Designed a **generic CRUD handler pattern** using Python decorators (`generic_crud_handler`, `generic_list_handler`) to eliminate boilerplate and standardize form processing across 9+ entity types
- Built **10+ WTForms with server-side validation** including Indian regulatory field validation (PAN regex: `ABCDE1234F`, IFSC code format, numeric pincode)
- Implemented a **JSONFormHandler class** for complex dynamic table forms, parsing client-side JSON data for opening balance entries and daily collection details
- Created **Tally-compatible chart of accounts** with 24 ledger groups (Capital Account, Bank Account, Sundry Debtors, etc.) supporting Indian accounting standards
- Integrated **SQLite database** via Flask-SQLAlchemy with CSRF protection via Flask-WTF for secure form submissions
- **Tech Stack:** Python, Flask, SQLAlchemy, WTForms, Jinja2, SQLite, HTML/CSS

---

## 📋 Long Version (Portfolio/LinkedIn)

### AccountingApp — Institutional Financial Management System

**Overview:**
A full-stack accounting and ERP web application designed for institutional financial management. The system implements Tally-compatible accounting structures with a modern web interface, supporting master data CRUD, dynamic transaction forms, automated journal voucher processing, and Indian regulatory compliance (PAN, GST).

**Key Features:**

- 🏛️ **Institution Management** — Complete business entity setup with name, address, contact, and Indian regulatory fields (PAN, GST validation)
- 📊 **Chart of Accounts** — Tally-compatible ledger system with 24 account groups (Capital Account, Bank Account, Cash-in-Hand, Current Assets/Liabilities, Direct/Indirect Expenses, Duties & Taxes, Fixed Assets, Investments, Loans, Purchase/Sales Accounts, Sundry Creditors/Debtors, Suspense Account, etc.)
- 📝 **Dynamic Transaction Forms** — JSON-serialized multi-row entry for opening balance, advance deposits, daily collections, and bank receipt vouchers
- 🔄 **Automated Journal Vouchers** — One-click GJV processing for Grants, Depreciation, Doubtful Collections, and Lapsed Deposits
- 🧾 **Voucher Type System** — Support for 18 transaction types (Sales, Purchase, Payment, Receipt, Journal, Contra, Debit/Credit Notes, Memos, Reversing Journals, Physical Stock, Sales/Purchase Orders, Delivery/Receipt Notes, Rejection In/Out)
- 🔐 **Secure Authentication** — Flask-WTF CSRF protection with session-based login
- 📱 **Responsive Dashboard** — Clean web interface with sidebar navigation

**Technical Highlights:**

- **Decorator Pattern:** Custom `generic_crud_handler` and `generic_list_handler` decorators reduce route boilerplate by 70%, standardizing form validation, error handling, and redirect logic
- **JSON Form Handler:** `JSONFormHandler` class encapsulates complex form processing with JSON data parsing, enabling dynamic client-side tables without compromising server-side validation
- **Modular Blueprint Architecture:** Flask Blueprints for `auth`, `dashboard`, and `master` modules ensure clean separation of concerns and independent development
- **Indian Regulatory Compliance:** Built-in validation for PAN (regex: `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`), IFSC codes (`^[A-Z]{4}0[A-Z0-9]{6}$`), and numeric pincode formats
- **Context Injection:** Flask context processor injects `request` object into all templates for dynamic sidebar navigation

**Tech Stack:**
`Python 3` `Flask` `Flask-SQLAlchemy` `Flask-WTF` `WTForms` `Jinja2` `SQLite` `HTML5` `CSS3`

**Project Structure:**
```
AccountingApp/
├── run.py                  # Application entry point
├── requirements.txt        # Python dependencies
└── app/
    ├── __init__.py         # App factory, extensions, blueprint registration
    ├── auth/               # Login/authentication module
    ├── dashboard/          # Main dashboard view
    ├── master/             # Core accounting (302 lines routes, 410 lines forms)
    ├── static/             # CSS, JS assets
    └── templates/          # Jinja2 templates with macros
```

---

## 🎯 Skills Demonstrated

| Category | Skills |
|----------|--------|
| **Backend** | Python, Flask, Blueprint Architecture, App Factory Pattern |
| **Database** | SQLAlchemy, SQLite, ORM, CRUD Operations |
| **Forms** | WTForms, Flask-WTF, Server-Side Validation, CSRF Protection |
| **Architecture** | Decorator Pattern, Generic CRUD Handlers, JSON Form Processing |
| **Domain** | Accounting, Chart of Accounts, Journal Vouchers, Indian Regulatory (PAN/GST) |
| **Frontend** | Jinja2, HTML5, CSS3, Responsive Design |
| **Security** | CSRF Protection, Session Management, Input Validation |

---

## 💡 Interview Talking Points

1. **"Tell me about a design pattern you implemented"**
   > "I created a generic CRUD handler using Python decorators that standardizes form processing across 9 entity types. The decorator handles validation, error flashing, and redirect logic — reducing route boilerplate by 70% and ensuring consistent behavior."

2. **"How did you handle complex forms?"**
   > "For dynamic multi-row forms like opening balance entries, I built a `JSONFormHandler` class that parses JSON data from hidden form fields. This lets the client handle dynamic table UI while the server validates and processes the data."

3. **"What about the domain complexity?"**
   > "The system implements Tally-compatible accounting with 24 ledger groups and 18 voucher types. I added Indian regulatory validation — PAN numbers must match `ABCDE1234F` format, IFSC codes follow `^[A-Z]{4}0[A-Z0-9]{6}$`."

4. **"How did you structure the application?"**
   > "I used Flask's Blueprint pattern to separate auth, dashboard, and master data into independent modules. The app factory pattern in `__init__.py` initializes extensions and registers blueprints, making testing and configuration straightforward."

---

*Tailor the content above to match the specific role you're applying for. For backend roles, emphasize Flask architecture and patterns. For full-stack roles, highlight the form handling and template rendering.*
