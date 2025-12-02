# Remix User Management

A modern, full-stack web application built with **React Router v7 (Remix)**, **Prisma**, **SQLite**, and **Shadcn UI**. This project features a robust authentication system, comprehensive user and customer management modules, and a polished, responsive user interface.

## 🚀 Features

### Authentication
- **Secure Login & Registration**: Built with `bcryptjs` for password hashing and secure cookie-based sessions.
- **Modern UI**: Split-layout design for login and registration pages using Shadcn blocks.
- **Protected Routes**: Authenticated layout ensuring only logged-in users can access the dashboard.

### User Management
- **Data Table**: Advanced table with server-side pagination, filtering (by email), and sorting.
- **Drawer-based Actions**: Add, Edit, and Duplicate users directly from a side drawer (Sheet) without leaving the page.
- **Validation**: Enforces unique emails and required fields.
- **Security**: Password hashing and secure updates.

### Customer Management
- **CRUD Operations**: Create, Read, Update, and Delete customers.
- **Search & Filter**: Real-time filtering by customer name.
- **Drawer Workflow**: Seamless editing and duplication of customer records.
- **Seeding**: Includes a script to generate 100 random customers for testing.

### UI/UX
- **Dashboard Layout**: Responsive sidebar navigation with breadcrumbs.
- **Feedback**: Toast notifications (`sonner`) for success and error messages.
- **Confirmation**: Safety checks (Alert Dialogs) before deleting records.
- **Design System**: Built with Tailwind CSS and Shadcn UI for a consistent, premium look.

## 🛠️ Tech Stack

- **Framework**: [React Router v7](https://reactrouter.com/) (formerly Remix)
- **Database**: [SQLite](https://www.sqlite.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **UI Library**: [Shadcn UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Table**: [TanStack Table](https://tanstack.com/table/v8)
- **Forms**: React Router Form & Actions

## 📂 Project Structure

```
├── app/
│   ├── components/         # Shadcn UI and custom components
│   │   ├── ui/            # Primitive UI components (Button, Input, Sheet, etc.)
│   │   └── app-sidebar.tsx # Sidebar navigation component
│   ├── routes/             # Application routes
│   │   ├── _auth.tsx      # Authenticated layout (Sidebar, Toaster)
│   │   ├── _index.tsx     # Login page (Root)
│   │   ├── register.tsx   # Registration page
│   │   ├── users._index.tsx # User management (Table + Drawer)
│   │   └── customers._index.tsx # Customer management (Table + Drawer)
│   ├── utils/              # Server-side utilities
│   │   ├── auth.server.ts # Authentication logic
│   │   ├── db.server.ts   # Prisma client singleton
│   │   └── session.server.ts # Session storage configuration
│   └── root.tsx            # Root layout
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Database seeding script
├── public/                 # Static assets
└── package.json            # Dependencies and scripts
```

## ⚡ Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- pnpm (recommended) or npm

### Installation

1.  **Clone the repository** (if applicable) or navigate to the project directory.

2.  **Install dependencies**:
    ```bash
    pnpm install
    ```

3.  **Setup Database**:
    Initialize the SQLite database and run migrations.
    ```bash
    npx prisma migrate dev
    ```

4.  **Seed Database** (Optional):
    Populate the database with 100 random customers.
    ```bash
    npx prisma db seed
    ```

5.  **Run Development Server**:
    ```bash
    pnpm dev
    ```
    Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📖 Usage Guide

1.  **Login/Register**:
    - The app starts at the Login page.
    - Create a new account via "Sign up".
    - Log in to access the dashboard.

2.  **Dashboard**:
    - Use the **Sidebar** to navigate between "User Management" and "Customer Management".

3.  **Managing Records**:
    - **Add**: Click the "Add" button to open the form drawer.
    - **Edit**: Click the "..." menu on a row and select "Edit".
    - **Duplicate**: Select "Duplicate" to create a copy with "CLONE -" prefix.
    - **Delete**: Select "Delete" and confirm the action in the dialog.

## 🧩 How to Create a New Module

Follow these steps to add a new module (e.g., "Products") to the application.

### 1. Database Setup
1.  Open `prisma/schema.prisma`.
2.  Add your new model:
    ```prisma
    model Product {
      id        String   @id @default(uuid())
      name      String
      price     Decimal
      createdAt DateTime @default(now())
      updatedAt DateTime @updatedAt
    }
    ```
3.  Run the migration to update your database:
    ```bash
    npx prisma migrate dev --name add_product_model
    ```

### 2. Create the Route
1.  Create a new file in `app/routes/` (e.g., `products._index.tsx`).
2.  **Copy & Paste**: You can copy the content of `app/routes/customers._index.tsx` as a starting point.
3.  **Update Loader**:
    -   Change the Prisma query to fetch your new model (e.g., `prisma.product.findMany()`).
4.  **Update Action**:
    -   Update the `intent` handling for "create", "update", and "delete" to work with your new model fields.
5.  **Update UI**:
    -   Modify the `columns` definition for the `DataTable`.
    -   Update the `Sheet` form fields to match your model.

### 3. Add to Sidebar
1.  Open `app/components/app-sidebar.tsx`.
2.  Import an icon from `lucide-react`.
3.  Add a new module item to the `sideNavItems` array in `app/utils/constans.ts`:
    ```tsx
    {
        title: "Products",
        url: "/products",
        icon: Package, // Imported from lucide-react
    },
    ```

### 4. Test
1.  Run `pnpm dev`.
2.  Navigate to your new route (e.g., `/products`) via the sidebar.
3.  Test creating, editing, and deleting items.

## 📜 Scripts

- `pnpm dev`: Start the development server.
- `pnpm build`: Build the application for production.
- `pnpm start`: Start the production server.
- `npx prisma studio`: Open the Prisma Studio GUI to view/edit database data.
