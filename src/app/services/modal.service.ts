import { Injectable } from '@angular/core';


interface IModal {
  id: string;
  visible: boolean;
}


@Injectable({  
    providedIn: 'root'        // available to the root injector.
 }
)
export class ModalService {
  private modals: IModal[] = []

  constructor() { }

  register(id: string) {
    this.modals.push({id, visible: false})
    //console.log("modal.service.ts:ModalService.register(...)  modals = ", this.modals)
  }

  unregister(id: string) {
    // Replace this.modals with a new array contaning only this.model elements where the
    // id is not equal to id.
    this.modals = this.modals.filter(
      element => element.id !== id
    )
  }



  isModalOpen(id: string): boolean {
    return !!this.modals.find(element => element.id === id)?.visible
      // The '?' is called optional chaining.
      // !! converts the value to boolean and returns the opposite.
  }

  toggleModal(id: string) {
    const modal = this.modals.find(element => element.id === id)

    if (modal) {
      modal.visible = !modal.visible
    }
  }





}
