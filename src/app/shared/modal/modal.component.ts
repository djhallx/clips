import { Component, Input, OnInit, ElementRef, OnDestroy } from '@angular/core';
import { ModalService } from 'src/app/services/modal.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
  //providers: [ModalService]
})
export class ModalComponent implements OnInit, OnDestroy {

  @Input() modalId = ''

  constructor(public modal: ModalService, public el: ElementRef) {
    //console.log('ModalComponent.constructor(modal) modal.visible: ', this.modal.visible)
    //console.log('ModalComponent.constructor(modal) el: ', this.el)
  }

  ngOnInit(): void {
    document.body.appendChild(this.el.nativeElement)
  }

  ngOnDestroy(): void {
    document.body.removeChild(this.el.nativeElement)
  }

  closeModal() {
    this.modal.toggleModal(this.modalId);
  }

}
