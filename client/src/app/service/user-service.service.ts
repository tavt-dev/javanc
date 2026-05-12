import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../model/user';
import { catchError, map, Observable, throwError } from 'rxjs';
import { Apiresponse } from '../apiresponse';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class UserServiceService {

  constructor(private http: HttpClient, private router: Router) { }

  private authURL = 'http://localhost:8080/auth';
  private usersURL = 'http://localhost:8080/users';

  signUpUser(user: User): Observable<any> {
    const payload = {
      name: user.name,
      email: user.email,
      password: user.password
    };
    return this.http.post<Apiresponse<any>>(`${this.authURL}/register`, payload).pipe(
      map(response => this.unwrap(response))
    );
  }

  verifyEmail(email: string, otp: string): Observable<any> {
    return this.http.post<Apiresponse<any>>(`${this.authURL}/verify-email`, { email, otp }).pipe(
      map(response => this.unwrap(response))
    );
  }

  resendVerificationOtp(email: string): Observable<void> {
    return this.http.post<Apiresponse<void>>(`${this.authURL}/resend-verification-otp`, { email }).pipe(
      map(response => this.unwrap(response))
    );
  }

  createAccount(user: User): Observable<User> {
    const payload = {
      name: user.name,
      email: user.email,
      password: user.password,
      employeeId: user.idEmployee,
      role: user.role
    };
    return this.http.post<Apiresponse<User>>(`${this.usersURL}/admin/accounts`, payload,
      { headers: this.createAuthorizationHeader() }).pipe(map(response => this.unwrap(response)));
  }

  changeRole(id: number, role: string): Observable<User> {
    return this.http.patch<Apiresponse<User>>(`${this.usersURL}/${id}/role`, { role },
      { headers: this.createAuthorizationHeader() }).pipe(map(response => this.unwrap(response)));
  }

  signInUser(user: User): Observable<any> {
    return this.http.post<Apiresponse<any>>(`${this.authURL}/login`, user).pipe(
      map(response => this.unwrap(response))
    );
  }

  updateUser(user: User): Observable<User> {
    return this.http.patch<Apiresponse<User>>(`${this.usersURL}/${user.id}/status`,
      { active: user.active },
      { headers: this.createAuthorizationHeader() }).pipe(map(response => this.unwrap(response)));
  }

  update(user: User): Observable<User> {
    const payload = {
      name: user.name,
      email: user.email,
      password: user.password,
      employeeId: user.idEmployee
    };
    return this.http.patch<Apiresponse<User>>(`${this.usersURL}/${user.id}`, payload,
      { headers: this.createAuthorizationHeader() }).pipe(map(response => this.unwrap(response)));
  }

  deleteUser(id: number): Observable<User> {
    return this.http.delete<Apiresponse<User>>(`${this.usersURL}/${id}`,
      { headers: this.createAuthorizationHeader() }).pipe(map(response => this.unwrap(response)));
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<Apiresponse<User>>(`${this.usersURL}/${id}`,
      { headers: this.createAuthorizationHeader() }).pipe(
        map(response => this.unwrap(response)),
        catchError(error => this.handleUnauthorized(error, 'Error fetching user'))
      );
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<Apiresponse<User>>(`${this.usersURL}/me`,
      { headers: this.createAuthorizationHeader() }).pipe(
        map(response => this.unwrap(response)),
        catchError(error => this.handleUnauthorized(error, 'Error fetching current user'))
      );
  }

  getAllUser(): Observable<User[]> {
    return this.http.get<Apiresponse<User[]>>(this.usersURL,
      { headers: this.createAuthorizationHeader() }).pipe(
        map(response => this.unwrap(response)),
        catchError(error => this.handleUnauthorized(error, 'Error fetching users'))
      );
  }

  getListUserById(ids: number[]): Observable<User[]> {
    return this.http.get<Apiresponse<User[]>>(`${this.usersURL}?ids=${ids.join('&ids=')}`,
      { headers: this.createAuthorizationHeader() }).pipe(map(response => this.unwrap(response)));
  }

  private createAuthorizationHeader(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : new HttpHeaders();
  }

  private unwrap<T>(response: Apiresponse<T>): T {
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message);
  }

  private handleUnauthorized(error: unknown, label: string): Observable<never> {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      this.router.navigate(['/login']);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userCurrent');
    }
    console.error(label, error);
    return throwError(() => new Error('Something went wrong!'));
  }
}
