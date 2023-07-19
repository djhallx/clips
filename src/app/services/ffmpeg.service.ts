import { Injectable } from '@angular/core';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

@Injectable({
  providedIn: 'root'
})
export class FfmpegService {

  isReady = false
  private ffmpeg

  constructor() {
    this.ffmpeg = createFFmpeg({
      log: true
    })
   }


   async init() {
    if (this.isReady) {
      return
    }

    console.log("await this.ffmpeg.load() running...")
    await this.ffmpeg.load()
    console.log("await this.ffmpeg.load() complete.")

    this.isReady = true
   }





   async getScreenshots(file: File): Promise<string[]> {
    console.log('getScreenshots()...')    

    const data = await fetchFile(file)
    this.ffmpeg.FS('writeFile', file.name, data)

    const seconds = [1,2,3]
    const commands: string[] = []

    seconds.forEach(second => {
      commands.push(
          // Input Options
        '-i',    // Grab a specific file from filesystem
        file.name,
        // Output Options
        '-ss',                // Configure the timestamp in the video
        `00:00:0${second}`,           // Time format: 'hh:mm:ss'
        '-frames:v', '1',     // Number of frames to capture. 
        '-filter:v', 'scale=510:-1',   // Filter the snapshot, i.e. scale it to 510x?? whatever value maintains the aspect ratio.
        // Output
        `output_0${second}.png`
      )
    })

    await this.ffmpeg.run(
      ...commands
    )

    const screenshots: string[] = []

    seconds.forEach(second => {
      const screenshotFile = this.ffmpeg.FS(
        'readFile', 
        `output_0${second}.png`        
        )

        const screenshotBlob = new Blob(
          [screenshotFile.buffer], {
            type: 'image/png'
          }
        )

        const screenshotURL = URL.createObjectURL(screenshotBlob)

        screenshots.push(screenshotURL)

        
    })
    return screenshots
  }
}
