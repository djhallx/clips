import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/compat/storage'
import { v4 as uuid } from 'uuid'
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app'
import { switchMap } from 'rxjs';
import { ClipService } from 'src/app/services/clip.service';
import { Router } from '@angular/router';
import { FfmpegService } from 'src/app/services/ffmpeg.service';
import { combineLatest, forkJoin } from 'rxjs';



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
    console.log('upload.component.ts - ngOnDestroy(): Begin...')

      // '?' the task property may not exist. 
      // If it does, invoke cancel. If it does not, do nothing.
    this.task?.cancel();
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
  selectedScreenshot = ''

  screenshotTask?: AngularFireUploadTask



  title = new FormControl('', [
    Validators.required,
    Validators.minLength(3)
  ])

  uploadForm = new FormGroup({
    title: this.title
  });


  async storeFile($event: Event) {
    console.log("storeFile()...")

    if (this.ffmpegService.isRunning) {
      console.log("An upload is already in progress. Please wait and try again later.")
      return
    }

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

    this.selectedScreenshot = this.screenshots[0]


    this.nextStep = true;
    this.title.setValue(
      this.file.name.replace(/\.[^/.]+$/,'')
    )

    console.log(this.file)
  }


  
  async uploadFile() {
    console.log('upload.component.ts - uploadFile(): Begin...')
    this.uploadForm.disable()

    this.showAlert = true;
    this.alertColor = 'blue'
    this.alertMsg = 'Please wait. Your clip is being uploaded...'
    this.inSubmission = true;
    this.showPercentage = true;

    console.log('uploadFile()...')
    const clipFilename = uuid()

    const clipPath = `clips/${clipFilename}.mp4`

    
    console.log('===================================================')
    console.log('===================================================')
    console.log('===================================================')
    console.log('===================================================')



    /**
     * Get the selected screenshot and upload it to the server.
     */
    const screenshotBlob = await this.ffmpegService.blobFromURL(this.selectedScreenshot)
    console.log('screenshotBlob: ' + screenshotBlob)
    const screenshotPath = `screenshots/${clipFilename}.png`
    console.log('screenshotPath: ' + screenshotPath)
    
    
    this.screenshotTask = this.storeage.upload(
      screenshotPath, screenshotBlob
    )


    /**
     * Uplaod the video clip.
     */
    this.task = this.storeage.upload(clipPath, this.file)
    const clipRef = this.storeage.ref(clipPath)

    const screenshotRef = this.storeage.ref(screenshotPath)


    // The percentageChanges observable is wrapped in order to 
    // reflect the changes on both the screenshot upload and 
    // the clip upload.

    combineLatest([
        this.task.percentageChanges(),
        this.screenshotTask.percentageChanges()
    ]).subscribe((progress) => {
      const [clipProgress, screenshotProgress] = progress

      if (!clipProgress || !screenshotProgress) {
        return
      }

      const total = clipProgress + screenshotProgress;
      this.percentage = total as number / 200
    })


    //-----------------------------------------------------------

    forkJoin([
      this.task.snapshotChanges(),
      this.screenshotTask.snapshotChanges()
    ]).pipe(
        switchMap(() => forkJoin([
          clipRef.getDownloadURL(),
          screenshotRef.getDownloadURL()
        ]))
      ).subscribe({
      next: async (urls) => {
        const [clipURL, screenshotURL] = urls
        const clip = {
          uid: this.user?.uid as string,
          displayName: this.user?.displayName as string,
          title: this.title.value as string,
          fileName: `${clipFilename}.mp4`,
          url : clipURL, 
          screenshotURL: screenshotURL,
          screenshotFilename: `${clipFilename}.png`,
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
