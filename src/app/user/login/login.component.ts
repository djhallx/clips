import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  credentials = {
    email: '',
    password: ''
  }

  showAlert = false
  alertMsg = 'Please wait! Logging in...'
  alertColor = 'blue'
  inSubmission = false


  constructor(private auth: AngularFireAuth) {

  }

  ngOnInit(): void {

  }

  async login() {

    this.showAlert = true
    this.alertMsg = 'Please wait! Logging in...'
    this.alertColor = 'blue'
    this.inSubmission = true
    
    try {
      await this.auth.signInWithEmailAndPassword(
        this.credentials.email,
        this.credentials.password        
      )

      this.showAlert = true
      this.alertMsg = 'Login successful!'
      this.alertColor = 'green'
      this.inSubmission = false 

      // Destroy the modal...

    } catch(e) {
      console.error(e)
      this.inSubmission = false 
      this.alertMsg = 'An unexpected error occurred. Please try again later.'
      this.alertColor = 'red'
      return
    }
  }

}
