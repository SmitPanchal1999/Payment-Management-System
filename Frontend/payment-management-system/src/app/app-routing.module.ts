import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentListComponent } from './components/payment-list/payment-list.component';
import { AddPaymentComponent } from './components/add-payment/add-payment.component';
import { EditPaymentComponent } from './components/edit-payment/edit-payment.component';
import { UploadEvidenceComponent } from './components/upload-evidence/upload-evidence.component';

const routes: Routes = [
  { path: '', redirectTo: '/payments', pathMatch: 'full' },
  { path: 'payments', component: PaymentListComponent },
  { path: 'payments/add', component: AddPaymentComponent },
  { path: 'payments/edit/:id', component: EditPaymentComponent },
  { path: 'payments/:id/evidence', component: UploadEvidenceComponent },
  { path: '**', redirectTo: '/payments' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes,  { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }