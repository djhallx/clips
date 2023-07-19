import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore/';
import IUser from '../models/user.model';
import { Observable, of } from 'rxjs';
import { map, delay, filter, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ActivatedRoute, NavigationEnd } from '@angular/router';




@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usersCollection: AngularFirestoreCollection<IUser>
  public isAuthenticated$: Observable<boolean>
  public isAuthenticatedWithDelay$: Observable<boolean>
  public redirect = false

  constructor(
    private auth: AngularFireAuth,
    private db: AngularFirestore,
    private router: Router,
    private route: ActivatedRoute
    ) { 
      this.usersCollection = db.collection('users')
      this.isAuthenticated$ = auth.user.pipe(
        map(user => !!user)
      )

      this.isAuthenticatedWithDelay$ = this.isAuthenticated$.pipe(
        delay(1000)
      )

      this.router.events.pipe(
          // Filter out everything except NavigationEnd events.
        filter(e => e instanceof NavigationEnd),
          // Get the firistChild object from the route.
        map(e => this.route.firstChild),
          // We need to subscribe to an observable from within an observable using the switchmap operator.
            // The switchmap operator cancels the previous inner observable every time a new observable is created.
          // The returned object "route?.data" is the new observable.
            // route?.data may be null. Use the "nullish coalescing operator" "??" to return 
            // route?.data if it's not null or the value on the right of the ?? operator.
            // In this case, the value on the right is the "of" operator which creates a new obeservable
            // on the object, "{ authOnly: false}".
            // 
          // Check route.data entity. If it's null
        switchMap((route) => route?.data ?? of({ authOnly: false }))
        ).subscribe((data) => {
          // If we get here we need to set this.redirect based on the value in data.authOnly.
          this.redirect = data.authOnly ?? false
        })

    }
    

  public async createUser(userData: IUser) {

    if (!userData.password) {
      throw new Error('Password not provided.')
    }

    try {
      const userCred = await this.auth.createUserWithEmailAndPassword(
        userData.email as string, userData.password as string
      )

      console.log(userCred)

      if (!userCred.user) {
        throw new Error('User cannot be found.')
      }

      await this.usersCollection.doc(userCred.user.uid).set({
        name: userData.name,
        email: userData.email,
        age: userData.age,
        phone_number: userData.phone_number
      })

      await userCred.user.updateProfile({
        displayName: userData.name
      })

    } catch(e) {
      console.log(e)
      

      return
    }
  }


  public async logout($event?: Event) {
    if ($event) {
      $event.preventDefault()
    }
    await this.auth.signOut()

    if (this.redirect) {
      // We are only going to redirect based on this.redirect which was set in our
      // this.router.events.pipe(...) construct above.
      await this.router.navigateByUrl('/')
    }
  }


}
