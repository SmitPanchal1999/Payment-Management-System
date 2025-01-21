import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentListComponent } from './components/payment-list/payment-list.component';
import { AddPaymentComponent } from './components/add-payment/add-payment.component';
import { EditPaymentComponent } from './components/edit-payment/edit-payment.component';
import { UploadEvidenceComponent } from './components/upload-evidence/upload-evidence.component';
import { ViewPaymentComponent } from './components/view-payment/view-payment.component';

const routes: Routes = [
  { path: '', redirectTo: '/payments', pathMatch: 'full' },
  { path: 'payments', component: PaymentListComponent },
  { path: 'payments/add', component: AddPaymentComponent },
  { path: 'payments/edit/:id', component: EditPaymentComponent },
  { path: 'payments/:id/evidence', component: UploadEvidenceComponent },
  { path: 'payments/:id', component: ViewPaymentComponent },
  { path: '**', redirectTo: '/payments' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes,  { useHash: true }), ],
  exports: [RouterModule]
})
export class AppRoutingModule { }