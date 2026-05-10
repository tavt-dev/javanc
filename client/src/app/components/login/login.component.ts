import { CommonModule, JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Profile } from '../../model/profile';
import { User } from '../../model/user';
import { ProfileServiceService } from '../../service/profile-service.service';
import { UserServiceService } from '../../service/user-service.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, JsonPipe, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  user: User = new User();
  userForm: FormGroup;
  idProfile: number | undefined;

  constructor(
    private fb: FormBuilder,
    private userService: UserServiceService,
    private router: Router,
    private profileService: ProfileServiceService
  ) {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  submitForm() {
    if (this.userForm.valid) {
      console.log('email :', this.userForm.value);
      this.login();
    } else {
      console.log('Form is invalid');
    }
  }

  login() {
    this.userService.signInUser(this.userForm.value).subscribe(
      (response: any) => {
        const token = response.accessToken;
        const userCurrent = response.user;
        localStorage.setItem('authToken', token);
        localStorage.setItem('userCurrent', JSON.stringify(userCurrent));
        console.log('Login successful, token saved to localStorage');
        console.log('Profile ID response:', response.user.id);

        this.profileService.getProfileByUserId(response.user.id).subscribe((data: Profile | null) => {
          console.log('Profile ID:', data?.id);
          if (data != null) {
            this.idProfile = data.id;
            localStorage.setItem('idProfile', this.idProfile !== undefined ? this.idProfile.toString() : '');
          }
        });

        console.log('Token:', token);
        if (response.user.role === 'admin') {
          this.router.navigateByUrl('/admin');
        } else if (response.user.role === 'hr' || response.user.role === 'manager') {
          this.router.navigateByUrl('/manager/about');
        } else if (response.user.role === 'user') {
          this.router.navigateByUrl('/home');
        }
      },
      (error) => {
        console.error('Error logging in:', error);
        this.userForm.get('email')?.setErrors(null);
        this.userForm.get('password')?.setErrors(null);

        if (error.status === 401) {
          this.userForm.get('password')?.setErrors({ invalidCredentials: true });
          console.error('Invalid email or password');
        } else if (error.status === 400) {
          this.userForm.get('email')?.setErrors({ invalidCredentials: true });
          console.error('Invalid login request');
        }
      }
    );
  }
}
