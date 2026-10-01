import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout.component';
import { authGuard } from './core/services/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/products/products.component').then((m) => m.ProductsComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/orders/orders.component').then((m) => m.OrdersComponent),
      },
      {
        path: 'quotations',
        loadComponent: () =>
          import('./pages/quotations/quotations.component').then((m) => m.QuotationsComponent),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./pages/customers/customers.component').then((m) => m.CustomersComponent),
      },
      {
        path: 'material-lists',
        loadComponent: () =>
          import('./pages/material-lists/material-lists.component').then((m) => m.MaterialListsComponent),
      },
      {
        path: 'brands',
        loadComponent: () =>
          import('./pages/brands/brands.component').then((m) => m.BrandsComponent),
      },
      { path: 'suppliers', redirectTo: 'brands', pathMatch: 'full' },
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/categories/categories.component').then((m) => m.CategoriesComponent),
      },
      {
        path: 'offers',
        loadComponent: () =>
          import('./pages/offers/offers.component').then((m) => m.OffersComponent),
      },
      {
        path: 'app-content',
        loadComponent: () =>
          import('./pages/app-content/app-content.component').then((m) => m.AppContentComponent),
      },
      {
        path: 'collections',
        loadComponent: () =>
          import('./pages/collections/collections.component').then((m) => m.CollectionsComponent),
      },
      { path: 'packages', redirectTo: 'collections', pathMatch: 'full' },
      {
        path: 'advertisements',
        loadComponent: () =>
          import('./pages/advertisements/advertisements.component').then((m) => m.AdvertisementsComponent),
      },
      { path: 'agent-ads', redirectTo: 'advertisements', pathMatch: 'full' },
      { path: 'reports', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'notifications', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'team',
        loadComponent: () =>
          import('./pages/team/team.component').then((m) => m.TeamComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
