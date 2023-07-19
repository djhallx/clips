import { Directive, HostListener } from '@angular/core';


@Directive({
  selector: '[app-event-blocker]'
})
export class EventBlockerDirective { 

  @HostListener('drop', ['$event']) 
  @HostListener('dragover', ['$event']) 
  public block(event: any): boolean {
    // console.log('EventBlockerDirective.block()')
    event.preventDefault()
    // event.stopPropogation()
    return false
  }
  
}