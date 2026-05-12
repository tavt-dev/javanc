import { CommonModule, JsonPipe } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserServiceService } from '../../service/user-service.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, JsonPipe],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  userForm: FormGroup;
  verificationPending = false;
  pendingEmail = '';
  otp = '';
  otpError = '';
  resendMessage = '';
  resendCooldown = 0;

  @Output() registerSuccess = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private userService: UserServiceService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', [Validators.required]],
      password: ['', [Validators.required, this.passwordValidator()]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordsMatchValidator.bind(this)
    });

    this.route.queryParams.subscribe(params => {
      if (params['verify'] === 'true' && params['email']) {
        this.verificationPending = true;
        this.pendingEmail = params['email'];
        this.userForm.patchValue({ email: params['email'] });
      }
    });
  }

  passwordValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null;
      }
      const errors: ValidationErrors = {};
      if (!/[a-zA-Z]/.test(value)) {
        errors['noLetter'] = true;
      }
      if (!/\d/.test(value)) {
        errors['noDigit'] = true;
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        errors['noSpecialChar'] = true;
      }
      if (value.length < 8) {
        errors['invalidLength'] = true;
      }
      return Object.keys(errors).length ? errors : null;
    };
  }

  passwordsMatchValidator(formGroup: FormGroup): ValidationErrors | null {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  getPasswordErrorMessage(): string {
    const control = this.userForm.get('password');
    const errors = [];
    if (control?.hasError('required')) {
      errors.push('is required');
    }
    if (control?.hasError('invalidLength')) {
      errors.push('must be at least 8 characters long');
    }
    if (control?.hasError('noLetter')) {
      errors.push('must contain at least one letter');
    }
    if (control?.hasError('noDigit')) {
      errors.push('must contain at least one number');
    }
    if (control?.hasError('noSpecialChar')) {
      errors.push('must contain at least one special character');
    }
    return errors.length ? `Password ${errors.join(' and ')}` : '';
  }

  submitForm() {
    if (this.userForm.valid) {
      this.signUpUser();
    }
  }

  signUpUser() {
    this.userService.signUpUser(this.userForm.value).subscribe(
      (data: any) => {
        this.pendingEmail = data.email || this.userForm.value.email;
        this.verificationPending = true;
        this.otp = '';
        this.otpError = '';
        this.resendMessage = 'Verification code sent';
        this.startResendCooldown();
      },
      (error) => {
        if (error.status === 409 || error.error?.message === 'Email already exists') {
          this.userForm.get('email')?.setErrors({ emailExists: true });
        }
      }
    );
  }

  verifyEmail() {
    this.otpError = '';
    if (!this.pendingEmail || !this.otp || this.otp.trim().length !== 6) {
      this.otpError = 'Enter the 6-digit verification code';
      return;
    }

    this.userService.verifyEmail(this.pendingEmail, this.otp.trim()).subscribe(
      (response: any) => {
        localStorage.setItem('authToken', response.accessToken);
        localStorage.setItem('userCurrent', JSON.stringify(response.user));
        this.registerSuccess.emit();
        if (response.user.role === 'admin') {
          this.router.navigateByUrl('/admin');
        } else if (response.user.role === 'hr' || response.user.role === 'manager') {
          this.router.navigateByUrl('/manager/about');
        } else {
          this.router.navigateByUrl('/home');
        }
      },
      (error) => {
        this.otpError = error?.error?.message || 'Verification code is invalid or expired';
      }
    );
  }

  resendOtp() {
    if (!this.pendingEmail || this.resendCooldown > 0) {
      return;
    }
    this.userService.resendVerificationOtp(this.pendingEmail).subscribe(
      () => {
        this.resendMessage = 'Verification code sent';
        this.startResendCooldown();
      },
      (error) => {
        this.resendMessage = error?.error?.message || 'Please wait before requesting another code';
      }
    );
  }

  private startResendCooldown() {
    this.resendCooldown = 60;
    const interval = setInterval(() => {
      this.resendCooldown -= 1;
      if (this.resendCooldown <= 0) {
        clearInterval(interval);
      }
    }, 1000);
  }
}
