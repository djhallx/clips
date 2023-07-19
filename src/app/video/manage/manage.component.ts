import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { ClipService } from 'src/app/services/clip.service';
import IClip from 'src/app/models/clip.model';
import { ModalService } from 'src/app/services/modal.service';
import { BehaviorSubject } from 'rxjs';


@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.css']
})
export class ManageComponent {
  videoOrder = '1' // descending order.
  clips: IClip[] = []
  activeClip: IClip | null = null
  
    // '$' denotes an observable. It is not required, only nomenclature.
  sort$: BehaviorSubject<string>

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private clipService: ClipService,
    private modalService: ModalService
    ) {
      this.sort$ = new BehaviorSubject(this.videoOrder)
  }

  ngOnInit(): void {
    console.log('manage.component.ts - ngOnInit()...')
    this.route.queryParamMap.subscribe((params: Params) => {
      this.videoOrder = params.params.sort == '2' ? params.params.sort : '1'
      this.sort$.next(this.videoOrder)
    })

    this.clipService.getUserClips(this.sort$).subscribe(docs => {
      this.clips = []
      docs.forEach(doc => {
        this.clips.push({
          docID: doc.id,
            // ... 'spread operator' merges the properties with the object.
          ...doc.data()
        })
      })
    })
  }


  sort(event: Event) {
    const { value } = (event.target as HTMLSelectElement)

    console.log('sort event value = ' + value)

    //this.router.navigateByUrl(`/manage?sort=${value}`)

    this.router.navigate(
      [], {
        relativeTo: this.route,
        queryParams: {
          sort: value
        }
       })

  }


  openModal($event: Event, clip: IClip) {
    $event.preventDefault()

    this.activeClip = clip

    this.modalService.toggleModal('editClip')
  }


  update($event: IClip) {

    this.clips.forEach((element, index) => {
      if (element.docID == $event.docID) {
        this.clips[index].title = $event.title
      }
    })
  }


  deleteClip($event: Event, clip: IClip) {
    $event.preventDefault()

    this.clipService.deleteClip(clip)

    this.clips.forEach((element, index) => {
      if (element.docID == clip.docID) {
        this.clips.splice(index, 1)
      }
    })
  }

}
