import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/compat/storage'
import { v4 as uuid } from 'uuid'
import { last } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app'
import { switchMap } from 'rxjs';
import { ClipService } from 'src/app/services/clip.service';
import { Router } from '@angular/router';
import { FfmpegService } from 'src/app/services/ffmpeg.service';
import { SafeURLPipe } from '../pipes/safe-url.pipe';


@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnDestroy {

  constructor(
    private storeage: AngularFireStorage,
    private auth: AngularFireAuth, 
    private clipsService: ClipService,
    private router: Router,
    public ffmpegService: FfmpegService
    ) {      
    auth.user.subscribe(user => this.user = user )
    this.ffmpegService.init();
  }

  ngOnDestroy(): void {
      // '?' the task property may not exist. 
      // If it does, invoke cancel. If it does not, do nothing.
    this.task?.cancel();

    console.log("Upload cancelled.")
  }

  isDragover = false
  file: File | null = null
  nextStep = false

  showAlert = false
  alertMsg = 'Please wait. Your clip is being uploaded...'
  alertColor = 'blue'
  inSubmission = false

  percentage = 0
  showPercentage = false

  user: firebase.User | null = null

  // '?' Makes property optional.
  task?: AngularFireUploadTask

  screenshots: string[] = []
  

  title = new FormControl('', [
    Validators.required,
    Validators.minLength(3)
  ])

  uploadForm = new FormGroup({
    title: this.title
  });


  async storeFile($event: Event) {
    console.log("storeFile()...")

    this.isDragover = false

      
    // Ternary operation...
    // If $event.dataTransfer is not null, 
    //    Then: get the file from the DragEvent
    //    Else: Get the file from the $event.target file selection.
    this.file = ($event as DragEvent).dataTransfer?
      ($event as DragEvent).dataTransfer?.files.item(0) ?? null :
      ($event.target as HTMLInputElement).files?.item(0) ?? null
    
      // Notes about the above code...
      // The '?' is optional chaining.
      // The '??' is the nullish operator.
      //    If the LHS is not null return LHS. If LHS is null, return RHS.
    
    if (!this.file || this.file.type !== 'video/mp4') {
      return
    }

    console.log('uploadComponent.ts{}.storeFile() calling getSceenshots()')
    this.screenshots = await this.ffmpegService.getScreenshots(this.file)


    this.nextStep = true;
    this.title.setValue(
      this.file.name.replace(/\.[^/.]+$/,'')
    )

    console.log(this.file)
  }


  
  uploadFile() {
    this.uploadForm.disable()

    this.showAlert = true;
    this.alertColor = 'blue'
    this.alertMsg = 'Please wait. Your clip is being uploaded...'
    this.inSubmission = true;
    this.showPercentage = true;

    console.log('uploadFile()...')
    const clipFilename = uuid()

    const clipPath = `clips/${clipFilename}.mp4`

    

    this.task = this.storeage.upload(clipPath, this.file)
    const clipRef = this.storeage.ref(clipPath)

    this.task.percentageChanges().subscribe(progress => {
      this.percentage = progress as number / 100
    })

    this.task.snapshotChanges().pipe(
        last(),
        switchMap(() => clipRef.getDownloadURL())
      ).subscribe({
      next: async (url) => {
        const clip = {
          uid: this.user?.uid as string,
          displayName: this.user?.displayName as string,
          title: this.title.value as string,
          fileName: `${clipFilename}.mp4`,
          url, 
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }

        const clipDocRef = await this.clipsService.creatClip(clip)

        console.log(clip)

        this.alertColor = 'green'
        this.alertMsg = 'Success! Your clip is now ready to share with the world.'
        this.showPercentage = false

        // After 1 second, redirect to display the newly uploaded clip.
        setTimeout(() => {
          this.router.navigate([
            'clip', clipDocRef.id
          ])
        }, 1000)
      }, 
      error: (error) => {
        this.uploadForm.enable()
        this.alertColor = 'red'
        this.alertMsg = 'Upload failed. Please try again later.'
        this.inSubmission = true
        this.showPercentage = false
        console.log(error)
      }
    })
  }
}


// https://www.caniuse.com/dragndrop
