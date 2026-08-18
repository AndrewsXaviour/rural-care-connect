# AccountingApp — Project Overview

**Repository:** [github.com/nadana1985/AccountingApp](https://github.com/nadana1985/AccountingApp)

---

## Project Summary

AccountingApp is a **Flask-based accounting/ERP web application** designed for managing institutional financial records. It appears to be tailored for **Indian institutions** (references to PAN, GST, Tally-like concepts).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python / Flask |
| Database | SQLite via Flask-SQLAlchemy |
| Forms | Flask-WTF / WTForms with CSRF protection |
| Templates | Jinja2 (HTML) |
| Frontend | HTML (88.7%), CSS (3.1%), Python (8.2%) |

---

## Architecture

The app uses Flask **Blueprints** for modular organization:

| Module | Purpose |
|--------|---------|
| `auth` | Login/authentication |
| `dashboard` | Main dashboard view |
| `master` | Core accounting master data & transactions |

**Entry point:** `run.py` → calls `create_app()` from `app/__init__.py`.

### Directory Structure

```
AccountingApp/
├── run.py                  # Application entry point
├── requirements.txt        # Python dependencies
├── .gitignore
└── app/
    ├── __init__.py         # App factory, extensions, blueprint registration
    ├── auth/
    │   ├── __init__.py
    │   ├── forms.py        # LoginForm
    │   └── routes.py       # Login route
    ├── dashboard/
    │   ├── __init__.py
    │   └── routes.py       # Dashboard route
    ├── master/
    │   ├── __init__.py
    │   ├── forms.py        # All master data forms (410 lines)
    │   └── routes.py       # CRUD routes (302 lines)
    ├── static/             # Static assets
    └── templates/
        ├── base.html
        ├── base_auth.html
        ├── form_macros.html
        ├── login.html
        ├── components/     # Reusable UI components
        └── pages/          # Page-specific templates
```

---

## Key Features

### 1. Authentication (`app/auth/`)

- Simple login form with username/password
- CSRF-protected via Flask-WTF
- Redirects to dashboard on success

**LoginForm fields:**
- `username` — StringField (required)
- `password` — PasswordField (required)

### 2. Dashboard (`app/dashboard/`)

- Main landing page after login
- Renders `pages/dashboard/dashboard.html`
- Route: `/` and `/dashboard`

### 3. Master Data Management (`app/master/`) — Core Module

#### Entity CRUD Operations

| Entity | Create Route | List Route |
|--------|-------------|------------|
| Institution | `/master/institution-creation` | `/master/institutions` |
| Ledger | `/ledger/create` | `/ledger/list` |
| Group | `/group/create` | `/group/list` |
| Voucher Type | `/voucher_type/create` | `/voucher_type/list` |
| Opening Balance | `/opening_balance/create` | `/opening_balance/list` |
| Auto GJV | `/auto_gjv/create` | `/auto_gjv/list` |
| Advance & Deposits | `/add_adv_deposits/create` | `/adv_deposits/list` |
| Daily Collection | `/transaction/daily-collection-details` | `/transaction/daily-collection-list` |
| Bank Receipt Voucher | `/bank_receipt/create` | `/bank_receipt/list` |

#### Design Patterns

- **`generic_crud_handler` decorator** — Reduces boilerplate for simple create forms. Handles form validation, error flashing, and redirect.
- **`generic_list_handler` decorator** — Standardizes list views with consistent template rendering.
- **`JSONFormHandler` class** — Handles complex forms with dynamic JSON data from the frontend (e.g., opening balance entries, collection details). Parses JSON from hidden form fields.

---

## Form Details (`app/master/forms.py` — 410 lines)

### InstitutionForm

Full business entity setup with Indian regulatory fields:

| Section | Fields |
|---------|--------|
| Basic Info | Name, Mailing Name |
| Address | Address, State, Country, Pincode (numeric regex) |
| Contact | Telephone, Alternate Telephone, Mobile, Alternate Mobile, Email |
| Legal | PAN No (regex: `ABCDE1234F`), GST No |

### LedgerForm

Chart of accounts management:

| Field | Type | Notes |
|-------|------|-------|
| Ledger Code | StringField | Required |
| Under Group | SelectField | 24 Tally-style groups (Capital Account, Bank Account, Cash-in-Hand, Current Assets, Current Liabilities, Direct/Indirect Expenses, Duties & Taxes, Fixed Assets, Investments, Loans, Purchase/Sales Accounts, Sundry Creditors/Debtors, etc.) |
| Opening Balance | DecimalField | Non-negative, 2 decimal places |
| Account Holder's Name | StringField | For bank ledgers |
| Account No | StringField | Digits only |
| IFSC Code | StringField | Regex: `^[A-Z]{4}0[A-Z0-9]{6}$` |
| Bank Name | StringField | |
| Branch Name | StringField | |
| Name of the Scheme | TextAreaField | Purpose of account |

### VoucherTypeForm

Transaction type configuration:

- Voucher Name, Alias Name
- Type selector: Sales, Purchase, Payment, Receipt, Journal, Contra, Debit Note, Credit Note, Memo, Reversing Journal, Physical Stock, Sales Order, Purchase Order, Delivery Note, Receipt Note, Rejection In/Out

### OpeningBalanceForm

Dynamic multi-row entry form:

- Balance Type (Debit/Credit) — RadioField
- Debit Total, Credit Total — Read-only calculated fields
- `opening_balance_entries_json` — Hidden field storing JSON array of dynamic table rows

### AutoGJVForm

Automated journal voucher triggers:

- Grant GJV
- Depreciation GJV
- Doubtful Collection GJV
- Lapsed Deposit GJV

### AddAdvDepositsForm, DailyCollectionForm, BankReceiptVoucherForm

Complex forms with JSON-serialized dynamic table entries handled via `JSONFormHandler`.

---

## Dependencies (`requirements.txt`)

```
Flask
Flask-WTF
WTForms
Flask-SQLAlchemy
email-validator
```

---

## Current State

| Aspect | Status |
|--------|--------|
| Commits | 2 |
| Database models | ❌ Not defined yet (routes return empty lists) |
| User authentication | ⚠️ No user model — login doesn't validate against DB |
| Secret key | ⚠️ Hardcoded (`'success123!'`) |
| README | ❌ None |
| Tests | ❌ None |
| Documentation | ❌ None |

---

## Strengths

1. **Well-structured Blueprint architecture** — Clean separation of concerns
2. **Generic CRUD handlers** — DRY pattern reduces boilerplate significantly
3. **Comprehensive form validation** — Regex patterns for PAN, IFSC, pincode
4. **JSON form handler pattern** — Elegant solution for dynamic table data
5. **Indian accounting domain** — Tally-compatible group structure

## Areas for Improvement

1. **Database persistence** — Add SQLAlchemy models for all entities
2. **User model** — Implement proper authentication with password hashing
3. **Secret key** — Move to environment variable
4. **Session management** — Add logout, session timeout
5. **Input sanitization** — Additional security hardening
6. **Testing** — Add unit and integration tests
7. **README** — Add setup instructions and documentation

---

*Generated from GitHub repository analysis on June 18, 2026.*
