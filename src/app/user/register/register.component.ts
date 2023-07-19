import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import IUser from 'src/app/models/user.model';
import { RegisterValidators } from '../validators/register-validators';
import { EmailTaken } from '../validators/email-taken';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  constructor(
    private auth: AuthService,
    private emailTaken: EmailTaken
  ) {  }

  inSubmission = false

  name = new FormControl('', [
    Validators.required,
    Validators.minLength(3)
  ])
  email = new FormControl('', [
    Validators.required,
    Validators.email
  ], this.emailTaken.validate)
  age = new FormControl<number | null>(null, [
    Validators.required,
    Validators.min(18),     // minimum age
    Validators.max(120)     // maximum age
  ])
  password = new FormControl('', [
      Validators.required,
      Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)  // No quotes around the pattern.
  ])
  confirm_password = new FormControl('', [
    Validators.required
  ])
  phone_number = new FormControl('',[
    Validators.required,
    Validators.minLength(13), 
    Validators.maxLength(14)
  ])

  showAlert = false
  alertMsg = 'Please wait! Your account is being created'
  alertColor = 'blue'




  registerForm = new FormGroup({
    name: this.name,
    email: this.email,
    age: this.age,
    password: this.password,
    confirm_password: this.confirm_password,
    phone_number: this.phone_number
  }, [RegisterValidators.match('password','confirm_password')]);



  async register() {
    this.showAlert = true
    this.alertMsg = 'Please wait! Your account is being created'
    this.alertColor = 'blue'
    this.inSubmission = true

    try {
      await this.auth.createUser(this.registerForm.value as IUser)
    } catch(e) {
      console.error(e)

      this.alertMsg = 'An unexpected error occurred. Please try again later.'
      this.alertColor = 'red'
      this.inSubmission = false      
    }



    
    this.alertMsg = 'Success! Your account has been created.'
    this.alertColor = 'green'

  }

}
