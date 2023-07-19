import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalService } from 'src/app/services/modal.service';

@Component({
  selector: 'app-auth-modal',
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.css']
})
export class AuthModalComponent implements OnInit, OnDestroy {

  constructor(public modal: ModalService) {

  }


  ngOnInit(): void {
    this.modal.register('auth')      // Register (create) a new modal with the service    
  }

  ngOnDestroy(): void {
    this.modal.unregister('auth')     // Unregister the modal to prevent a memory leak.
  }

}
