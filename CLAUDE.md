# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multi-tenant SaaS platform for market procurement management built with Next.js 15 and TypeScript. The system supports three tenant types: MARKET, PROVIDER, and CUSTOMER, each with different user roles and workflows for order processing.

## Tech Stack

- **Framework**: Next.js 15 (App Router) with Turbopack
- **Language**: TypeScript
- **UI Components**: shadcn/ui + Radix UI primitives
- **Styling**: Tailwind CSS with custom animations
- **State Management**: React Context (WorkspaceProvider, UserMenuProvider)
- **Forms**: React Hook Form + Zod validation
- **Testing**: Vitest with @testing-library
- **Icons**: Lucide React + Heroicons
- **Date Handling**: date-fns + dayjs

## Development Commands

```bash
# Start development server (includes Turbopack for faster builds)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests with coverage
npm run coverage

# Lint code
npm run lint
```

## Project Architecture

### Multi-Tenant Structure

The system follows a hierarchical organization model:
- **Organization/Tenant**: Top-level entity representing a business
- **Tenant Types**: MARKET (marketplace), PROVIDER (supplier), CUSTOMER (buyer)
- **User Roles**: Different permissions per tenant type (Market Admin, Inquiry Staff, etc.)

### Key Directories

```
app/
├── admin/                 # Admin panel for system management
├── api/                   # Next.js API routes for backend communication
├── workspace/             # Main application area for tenants
│   ├── components/        # Reusable UI components
│   │   ├── admin/        # Admin-specific components
│   │   ├── orders/       # Order management components
│   │   ├── procurement/  # Procurement workflow components
│   │   └── providers/    # Provider management components
│   └── hooks/            # Custom React hooks for business logic
lib/
├── types/                # TypeScript type definitions
├── constants/            # Application constants (order statuses, etc.)
├── utils/                # Utility functions
└── api-client.ts         # Centralized API client
```

### Component Architecture

**Server Components + Client Components Pattern**:
- Use Server Components for data fetching and static content
- Use Client Components (`'use client'`) for interactivity
- Separate interactive logic into `components/client/` when possible

**Component Organization**:
- Shared components in `components/common/`
- Business-specific components grouped by feature
- Custom hooks in dedicated `hooks/` directories
- Types defined in `types/` or component-adjacent `type.ts` files

## Order Management System

The application's core business logic revolves around order processing with complex state machines:

### Order Status Flows

Orders follow different status flows based on tenant type:
- **Normal Flow**: PENDING → ASSIGNED → SUPPLIER_PREPARING → SUPPLIER_DELIVERING → MARKET_INSPECTING → COMPLETED
- **Return Flow**: RETURN_REQUESTED → RETURNED
- **Exchange Flow**: EXCHANGE_REQUESTED → EXCHANGE_IN_PROGRESS → EXCHANGE_DELIVERING → EXCHANGE_COMPLETED

### Key Order Components

- **OrderDetails.tsx**: Main order detail view (currently being refactored from 2374 lines)
- **OrdersList.tsx**: Tenant-aware order listing with role-based columns
- **Custom Hooks**:
  - `useOrderDetails`: Order data fetching
  - `useOrderOperations`: Return/exchange operations
  - `useOrderEditing`: Edit mode management
  - `useOrderActions`: Status change operations
  - `useOrderCalculations`: Amount calculations

## API Integration

### API Client Usage

The system uses a centralized API client (`lib/api-client.ts`) for backend communication:
- JWT-based authentication
- Centralized error handling with user-friendly messages
- TypeScript interfaces for request/response types

### API Route Structure

```
app/api/
├── orders/[order_code]/           # Order-specific operations
├── customers/[customer_id]/       # Customer operations
├── markets/[market_id]/          # Market management
├── providers/[provider_id]/      # Provider operations
└── admin/                        # System administration
```

## UI/UX Guidelines

### Component Usage

- **Forms**: Use shadcn/ui Form components with React Hook Form
- **Tables**: Use shadcn/ui Table with consistent styling
- **Dialogs**: Use Radix UI Dialog for modals
- **Buttons**: Use shadcn/ui Button with proper variants
- **Status Badges**: Custom variants for order statuses

### Tenant-Aware Development

When building shared features:
1. Use role-based rendering: `useTenant()` or `useUserRole()` hooks
2. Configure actions by tenant type:
   ```typescript
   const orderActions = {
     MARKET: [...],
     PROVIDER: [...],
     CUSTOMER: [...]
   }
   ```
3. Avoid duplicating pages for different tenants
4. Use configuration mapping for different tenant behaviors

### Styling Conventions

- Use `cn()` utility for conditional classes
- Follow shadcn/ui patterns for consistency
- Implement responsive design for mobile compatibility
- Use semantic colors for status indicators

## Code Standards

### TypeScript
- Avoid `any` type; use `unknown` or proper interfaces
- Define types in dedicated `types/` directories or `type.ts` files
- Use enums for constants (e.g., OrderStatus, TenantType)

### React Patterns
- Custom hooks named with `use` prefix
- Component props interfaces named `XxxProps`
- Use PascalCase for component names
- Extract complex logic into custom hooks

### Error Handling
- Use try/catch for API calls
- Provide user-friendly error messages via toast notifications
- Log errors for debugging (use `lib/logger.ts`)

## Testing

### Test Structure
- Unit tests in `__tests__/` directories or `*.test.ts` files
- Component testing with @testing-library/react
- API testing with mocked responses
- Coverage reporting available via `npm run coverage`

### Test Patterns
- Test custom hooks separately
- Mock API responses for consistent testing
- Test user interactions and form validation
- Test tenant-specific behavior variations

## Key Business Concepts

### Multi-Tenant Architecture
- Single codebase serves different tenant types
- Role-based access control within tenants
- Shared data models with tenant-specific views

### Order Processing Workflows
- Complex state machines for order lifecycle
- Tenant-specific actions at different order stages
- Real-time status updates and notifications

### Price Management
- Daily price collection by market staff
- Price approval workflows
- Historical price tracking

## Development Workflow

1. **Feature Development**: Create tenant-aware components with proper role-based rendering
2. **API Integration**: Use centralized API client with proper error handling
3. **Testing**: Write unit tests for hooks and components
4. **Code Review**: Ensure adherence to multi-tenant patterns and shadcn/ui usage

## Important Files

- `lib/types/orderStatus.ts`: Core order status definitions
- `lib/constants/orderStatus.ts`: Order flow configurations
- `lib/api-client.ts`: Centralized API communication
- `app/workspace/layout.tsx`: Main application layout with authentication
- `.cursor/rules/market-front.mdc`: Project-specific development rules