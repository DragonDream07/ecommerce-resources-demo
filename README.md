# ecommerce-resources

E-commerce storefront + admin. React (Vite, JavaScript) frontend; Node/Express backend generated from the pack's structure artifacts.

> React (vite)

## Features
- **Orders & Fulfilment**: Requirements grouped under the "Orders & Fulfilment" capability
- **Cart & Checkout**: Requirements grouped under the "Cart & Checkout" capability
- **Payments**: Requirements grouped under the "Payments" capability
- **Account & Authentication**: Requirements grouped under the "Account & Authentication" capability
- **Catalogue & Browsing**: Requirements grouped under the "Catalogue & Browsing" capability
- **Admin & Management**: Requirements grouped under the "Admin & Management" capability
- **Notifications**: Requirements grouped under the "Notifications" capability

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React + TypeScript (bundled with vite) |

## Project structure

### Backend

```text
src/
  modules/
    auth/
      auth.routes.js - Express router: POST /auth/register, /auth/login, /auth/logout, /auth/forgot-password, /auth/rese...
      auth.controller.js - Request handling for all auth endpoints
      auth.service.js - Registration, login, JWT issuance, bcrypt hashing, password-reset token lifecycle
      auth.validator.js - Joi/express-validator schemas for auth payloads
      auth.test.js - Unit + integration tests for auth flows
    users/
      users.routes.js - Express router: GET/PATCH /users/me, admin CRUD /admin/users
      users.controller.js - Request handling for profile, address-book, admin user management
      users.service.js - Profile updates, role assignment, account lookup
      users.validator.js - Validation schemas for user payloads
      users.test.js - Unit tests for user service
    roles/
      roles.routes.js - Express router: admin role management endpoints
      roles.controller.js - Request handling for roles and user_roles assignment
      roles.service.js - RBAC role CRUD, user-role association logic
      roles.test.js - Unit tests for RBAC logic
    addresses/
      addresses.routes.js - Express router: GET/POST/PUT/DELETE /users/me/addresses
      addresses.controller.js - Request handling for address book management
      addresses.service.js - Address CRUD, default address logic, serviceability check against serviceable_pin_codes
      addresses.validator.js - Validation schemas for address payloads
      addresses.test.js - Unit tests for address service
    catalogue/
      catalogue.routes.js - Express router: product listing, PLP filters, product detail, categories, brands; admin sub-routes
      catalogue.controller.js - Request handling for browse, category, brand, and admin catalogue endpoints
      catalogue.service.js - Product/SKU/category/brand business logic, stock lookup, image handling, admin CRUD orchestration
      catalogue.validator.js - Validation schemas for product, SKU, category, brand payloads
      catalogue.test.js - Unit tests for catalogue service
    search/
      search.routes.js - Express router: GET /search (full-text + facets), GET /search/autocomplete
      search.controller.js - Request handling for search and autocomplete queries
      search.service.js - Orchestrates Elasticsearch queries; faceted filter aggregations, autocomplete suggestions
      search.validator.js - Validation for query params (q, filters, page, size)
      adapters/
        elasticsearch.adapter.js - Elasticsearch client wrapper; index mapping helpers, query builders
      search.test.js - Unit tests with mocked Elasticsearch adapter
    cart/
      cart.routes.js - Express router: GET/POST/PATCH/DELETE /cart and /cart/items/:id; apply promo
      cart.controller.js - Request handling for cart operations
      cart.service.js - Add/update/remove items, stock reservation validation, promo code application, guest vs. auth car...
      cart.validator.js - Validation schemas for cart item payloads
      cart.test.js - Unit tests for cart logic
    promotions/
      promotions.routes.js - Express router: promo validation endpoint; admin CRUD /admin/promo-codes
      promotions.controller.js - Request handling for promo code validation and admin management
      promotions.service.js - Promo eligibility rules, discount calculation, usage tracking
      promotions.validator.js - Validation schemas for promo code payloads
      promotions.test.js - Unit tests for promotions engine
    checkout/
      checkout.routes.js - Express router: POST /checkout/initiate, /checkout/confirm; guest checkout support
      checkout.controller.js - Request handling for multi-step checkout flow
      checkout.service.js - Address validation, stock reservation confirmation, promo finalisation, order creation, payment i...
      checkout.validator.js - Validation schemas for checkout payloads
      checkout.test.js - Integration tests for checkout flow
    payments/
      payments.routes.js - Express router: POST /payments/initiate, /payments/confirm, /payments/webhook
      payments.controller.js - Request handling for payment lifecycle
      payments.service.js - Provider-agnostic payment orchestration; persists payment_attempts, delegates to active adapter
      payments.validator.js - Validation for payment request payloads
      adapters/
        payment.adapter.interface.js - Abstract interface / duck-type contract all provider adapters must satisfy
        mock.adapter.js - Test-mode mock adapter returning configurable success/failure responses
      payments.test.js - Unit tests with mock adapter
    orders/
      orders.routes.js - Express router: GET /orders, GET /orders/:id; admin order list and detail; status update
      orders.controller.js - Request handling for order history, detail, admin management
      orders.service.js - Order creation (called by checkout), status transitions, order_status_history writes, order_track...
      orders.validator.js - Validation for order update payloads
      orders.test.js - Unit tests for order service
    returns/
      returns.routes.js - Express router: POST /orders/:id/returns; GET /orders/:id/returns/:rid; admin returns list and de...
      returns.controller.js - Request handling for return initiation and admin management
      returns.service.js - Return eligibility, return_requests CRUD, refund trigger, stock update on approval
      returns.validator.js - Validation schemas for return request payloads
      returns.test.js - Unit tests for returns service
    notifications/
      notifications.routes.js - Express router: GET /notifications (polling), PATCH /notifications/:id/read, PATCH /notifications...
      notifications.controller.js - Request handling for notification centre
      notifications.service.js - Notification creation (called by other services), unread count, mark-read logic
      notifications.test.js - Unit tests for notification service
    admin/
      admin.routes.js - Express router: mounts admin sub-routes; applies admin RBAC middleware
      admin.controller.js - Dashboard stats aggregation, reports endpoint orchestration
      admin.service.js - Cross-domain read aggregations for dashboard and reports (delegates to domain services)
      admin.test.js - Integration tests for admin endpoints
  db/
    client.js - Knex instance configured from env; exported singleton used by all repositories
    migrations/
      001_create_roles.js - roles table
      002_create_users.js - users table with bcrypt password_hash column
      003_create_user_roles.js - user_roles join table
      004_create_addresses.js - addresses table FK → users
      005_create_serviceable_pin_codes.js - serviceable_pin_codes lookup table
      006_create_categories.js - categories table with self-referencing parent_id
      007_create_brands.js - brands table
      008_create_products.js - products table FK → categories, brands
      009_create_product_images.js - product_images table FK → products
      010_create_skus.js - skus table FK → products with size/colour/stock columns
      011_create_promo_codes.js - promo_codes table with rules JSON column
      012_create_carts.js - carts table (nullable user_id for guest, session_id)
      013_create_cart_items.js - cart_items table FK → carts, skus
      014_create_orders.js - orders table FK → users (nullable), addresses
      015_create_order_items.js - order_items table FK → orders, skus
      016_create_order_status_history.js - order_status_history table FK → orders
      017_create_stock_reservations.js - stock_reservations table FK → skus, orders
      018_create_payment_attempts.js - payment_attempts table FK → orders
      019_create_refunds.js - refunds table FK → orders, payment_attempts
      020_create_return_requests.js - return_requests table FK → orders
      021_create_order_tracking.js - order_tracking table FK → orders
      022_create_notifications.js - notifications table FK → users (nullable for broadcast)
    seeds/
      01_roles.js - Seed default roles: customer, staff, admin
      02_admin_user.js - Seed default admin user for development
      03_categories.js - Sample category tree
      04_brands.js - Sample brands
      05_products_skus.js - Sample products and SKU variants
      06_promo_codes.js - Sample promo codes
    repositories/
      users.repository.js - Knex queries for users table
      roles.repository.js - Knex queries for roles and user_roles tables
      addresses.repository.js - Knex queries for addresses table
      serviceable_pin_codes.repository.js - Knex queries for serviceability lookup
      categories.repository.js - Knex queries for categories table (tree traversal helpers)
      brands.repository.js - Knex queries for brands table
      products.repository.js - Knex queries for products and product_images tables
      skus.repository.js - Knex queries for skus table; atomic stock decrement helpers
      promo_codes.repository.js - Knex queries for promo_codes table
      carts.repository.js - Knex queries for carts and cart_items tables
      orders.repository.js - Knex queries for orders, order_items, order_status_history, order_tracking tables
      stock_reservations.repository.js - Knex queries for stock_reservations table
      payment_attempts.repository.js - Knex queries for payment_attempts table
      refunds.repository.js - Knex queries for refunds table
      return_requests.repository.js - Knex queries for return_requests table
      notifications.repository.js - Knex queries for notifications table
  middleware/
    authenticate.js - JWT verification middleware; attaches req.user
    authorize.js - RBAC middleware factory: authorize(role) checks req.user roles
    rateLimiter.js - express-rate-limit configs for auth and password-reset routes
    errorHandler.js - Centralised Express error handler; structured JSON error responses
    requestLogger.js - Morgan/Winston HTTP request logging
    validate.js - Generic validation middleware wrapper for Joi schemas
  config/
    index.js - Reads and exports all env vars with defaults and validation (dotenv + joi)
    database.js - Knex connection config derived from config/index.js
    elasticsearch.js - Elasticsearch client config (host, auth) derived from config/index.js
    jwt.js - JWT secret, access token TTL, reset token TTL constants
    rateLimit.js - Rate-limit window and max request constants
  utils/
    logger.js - Winston logger instance (console + file transports); satisfies NFR-11
    asyncHandler.js - Wraps async route handlers to forward errors to Express error handler
    pagination.js - Shared helper: parse page/limit, build offset, format paginated response
    tokenUtils.js - Generate/verify cryptographic reset tokens (crypto.randomBytes)
  app.js - Express app factory: registers middleware, mounts all module routers, error handler
  server.js - Entry point: imports app, starts HTTP server, logs port
tests/
  integration/
    auth.test.js - Full-stack auth flow tests against test DB
    cart.test.js - Cart + promo integration tests
    checkout.test.js - End-to-end checkout with mock payment adapter
    orders.test.js - Order lifecycle and status transition tests
    returns.test.js - Return request and refund flow tests
    search.test.js - Search and autocomplete with mocked Elasticsearch
  helpers/
    dbSetup.js - Run migrations and seeds before tests; rollback after
    authHelper.js - Generate test JWTs for different roles
    requestHelper.js - Supertest wrapper with common headers
knexfile.js - Knex environment configs (development, test, production) for CLI use
.env.example - Template of all required environment variables with documentation comments
.eslintrc.js - ESLint config including import/no-cycle and import boundary rules
package.json - Dependencies: express, knex, pg, bcrypt, jsonwebtoken, joi, @elastic/elasticsearch, express-rate-...
jest.config.js - Jest config: test environment, coverage thresholds, module aliases
.gitignore - node_modules, .env, dist, logs
README.md - Setup, migration commands, environment variable reference, module dependency direction ADR summary
```

### Frontend

```text
src/
  main.jsx - Vite entry point; renders App into #root
  App.jsx - Root component; sets up React Router, global providers (auth, cart, notifications)
  index.css - Tailwind base/components/utilities imports; CSS custom properties for design tokens
  routes/
    index.jsx - Centralised route definitions using React Router v6 createBrowserRouter
    ProtectedRoute.jsx - Wraps routes requiring authentication; redirects to /login if no token
    AdminRoute.jsx - Wraps admin routes; checks role claim in JWT; 403 if unauthorised
    GuestRoute.jsx - Redirects authenticated users away from login/register pages
  pages/
    Home.jsx - Landing page /
    NotFound.jsx - 404 catch-all page *
    catalogue/
      ProductListing.jsx - Page /products — PLP with filters, result counts, pagination
      CategoryProductListing.jsx - Page /categories/:slug/products — category-scoped PLP
      SearchResults.jsx - Page /search — full-text search results with facet filters
      ProductDetail.jsx - Page /products/:slug — image, variant picker, tax-inclusive price, add-to-cart
    cart/
      Cart.jsx - Page /cart — cart item list, totals, proceed to checkout
    checkout/
      CheckoutAddress.jsx - Step 1 /checkout/address — delivery address form, PIN serviceability check
      CheckoutPayment.jsx - Step 2 /checkout/payment — payment form with test-mode mock
      CheckoutReview.jsx - Step 3 /checkout/review — order totals, taxes, promo code entry, shipping charge display
      CheckoutConfirmation.jsx - Page /checkout/confirmation — order confirmed summary
      GuestPostCheckoutRegister.jsx - Page /checkout/register — optional account creation after guest checkout
    auth/
      Login.jsx - Page /login — email + password login form
      Register.jsx - Page /register — new customer registration form
      ForgotPassword.jsx - Page /forgot-password — request password reset form
      ResetPassword.jsx - Page /reset-password — submit new password with token from URL
    account/
      AccountOverview.jsx - Page /account — dashboard: profile summary, quick links
      AccountProfile.jsx - Page /account/profile — edit name, email, password
      AccountAddresses.jsx - Page /account/addresses — address book list
      AddressNew.jsx - Page /account/addresses/new — add new address form
      AddressEdit.jsx - Page /account/addresses/:id/edit — edit existing address form
      OrderHistory.jsx - Page /account/orders — order list with status badges
      OrderDetail.jsx - Page /account/orders/:id — status timeline, items, tracking, cancel/return actions
      ReturnRequest.jsx - Page /account/orders/:id/return — return request form for eligible items
      Notifications.jsx - Page /account/notifications — in-app notification centre, mark-read
    admin/
      AdminDashboard.jsx - Page /admin — aggregated stats and quick-access tiles
      AdminReports.jsx - Page /admin/reports — consolidated business reporting view
      orders/
        AdminOrderList.jsx - Page /admin/orders — staff order list with status filters
        AdminOrderDetail.jsx - Page /admin/orders/:id — order detail, advance status controls
      catalogue/
        AdminProductList.jsx - Page /admin/catalogue/products — product CMS list
        AdminProductNew.jsx - Page /admin/catalogue/products/new — create product form
        AdminProductEdit.jsx - Page /admin/catalogue/products/:id/edit — edit product & SKUs form
        AdminCategoryList.jsx - Page /admin/catalogue/categories — category tree management
        AdminCategoryNew.jsx - Page /admin/catalogue/categories/new — create category form
        AdminCategoryEdit.jsx - Page /admin/catalogue/categories/:id/edit — edit category form
        AdminBrandList.jsx - Page /admin/catalogue/brands — brand list
        AdminBrandNew.jsx - Page /admin/catalogue/brands/new — create brand form
        AdminBrandEdit.jsx - Page /admin/catalogue/brands/:id/edit — edit brand form
      promotions/
        AdminPromotionList.jsx - Page /admin/promotions — promo code list
        AdminPromotionNew.jsx - Page /admin/promotions/new — create promo code: type, discount, expiry
        AdminPromotionEdit.jsx - Page /admin/promotions/:id/edit — edit promo code form
      returns/
        AdminReturnList.jsx - Page /admin/returns — return requests queue
        AdminReturnDetail.jsx - Page /admin/returns/:id — return detail, approve/reject controls
      users/
        AdminUserList.jsx - Page /admin/users — user list with role filter
        AdminUserDetail.jsx - Page /admin/users/:id — user detail, role assignment
  components/
    layout/
      AppShell.jsx - Outer shell: renders Header, main content slot, Footer
      Header.jsx - Top nav: logo, search bar, cart icon, account menu, notification bell
      Footer.jsx - Site footer: links, copyright
      AdminShell.jsx - Admin layout shell with sidebar nav gated by AdminRoute
      AdminSidebar.jsx - Sidebar nav for admin panel: links to all admin sections
      PageWrapper.jsx - Applies consistent page padding and max-width constraint
      Breadcrumb.jsx - Generic breadcrumb trail component
    catalogue/
      ProductCard.jsx - Grid card: image, name, tax-inclusive price, rating badge
      ProductGrid.jsx - Responsive product card grid with skeleton loading states
      FilterPanel.jsx - Brand, price-range, rating filter controls with result counts
      ActiveFilterBar.jsx - Chips showing applied filters with remove controls
      VariantPicker.jsx - Size/colour selector that resolves selection to a SKU
      ProductImageGallery.jsx - Main product image display for PDP
      PriceDisplay.jsx - Renders tax-inclusive price with optional original price strikethrough
      CategoryNav.jsx - Category tree navigation menu
      ResultCount.jsx - Displays total results and per-option facet counts
    search/
      SearchBar.jsx - Input field wired to autocomplete; submits to /search on enter
      AutocompleteSuggestions.jsx - Dropdown list of autocomplete suggestions from GET /search/autocomplete
    cart/
      CartItem.jsx - Single cart line: image, name, SKU variant, qty stepper, remove
      CartSummary.jsx - Subtotal, shipping charge, discount, GST, grand total display
      PromoCodeInput.jsx - Promo code field and apply button; shows applied discount
      EmptyCart.jsx - Empty state illustration and CTA for /products
    checkout/
      CheckoutStepper.jsx - Step indicator for Address → Payment → Review flow
      AddressForm.jsx - Reusable delivery address fields with PIN serviceability feedback
      OrderSummaryPanel.jsx - Compact order totals panel shown during checkout steps
      PaymentMockForm.jsx - Test-mode payment form: simulate success/failure/pending outcomes
      ShippingBadge.jsx - Displays free shipping eligibility or ₹49 charge contextually
    orders/
      OrderCard.jsx - Summary card for order history list: ID, date, status badge
      StatusTimeline.jsx - Visual timeline: Confirmed → Packed → Shipped → Delivered stages
      OrderItemsList.jsx - Tabular list of items in an order with quantities and prices
      TrackingInfo.jsx - Simulated tracking details block on order detail page
      CancelOrderButton.jsx - Cancel CTA with confirmation dialog; only shown when eligible
      ReturnItemSelector.jsx - Checkbox list for selecting eligible items to include in return request
    notifications/
      NotificationBell.jsx - Header icon showing unread count badge; opens notification dropdown
      NotificationList.jsx - Scrollable list of notifications with read/unread state
      NotificationItem.jsx - Single notification row: icon, message, timestamp, mark-read action
    auth/
      LoginForm.jsx - Controlled login form with validation
      RegisterForm.jsx - Controlled registration form with validation
      ForgotPasswordForm.jsx - Email input form for password reset request
      ResetPasswordForm.jsx - New password + confirm fields with token from URL param
    admin/
      StatsCard.jsx - Dashboard KPI tile: metric label, value, trend indicator
      OrderStatusAdvancer.jsx - Dropdown/button to advance order status; role-gated
      ProductForm.jsx - Create/edit product form including SKU variant management
      CategoryForm.jsx - Create/edit category form with parent selector
      BrandForm.jsx - Create/edit brand form
      PromoCodeForm.jsx - Create/edit promo code: type (percentage/flat), value, expiry date
      ReturnApprovalPanel.jsx - Approve/reject return request controls with refund note
      UserRoleEditor.jsx - Role assignment dropdown for a given user
      AdminDataTable.jsx - Reusable sortable/paginated table for admin list views
      ReportChart.jsx - Wrapper around charting library for consolidated reports
    ui/
      Button.jsx - Design-system button with variants (primary, secondary, destructive) and sizes
      Input.jsx - Styled text input with label, error message, and accessible focus ring
      Select.jsx - Styled select/dropdown component
      Checkbox.jsx - Accessible checkbox with label
      Badge.jsx - Status badge: colour + icon + label (never colour alone)
      Modal.jsx - Accessible modal dialog with focus trap and elevation-3 shadow
      Spinner.jsx - Loading spinner for async states
      Toast.jsx - Transient success/error/info notification toast
      ToastContainer.jsx - Renders active toasts; anchored to viewport corner
      Skeleton.jsx - Content-placeholder skeleton shapes for loading states
      Pagination.jsx - Page navigation controls for list views
      EmptyState.jsx - Generic empty-state block with optional CTA
      ErrorBoundary.jsx - React error boundary to catch and display render errors
  services/
    api.js - Axios instance: base URL, JWT auth header injection, 401 refresh/logout handling
    authService.js - Calls POST /auth/register, /auth/login, /auth/logout, /auth/forgot-password, /auth/reset-password
    usersService.js - Calls GET/PATCH /users/me; admin CRUD /admin/users
    addressesService.js - Calls GET/POST/PUT/DELETE /users/me/addresses; PIN serviceability via addresses service
    catalogueService.js - Calls product listing, PLP filters, product detail, categories, brands endpoints; admin catalogue...
    searchService.js - Calls GET /search and GET /search/autocomplete
    cartService.js - Calls GET/POST/PATCH/DELETE /cart and /cart/items/:id; apply promo
    checkoutService.js - Calls POST /checkout/initiate and /checkout/confirm
    paymentsService.js - Calls POST /payments/initiate and /payments/confirm; surfaces mock adapter outcomes
    ordersService.js - Calls GET /orders, GET /orders/:id; admin order list, detail, status update
    returnsService.js - Calls POST /orders/:id/returns; GET /orders/:id/returns/:rid; admin returns endpoints
    promotionsService.js - Calls promo validation endpoint; admin CRUD /admin/promo-codes
    notificationsService.js - Calls GET /notifications, PATCH /notifications/:id/read, PATCH /notifications/read-all
    adminService.js - Calls admin dashboard stats and reports endpoints; delegates domain calls to domain services
  hooks/
    useAuth.js - Reads auth context; exposes user, login, logout, isAuthenticated
    useCart.js - Cart context consumer; exposes cart state, addItem, removeItem, updateQty
    useNotifications.js - Polls GET /notifications on interval; exposes list, unreadCount, markRead
    useSearch.js - Manages search query state, calls searchService, debounces autocomplete
    useFilters.js - Manages multi-filter state for PLP; builds query params for catalogueService
    usePagination.js - Manages page/limit state for paginated list views
    useCheckout.js - Manages multi-step checkout form state across Address/Payment/Review steps
    useOrders.js - Fetches order history and single order detail via ordersService
    useAddresses.js - Fetches and mutates address book via addressesService
    useRoles.js - Reads role claims from auth context; exposes hasRole helper
    useToast.js - Imperative toast trigger hook wired to ToastContainer
  context/
    AuthContext.jsx - Provides JWT-backed auth state; persists token in httpOnly cookie or localStorage
    CartContext.jsx - Provides cart state and mutation actions; merges guest cart on login
    NotificationContext.jsx - Provides notification list and unread count to header bell and notification page
  types/
    auth.types.js - JSDoc/TS-style shapes: User, LoginPayload, RegisterPayload, ResetPayload
    catalogue.types.js - Product, SKU, Category, Brand, ProductImage shapes mirroring backend models
    cart.types.js - Cart, CartItem shapes
    checkout.types.js - CheckoutInitiatePayload, CheckoutConfirmPayload shapes
    order.types.js - Order, OrderItem, OrderStatusHistory, OrderTracking shapes
    payment.types.js - PaymentAttempt, PaymentOutcome shapes (success/failure/pending)
    returns.types.js - ReturnRequest, Refund shapes
    promotions.types.js - PromoCode shape with discount type and expiry
    notification.types.js - Notification shape mirroring notifications table
    address.types.js - Address shape including pin_code and serviceability flag
    admin.types.js - DashboardStats, ReportData, AdminUser shapes
  utils/
    formatCurrency.js - Formats amounts as ₹ with locale-aware decimals
    formatDate.js - Formats ISO dates to display strings
    taxUtils.js - Derives GST-inclusive display price; extracts tax portion for breakdown
    shippingUtils.js - Computes shipping charge (₹0 if total ≥ ₹799, else ₹49)
    authUtils.js - Decode JWT claims; check token expiry client-side
    validationSchemas.js - Yup/Zod schemas for all form fields matching backend validator rules
    errorUtils.js - Parses API error responses into user-facing messages
    cn.js - Classname utility (clsx + tailwind-merge) for conditional Tailwind classes
  config/
    env.js - Reads import.meta.env vars; exports typed constants (API_BASE_URL, etc.)
    tokens.css - CSS custom properties mapping all design token names to hex/value literals
    tailwind.config.js - Extends Tailwind with design-system colour, spacing, radius, and shadow tokens
  assets/
    images/ - Static image assets (logo, placeholder product image, empty-state illustrations)
    icons/ - SVG icon files used throughout the UI for status indicators and navigation
public/
  favicon.ico - Site favicon
  robots.txt - Robots crawl directives
index.html - Vite HTML entry; mounts #root div, references main.jsx
vite.config.js - Vite config: React plugin, path aliases (@/ → src/), proxy /api to backend dev server
tailwind.config.js - Root Tailwind config extending src/config/tailwind.config.js token extensions
postcss.config.js - PostCSS config for Tailwind and autoprefixer
eslint.config.js - ESLint config: React, import-order, accessibility (jsx-a11y) rules
.env.example - Template: VITE_API_BASE_URL and other required frontend env vars
package.json - Dependencies: react, react-dom, react-router-dom, axios, @tanstack/react-query, tailwindcss, clsx...
README.md - Frontend setup, env var reference, design token usage guide, route map
```

## Getting started

### Prerequisites

- Node.js 18+ and npm

### Frontend

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Screens & routes

| Screen | Route |
| --- | --- |
| Home | `/` |
| Product Listing | `/products` |
| Product Listing by Category | `/categories/:slug/products` |
| Search Results | `/search` |
| Product Detail | `/products/:slug` |
| Cart | `/cart` |
| Checkout - Address | `/checkout/address` |
| Checkout - Payment | `/checkout/payment` |
| Checkout - Review | `/checkout/review` |
| Checkout - Confirmation | `/checkout/confirmation` |
| Guest Post-Checkout Register | `/checkout/register` |
| Login | `/login` |
| Register | `/register` |
| Forgot Password | `/forgot-password` |
| Reset Password | `/reset-password` |
| Account Overview | `/account` |
| Account Profile | `/account/profile` |
| Account Addresses | `/account/addresses` |
| Account Add Address | `/account/addresses/new` |
| Account Edit Address | `/account/addresses/:id/edit` |
| Order History | `/account/orders` |
| Order Detail | `/account/orders/:id` |
| Return Request | `/account/orders/:id/return` |
| Notifications | `/account/notifications` |
| Admin Dashboard | `/admin` |
| Admin Order List | `/admin/orders` |
| Admin Order Detail | `/admin/orders/:id` |
| Admin Catalogue Products | `/admin/catalogue/products` |
| Admin Create Product | `/admin/catalogue/products/new` |
| Admin Edit Product | `/admin/catalogue/products/:id/edit` |
| Admin Catalogue Categories | `/admin/catalogue/categories` |
| Admin Create Category | `/admin/catalogue/categories/new` |
| Admin Edit Category | `/admin/catalogue/categories/:id/edit` |
| Admin Catalogue Brands | `/admin/catalogue/brands` |
| Admin Create Brand | `/admin/catalogue/brands/new` |
| Admin Edit Brand | `/admin/catalogue/brands/:id/edit` |
| Admin Promotions | `/admin/promotions` |
| Admin Create Promo Code | `/admin/promotions/new` |
| Admin Edit Promo Code | `/admin/promotions/:id/edit` |
| Admin Returns | `/admin/returns` |
| Admin Return Detail | `/admin/returns/:id` |
| Admin Reports | `/admin/reports` |
| Admin User List | `/admin/users` |
| Admin User Detail | `/admin/users/:id` |
| Not Found | `*` |

## Notes

- Stack is Node.js + Express with MySQL 8 per the brief, but the datastore_product field says 'postgresql' — the schema, repositories, and Knex config are written for PostgreSQL (pg driver). Confirm which database to target and swap the Knex driver accordingly.
- Knex is chosen as the query builder / migration tool because it works with both MySQL and PostgreSQL, keeps SQL explicit, and avoids heavy ORM magic — appropriate for a team already familiar with the domain. Swap for Sequelize or Prisma if ORM features are preferred.
- The notifications table is in PostgreSQL (as specified). The REST polling pattern is implemented in the notifications module; no additional infrastructure is required.
- Elasticsearch is accessed only through src/modules/search/adapters/elasticsearch.adapter.js. All other modules are isolated from it. Index sync (product indexing on catalogue changes) should be triggered from catalogue.service.js via the search adapter.
- The payment module ships only the mock adapter. Real provider adapters (Stripe, etc.) are dropped into src/modules/payments/adapters/ and selected via a PAYMENT_ADAPTER env var — no code changes required to plug them in.
- Guest checkout is supported via a nullable user_id on the carts and orders tables and a session_id column on carts. The auth middleware is not required on checkout routes; ownership is verified by session cookie or guest token.
- Password-reset tokens are stored as hashed values in the users table (or a separate password_reset_tokens table) with an expires_at column, satisfying NFR-5. Add a migration if a separate table is preferred.
- Rate limiting (NFR-7) is applied at the router level for /auth/login and /auth/forgot-password via the rateLimiter middleware.
- The import dependency direction rule (auth ← everything; cart → orders/promotions; checkout → cart/orders/payments; admin → all domain services) should be enforced with eslint-plugin-import and documented as an ADR in README.md.
- stock_reservations are created at checkout initiation and released on payment failure or cart abandonment. A scheduled cleanup job (cron or pg_cron) for stale reservations is recommended but not included in this tree.
- serviceable_pin_codes is a simple lookup table; the addresses service queries it before confirming delivery eligibility during checkout.
